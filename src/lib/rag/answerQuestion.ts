import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getSectionById } from '../../../config/sections'
import { ESCALATION_CONFIG } from '../../../config/escalation-keywords'
import type { Message, AnswerResult, Citation } from '@/types'
import * as fs from 'fs'
import * as path from 'path'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

async function getSystemPrompt(sectionId: string): Promise<string> {
  const supabase = createServiceRoleClient()

  // Try database first (active document's system_prompt)
  const { data: doc } = await supabase
    .from('documents')
    .select('system_prompt')
    .eq('section_id', sectionId)
    .eq('is_active', true)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .single()

  if (doc?.system_prompt) {
    return doc.system_prompt
  }

  // Fallback to file
  const section = getSectionById(sectionId)
  if (section?.systemPromptFile) {
    try {
      const filePath = path.join(process.cwd(), section.systemPromptFile)
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      // File not found, use generic fallback
    }
  }

  return `You are an assistant for EHL Experiences. Answer questions only from the provided documents. Never guess. Cite your sources.`
}

function checkKeywordEscalation(query: string, sectionId: string): string | null {
  if (!ESCALATION_CONFIG.enabled) return null

  const lowerQuery = query.toLowerCase()
  const matched = ESCALATION_CONFIG.keywords.find((kw) =>
    lowerQuery.includes(kw.toLowerCase())
  )

  if (matched) {
    const section = getSectionById(sectionId)
    const contact = section?.escalationContact
    if (contact) {
      return `I understand this is an important matter. This is something ${contact.name} would want to speak with you about personally. You can reach them directly at ${contact.email}`
    }
    return `This topic requires personal attention. Please contact your manager directly.`
  }

  return null
}

export async function answerQuestion(
  sectionId: string,
  query: string,
  conversationHistory: Message[]
): Promise<AnswerResult> {
  // Step 0: Check keyword escalation (if enabled)
  const keywordEscalation = checkKeywordEscalation(query, sectionId)
  if (keywordEscalation) {
    return {
      answer: keywordEscalation,
      citations: [],
      escalated: true,
    }
  }

  const supabase = createServiceRoleClient()

  // Step 1: Generate embedding for the query
  const embeddingResponse = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })
  const queryEmbedding = embeddingResponse.data[0].embedding

  // Step 2: Search for matching chunks
  const { data: chunks, error: matchError } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    section_id: sectionId,
    match_count: 12,
  })

  if (matchError || !chunks || chunks.length === 0) {
    const section = getSectionById(sectionId)
    const contact = section?.escalationContact
    const contactMsg = contact
      ? `Please contact ${contact.name} at ${contact.email} for assistance.`
      : 'Please contact your manager for assistance.'

    return {
      answer: `I couldn't find any relevant information in the uploaded documents to answer your question. ${contactMsg}`,
      citations: [],
      escalated: false,
    }
  }

  // Step 3: Get document filenames for citations
  const documentIds = Array.from(new Set(chunks.map((c: { document_id: string }) => c.document_id)))
  const { data: documents } = await supabase
    .from('documents')
    .select('id, filename')
    .in('id', documentIds)

  const docMap = new Map(documents?.map((d: { id: string; filename: string }) => [d.id, d.filename]) || [])

  // Step 4: Assemble prompt
  const systemPrompt = await getSystemPrompt(sectionId)
  const section = getSectionById(sectionId)
  const escalationInfo = section?.escalationContact
    ? `\n\nIf you need to escalate, direct the employee to ${section.escalationContact.name} at ${section.escalationContact.email}.`
    : ''

  const contextChunks = chunks
    .map((c: { chunk_text: string; document_id: string }, i: number) => {
      const docName = docMap.get(c.document_id) || 'Unknown Document'
      return `[Source ${i + 1}: ${docName}]\n${c.chunk_text}`
    })
    .join('\n\n---\n\n')

  const fullSystemPrompt = `${systemPrompt}${escalationInfo}\n\n--- DOCUMENT CONTEXT ---\n\n${contextChunks}`

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: query },
  ]

  // Step 5: Call Claude
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: fullSystemPrompt,
    messages,
  })

  const answerText =
    response.content[0].type === 'text' ? response.content[0].text : ''

  // Step 6: Build citations
  const citations: Citation[] = chunks.map((c: { chunk_text: string; document_id: string }) => ({
    documentName: docMap.get(c.document_id) || 'Unknown Document',
    chunkText: c.chunk_text.slice(0, 200) + (c.chunk_text.length > 200 ? '...' : ''),
  }))

  // Deduplicate citations by document name
  const uniqueCitations = citations.filter(
    (c: Citation, i: number, arr: Citation[]) => arr.findIndex((x: Citation) => x.documentName === c.documentName) === i
  )

  return {
    answer: answerText,
    citations: uniqueCitations,
    escalated: answerText.toLowerCase().includes(section?.escalationContact?.email?.toLowerCase() || '___none___'),
  }
}
