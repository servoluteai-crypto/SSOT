# EHL SSOT — Architecture

> High-level system architecture, data flow, and component relationships.
> For feature detail see [docs/features/](docs/features/). For project status see [docs/project_status.md](docs/project_status.md).

---

## System Overview

EHL SSOT is a RAG-powered Q&A platform. Employees ask questions in plain English → the app searches uploaded company documents → returns cited answers. Floor staff use phones; admins manage content via a protected panel.

```
Employee (phone/desktop)
  → Chat UI (ChatInterface.tsx)
    → POST /api/chat
      → answerQuestion() [lib/rag/answerQuestion.ts]
        → OpenAI embeddings → Supabase pgvector → Claude Haiku
          → cited answer

Admin (desktop)
  → Admin Panel (/admin/*)
    → POST /api/documents/upload
      → PDF → text → chunks → embeddings → Supabase
    → POST /api/admin/prompt
      → activate system prompt per section
```

---

## Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Frontend + API | Next.js 14 (App Router) | No separate backend server |
| Styling | Tailwind CSS | Mobile-first, 375px baseline |
| DB + Auth + Storage | Supabase | pgvector, file storage, auth |
| Embeddings | OpenAI `text-embedding-3-small` | 1536 dimensions |
| LLM | Anthropic `claude-haiku-4-5-20251001` | Upgrade to Sonnet if accuracy issues |
| Hosting | Vercel | |
| VCS | GitHub | |

---

## Directory Structure

```
/
├── config/
│   ├── sections.ts               # Single source for all navigation sections
│   ├── escalation-keywords.ts    # Keyword escalation config (off by default)
│   └── prompts/
│       ├── hr.txt                # Fallback system prompt for HR
│       └── service-training.txt  # Fallback system prompt for Service & Training
│
├── docs/
│   ├── changelog.md
│   ├── project_status.md
│   └── features/
│       ├── rag-pipeline.md
│       ├── document-upload.md
│       ├── chat-interface.md
│       ├── admin-panel.md
│       └── section-config.md
│
├── scripts/
│   └── setup-admins.ts           # One-time admin account creation script
│
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page — department tiles
│   │   ├── hr/page.tsx
│   │   ├── operations/
│   │   │   ├── page.tsx
│   │   │   ├── service-training/page.tsx
│   │   │   └── onboarding-hub/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx          # Admin login
│   │   │   ├── layout.tsx        # Auth-gated layout
│   │   │   ├── dashboard/
│   │   │   ├── documents/
│   │   │   ├── prompts/
│   │   │   └── escalation/
│   │   ├── staff-login/
│   │   └── api/
│   │       ├── chat/route.ts
│   │       ├── documents/
│   │       │   ├── upload/route.ts
│   │       │   └── signed-url/route.ts
│   │       └── admin/
│   │           ├── login/route.ts
│   │           ├── verify/route.ts
│   │           ├── dashboard/route.ts
│   │           ├── documents/route.ts
│   │           ├── documents/delete/route.ts
│   │           ├── prompt/route.ts
│   │           ├── regenerate-prompt/route.ts
│   │           ├── escalation/route.ts
│   │           └── debug-auth/route.ts
│   │
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   └── PdfViewerModal.tsx
│   │
│   ├── lib/
│   │   ├── rag/answerQuestion.ts  # ALL RAG logic lives here only
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── middleware.ts
│   │
│   ├── middleware.ts
│   └── types/index.ts
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## Core Architectural Patterns

### 1. Config-Driven Navigation

All sections defined in `config/sections.ts` — label, parent, status, auth requirement, escalation contact, suggested questions. Never hardcoded in components. See [docs/features/section-config.md](docs/features/section-config.md).

### 2. RAG Pipeline — Single Isolated Function

All retrieval + answer logic in `lib/rag/answerQuestion.ts` only. See [docs/features/rag-pipeline.md](docs/features/rag-pipeline.md).

### 3. Document Upload Pipeline

PDF → text extraction → chunks → embeddings → Supabase. See [docs/features/document-upload.md](docs/features/document-upload.md).

### 4. Auth — Built But Inactive for MVP

Full Supabase Auth implemented. `authRequired: false` in config for public sections. Admin routes always protected. Flipping `authRequired: true` activates auth per section with no code changes.

### 5. System Prompt Priority

1. `documents.system_prompt` on the active document (admin-activated)
2. Fallback: `config/prompts/{sectionId}.txt`
3. Generic fallback hardcoded in `answerQuestion.ts`

---

## Database Schema

**`admins`**
- `id` uuid PK, `email` text unique, `section_scope` text (null = full access), `created_at`

**`documents`**
- `id` uuid PK, `section_id` text, `filename` text, `storage_path` text, `uploaded_at`, `uploaded_by` text, `is_active` boolean, `system_prompt` text

**`document_chunks`**
- `id` uuid PK, `document_id` uuid FK → documents CASCADE, `section_id` text, `chunk_text` text, `chunk_index` int, `embedding` vector(1536), `created_at`
- Index: ivfflat on embedding (vector_cosine_ops, lists=100)

**`escalation_logs`**
- `id` uuid PK, `section_id` text, `query` text, `escalation_reason` text, `created_at`
- (future use — table exists, empty in MVP)

**RPC: `match_chunks(query_embedding, section_id, match_count)`**
Returns top N chunks by cosine similarity for a given section.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
ADMIN_SETUP_SECRET=
```
