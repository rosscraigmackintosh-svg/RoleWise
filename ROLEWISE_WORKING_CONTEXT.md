# ROLEWISE — Working Context

> **Purpose:** AI developer working memory. Updated whenever development begins on a new task.
> **Rule:** Read this file at the start of every development session. Update it before and after each task.

---

## Current Focus

No task currently in progress.

RM-04 and RM-06 closed 2026-03-12 (audit-verified as already fully implemented). Only remaining deferred Reasoning Map task: RM-13 (enrich graph data model — split into RM-13a similar_role and RM-13b market_signal). RM-13a is the next planned task.

---

## Recent Changes

### 2026-03-12
**Task: RM-04 + RM-06 — Doc closure (audit-verified as already implemented)**

Planning audit confirmed both tasks were fully built during foundational graph work. RM-04: arc-based radial layout engine (RING_RADII, TYPE_ARCS, placeNodesInArc, pullEvidenceTowardsParents, computeLayout with 20-iteration collision avoidance). RM-06: centreOnNode() + auto-centre on selectNode() + topbar button (#rm-btn-centre-selected) + dblclick handler + keyboard nav. No code changes required. Doc-only closure.

Files: no code files changed.

---

### 2026-03-12
**Task: RM-07 — Reasoning path highlight (audit-first)**

Audit confirmed BFS pathfinding, path highlighting (rm-node--path, rm-node--dimmed, rm-edge--path), green SVG marker swap, renderPathInspector(), and button wiring all working correctly. One gap (G-01): silent fail when findReasoningPath() returns null. Patched: added else branch to #rm-btn-show-path click handler — button text → "No path found", disabled for 1500ms, then restores. 13/14 Playwright checks pass (A14 = Playwright headless limitation, not app defect). RM-15 regression: 10/10 still clean.

Files: `reasoning-map.js` (2,758 → 2,763 lines, +5)

---

### 2026-03-12
**Task: RM-15 — Final polish (P-01 through P-04)**

Four targeted polish items from pre-implementation audit. P-01: `.rm-topbar-ctrl:disabled` CSS rule (opacity 0.38, cursor default, pointer-events none) — visual disabled state. P-02: `aria-label="Start guided tour"` on tour button in `buildOverlayHTML()` — accessibility. P-03: `inspPanel.scrollTop = 0` in `renderInspector()` after content swap — scroll resets on node switch. P-04: `.rm-guided-title` margin-bottom 4px → 6px — breathing room. No app.js changes. No structural changes. 10/10 Playwright regression pass.

Files: `reasoning-map.js` (2,754 → 2,758 lines, +4), `reasoning-map.css` (1,454 → 1,459 lines, +5)

---

### 2026-03-12
**Task: RM-14 — QA / verification pass + DEFECT-01 patch**

Playwright QA pass across 7 areas (39 checks): guided tour on full/sparse/no-data roles, inspector, dimming, Prev/Next/Finish/×/Escape. 1 real defect found (DEFECT-01 MEDIUM): tour button active on empty state. Patched immediately — 2 lines in `openReasoningMap()`: disable tour button in empty-state branch, re-enable in graph branch. 8/8 verification checks pass. Zero open defects.

Files: `reasoning-map.js` (2,752 → 2,754 lines, +2)

---

### 2026-03-12
**Task: RM-12 — Add lightweight guided mode**

Replaced broken static `GUIDED_STEPS` constant (referenced sample-data node IDs) with dynamic `buildGuidedSteps()` system. Added `GUIDED_TYPE_INFO` (7 node types with title/description), `GUIDED_TYPE_ORDER` (walk sequence), `_guidedSteps` (dynamic storage). Updated `startGuidedMode()` to build steps on entry with empty guard, `stepGuided()` and `renderGuidedStep()` to use `_guidedSteps`. CSS: guided header margin 4→6px, description margin 10→12px. Renamed RM-13 from "Upgrade sample data" to "Enrich graph data model" across all docs.

Files: `reasoning-map.js` (2,745 → 2,752 lines, +7), `reasoning-map.css` (1,454 lines, unchanged)

---

### 2026-03-12
**Task: Dead sample cleanup**

Removed all dead sample-data code from `reasoning-map.js`. `buildSampleGraph()` (355 lines, 0 callers since KG-02), `loadSampleData()` (25 lines, misleading duplicate of initGraph), `#rm-btn-load-sample` button and event wiring. Total −387 lines. Real-data flow unchanged. Empty state still works (shows title + description). Error retry still works. Resolves open question #6.

Files: `reasoning-map.js` (3,132 → 2,745 lines)

---

### 2026-03-12
**Task: RM-11 — Polish controls / filters (CSS only)**

CSS-only patch to `reasoning-map.css` — 11 changes across 11 CSS blocks, 1 line added. Sidebar label gap widened (8px, was 7). Focus pills: gap 5px (was 4), padding 4px 9px (was 3px 8px). Node toggles: list gap 3px (was 2), row padding 5px (was 4). Strength buttons: gap 5px (was 4), padding 4px 10px (was 3px 9px), active font-weight 600. Signal toggles: list gap 3px (was 2), row padding 5px (was 4). Graph actions gap 5px (was 4). Zero JS changes.

Files: `reasoning-map.css` (1,453 → 1,454 lines)

---

### 2026-03-12
**Task: RM-10 — Polish top bar / workspace chrome (CSS only)**

CSS-only patch to `reasoning-map.css` — 7 changes across 7 CSS blocks, 1 line added. Top bar padding balanced (14px both sides, was asymmetric 8/12). Right controls gap widened (6px, was 4). Dividers taller (24px, was 20), darker (`--border`, was `--border-light`), and wider margin (6px, was 4). Centre stats gap 12px (was 10). Canvas inset shadow added for depth at top edge. Sidebar section bottom padding balanced (8px, was 6). Zero JS changes.

Files: `reasoning-map.css` (1,452 → 1,453 lines)

---

### 2026-03-12
**Task: RM-09 — Upgrade inspector panel (CSS only)**

CSS-only patch to `reasoning-map.css` — 10 value changes across 10 CSS blocks. Inspector header more generous (16px/12px padding). Section padding increased (12px) with wider title-to-content gap (9px). Evidence bar thicker (6px) with bolder percentage (12px/#181d27). Metadata table contrast improved (keys #535862, values #181d27). Connected nodes list clearer (5px gap, 6px row padding). Zero JS changes. File unchanged at 1,452 lines.

Files: `reasoning-map.css` (1,452 lines, unchanged)

---

### 2026-03-12
**Task: RM-08 — Improve graph legibility (CSS only)**

CSS-only patch to `reasoning-map.css` — 7 edits across 5 CSS blocks. Node labels bumped to 11px / weight 500 (was 10.5px / 400). Dimmed node opacity softened from 0.12 to 0.18 (body/icon) and 0.15 (label). Connected label opacity raised from 0.85 to 0.92. Edge labels enlarged from 9.5px to 10.5px. Dimmed edge opacity raised from 0.06 to 0.10. Visual hierarchy preserved: selected > connected > dimmed. Zero JS changes.

Files: `reasoning-map.css` (1,450 → 1,452 lines)

---

### 2026-03-12
**Task: RM-02 — Audit current Reasoning Map implementation**

Full code audit of the Reasoning Map after KG-02. Verified KG-02 implementation across 7 checks: role object passed correctly from app.js bridge, `buildGraphFromRole` used for real data, `resolveGraphData` returns null when data missing, empty state renders correct message at all 3 call sites, no active callers use `buildSampleGraph`, no accidental fallback to sample data, syntax valid. Initially reported edge type mismatch — later re-verified and found to be incorrect (all emitted types already exist in `EDGE_DEFS`; the mismatched types were from the design spec, not the implementation). `rm-btn-load-sample` dead end still deferred.

Files: (documentation only)

---

### 2026-03-12
**Task: RM-05 — Improve node selection / focus mode (CSS polish)**

CSS-only patch to strengthen the node focus neighbourhood. Connected node body: opacity 0.92 + brightness 1.06 (was just brightness 1.04). Connected label: opacity 0.85 + darker fill (was inheriting muted default). Connected ring: opacity 0.3 (was 0). Active edges: stroke-width 2.8 + brightness 1.15 + darker label fill (was 2.5 with no brightness). Zero JS changes. 8 lines added.

Files: `reasoning-map.css` (1,440 → 1,450 lines)

---

### 2026-03-12
**Task: KG-02 — Connect Reasoning Map to real role analysis data**

Built `buildGraphFromRole(role)` function (~350 lines) that transforms `role.latest_match_output` (from `jd_matches.output_json`) into a full reasoning graph. Added `resolveGraphData(role)` wrapper that returns real graph or null (no sample data fallback). Updated all three callers (`initGraph`, `openReasoningMap`, `loadSampleData`) with null handling — shows "Reasoning Map unavailable for this role" when no analysis data exists. 12 node types, 11 edge types, full provenance tagging.

Files: `reasoning-map.js` (2,532 → 3,132 lines)

---

### 2026-03-12
**Task: CTX-01 — Create working context file**

Created `ROLEWISE_WORKING_CONTEXT.md` as the AI developer's working memory. Structured with Current Focus, Recent Changes, Open Questions, Temporary Notes, and Next Tasks sections.

Files: `ROLEWISE_WORKING_CONTEXT.md`

---

### 2026-03-12
**Task: LEDGER-02 — Upgrade ledger to operational control document**

Extended the Master Build Ledger with Master Task Index (section 0), Decision Intelligence Layer (Phase 4), Interaction Layer (Phase 5), SYS-01 module extraction task (Phase 6). Verified all file sizes, render functions, edge functions, and database tables against the live codebase and Supabase. Corrected `tokens.css` line count (1,307 not ~800), `rolewise-prompts.js` line count (254 not ~400). Added 4 missing views. Added ongoing rules section.

Files: `ROLEWISE_MASTER_BUILD_LEDGER.md`

---

### 2026-03-12
**Task: STATE-01 — Create system state file**

Created `ROLEWISE_SYSTEM_STATE.md` with live metrics pulled from Supabase. Covers core metrics, pipeline activity, workspace activity, intelligence pipelines, recruiter system, user/trust, analytics, sharing, intelligence unlock progress, edge function health, and codebase size.

Files: `ROLEWISE_SYSTEM_STATE.md`

---

### 2026-03-12
**Task: ARCH-01 — Create architecture map**

Created `ROLEWISE_ARCHITECTURE_MAP.md` with 12 sections covering: purpose, core product areas, file ownership, data flow, state model, database/persistence, AI surfaces, rendering responsibilities, extension rules, known risks, recommended module split, change log.

Files: `ROLEWISE_ARCHITECTURE_MAP.md`

---

### 2026-03-12
**Task: RM-03 — Add provenance metadata to graph model**

Added PROVENANCE taxonomy constant (origin_type: 10 values, evidence_mode: 5, confidence_band: 3, temporal_scope: 4, scenario_state: 4). Tagged all 27 sample nodes and 28 sample edges with provenance fields. Built `_renderProvenance()` helper. Integrated into node inspector and edge inspector. Added `.rm-node--missing` CSS rule.

Files: `reasoning-map.js`, `reasoning-map.css`

---

### 2026-03-12
**Task: RM-01 — Create master task log**

Created `REASONING-MAP-LOG.md` to track the 15-task Reasoning Map refinement plan.

Files: `REASONING-MAP-LOG.md`

---

## Open Questions

1. Should the Reasoning Map use live role data from Supabase or continue with static sample data? (Resolved by KG-02 — now uses real data from `role.latest_match_output`)
2. Should knockout criteria (KO-01) be detected during JD analysis or as a post-processing step?
3. What constitutes a "role archetype" — should archetypes be user-defined or AI-generated? (Relevant to ARC-01)
4. When should intelligence unlock gates actually gate rendering? Currently thresholds are defined but rendering is not gated.
5. The `smart-endpoint` edge function is the only one requiring JWT. Should the others also require JWT for security?
6. ~~The `buildSampleGraph()` function still exists in reasoning-map.js as dead code. Should it be removed, or kept as a reference/testing fallback?~~ (Resolved — removed in dead sample cleanup, −387 lines)

---

## Temporary Notes

- `app.js` is 22,433 lines. Any edit carries risk of breaking unrelated features. Prefer isolated module work (reasoning-map.js) where possible.
- The Reasoning Map IIFE has zero imports from `app.js`. Keep it that way.
- Two intelligence unlock gates are already met (81 roles > 10 and > 30 thresholds) but rendering is not gated.
- 19 more roles needed to hit the 100-role threshold for full pattern engine.
- `role_memory_signals` and `role_documents` tables have 0 rows despite edge functions being deployed. The end-to-end workflows are not connected yet.
- `reasoning-map.js` is now 2,763 lines (2,745 after dead sample cleanup, +7 RM-12, +2 RM-14 DEFECT-01 patch, +4 RM-15 P-02/P-03, +5 RM-07 G-01 patch).
- `reasoning-map.css` is now 1,459 lines (+5 RM-15 P-01/P-04).
- Real data source chain: `jd_matches.output_json` → `app.js` line 955 (`role.latest_match_output = jdOutputMap[r.id]`) → `reasoning-map.js buildGraphFromRole(role)`.
- `buildSampleGraph()`, `loadSampleData()`, and static `GUIDED_STEPS` have all been removed. `resolveGraphData()` returns null when no analysis data exists. Guided mode uses dynamic `buildGuidedSteps()` from live graph.

---

## Next Tasks

| Priority | Task ID | Description |
|----------|---------|-------------|
| 1 | RM-02 | Audit current Reasoning Map implementation |
| ~~2~~ | ~~RM-04~~ | ~~Rebuild graph layout as structured radial model~~ ✅ Done |
| 3 | RM-05 | Improve node selection / focus mode |
| ~~4~~ | ~~RM-06~~ | ~~Add centre-selected + double-click focus~~ ✅ Done |
| ~~5~~ | ~~RM-07~~ | ~~Build reasoning path highlight~~ ✅ Done |
| ~~6~~ | ~~RM-08~~ | ~~Improve graph legibility~~ ✅ Done |
| ~~7~~ | ~~RM-09~~ | ~~Upgrade inspector panel~~ ✅ Done |
| ~~8~~ | ~~RM-10~~ | ~~Polish top bar / workspace chrome~~ ✅ Done |
| ~~9~~ | ~~RM-11~~ | ~~Polish controls / filters~~ ✅ Done |
| ~~10~~ | ~~RM-12~~ | ~~Add lightweight guided mode~~ ✅ Done |
| 11 | RM-13 | Enrich graph data model |
| ~~12~~ | ~~RM-14~~ | ~~QA / verification pass~~ ✅ Done |
| ~~13~~ | ~~RM-15~~ | ~~Final cleanup + implementation report~~ ✅ Done |
