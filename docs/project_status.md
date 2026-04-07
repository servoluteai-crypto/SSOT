# Project Status

---

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Project scaffold & repo setup | Complete |
| 2 | Database schema & Supabase setup | Complete |
| 3 | Admin auth & setup script | Complete |
| 4 | Document upload pipeline (PDF → RAG) | Complete |
| 5 | RAG query pipeline | Complete |
| 6 | Staff-facing chat interfaces (HR + Service & Training) | Complete |
| 7 | Admin panel (documents, prompts, escalation) | Complete |
| 8 | PDF viewer in-app | Complete |
| 9 | MVP end-to-end testing on mobile + desktop | Not started |
| 10 | Vercel production deployment | Not started |
| 11 | Onboarding Hub (post-MVP) | Not started |
| 12 | Analytics — anonymous query logging + admin dashboard | Complete |
| 13 | Review Response Generator (Karlo + Victor voices) | Complete |

---

## Accomplished

- Full Next.js 14 App Router scaffold with Tailwind CSS
- Supabase connected: pgvector, auth, storage, all migrations run
- Config-driven section system — adding a section requires one config entry, zero code changes
- Document upload pipeline: PDF → text extraction → chunking → OpenAI embeddings → Supabase storage
- RAG query pipeline fully isolated in `lib/rag/answerQuestion.ts`
- Shared `ChatInterface` component with suggested questions, citations, PDF viewer trigger, escalation contact
- `/hr` and `/operations/service-training` wired and functional
- Full admin panel: document management, system prompt editor (draft/activate flow), escalation config
- Supabase Auth for admin routes — login, session cookies, admins table verification
- Keyword escalation system built (off by default)
- Auto-generated system prompt drafts on document upload (requires admin activation)
- Anonymous query logging — every chat question logged (no user ID) for analytics
- Admin analytics page (`/admin/analytics`) — top questions, section breakdown, daily trend, 7/30/90d filters
- Review Response Generator (`/reviews`) — paste a review, pick Karlo or Victor, get a draft response. No RAG/embeddings — few-shot examples baked into system prompt

---

## What's Next

### Immediate (pre-launch)
- [ ] End-to-end test on real mobile device at 375px
- [ ] Upload real HR and Service & Training documents
- [ ] Review and activate auto-generated system prompts for each section
- [ ] Set correct escalation contacts in admin panel
- [ ] Deploy to Vercel and verify environment variables

### Post-launch
- [ ] Onboarding Hub — video guides by role, progress tracking, requires auth
- [ ] Per-department admin logins using `section_scope` column
- [x] Analytics — most asked questions, escalation rates, knowledge gap identification
- [ ] MyZimply deep-link integration
- [ ] Microsoft Teams bot integration
