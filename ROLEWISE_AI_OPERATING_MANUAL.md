# Rolewise AI Operating Manual

> **Last updated:** 2026-03-12
> **Purpose:** Defines the operational rules for AI assistants working in the Rolewise codebase. Ensures safe edits, traceable development, and consistent documentation updates.

---

## Core Principles

1. Make minimal changes.
2. Never rewrite large files.
3. Preserve existing behaviour unless explicitly instructed.
4. Every change must be logged.

---

## Safety Editing Rule

Before modifying any file the AI must follow this process:

1. Locate the exact function or block requiring change.
2. Read at least 50 lines before and after that location.
3. Confirm no other features rely on the code.
4. Modify only the minimal required lines.

The AI must never:

- Rewrite entire files.
- Reformat large code sections.
- Rename variables unnecessarily.
- Move unrelated logic.

Large files such as `app.js` must only be patched, never rewritten.

---

## Mandatory Change Declaration

Before writing code the AI must output:

- **File being modified**
- **Function being edited**
- **Lines affected**
- **Reason for change**

**Example:**

```
Editing file: app.js
Function: renderRoleDoc()
Lines affected: 8420–8440
Reason: add Reasoning Map launch button
```

---

## Post-Change Report

After completing a change the AI must output:

- Lines added
- Lines modified
- Lines removed

The AI must confirm that no unrelated code was changed.

---

## Documentation Updates

Every feature implementation must update the following documents:

- `ROLEWISE_MASTER_BUILD_LEDGER.md`
- `ROLEWISE_WORKING_CONTEXT.md`
- `REASONING-MAP-LOG.md` (if map changes)
- `ROLEWISE_ARCHITECTURE_MAP.md` (if architecture changes)

---

## Project Documentation Map

| File | Purpose |
|------|---------|
| `ROLEWISE_ARCHITECTURE_MAP.md` | Describes the real system architecture |
| `ROLEWISE_MASTER_BUILD_LEDGER.md` | Tracks roadmap tasks and completion |
| `ROLEWISE_WORKING_CONTEXT.md` | Tracks current development work and notes |
| `REASONING-MAP-LOG.md` | Logs reasoning map development |
| `ROLEWISE_AI_OPERATING_MANUAL.md` | Defines AI governance rules (this file) |
