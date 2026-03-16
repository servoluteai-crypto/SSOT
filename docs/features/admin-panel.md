# Feature: Admin Panel

**Routes:** `/admin/*`
**Auth:** Supabase Auth session + `admins` table verification required for all routes

---

## Overview

The admin panel lets Lawrence and Courtney manage documents, system prompts, and escalation config per section. All routes are protected — unauthenticated requests are redirected to `/admin`.

---

## Auth Flow

1. Admin submits email + password at `/admin`
2. `POST /api/admin/login` — Supabase Auth sign-in, sets session cookie
3. `GET /api/admin/verify` — checks session exists AND email is in `admins` table
4. If not in `admins` table: session destroyed, access denied
5. `src/app/admin/layout.tsx` wraps all `/admin/*` routes with auth check

**Admin setup:** Run once with `npx tsx scripts/setup-admins.ts`. Prompts for email + password at runtime (never hardcoded). Requires `ADMIN_SETUP_SECRET` env var.

---

## Document Management — `/admin/documents`

**API:** `GET /api/admin/documents`, `DELETE /api/admin/documents/delete`

Per section:
- List active documents: filename, upload date, chunk count
- Upload new PDF (triggers full pipeline — see [document-upload.md](document-upload.md))
- Delete document (cascades to `document_chunks`, removes from storage)
- PDF only, max 50MB

On upload: old documents for that section are marked inactive then deleted. New document becomes active.

---

## System Prompt Editor — `/admin/prompts`

**API:** `GET /api/admin/prompt`, `POST /api/admin/prompt`, `POST /api/admin/regenerate-prompt`

Per section:
- **Active prompt** — shown in editable textarea, save button
- **Draft area** — populated after document upload with auto-generated prompt
- **Activate** — promotes draft to active (goes live immediately)
- **Discard** — clears draft without activating
- **Regenerate draft** — re-runs Claude Haiku against the active document's text
- Last edited timestamp + editor email shown

**Important:** Auto-generated drafts are NEVER activated automatically. Admin must review and click Activate.

Prompt is stored in `documents.system_prompt` on the active document record.

---

## Escalation Config — `/admin/escalation`

**API:** `GET /api/admin/escalation`, `POST /api/admin/escalation`

Per section:
- Edit escalation contact name and email
- Keyword escalation toggle (on/off) — off by default
- Add/remove keywords from the escalation keyword list

Contacts are read from `config/sections.ts` as defaults but can be overridden via this panel. Keywords stored in `config/escalation-keywords.ts` (toggle + list).

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/login` | POST | Supabase Auth sign-in |
| `/api/admin/verify` | GET | Check session + admins table |
| `/api/admin/dashboard` | GET | Admin stats (doc counts, etc.) |
| `/api/admin/documents` | GET | List documents per section |
| `/api/admin/documents/delete` | DELETE | Delete document + chunks + storage |
| `/api/admin/prompt` | GET | Get active + draft prompt for section |
| `/api/admin/prompt` | POST | Save/activate/discard prompt |
| `/api/admin/regenerate-prompt` | POST | Re-draft system prompt via Claude |
| `/api/admin/escalation` | GET | Get escalation config for section |
| `/api/admin/escalation` | POST | Update escalation contact / keywords |
| `/api/admin/debug-auth` | GET | Auth debug info (dev only) |

---

## Known Limitations / Improvement Areas

- Only full-access admins currently — `section_scope` column exists but per-section admin login not yet implemented
- No audit log of who changed which prompt or when (beyond last edited timestamp)
- Keyword list changes write to config file — requires redeploy to take effect on Vercel
- No bulk document management (only one upload at a time per section)
