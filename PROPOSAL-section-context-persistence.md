# Proposal: Section Context — Proper Persistence Model

**Status:** Draft  
**Date:** 2026-04-13  
**Depends on:** V1 section context feature (shipped, localStorage-only)

---

## Problem

V1 stores role-specific notes, corrections, and preferences in `localStorage` keyed by `rw_section_ctx_{roleId}`. This is fragile: clearing browser data, switching devices, or using incognito mode loses everything. Preferences already write to `profiles.preferences_json` via `_savePreferencePatch`, but role-level notes and corrections have no server-side home.

## Goals

1. Persist role-level section context (notes and corrections) to the database so they survive across browsers and devices.
2. Keep the existing user-level reusable preferences path (`profiles.preferences_json → section_preferences[]`) but formalise it.
3. Add an explicit "re-evaluate this role" action so saved context can feed back into analysis — without any silent or automatic re-analysis.

---

## Data Model

### A. Role-level storage: `section_context` column on `roles`

Add a single JSONB column to the existing `roles` table:

```sql
ALTER TABLE roles
ADD COLUMN section_context JSONB DEFAULT '{}'::jsonb;
```

Shape — identical to the current localStorage structure:

```jsonc
{
  "fit-reality": {
    "type": "note",           // "note" | "correction"
    "text": "The hiring manager mentioned...",
    "created_at": "2026-04-13T10:00:00Z",
    "updated_at": "2026-04-13T10:05:00Z"
  },
  "commute": {
    "type": "correction",
    "text": "Office is actually in Edinburgh, not Glasgow.",
    "created_at": "2026-04-13T10:10:00Z",
    "updated_at": "2026-04-13T10:10:00Z"
  }
}
```

Notes:

- Only `note` and `correction` types live here. Preferences continue to live on `profiles.preferences_json` because they are user-level, not role-level.
- The column is nullable/defaults to `{}` so existing roles are unaffected.
- No new table required — this is a lightweight annotation layer on a row that already belongs to the user.

### B. User-level reusable preferences (no schema change)

Already persisted in `profiles.preferences_json.section_preferences[]`. Formalise the shape:

```jsonc
// Inside profiles.preferences_json
{
  "section_preferences": [
    {
      "section": "commute",
      "text": "I will not consider roles requiring >3 days/week in office.",
      "created_at": "2026-04-10T09:00:00Z",
      "updated_at": "2026-04-13T10:05:00Z"
    }
  ],
  // ... other existing preference fields
}
```

No migration needed — this path already works in V1.

---

## Read/Write Flow

### On role detail load

1. Read `role.section_context` from the already-fetched role object (loaded in `loadData()`).
2. Read `userProfile.section_preferences` for preference entries.
3. Merge into the in-memory model used by `_scDecorateRenderedSections`.
4. Fall back to localStorage if the DB field is empty (one-time migration: if localStorage has data and DB doesn't, write localStorage entries up to the DB, then clear localStorage for that role).

### On save

| Type | Where it writes | Method |
|------|----------------|--------|
| `note` | `roles.section_context` | `db.from('roles').update({ section_context }).eq('id', roleId)` |
| `correction` | `roles.section_context` | Same as above |
| `preference` | `profiles.preferences_json` | `_savePreferencePatch({ section_preferences })` (existing) |

All three also update the in-memory model immediately (optimistic).

### On delete

Same paths in reverse — remove the key from the JSONB object or array, write back.

---

## Migration from localStorage

A one-time, per-role lazy migration:

```
When rendering a role detail:
  1. Load section_context from DB (via role object).
  2. Load localStorage entries for this roleId.
  3. For each localStorage entry:
     - If DB has no entry for that section → write it to DB.
     - If DB already has an entry → DB wins (it's newer or was set from another device).
  4. Clear localStorage key for this roleId.
```

This is transparent to the user. No bulk migration script needed — entries migrate the next time the user views each role.

---

## "Re-evaluate this role" Action

### What it is

A button (not automatic) that the user explicitly clicks to request that the analysis be re-run, incorporating any saved notes, corrections, and preferences.

### Where it appears

On the role detail view, inside or near the decision block — visible only when:
- The role has at least one `correction` or `preference` entry saved, AND
- The role has an existing analysis (no point re-evaluating a role that hasn't been analysed).

### What it does

1. Gathers the role's `section_context` (corrections) and applicable `section_preferences`.
2. Appends them as structured context to the analysis prompt (a new optional field in the analysis input).
3. Queues or triggers a re-analysis pass — same pipeline as the original analysis, with the added context.
4. Marks the role with a `re_eval_requested_at` timestamp so the UI can show "Re-evaluation pending" state.
5. When the new analysis arrives, it replaces the old one. The section context entries remain untouched.

### What it does NOT do

- It does not run automatically when a note/correction/preference is saved.
- It does not silently modify the global preference model.
- Notes (type `note`) are private annotations and are NOT sent to the analysis — only corrections and preferences are.

### Suggested schema addition

```sql
ALTER TABLE roles
ADD COLUMN re_eval_requested_at TIMESTAMPTZ DEFAULT NULL;
```

This lets the UI distinguish "analysis is current" vs "user requested re-evaluation, pending".

---

## Implementation Phases

### Phase 1: DB persistence (small)
- Add `section_context` column to `roles`.
- Update `_scSet` / `_scDelete` to write to DB instead of (or in addition to) localStorage.
- Add lazy migration from localStorage.
- No UI changes — everything looks and works the same, just persisted properly.

### Phase 2: Formalise preferences display
- When decorating sections, also show applicable `section_preferences` entries even on roles where no role-specific context exists — so the user can see "Your standing preference for this section" on every role.
- Add a small visual distinction (e.g., a "reusable" badge or different border colour) to make it clear this came from preferences, not a role-specific note.

### Phase 3: Re-evaluate action
- Add the "Re-evaluate with my context" button.
- Modify the analysis prompt builder to accept optional `user_context` field.
- Add `re_eval_requested_at` column.
- Wire up the re-analysis queue.

---

## Open Questions

1. **Conflict resolution across devices:** The proposal uses last-write-wins. Should we add `updated_at` comparison and warn the user if a newer version exists on the server?
2. **Retention on role deletion:** When a role is deleted, `section_context` goes with it. Should corrections/notes be exportable first?
3. **Preference scope:** Currently preferences are per-section (e.g., one preference for "Commute"). Should we support multiple preferences per section, or is one sufficient?
4. **Rate limiting re-evaluation:** Re-analysis costs API tokens. Should there be a cooldown or confirmation step ("This will use 1 analysis credit")?
