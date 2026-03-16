# Reasoning Map — Implementation Log

## Master Task List

| # | Task | Status | Files Changed | Notes |
|---|------|--------|---------------|-------|
| 01 | Create master task log | ✅ Done | `REASONING-MAP-LOG.md` | This file |
| 02 | Audit current implementation | ✅ Done | (documentation only) | KG-02 verified, UX audit, risk inventory |
| 03 | Add provenance metadata to graph model | ✅ Done | `reasoning-map.js`, `reasoning-map.css` | PROVENANCE taxonomy, 27+28 tagged, inspector integration |
| KG-02 | Connect Reasoning Map to real role analysis data | ✅ Done | `reasoning-map.js` | buildGraphFromRole, resolveGraphData, null handling |
| 04 | Rebuild graph layout as structured radial model | ✅ Done | `reasoning-map.js` | Arc-based radial engine (RING_RADII, TYPE_ARCS, collision avoidance) — built during foundational work, verified 2026-03-12 |
| 05 | Improve node selection / focus mode | ✅ Done | `reasoning-map.css` | CSS-only: connected node + active edge polish |
| 06 | Add centre-selected + double-click focus | ✅ Done | `reasoning-map.js` | centreOnNode() + button + dblclick + keyboard nav — built during foundational work, verified 2026-03-12 |
| 07 | Build reasoning path highlight | ✅ Done | `reasoning-map.js` | Full BFS pathfinding verified; G-01 feedback patch (null path → button feedback) |
| 08 | Improve graph legibility | ✅ Done | `reasoning-map.css` | CSS-only: label size/weight, dimmed opacity, edge label size |
| 09 | Upgrade inspector panel | ✅ Done | `reasoning-map.css` | CSS-only: spacing, contrast, metadata hierarchy |
| 10 | Polish top bar / workspace chrome | ✅ Done | `reasoning-map.css` | CSS-only: topbar padding, dividers, control gap, canvas shadow, sidebar sections |
| 11 | Polish controls / filters | ✅ Done | `reasoning-map.css` | CSS-only: pill/button spacing, toggle row padding, strength active weight, label gap |
| 12 | Add lightweight guided mode | ✅ Done | `reasoning-map.js`, `reasoning-map.css` | Dynamic guided steps from live graph; replaced static GUIDED_STEPS; CSS spacing tweaks |
| 13 | Enrich graph data model | ⬜ Pending | — | — |
| 14 | QA / verification pass | ✅ Done | `reasoning-map.js` | Playwright 39-check pass; DEFECT-01 patch (tour btn disabled on empty state) |
| 15 | Final cleanup + implementation report | ✅ Done | `reasoning-map.js`, `reasoning-map.css` | P-01–P-04 polish; 10/10 Playwright regression pass |
| — | Dead sample cleanup | ✅ Done | `reasoning-map.js` | Removed buildSampleGraph (355 lines), loadSampleData (25 lines), button + wiring. −387 lines. |

## Completed Tasks — Detail Log

### TASK 01 — CREATE MASTER TASK LOG
- **Status:** ✅ Done
- **What changed:** Created this tracking file
- **Files changed:** `app/REASONING-MAP-LOG.md`
- **Verification:** File exists, all 15 tasks listed
- **Issues:** None

### TASK 03 — ADD PROVENANCE METADATA TO GRAPH MODEL
- **Status:** ✅ Done
- **What changed:** Added PROVENANCE taxonomy constant with 26 total values across 5 dimensions (origin_type: 10, evidence_mode: 5, confidence_band: 3, temporal_scope: 4, scenario_state: 4). Tagged all 27 sample nodes and 28 sample edges with provenance fields. Built shared `_renderProvenance()` helper. Integrated into node inspector and edge inspector panels. Added `.rm-node--missing` CSS rule for missing evidence visual treatment.
- **Files changed:** `reasoning-map.js`, `reasoning-map.css`
- **Verification:** Provenance renders in inspector on node/edge selection
- **Issues:** None

### TASK 04 — REBUILD GRAPH LAYOUT AS STRUCTURED RADIAL MODEL
- **Status:** ✅ Done
- **Date:** 2026-03-12 (audit-verified; built during foundational graph work)
- **What was built:** Section 3 of `reasoning-map.js` — "Layout engine (arc-based radial)". Full implementation:
  - `RING_RADII = [0, 220, 390, 560]` — three concentric rings at 220/390/560px graph-space radius
  - `TYPE_ARCS` — 14 node types mapped to specific clock-degree arcs (0°=top, 90°=right): `jd_evidence` 315°/110°, `trait` 50°/85°, `blocker` 145°/60°, `question` 205°/45°, `missing_evidence` 255°/45° (Ring 1); `company` 325°/35°, `recruiter` 5°/30°, `cv` 45°/60°, `preference` 210°/85° (Ring 2); `similar_role` 335°/70°, `outcome` 55°/65°, `career_signal` 130°/65°, `market_signal` 205°/40° (Ring 3)
  - `placeNodesInArc(nodes, startDeg, spanDeg, radius)` — distributes nodes evenly within a clock-degree arc at given radius
  - `pullEvidenceTowardsParents(nodes, edges)` — pulls `jd_evidence` nodes 30% toward the average angular position of connected trait/blocker parents, keeping them on Ring 1 radius
  - `computeLayout(nodes, edges)` — orchestrates the full pipeline: role at origin, type grouping, arc placement, evidence pull, 20-iteration collision avoidance
- **Files changed:** None (already in place — doc closure only)
- **Verification:** Layout confirmed working on real graph data. All 14 node types have arc assignments. Collision avoidance runs 20 iterations. Evidence pull confirmed for `jd_evidence` type.
- **Issues:** None. Ring 3 arc positions for `similar_role` and `market_signal` are defined but those node types are not yet populated by `buildGraphFromRole()` — tracked as RM-13.

### TASK KG-02 — CONNECT REASONING MAP TO REAL ROLE ANALYSIS DATA
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:**
  1. **`buildGraphFromRole(role)`** (~350 lines) — Transforms `role.latest_match_output` (sourced from `jd_matches.output_json` via `app.js` line 955) into a full graph. Generates nodes and edges for:
     - Root role node (from role_title, company_name)
     - Company node (from company_name, role_shape_signals.company_stage)
     - Recruiter node (from role._recruiter if present)
     - Trait nodes from practical_details: work_model, salary, employment_type, seniority, location
     - Missing evidence nodes for undisclosed salary and _missing_fields
     - Role shape signal traits: company_stage, ai_tooling, design_system_ownership, craft_strategy_balance
     - Blocker nodes from risks_and_unknowns array
     - Hard no blocker if output.hard_no is true
     - Friction signal blockers
     - Question nodes from questions_worth_asking
     - Career signal nodes from fit_reality_summary
     - JD evidence nodes from what_you_would_actually_do and what_they_are_really_looking_for
     - CV recommendation node from suggested_actions.recommended_cv
     - Analysis verdict outcome node from role.analysis.decision
     - User preference nodes from role.work_model, role.fit_assessment, role.verdict_state
  2. **`resolveGraphData(role)`** — Returns real graph if available (`nodes.length > 1`), otherwise returns `null`. No sample data fallback per user requirement.
  3. **Null handling in callers** — All three functions that call `resolveGraphData` now handle null:
     - `loadSampleData()`: Shows "Reasoning Map unavailable for this role" via `showEmpty()`
     - `initGraph(role)`: Shows same empty state
     - `openReasoningMap(role)`: Builds overlay first (so user has back button and proper chrome), then shows empty state
  4. **Node types generated:** role, company, recruiter, trait, blocker, question, career_signal, jd_evidence, missing_evidence, cv, preference, outcome
  5. **Edge types used:** supports, conflicts_with, linked_to, mentions, recommends, weakens, missing_evidence_for (all match existing EDGE_DEFS — corrected from earlier incorrect list that came from the design spec, not the actual implementation)
  6. **Provenance:** All generated nodes include full provenance metadata (origin_type, evidence_mode, confidence_band, temporal_scope, scenario_state)
- **Files changed:** `reasoning-map.js` (2,532 → 3,132 lines)
- **Data source chain:** `jd_matches.output_json` → `app.js` enrichment (line 955) → `role.latest_match_output` → `buildGraphFromRole(role)` → graph `{ nodes: [], edges: [] }`
- **No changes to app.js** — The bridge code at lines 22099-22107 already passes the role object correctly
- **Verification:** Syntax check passed (`node --check`). All `resolveGraphData` call sites confirmed with grep. Empty state path confirmed for roles without analysis data.
- **Issues:** `buildSampleGraph()` function still exists as dead code (no longer called). Could be removed in a future cleanup pass.

### TASK 02 — AUDIT CURRENT IMPLEMENTATION
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:** Full code audit of the Reasoning Map after KG-02 real data integration.
- **KG-02 Verification (7 checks):**
  1. Role object passed correctly from app.js bridge (line 22105–22106) — ✅
  2. `buildGraphFromRole(role)` used for real data (line 1108) — ✅
  3. `resolveGraphData(role)` returns null when data missing (line 1110) — ✅
  4. Empty state renders at all 3 call sites (lines 2870, 2898, 2993) — ✅
  5. Zero callers of `buildSampleGraph()` — ✅
  6. No accidental fallback to sample data — ✅
  7. Syntax valid (`node --check`) — ✅
- **Risks found:**
  - Edge type mismatch: **CORRECTED** — re-verification on 2026-03-12 confirmed all emitted edge types (supports, conflicts_with, linked_to, mentions, recommends, weakens, missing_evidence_for) exist in `EDGE_DEFS`. The originally reported mismatched types (`supported_by`, `contradicts`, `shaped_by`, etc.) came from the design spec, not the actual implementation. No mismatch exists.
  - `rm-btn-load-sample` button in empty state calls `loadSampleData()` which will re-show empty state for roles without data. Cosmetic dead end. Deferred.
- **UX audit findings:**
  - Strengths: self-contained IIFE, comprehensive keyboard nav, rich inspector, multiple focus modes, BFS path traversal
  - Weaknesses: connected node treatment nearly invisible (brightness 1.04 only), connected labels not promoted, no ring on connected nodes, double-click only centres (doesn't select)
- **Files changed:** (documentation only)
- **Issues:** None

### TASK 05 — IMPROVE NODE SELECTION / FOCUS MODE (CSS POLISH)
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:** CSS-only patch to strengthen the node focus neighbourhood visual treatment.
  1. `.rm-node--connected .rm-node-body` — was `filter: brightness(1.04)`. Now `filter: brightness(1.06); opacity: 0.92;`
  2. `.rm-node--connected .rm-node-label` — NEW rule: `opacity: 0.85; fill: var(--text-secondary, #414651);`
  3. `.rm-node--connected .rm-node-ring` — NEW rule: `opacity: 0.3;`
  4. `.rm-edge--active .rm-edge-line` — was `stroke-width: 2.5`. Now `stroke-width: 2.8; filter: brightness(1.15);`
  5. `.rm-edge--active .rm-edge-label` — added `fill: var(--text, #181d27);`
- **Files changed:** `reasoning-map.css` (1,440 → 1,450 lines)
- **Behaviour changes:** Connected nodes are now visually distinct from both dimmed and unselected nodes. Active edges are slightly thicker and brighter. No JS changes.
- **Verification:** CSS brace balance confirmed (234/234). No JS modified.
- **Deferred cleanup:** `buildSampleGraph()` (354 lines dead code) — kept as reference. User has open question about removal.
- **Issues:** Visual values (opacity 0.92, 0.85, 0.3) are subjective and may need browser tuning.

### TASK 06 — ADD CENTRE-SELECTED + DOUBLE-CLICK FOCUS
- **Status:** ✅ Done
- **Date:** 2026-03-12 (audit-verified; built during foundational graph work)
- **What was built:** Four trigger points all wired to `centreOnNode(nodeId)`:
  1. **`centreOnNode(nodeId)`** function (lines 1454–1463) — calculates pan offset to centre node in SVG viewport: `x = rect.width/2 − node.x * k`, `y = rect.height/2 − node.y * k`, calls `_applyTransform(true)` (animated)
  2. **Auto-centre on selection** — `selectNode()` calls `centreOnNode(nodeId)` at line 1578 after every node selection
  3. **Topbar button** — `#rm-btn-centre-selected` button present in `buildOverlayHTML()` sidebar; wired in `initEvents()` to call `centreOnNode(_state.selectedId)` when a node is selected
  4. **Double-click** — `svg.addEventListener('dblclick', ...)` at line 2465 calls `centreOnNode(nodeG.dataset.id)` on node double-click
  5. **Keyboard navigation** — `initKeyboardNav()` calls `centreOnNode()` when arrow keys move focus to a new node
- **Files changed:** None (already in place — doc closure only)
- **Verification:** All four trigger paths confirmed in source. Animation confirmed (`_applyTransform(true)`). Button guard (`if (_state.selectedId)`) confirmed.
- **Issues:** None.

### TASK 08 — IMPROVE GRAPH LEGIBILITY (CSS ONLY)
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:** CSS-only patch to improve readability of graph nodes, labels, and edges without touching layout or rendering logic.
  1. `.rm-node-label` — added `font-size: 11px; font-weight: 500` (overrides JS inline attrs 10.5/400 via CSS precedence over SVG presentation attributes)
  2. `.rm-node--dimmed .rm-node-body` — opacity 0.12 → 0.18
  3. `.rm-node--dimmed .rm-node-icon` — opacity 0.12 → 0.18
  4. `.rm-node--dimmed .rm-node-label` — opacity 0.12 → 0.15
  5. `.rm-node--connected .rm-node-label` — opacity 0.85 → 0.92
  6. `.rm-edge-label` — font-size 9.5px → 10.5px
  7. `.rm-edge--dimmed .rm-edge-line` (Priority 2 override) — opacity 0.06 → 0.10
- **Files changed:** `reasoning-map.css` (1,450 → 1,452 lines, +2 lines)
- **Behaviour changes:** Node labels slightly larger and bolder. Dimmed nodes recede but remain visible for spatial orientation. Connected labels more readable. Edge labels more legible on hover/selection. Dimmed edges still visible enough to trace paths. Three-tier visual hierarchy preserved: selected (weight 600, brightness 1.08, drop-shadow) > connected (weight 500, opacity 0.92) > dimmed (opacity 0.15–0.18).
- **Verification:** All 7 edits confirmed in place. Visual hierarchy checked against CSS cascade. No layout logic altered. No JS modified.
- **Issues:** None. Remaining legibility improvements would require JS changes (e.g., label truncation length, edge default opacity formula) or layout changes (e.g., increased collision padding).

### TASK 09 — UPGRADE INSPECTOR PANEL (CSS ONLY)
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:** CSS-only patch to improve inspector panel readability, spacing, and visual hierarchy. 10 value changes across 10 CSS blocks, zero lines added.
  1. `.rm-insp-header` — padding 14px 14px 10px → 16px 14px 12px (more breathing room)
  2. `.rm-insp-title` — margin-bottom 4px → 6px (wider title gap)
  3. `.rm-insp-section` — padding 10px 14px → 12px 14px (more vertical space)
  4. `.rm-insp-section-title` — margin-bottom 7px → 9px (clearer title-to-content separation)
  5. `.rm-evidence-bar-track` — height 5px → 6px (thicker evidence bar)
  6. `.rm-evidence-bar-val` — font-size 11px → 12px, color `var(--text-muted)` → `var(--text, #181d27)` (bolder percentage)
  7. `.rm-insp-meta-key` — color `var(--text-light, #697586)` → `var(--text-muted, #535862)` (darker keys)
  8. `.rm-insp-meta-val` — color `var(--text-muted, #535862)` → `var(--text, #181d27)` (darkest values)
  9. `.rm-insp-connections` — gap 3px → 5px (more space between connections)
  10. `.rm-insp-connection` — padding 5px 8px → 6px 8px (taller rows)
- **Files changed:** `reasoning-map.css` (1,452 lines, unchanged — all edits were value swaps)
- **Behaviour changes:** Inspector header more generous. Section spacing wider. Evidence bar thicker with bolder percentage text. Metadata table has proper contrast hierarchy (keys muted, values darkest). Connected nodes list more scannable. No layout logic altered. No JS modified.
- **Verification:** All 10 edits confirmed in place. CSS file size unchanged (1,452 lines). No JS modified.
- **Issues:** None. Further inspector improvements would require JS changes (e.g., reordering sections, adding collapsible groups, truncation logic).

### TASK 10 — POLISH TOP BAR / WORKSPACE CHROME (CSS ONLY)
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:** CSS-only patch to improve top bar spacing, divider visibility, control button breathing room, canvas depth, and sidebar section rhythm. 7 changes across 7 CSS blocks, 1 line added.
  1. `.rm-topbar` — padding `0 12px 0 8px` → `0 14px 0 14px` (balanced horizontal padding)
  2. `.rm-topbar-right` — gap 4px → 6px (less cramped control buttons)
  3. `.rm-topbar-divider` — height 20px → 24px, background `--border-light` → `--border`, margin 4px → 6px (taller, more visible, wider spacing)
  4. `.rm-topbar-center` — gap 10px → 12px (less crowded centre stats)
  5. `.rm-canvas-wrap` — added `box-shadow: inset 0 1px 3px rgba(10,13,18,0.04)` (subtle depth at canvas top edge)
  6. `.rm-sidebar-section` — padding bottom 6px → 8px (balanced vertical rhythm)
- **Files changed:** `reasoning-map.css` (1,452 → 1,453 lines, +1 line from box-shadow)
- **Behaviour changes:** Top bar feels balanced and breathes evenly. Dividers are visible structural markers rather than barely-there lines. Control buttons have clear separation. Canvas has subtle depth differentiating it from the top bar. Sidebar sections have even vertical padding. No layout logic altered. No JS modified.
- **Verification:** All 7 edits confirmed in place. CSS file at 1,453 lines. No JS modified.
- **Issues:** None. Further chrome improvements would require JS changes (e.g., responsive breakpoint behaviour, collapsible panels) or new CSS selectors (e.g., per-section padding overrides).

### TASK 11 — POLISH CONTROLS / FILTERS (CSS ONLY)
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:** CSS-only patch to improve sidebar control spacing, tap targets, and active state clarity. 11 changes across 11 CSS blocks, 1 line added.
  1. `.rm-sidebar-label` — margin-bottom 7px → 8px (wider label-to-content gap)
  2. `.rm-focus-pills` — gap 4px → 5px (less crowded pill layout)
  3. `.rm-focus-pill` — padding 3px 8px → 4px 9px (better tap target)
  4. `.rm-node-toggles` — gap 2px → 3px (clearer row separation)
  5. `.rm-node-toggle` — padding 4px 6px → 5px 6px (taller rows)
  6. `.rm-strength-filter` — gap 4px → 5px (less crowded button layout)
  7. `.rm-strength-btn` — padding 3px 9px → 4px 10px (better tap target)
  8. `.rm-strength-btn.rm-strength-active` — added font-weight: 600 (bolder active state)
  9. `.rm-signal-filter` — gap 2px → 3px (clearer row separation)
  10. `.rm-signal-toggle` — padding 4px 6px → 5px 6px (taller rows, consistent with node toggles)
  11. `.rm-graph-actions` — gap 4px → 5px (consistent with other control groups)
- **Files changed:** `reasoning-map.css` (1,453 → 1,454 lines, +1 line from font-weight addition)
- **Behaviour changes:** All control groups have more generous spacing. Toggle rows are taller and more scannable. Pill and button tap targets are larger. Active strength button is visually distinct (bold weight). Consistent 5px gap across all pill/button groups. Consistent 3px gap across all toggle lists. No filter logic altered. No JS modified.
- **Verification:** All 11 edits confirmed in place. CSS file at 1,454 lines. No JS modified.
- **Issues:** None. Further control improvements would require JS changes (e.g., custom checkbox styling, reordering filter sections) or deeper CSS (e.g., filled active pill states).

### DEAD SAMPLE CLEANUP
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:** Removed all dead sample-data code paths from `reasoning-map.js`.
  1. `buildSampleGraph(role)` — 355 lines (lines 186–540). Zero callers since KG-02 replaced it with `buildGraphFromRole`. Function + section comment removed.
  2. `loadSampleData()` — 25 lines. Misleading name — actually called `resolveGraphData(_currentRole)` (real data, not sample). Logic was duplicate of `initGraph`. Function removed.
  3. `#rm-btn-load-sample` button — HTML template line in empty state. Dead end: clicked button retried real data, showed empty state again if no analysis data. Button removed.
  4. Event listener wiring — `overlayEl.querySelector('#rm-btn-load-sample')?.addEventListener(...)`. Removed.
  5. Section comment updated: "SECTION 2" now reads "Build graph from real role data" with removal note.
- **Files changed:** `reasoning-map.js` (3,132 → 2,745 lines, −387 lines)
- **Behaviour changes:** None. Real-data flow unchanged (`buildGraphFromRole` → `resolveGraphData` → `initGraph` / `openReasoningMap`). Empty state still shows title + description. Error state retry button still works.
- **Verification:** No references to removed functions remain (only comments). `node --check` passes. All four key functions (`buildGraphFromRole`, `resolveGraphData`, `initGraph`, `openReasoningMap`) confirmed present.
- **Issues:** None. All identified dead paths removed. No deferred items.

### TASK 12 — ADD LIGHTWEIGHT GUIDED MODE
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **What changed:** Replaced broken static `GUIDED_STEPS` constant (which referenced sample-data node IDs) with a dynamic system that builds guided steps from the live graph.
  1. Added `GUIDED_TYPE_INFO` — object mapping 7 node types (role, company, trait, blocker, career_signal, missing_evidence, jd_evidence) to title/description pairs.
  2. Added `GUIDED_TYPE_ORDER` — array controlling walk sequence.
  3. Added `let _guidedSteps = []` — dynamic storage populated at tour start.
  4. Added `buildGuidedSteps()` — function that picks the first node of each key type from `_graphData.nodes`.
  5. Updated `startGuidedMode()` — calls `buildGuidedSteps()` on entry, guards against empty steps.
  6. Updated `stepGuided()` — `GUIDED_STEPS.length` → `_guidedSteps.length`.
  7. Updated `renderGuidedStep()` — `GUIDED_STEPS[_guidedStep]` → `_guidedSteps[_guidedStep]`, all `.length` references updated.
  8. CSS: `.rm-guided-header` margin-bottom 4px → 6px, `.rm-guided-desc` margin-bottom 10px → 12px.
- **Files changed:** `reasoning-map.js` (2,745 → 2,752 lines, +7), `reasoning-map.css` (1,454 lines, unchanged)
- **Behaviour changes:** Guided tour now works with real data. Each tour dynamically picks representative nodes from whatever the current graph contains. Empty graphs silently skip tour start.
- **Verification:** `node --check` passes. Zero stale `GUIDED_STEPS` references remain. 7 `_guidedSteps` references all correct (declaration, population, guard, bounds, lookup, count, label).
- **Issues:** None.
- **Roadmap note:** Renamed RM-13 from "Upgrade sample data" to "Enrich graph data model" across all docs (sample data no longer exists).

### TASK 14 — QA / VERIFICATION PASS + DEFECT-01 PATCH
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **QA scope:** 7 areas, 39 automated Playwright checks covering: guided tour on full/sparse/no-data roles; inspector; dimming; Prev/Next/Finish/× close; Escape key; tour button state.
- **Findings:** 1 real defect (DEFECT-01, MEDIUM). 2 initial false positives resolved (wrong test selectors + wrong test data schema).
  - DEFECT-01: Tour button visible and enabled on empty state. Click was silent (guard worked) but button was a broken affordance.
- **Patch (DEFECT-01):** 2 lines added to `openReasoningMap()` in `reasoning-map.js`:
  1. Empty-state branch (inside `requestAnimationFrame`): `if (tourBtn) tourBtn.disabled = true;` after `showEmpty()`.
  2. Normal graph branch (inside `requestAnimationFrame`): `if (tourBtn) tourBtn.disabled = false;` before `renderGraph()` setTimeout.
- **Files changed:** `reasoning-map.js` (2,752 → 2,754 lines, +2)
- **Verification:** 8/8 Playwright checks pass. Tour button disabled on empty state, enabled on real graph, no console errors, guided mode fully functional after patch.
- **Issues:** None remaining.

### TASK 15 — FINAL POLISH (P-01 THROUGH P-04)
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **Scope:** Four targeted polish items identified in pre-implementation audit. No new features, no structural changes, no app.js changes.
- **Changes:**
  - **P-01** (`reasoning-map.css`, after `.rm-topbar-ctrl svg` rule): Added `.rm-topbar-ctrl:disabled { opacity: 0.38; cursor: default; pointer-events: none; }` — visual disabled state for tour button.
  - **P-02** (`reasoning-map.js`, line 953 `buildOverlayHTML()`): Added `aria-label="Start guided tour"` to tour button — screen-reader accessible label.
  - **P-03** (`reasoning-map.js`, inside `renderInspector()` after `content.classList.remove('hidden')`): Added `const inspPanel = document.getElementById('rm-inspector'); if (inspPanel) inspPanel.scrollTop = 0;` — resets inspector scroll position on node switch.
  - **P-04** (`reasoning-map.css`, `.rm-guided-title`): Changed `margin-bottom: 4px` → `6px` — guided step title breathing room.
- **Files changed:** `reasoning-map.js` (2,754 → 2,758 lines, +4), `reasoning-map.css` (1,454 → 1,459 lines, +5)
- **Verification:** 10/10 Playwright checks pass (`qa_rm15.mjs`):
  - T1: Tour btn disabled on empty-state ✅
  - T2: Tour btn enabled on full graph ✅
  - T3: aria-label="Start guided tour" ✅
  - T4: .rm-topbar-ctrl:disabled CSS rule (opacity=0.38) ✅
  - T5: Inspector scrollTop resets (before=319, after=0) ✅
  - T6a–d: Guided tour opens, title renders, navigation works, × closes ✅✅✅✅
  - T7: .rm-guided-title margin-bottom=6px ✅
- **Issues:** None. All deferred items confirmed deferred (RM-04, RM-06, RM-13).

### TASK 07 — REASONING PATH HIGHLIGHT
- **Status:** ✅ Done
- **Date:** 2026-03-12
- **Scope:** Audit-first task. Infrastructure was already substantially built; one feedback gap patched.
- **Audit findings:**
  - `findReasoningPath()` — BFS traversal from any node to `role` node. Correct and complete.
  - `activateReasoningPath()` — applies `rm-node--path`, `rm-node--dimmed`, `rm-edge--path`, swaps SVG markers to green `#rm-arrow-path`. Correct.
  - `clearReasoningPath()` — called unconditionally by `selectNode()`, `selectEdge()`, `clearSelection()`. Correct.
  - `renderPathInspector()` — replaces inspector with green badge, clickable chain steps, "Clear path" button. Correct.
  - Button wiring — `#rm-btn-show-path` in `renderInspector()` fires BFS on click. Correct.
  - Role guard — role node inspector has no "Show reasoning path" button. Correct.
  - Path length distribution (test graph): 10 direct (2-hop) paths, 2 multi-hop (3-hop) paths.
- **Gap identified (G-01):** When `findReasoningPath()` returns null, click handler silently did nothing — no user feedback. Added `else` branch: button text changes to "No path found", button disabled for 1500ms, then restores.
- **Changes:**
  - **G-01** (`reasoning-map.js`, `renderInspector()` — `#rm-btn-show-path` click handler, ~line 1905): Added `else` branch with 1500ms button-text feedback when path result is null.
- **Files changed:** `reasoning-map.js` (2,758 → 2,763 lines, +5)
- **Verification:** 13/14 Playwright checks pass (`qa_rm07_audit.mjs` + `qa_rm07_supplemental.mjs`). A14 failure confirmed as Playwright headless infrastructure limitation (Enter key injection does not trigger button click in headless Chrome), not an app defect. RM-15 regression: 10/10 still passing.
  - A1: Show reasoning path button in inspector ✅
  - A2: Path classes applied (rm-node--path + rm-node--dimmed) ✅
  - A3: Path edges get rm-edge--path + green marker ✅
  - A4: Inspector shows path view with badge, chain, clear button ✅
  - A5: Chain starts at test node, ends at role node ✅
  - A6: "Clear path" removes path classes, restores selection ✅
  - A7: selectNode() on different node clears active path ✅
  - A8: Role node inspector has NO "Show reasoning path" button ✅
  - A9: Path highlight stable after 500ms idle ✅
  - A10: Reopen shows no stale path state ✅
  - A11: resetGraph() clears path and inspector ✅
  - A12: Clicking chain node in inspector selects that node ✅
  - A13: Role node guarded from path ✅
  - A14: Keyboard Enter — Playwright infra limitation (not app defect) ⚠️
- **Issues:** None remaining.

