# Feature: Document Upload Pipeline

**Location:** `src/app/api/documents/upload/route.ts`

---

## Overview

Admins upload PDF documents via the admin panel. The pipeline extracts text, chunks it, generates embeddings, stores everything in Supabase, and auto-drafts a system prompt for admin review. One active document per section at a time.

---

## API Endpoint

```
POST /api/documents/upload
Content-Type: multipart/form-data

Fields:
  file        File    Required. PDF only, max 50MB
  sectionId   string  Required. Must match a section id in config/sections.ts
  uploadedBy  string  Optional. Admin email for audit trail
```

**Response (success):**
```json
{
  "success": true,
  "documentId": "uuid",
  "chunkCount": 42,
  "draftPrompt": "You are the HR assistant..."
}
```

**Response (error):**
```json
{ "error": "description" }
```

---

## Upload Flow

```
1. Validate: file present, PDF extension, size ≤ 50MB

2. Upload PDF to Supabase Storage
   → path: documents/{sectionId}/{filename}
   → upsert: true (overwrites same filename)

3. Extract text from PDF
   → library: unpdf (extractText with mergePages: true)

4. Insert document record (is_active = true)
   → if this fails: remove file from storage, return error

5. Chunk and embed (streaming — no array buffering)
   → chunk size: 400 words (word-split, no overlap currently)
   → embed each chunk: OpenAI text-embedding-3-small
   → insert each chunk immediately into document_chunks
   → 100ms delay between chunks to avoid rate limiting
   → if any chunk fails: delete document record (cascades chunks) + remove from storage

6. Clean up old inactive documents
   → delete all docs for this sectionId where is_active = false
   → active documents for this section remain (multi-doc supported)

7. Generate system prompt draft
   → first 3000 words sent to Claude Haiku with meta-prompt
   → returned in response as draftPrompt
   → NOT saved to DB automatically — admin must save and activate
   → failure here is non-fatal (logged, upload still succeeds)
```

---

## System Prompt Auto-Draft

Meta-prompt sent to Claude Haiku with first 3000 words of document:

> You are configuring an AI assistant for a hospitality company called EHL Experiences. Write a system prompt that instructs the AI to: answer only from the document, cite section names in italics, use warm tone, escalate personal situations, never guess.

The draft is returned to the admin UI. Admin must click **Save Draft** then **Activate** before it goes live.

---

## Storage Structure

```
Supabase Storage bucket: documents
  documents/
    hr/
      EHL-HR-Policy-2025.pdf
    service-training/
      Service-Standards-Guide.pdf
```

---

## Known Limitations / Improvement Areas

- No chunk overlap — could miss context at chunk boundaries
- Text extraction quality depends on PDF structure (scanned/image PDFs will extract poorly)
- Single active document per section — replacing adds a new doc and marks old ones inactive, then deletes them
- No progress indicator — long PDFs block the API route until complete (consider background job for large files)
- `uploadedBy` is stored as text, not validated against the admins table
