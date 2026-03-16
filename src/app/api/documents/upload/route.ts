import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { extractText } from 'unpdf'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function* chunkText(text: string, chunkSize = 400): Generator<string> {
  const words = text.split(/\s+/)
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ').trim()
    if (chunk) yield chunk
  }
}

async function generateSystemPromptDraft(text: string): Promise<string> {
  const first3000Words = text.split(/\s+/).slice(0, 3000).join(' ')

  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are configuring an AI assistant for a hospitality company called EHL Experiences.

Read the document excerpt below and write a system prompt for an AI assistant that will answer employee questions using this document.

The system prompt must instruct the AI to:
1. Answer only from the provided document content — never from general knowledge
2. Cite the section name for every answer using this format: *(Section Name)* — just the section name in italics at the end of relevant sentences, with no filename or bold markers
3. Use a warm, conversational tone appropriate for employee communications
4. If an employee is describing a personal situation involving a specific colleague, manager, or individual circumstance — escalate to the human contact
5. If an employee is asking what a policy or procedure IS — answer from the document
6. Never guess or infer beyond what is explicitly stated

Return only the system prompt text. No explanation, no preamble, no markdown.

Document excerpt:
${first3000Words}`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sectionId = formData.get('sectionId') as string
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file || !sectionId) {
      return NextResponse.json(
        { error: 'file and sectionId are required' },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      )
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    // Step 1: Upload PDF to Supabase Storage
    const storagePath = `documents/${sectionId}/${file.name}`
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (storageError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${storageError.message}` },
        { status: 500 }
      )
    }

    // Step 2: Extract text from PDF
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
    console.log('PDF Extraction Result:', { filename: file.name, textLength: text.length, firstChars: text.substring(0, 200) })

    // Step 3: Insert document record before processing chunks
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        section_id: sectionId,
        filename: file.name,
        storage_path: storagePath,
        uploaded_by: uploadedBy || null,
        is_active: true,
      })
      .select()
      .single()

    if (docError || !doc) {
      await supabase.storage.from('documents').remove([storagePath])
      return NextResponse.json(
        { error: `Document record failed: ${docError?.message}` },
        { status: 500 }
      )
    }

    // Step 4: Stream chunks — embed and insert one at a time, no buffering
    const openai = getOpenAI()
    let chunkIndex = 0

    try {
      for (const chunk of chunkText(text)) {
        // Embed this chunk
        const embeddingRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        })
        const embedding = embeddingRes.data[0].embedding

        // Insert immediately — no array accumulation
        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: doc.id,
            section_id: sectionId,
            chunk_text: chunk,
            chunk_index: chunkIndex,
            embedding,
          })

        if (insertError) {
          throw new Error(`Chunk ${chunkIndex} insertion failed: ${insertError.message}`)
        }

        console.log(`Processed chunk ${chunkIndex}`)
        chunkIndex++

        // 100ms delay between embedding calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (err) {
      // Rollback: delete document record (cascades to chunks) and storage
      await supabase.from('documents').delete().eq('id', doc.id)
      await supabase.storage.from('documents').remove([storagePath])
      const errMsg = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: `Chunk processing failed: ${errMsg}` },
        { status: 500 }
      )
    }

    // Step 5: Delete any previously inactive documents (and their chunks) for this section
    const { data: inactiveDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('section_id', sectionId)
      .eq('is_active', false)

    if (inactiveDocs && inactiveDocs.length > 0) {
      const inactiveIds = inactiveDocs.map((d: { id: string }) => d.id)
      await supabase.from('documents').delete().in('id', inactiveIds)
    }
    // All active documents for this section remain — multi-doc querying is supported

    // Step 6: Generate system prompt draft
    let draftPrompt: string | null = null
    try {
      draftPrompt = await generateSystemPromptDraft(text)
    } catch (err) {
      console.error('System prompt generation failed (non-fatal):', err)
    }

    console.log(`Upload complete: ${chunkIndex} chunks inserted`)

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      chunkCount: chunkIndex,
      draftPrompt,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Document upload error:', errorMsg, error)
    return NextResponse.json(
      { error: `Upload failed: ${errorMsg}` },
      { status: 500 }
    )
  }
}
