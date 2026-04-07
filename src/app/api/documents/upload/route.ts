import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { extractText } from 'unpdf'
import mammoth from 'mammoth'
import { createCanvas } from '@napi-rs/canvas'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

async function extractTextViaVision(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs' as any)

  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise
  const anthropic = getAnthropic()
  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2.0 }) // 2x scale for better OCR quality

    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height))
    const ctx = canvas.getContext('2d')

    await page.render({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvasContext: ctx as any,
      viewport,
    }).promise

    const imageData = canvas.toBuffer('image/png')
    const base64Image = imageData.toString('base64')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: base64Image },
            },
            {
              type: 'text',
              text: 'Extract all the text from this document page. Output only the raw text content, preserving structure and line breaks. Do not add commentary, headings, or formatting markers.',
            },
          ],
        },
      ],
    })

    const pageText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    if (pageText) pageTexts.push(pageText)

    // Small delay to avoid rate limiting
    if (pageNum < pdf.numPages) await new Promise(r => setTimeout(r, 200))
  }

  return pageTexts.join('\n\n')
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

    const fileName = file.name.toLowerCase()
    const isPDF = fileName.endsWith('.pdf')
    const isDocx = fileName.endsWith('.docx')

    if (!isPDF && !isDocx) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are accepted' },
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

    // Step 1: Upload file to Supabase Storage
    const storagePath = `documents/${sectionId}/${file.name}`
    const contentType = isPDF ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      })

    if (storageError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${storageError.message}` },
        { status: 500 }
      )
    }

    // Step 2: Extract text from PDF or DOCX
    let text: string
    let extractionMethod = 'text'
    if (isPDF) {
      const { text: pdfText } = await extractText(new Uint8Array(buffer), { mergePages: true })
      const wordCount = pdfText.trim().split(/\s+/).filter(Boolean).length
      console.log('PDF Extraction Result:', { filename: file.name, textLength: pdfText.length, wordCount, firstChars: pdfText.substring(0, 200) })

      if (wordCount < 10) {
        // Text extraction failed — fall back to vision (handles scanned PDFs and image-heavy docs)
        console.log('PDF text extraction insufficient, falling back to vision extraction…')
        extractionMethod = 'vision'
        text = await extractTextViaVision(buffer)
        console.log('Vision extraction complete:', { wordCount: text.split(/\s+/).filter(Boolean).length })
      } else {
        text = pdfText
      }
    } else {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
      if (result.messages.length > 0) {
        console.log('DOCX Extraction Warnings:', result.messages)
      }
      console.log('DOCX Extraction Result:', { filename: file.name, textLength: text.length, firstChars: text.substring(0, 200) })
    }

    // Guard: reject if no text was extracted even after vision fallback
    if (!text || text.trim().split(/\s+/).filter(Boolean).length < 10) {
      return NextResponse.json(
        { error: 'Could not extract any text from this file, even using vision analysis. The file may be corrupted or contain no readable content.' },
        { status: 422 }
      )
    }

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
      extractionMethod,
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
