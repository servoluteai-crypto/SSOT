# Feature: Config-Driven Section System

**Location:** `config/sections.ts`

---

## Overview

All sections (HR, Service & Training, Onboarding Hub, etc.) are defined in a single config file. No section data is hardcoded in components. Adding a new section requires only one config entry — zero code changes.

---

## Section Shape

```typescript
{
  id: string                        // URL slug, used as sectionId throughout the app
  label: string                     // Display name
  description: string               // One-liner shown in UI
  parent: string | null             // null = top-level, string = parent section id
  status: 'active' | 'coming-soon' | 'hidden'
  authRequired: boolean             // false for MVP, flip to true to require login
  escalationContact: {
    name: string
    email: string
  } | null
  systemPromptFile: string | null   // Path to fallback system prompt file
  suggestedQuestions: string[]      // Shown as chips on chat interface load
}
```

## Top-Level Sections

```typescript
TOP_LEVEL_SECTIONS: { id, label, description }[]
```

Used to render the landing page department tiles. Operations is a parent that groups sub-sections.

---

## Current Sections

| id | label | Parent | Status | Auth |
|----|-------|--------|--------|------|
| `hr` | HR | — | active | No |
| `service-training` | Service & Training | operations | active | No |
| `onboarding-hub` | Onboarding Hub | operations | coming-soon | Yes (future) |

---

## Helper Functions

```typescript
getSectionById(id: string): Section | undefined
getSectionsByParent(parentId: string): Section[]
```

---

## Adding a New Section

1. Add entry to `SECTIONS` array in `config/sections.ts`
2. If it needs a fallback system prompt, create `config/prompts/{id}.txt`
3. Upload document via admin panel → review auto-generated prompt → activate
4. Set escalation contact via admin panel

No component changes needed for steps 2–4.

---

## Status Behaviour

- `active` — fully functional, link clickable
- `coming-soon` — visible on landing/operations page, non-clickable, "Coming Soon" badge
- `hidden` — not rendered in navigation at all

## Auth Behaviour

- `authRequired: false` — publicly accessible, no login
- `authRequired: true` — requires Supabase Auth session (mechanism built, activates via config flip)
