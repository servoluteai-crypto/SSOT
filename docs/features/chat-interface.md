# Feature: Chat Interface

**Location:** `src/components/ChatInterface.tsx`
**Used by:** `/hr`, `/operations/service-training`

---

## Overview

Shared component used by all active chat sections. Accepts section config as props, handles conversation state in memory, calls the chat API, and renders responses with citations and PDF viewer access.

---

## Props

The component receives the section config object from `config/sections.ts`:

```typescript
{
  id: string
  label: string
  description: string
  escalationContact: { name: string, email: string } | null
  suggestedQuestions: string[]
}
```

---

## Behaviour

- **Conversation history:** In-memory only. Clears on page refresh. Never persisted to DB.
- **Suggested questions:** Shown on load as tappable chips (from `section.suggestedQuestions`)
- **Input:** Fixed at bottom on mobile, full-screen layout
- **Loading state:** Shown while awaiting API response
- **Citations:** Displayed below each AI response — document name, first 200 chars of matched chunk
- **PDF viewer:** "View Document" button on citations opens `PdfViewerModal`
- **Escalation:** If response contains escalation contact, email renders as a tappable `mailto:` link

---

## API Call

```
POST /api/chat
Body: { sectionId, query, conversationHistory }
Response: { answer, citations, escalated }
```

---

## UI Specs

- Mobile-first, 375px baseline
- Section name + description shown at top
- Dark, luxury aesthetic matching brand
- Input fixed at bottom with send button
- Messages scroll upward
- Escalation contact rendered as `<a href="mailto:...">` — no automatic email sent

---

## Known Limitations / Improvement Areas

- No streaming — full response waits before rendering (can feel slow on long answers)
- No conversation export or sharing
- Conversation lost on refresh — intentional for MVP privacy, but may be a UX friction point
- No character limit on input
