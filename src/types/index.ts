export interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

export interface Citation {
  documentName: string
  chunkText: string
}

export interface AnswerResult {
  answer: string
  citations: Citation[]
  escalated: boolean
}

export interface DocumentRecord {
  id: string
  section_id: string
  filename: string
  storage_path: string
  uploaded_at: string
  uploaded_by: string | null
  is_active: boolean
  system_prompt: string | null
}

export interface DocumentChunk {
  id: string
  document_id: string
  section_id: string
  chunk_text: string
  chunk_index: number
  embedding: number[] | null
  created_at: string
}

export interface MatchedChunk {
  id: string
  chunk_text: string
  document_id: string
  similarity: number
}

export interface QueryLog {
  id: string
  section_id: string
  query: string
  was_escalated: boolean
  had_results: boolean
  created_at: string
}

export interface QueryTopic {
  topic: string
  count: number
  queries: string[]
}

export interface QueryAnalytics {
  topTopics: QueryTopic[]
  totalQueries: number
  escalationRate: number
  queriesBySection: {
    section_id: string
    count: number
  }[]
  queriesByDay: {
    date: string
    count: number
  }[]
}
