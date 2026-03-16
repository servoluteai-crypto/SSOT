import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: NextRequest) {
  try {
    const { sectionId } = await request.json()

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Get active document
    const { data: doc } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('section_id', sectionId)
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single()

    if (!doc) {
      return NextResponse.json({ draftPrompt: null, error: 'No active document found' })
    }

    // Download PDF from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (dlError || !fileData) {
      return NextResponse.json({ error: 'Could not download document' }, { status: 500 })
    }

    // For now, use placeholder text since PDF extraction is complex in Next.js
    const text = `[Document from storage] This is a placeholder. PDF text extraction requires external processing.`
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
2. Cite the section name for every answer
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

    const draftPrompt =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ draftPrompt })
  } catch (error) {
    console.error('Regenerate prompt error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
