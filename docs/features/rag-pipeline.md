# Feature: RAG Pipeline

**Location:** `src/lib/rag/answerQuestion.ts`

---

## Overview

The RAG (Retrieval-Augmented Generation) pipeline is the core intelligence of SSOT. It takes an employee's question, finds the most relevant chunks from uploaded documents, and returns a cited answer via Claude. All logic is isolated to a single function — nothing outside it knows how retrieval works.

---

## Function Signature

```typescript
export async function answerQuestion(
  sectionId: string,
  query: string,
  conversationHistory: Message[]
): Promise<AnswerResult>
```

**Returns:**
```typescript
{
  answer: string
  citations: Citation[]   // deduplicated by document name
  escalated: boolean
}
```

---

## Query Flow

```
Step 0: Check keyword escalation (if ESCALATION_CONFIG.enabled)
  → if keyword matched: return escalation message immediately, skip RAG

Step 1: Embed query
  → OpenAI text-embedding-3-small → 1536-dim vector

Step 2: Vector search
  → match_chunks RPC, top 12 results, filtered by sectionId
  → cosine similarity via pgvector ivfflat index
  → if no chunks found: return "no information found" + escalation contact

Step 3: Fetch document filenames
  → used for source citations

Step 4: Assemble prompt
  → system prompt (DB first, fallback to config/prompts/{sectionId}.txt)
  → escalation contact appended to system prompt
  → chunks formatted as [Source N: filename]\n{chunk_text}
  → conversation history + current query appended

Step 5: Call Claude
  → model: claude-haiku-4-5-20251001
  → max_tokens: 1024

Step 6: Build and return citations
  → deduplicated by document name
  → each citation includes document name + first 200 chars of chunk
```

---

## System Prompt Resolution

1. Query `documents` table for active doc with non-null `system_prompt` for this `sectionId`
2. If found: use it
3. If not: read `config/prompts/{sectionId}.txt`
4. If that fails: use generic fallback ("Answer only from provided documents. Never guess. Cite sources.")

---

## Escalation Detection

`escalated: true` is returned when:
- Keyword escalation triggered (Step 0), OR
- Claude's response text contains the section's escalation contact email (natural language escalation via system prompt)

---

## Key Implementation Notes

- Chunk retrieval: top **12** (not 5 as originally spec'd — updated during build for better coverage)
- Chunk size: **400 words** (not 500 tokens — implemented word-based chunking)
- No overlap currently implemented (spec called for 50 token overlap — not yet built)
- 100ms delay between embedding API calls to avoid rate limiting during upload
- Rollback on partial failure: deletes document record (cascades to chunks) + removes from storage

---

## Known Limitations / Improvement Areas

- No chunk overlap — could miss context at chunk boundaries
- Keyword escalation is a blunt instrument — natural language escalation via system prompt is more accurate
- `match_count: 12` is hardcoded — could be made configurable per section
- No streaming response — full answer buffered before returning to client
