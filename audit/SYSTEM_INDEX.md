# SYSTEM_INDEX — RoleWise

> Generated: 2026-04-14. The single-page mental model. If you read one file from this audit, read this one.

---

## What is RoleWise

A single-user (per-account) role-tracking and decision-support tool for job seekers. You paste a JD, it analyses fit against your stored profile + past decisions, you decide, it learns. Frontend is a vanilla-JS SPA. Backend is Supabase (Postgres + Edge Functions + Auth).

---

## Architecture in one diagram

```
┌──────────────────────────── BROWSER ──────────────────────────────┐
│                                                                    │
│  index.html                                                        │
│    ├── Tailwind Play CDN  (runtime compilation — perf hotspot)     │
│    ├── styles.css         (16k lines, design system + components)  │
│    ├── app.js             (32k lines, the monolith)                │
│    ├── reasoning-map.js   (124 KB, SVG overlay — eager load)       │
│    ├── analysis/render.js + signals.js   (extracted helpers)       │
│    └── devtools/inspect/{inspect-mode, ai-meta}.js  (localhost)    │
│                                                                    │
│  State: top-level IIFE globals + 12 localStorage keys              │
│  Render: el.innerHTML = … (no virtual DOM, no diffing)             │
│                                                                    │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ Supabase JS client
                               ▼
┌──────────────────────────── SUPABASE ─────────────────────────────┐
│                                                                    │
│  ~30 tables (roles, role_decisions, role_conversations,            │
│              candidate_learning, profiles, brand_assets, …)         │
│                                                                    │
│  7 edge functions:                                                 │
│    analyse-jd          (Claude API — main JD analysis)              │
│    workspace-chat      (multi-turn chat)                            │
│    enrich-role         (inferred enrichments)                       │
│    commute-estimate    (routing API)                                │
│    fetch-linkedin-jd   (LinkedIn session-cookie scrape)             │
│    generate-narrative  (post-analysis narrative)                    │
│    memory-extract      (chat-context extraction)                    │
│                                                                    │
│  Auth: Supabase Auth — single user per account.                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## The 6 columns of the UI

```
┌─ left nav ─┬─ filter ─┬─ inbox ─┬─ centre (role detail) ─┬─ chat ─┬─ rail ─┐
│            │          │         │                         │        │        │
│  overview  │ search   │  role   │  header                 │  ws    │ stage  │
│  inbox     │ checkbox │  cards  │  decision banner        │  time- │ chips  │
│  radar     │ filters  │         │  match output           │  line  │ outcome│
│  recruit.  │          │         │  JD section             │  chat  │ chips  │
│  admin     │          │         │  notes                  │  bar   │ history│
│  profile   │          │         │  preparation            │  docs  │        │
│            │          │         │                         │        │        │
└────────────┴──────────┴─────────┴─────────────────────────┴────────┴────────┘
```

Visibility of columns is driven by `currentNav` and three booleans (`listPanelVisible`, `rightPanelVisible`, `filterPanelOpen`). All panels are pre-baked in `index.html` and rendered into via `el.innerHTML = …`.

---

## The lifecycle of a role

```
1. INGEST          → +Add JD button → openIngestionOverlay()
                     paste JD / URL / LinkedIn / file
                       │
2. PARSE           → runJDExtractionV2(jdText)  (pure, app.js:21013+)
                     → company, salary, work model, location, IR35, etc.
                       │
3. ANALYSE         → callAnalysisAPI() → analyse-jd edge function
                     → Claude returns structured analysis JSON
                       │
4. ENRICH          → enrich-role + generate-narrative
                       │
5. PERSIST         → roles INSERT, jd_matches INSERT, analyses INSERT
                     plus per-role audit log row in role_updates
                       │
6. RENDER          → renderInbox() (full rebuild)
                     selectRole(id) → renderRoleDoc + renderRail
                     renderMatchOutput drives the centre card sections
                       │
7. DECIDE          → Apply / Skip / Pass / Withdraw buttons
                     wsAppendDecision (role_decisions)
                     + _saveDecisionSnapshot (role_decision_snapshots)
                     + _saveCandidateDecisionExt (role_decisions_ext)
                     + _updateCandidateLearningCounters
                     + _rebuildCandidateLearningPatterns (every 5th)
                       │
8. ITERATE         → workspace chat (callWorkspaceChatAPI)
                     notes (localStorage rw_role_notes_<id>)
                     section context corrections (roles.section_context JSON)
                     interactions, insights, artifacts (separate tables)
                       │
9. OUTCOME         → Outcome chip → showOutcomeReasonForm
                     role_outcomes_ext + candidate_learning update
```

---

## Key files at a glance

| File | Lines | Role |
|---|---:|---|
| `app/app.js` | 31,999 | Monolith — see CODEBASE_INDEX.md for sections |
| `app/styles.css` | 15,995 | Design system + component styles (~1,646 selectors) |
| `app/index.html` | 1,085 | Shell, script tags, global Tailwind block |
| `app/reasoning-map.js` | 2,763 | SVG reasoning graph overlay (self-contained) |
| `app/analysis/render.js` | ~305 | Section renderers used by `renderMatchOutput` |
| `app/analysis/signals.js` | ~270 | Pure signal classifier |
| `app/devtools/inspect/*` | ~500 | Localhost-only DOM inspector |
| `app/ai/prompts/rolewise-prompts.js` | — | Prompt templates used by edge functions |
| `supabase/functions/*` | ~1,000 | 3 edge functions checked in (others deployed only) |

---

## Where state lives

| Kind | Where | Examples |
|---|---|---|
| Mutable globals | top-level IIFE in `app.js` | `allRoles`, `selectedRoleId`, `currentNav`, `_candidateLearning`, caches |
| Per-user persistence | Supabase tables | `profiles`, `candidate_profile`, `candidate_learning`, `user_boundaries` |
| Per-role persistence | Supabase tables | `roles` + ~14 child tables |
| User preferences | localStorage | `rw-accent-theme`, `rw-appearance-mode`, `rw_intel_*` flags |
| Per-role notes | localStorage (smell) | `rw_role_notes_<id>` — should move to DB |
| Section context | `roles.section_context` JSON column | per-section corrections / notes |

See STATE_AND_STORAGE_MAP for the complete inventory.

---

## Where events live

| Kind | Count | Notes |
|---|---:|---|
| `addEventListener` calls | ~204 | mostly per-element, some delegated |
| `dispatchEvent` calls | 4 | all on element handles, no global bus |
| `setInterval` | 1 | workspace phase polling |
| `setTimeout` | 20+ | mostly fade/timer UI |
| `IntersectionObserver` | 1 | sticky header reveal |
| Custom events | `ws:chip-send` | timeline chip → workspace handler |

See EVENT_MAP for the complete inventory.

---

## Things that look complicated but aren't

- **JD Extraction Engine v2** (`app.js:21013–22461`) — already a clean layered module-within-the-file. Read its header comment.
- **Reasoning map** (`reasoning-map.js`) — self-contained black box. Don't touch unless changing the reasoning view.
- **`analysis/signals.js`** — pure function, ~270 lines. Read top to bottom in 10 minutes.

## Things that look simple but aren't

- **`renderInbox`** — full-tree rebuild on every keystroke. See PERFORMANCE_HOTSPOTS #3.
- **`selectRole`** — triggers full re-render of centre + rail. See PERFORMANCE_HOTSPOTS #5.
- **`wsAppendDecision`** — fires three sibling functions and one rebuild. Not a duplication, but worth tracing once.
- **`section_context` JSON** — has its own legacy localStorage migration path that already ran. Don't reintroduce LS storage.

---

## The 30-second new-developer brief

1. Open `WHERE_THINGS_LIVE.md`. Find your feature.
2. Open `app.js` to that line. Use the section dividers (`──── X ────`) to orient.
3. Most rendering is `el.innerHTML = bigHtmlString`. There is no diffing.
4. State is global; mutate carefully. Render functions read globals directly.
5. Saves are `await db.from('table').…`. Most are fire-and-forget — see PERFORMANCE_HOTSPOTS #11.
6. New DOM event? Probably belongs in an existing delegate (see EVENT_MAP §5).
7. Need to add a feature module? Read MODULE_SPLIT_PROPOSAL first.
