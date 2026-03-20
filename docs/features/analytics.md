# Feature: Query Analytics

**Location:** `/admin/analytics`
**API:** `src/app/api/admin/analytics/route.ts`
**Logging:** `src/app/api/chat/route.ts` (fire-and-forget insert)

---

## Overview

Every question asked via the chat interface is logged anonymously to the `query_logs` table. Admins can view aggregated analytics on the `/admin/analytics` page to identify common questions, knowledge gaps, and escalation patterns.

---

## Privacy

- **No user identifier** is stored — the `query_logs` table has no `user_id` column
- **No conversation linkage** — each query is an independent row with no session or thread reference
- Queries are normalised to lowercase before storage to reduce trivial duplicates

---

## Database Table

```sql
query_logs
  id              uuid        PK, auto-generated
  section_id      text        NOT NULL — matches config/sections.ts ids
  query           text        NOT NULL — the question asked (lowercase, trimmed)
  was_escalated   boolean     DEFAULT false — whether the answer triggered escalation
  had_results     boolean     DEFAULT true — whether any document chunks matched
  created_at      timestamptz DEFAULT now()

Indexes:
  idx_query_logs_section_created  (section_id, created_at DESC)
  idx_query_logs_created          (created_at DESC)
```

---

## How Logging Works

In `src/app/api/chat/route.ts`, after `answerQuestion()` returns:

1. A Supabase insert is fired **without awaiting** — the chat response is returned immediately
2. If the insert fails, the error is logged to console only — analytics never breaks the core chat feature
3. The query text is stored as `query.trim().toLowerCase()` to group near-identical questions

---

## Analytics API

```
GET /api/admin/analytics?sectionId=hr&days=30
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| sectionId | string | (all) | Filter to one section |
| days | number | 30 | Time window: 7, 30, or 90 |

**Response shape** (`QueryAnalytics` type):

```json
{
  "topTopics": [
    {
      "topic": "Holiday Allowance",
      "count": 12,
      "queries": ["how many holidays do i get", "whats the holiday count", "annual leave entitlement"]
    }
  ],
  "totalQueries": 142,
  "escalationRate": 0.07,
  "queriesBySection": [{ "section_id": "hr", "count": 98 }],
  "queriesByDay": [{ "date": "2026-03-18", "count": 12 }]
}
```

Aggregation is done in JavaScript (not SQL RPCs) since query volume is low (~100 staff).

---

## Topic Clustering

Instead of showing individual queries (which fragment when people phrase the same question differently), the analytics API groups queries into topics using Claude Haiku at display time:

1. The top 50 unique queries (by count) are sent to Claude with their counts
2. Claude groups them into short-named topics (e.g. "Holiday Allowance", "Bike Storage")
3. Each topic shows the total count across all its query variations
4. If Claude's response can't be parsed, the system falls back to showing ungrouped queries
5. If there are 5 or fewer unique queries, no clustering is needed — they're shown as-is

This approach means:
- **Zero extra cost per staff query** — clustering only happens when an admin loads the page
- **No schema changes** — raw queries are stored as-is, clustering is a display-time concern
- **Self-improving** — as more queries come in, Claude gets better grouping context

---

## Admin UI

The `/admin/analytics` page shows:

1. **Filters** — section dropdown + 7d / 30d / 90d time range buttons
2. **Summary stats** — Total Queries, Escalation Rate, Avg Queries/Day
3. **Most Asked Topics** — ranked expandable cards showing topic name, total count, and click-to-expand query variations
4. **Queries by Section** — horizontal progress bars (hidden when filtering by section)
5. **Daily Trend** — bar chart with hover tooltips showing date and count

---

## Future Improvements

- Export analytics data as CSV
- Alert when escalation rate exceeds a threshold
- Track "no results" queries separately to identify missing document coverage
