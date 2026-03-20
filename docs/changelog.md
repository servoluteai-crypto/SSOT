# Changelog

All notable changes to EHL SSOT are documented here.

Format: `[YYYY-MM-DD] — Description`

---

## [2026-03-20] — Smart topic clustering for analytics

### Changed
- Analytics API now groups similar queries into topics using Claude Haiku (e.g. "how many holidays do i get" and "whats the holiday count" → "Holiday Allowance")
- Analytics page shows expandable topic cards instead of individual queries — click to see all variations
- `QueryAnalytics` type updated: `topQueries` replaced with `topTopics` (array of `QueryTopic`)

---

## [2026-03-20] — Vision fallback for scanned/image PDFs

### Added
- `extractTextViaVision()` in the upload route — renders each PDF page to a PNG at 2x scale using `pdfjs-dist` + `@napi-rs/canvas`, then sends to Claude Haiku vision to extract text. No new dependencies needed (both were already installed transitively)
- When a PDF yields < 10 words via `unpdf`, the pipeline automatically retries via vision extraction instead of failing
- Success message in the admin Documents UI now notes "(scanned PDF — text extracted via vision)" when vision was used
- `extractionMethod` field returned in upload API response

---

## [2026-03-20] — Fix document ingestion for empty-text PDFs

### Fixed
- Upload route now returns a 422 error (with a clear message) if text extraction yields fewer than 10 words — previously a scanned/image-only PDF would silently create a document record with 0 chunks, making it invisible to the bot
- Removed orphaned 0-chunk document record for "EHL Experiences' Onboarding blueprint.pdf" from the database
- Removed duplicate "Contact Person Fact sheet.docx" record (older of the two uploads)

---

## [2026-03-20] — Anonymous query analytics

### Added
- `query_logs` table — stores every chat query anonymously (no user ID, no conversation linkage) with section_id, escalation status, and whether results were found
- Analytics API endpoint (`/api/admin/analytics`) — aggregates top queries, totals, escalation rate, section breakdown, and daily trends with 7/30/90-day filters
- Admin analytics page (`/admin/analytics`) — summary stats, ranked top questions list, section bar chart, daily trend chart
- "Analytics" nav item in admin sidebar

### Changed
- Chat API (`/api/chat`) now logs each query as fire-and-forget after answering (does not slow down responses)

---

## [2026-03-20] — DOCX file upload support

### Changed
- Document upload pipeline now accepts both PDF and DOCX files
- File validation updated to allow `.pdf` and `.docx` extensions
- Admin panel upload UI updated to indicate PDF or DOCX support

### Added
- `mammoth` library (`^1.8.0`) for DOCX text extraction
- DOCX text extraction in upload route (`/api/documents/upload`)

---

## [2026-03-16] — Database-backed escalation contacts

### Changed
- Escalation contact admin panel (`/admin/escalation`) now persists to database instead of config files
- RAG pipeline (`lib/rag/answerQuestion.ts`) now fetches escalation contacts from database with fallback to config file
- Admin can change escalation email on-the-fly without requiring deployment
- All escalation messages now pull from `section_escalation_config` table (database-first, config fallback)

### Added
- `section_escalation_config` table with section_id (unique), contact_name, contact_email, updated_at
- GET endpoint to `/api/admin/escalation` to fetch saved config per section
- RLS policies for escalation config table

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
