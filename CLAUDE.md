# CLAUDE.md — EHL Experiences SSOT Platform

> **Read fully before writing any code. Follow every instruction exactly.**

---

## Quick Reference

- **App name:** EHL Single Source of Truth (EHL SSOT)
- **Company:** EHL Experiences — umbrella hospitality brand
- **Venues:** Fire Steakhouse & Bar, Sole Seafood & Grill, Saint Studios, The Roundroom
- **Purpose:** Employees ask questions in plain English → app searches uploaded company documents via RAG → returns cited answers. Cannot answer = escalate to human.
- **Core rule:** NEVER answer from general knowledge. Every answer must come from uploaded documents only.

---

## Users

| Role | Device | Auth required? |
|------|--------|----------------|
| Floor/field staff (primary) | Phone only, non-technical | No (MVP) |
| Office/admin staff (secondary) | Desktop + phone | No (MVP) |
| Admins (Lawrence + Courtney) | Desktop + phone | Yes — `/admin` routes only |

---

## Documentation

| File | Purpose |
|------|---------|
| [architecture.md](architecture.md) | System architecture, data flow, DB schema, component map |
| [docs/changelog.md](docs/changelog.md) | All notable changes — update after every meaningful change |
| [docs/project_status.md](docs/project_status.md) | Milestones, what's done, what's next |
| [docs/features/rag-pipeline.md](docs/features/rag-pipeline.md) | RAG query pipeline detail |
| [docs/features/document-upload.md](docs/features/document-upload.md) | Document upload pipeline detail |
| [docs/features/chat-interface.md](docs/features/chat-interface.md) | Chat UI component detail |
| [docs/features/admin-panel.md](docs/features/admin-panel.md) | Admin panel routes and API detail |
| [docs/features/section-config.md](docs/features/section-config.md) | Config-driven section system detail |

---

## Hard Rules — Never Break These

1. NEVER answer from general knowledge — only from retrieved document chunks
2. NEVER persist employee conversation content to DB in MVP
3. NEVER send automatic emails — escalation = display contact details only
4. NEVER hardcode navigation sections — always config-driven via `config/sections.ts`
5. NEVER activate keyword escalation by default — admin must explicitly enable
6. ALWAYS cite source document and section in every AI response
7. ALWAYS build mobile-first — test at 375px
8. ALWAYS keep RAG pipeline inside `lib/rag/answerQuestion.ts` only
9. ALWAYS run full DB schema migrations on first setup even if tables are empty
10. ALWAYS keep auth logic in place even for public sections — activate via config only

---

## Documentation Maintenance

Update docs automatically when making changes:

- **After any code change:** add an entry to [docs/changelog.md](docs/changelog.md)
- **After completing or starting a milestone:** update [docs/project_status.md](docs/project_status.md)
- **After adding a major feature:** update or create the relevant file in [docs/features/](docs/features/)
- **After significant architectural change:** update [architecture.md](architecture.md)

---

## Future Features — DO NOT BUILD NOW

- **Onboarding Hub:** Video guides by role, progress tracking, requires auth (`authRequired: true`)
- **Per-department admin logins:** `section_scope` column already stubbed in `admins` table
- **Analytics:** Most asked questions, escalation rates, knowledge gap identification
- **Integrations:** MyZimply deep-link, Microsoft Teams bot

---

## Adding a New Section

1. Add one entry to `config/sections.ts`
2. Upload document via admin panel (auto chunks + embeds)
3. Review + activate auto-generated system prompt
4. Set escalation contact in admin panel

**No code changes. Steps 2–4 need no developer.**
