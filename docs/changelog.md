# Changelog

All notable changes to EHL SSOT are documented here.

Format: `[YYYY-MM-DD] — Description`

---

## [2026-03-13] — Initial MVP build

### Added
- Next.js 14 App Router scaffold with Tailwind CSS
- Supabase integration: pgvector, auth, file storage
- Full database schema: `admins`, `documents`, `document_chunks`, `escalation_logs`
- `match_chunks` RPC function for cosine similarity search
- Admin setup script (`scripts/setup-admins.ts`) — creates two admin accounts in Supabase Auth + `admins` table
- Supabase Auth for admin routes — session via cookies, `admins` table check on login
- Landing page (`/`) — department tiles driven by `config/sections.ts`
- Config-driven section system (`config/sections.ts`) with `suggestedQuestions`, `description`, `escalationContact`, `authRequired`
- Document upload pipeline (`/api/documents/upload`) — PDF → text extraction (unpdf) → chunking (400 words) → embeddings (OpenAI) → Supabase insert → auto-draft system prompt
- RAG query pipeline (`lib/rag/answerQuestion.ts`) — embed query → match_chunks (top 12) → assemble prompt → Claude Haiku → citations
- Shared `ChatInterface` component — used by `/hr` and `/operations/service-training`
- HR chat interface (`/hr`)
- Service & Training chat interface (`/operations/service-training`)
- Operations landing page (`/operations`)
- Onboarding Hub coming soon placeholder (`/operations/onboarding-hub`)
- Admin dashboard (`/admin/dashboard`)
- Admin document management (`/admin/documents`) — upload, view chunks, delete
- Admin system prompt editor (`/admin/prompts`) — draft/activate/discard/regenerate
- Admin escalation config (`/admin/escalation`) — contacts, keyword toggle
- PDF viewer modal (`PdfViewerModal.tsx`) — Supabase signed URLs, react-pdf
- Keyword escalation config (`config/escalation-keywords.ts`) — off by default
- `.env.example` with all required variable names
- `architecture.md`, `CLAUDE.md` project documentation
