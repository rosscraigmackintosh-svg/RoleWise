# FUNCTION_REGISTRY — RoleWise

> Generated: 2026-04-14. Catalogue of the most important functions in `app/app.js`, `app/reasoning-map.js`, `app/analysis/*.js`. **Does not include every helper** — focuses on the ~120 functions a developer would actually need to navigate to.
>
> Line numbers are approximate as of this audit. When in doubt, grep the function name.

Conventions used in tables:
- **Side effects**: DB = writes Supabase, DOM = mutates DOM, LS = writes localStorage, NET = network/edge function, STATE = mutates module-scope vars.
- **Called from**: a non-exhaustive list — search the file for the full set.

---

## 1. Workspace primitives (Supabase-backed) — `app.js:48–340`

| Function | Line | Purpose | Side effects | Called from |
|---|---:|---|---|---|
| `wsAddMessage(roleId, sender, message)` | 48 | Insert message into `role_conversations`. | DB | Workspace chat send path |
| `wsAppendDecision(roleId, decisionType, reason, notes)` | 61 | Append to `role_decisions`. Auto-fires snapshot, learning ext, counters, optional pattern rebuild every 5th decision. | DB, STATE | Apply / Skip / Withdraw buttons |
| `wsUpdateDecisionConfidence(roleId, confidence)` | 110 | Patches latest `role_decisions` row's confidence column. | DB | Decision banner stars |
| `wsLoadDecisions(roleId)` | 128 | Reads decisions for one role. | NET | Rail render, decision history |
| `wsRefreshDecisionHistory(roleId)` | 142 | Re-renders `.ws-decision-history` panel inline. | DOM, NET | After every decision |
| `wsDecisionStats({roleId})` | 166 | Aggregates decision counts by type+reason. | NET | Stats panel |
| `wsLoadMessages(roleId)` | 187 | Read `role_conversations` for role. | NET | Workspace mount |
| `wsAddInteraction(roleId, payload)` | 198 | Insert into `role_interactions`. | DB | "Add interaction" button |
| `wsAddInsight(roleId, type, text)` | 210 | Insert into `role_insights`. | DB | AI insight capture |
| `wsAddArtifact(roleId, type, title, content)` | 222 | Insert into `role_artifacts`. | DB | Document save |
| `wsUpdateArtifact(id, title, content)` | 234 | Update artifact row. | DB | Document edit |
| `wsLoadMemory(roleId)` | 245 | **Single Promise.all** that fetches conversations + interactions + insights + artifacts in parallel. | NET | Workspace mount |
| `wsLoadSignals(roleId)` | 268 | Read role_signals (table that may not exist anymore). | NET | **No live caller** — see UNUSED_CODE_REPORT |
| `wsUpsertSignal(roleId, signal)` | 284 | Same. | DB | **No live caller** |
| `_wsExtractAndStoreSignals(roleId, message)` | 300 | Same. | NET, DB | **No live caller** |
| `wsAddDocument(roleId, docData)` | 320 | Wrapper around `wsAddArtifact` for document type. | DB | Doc upload |
| `wsLoadDocuments(roleId)` | 340 | Filtered artifact read. | NET | Workspace docs panel |

---

## 2. Decision capture & candidate learning — `app.js:354–805`

| Function | Line | Purpose | Side effects |
|---|---:|---|---|
| `_loadRoleBlockers(roleId)` | 354 | Read `role_blockers` for role. | NET |
| `_upsertRoleBlocker(roleId, key, label, evidence, userState)` | 372 | Upsert into `role_blockers`. | DB |
| `_saveDecisionSnapshot(role, decision, opts)` | 393 | Snapshot role DNA + blockers into `role_decision_snapshots`. **One of three decision-saving functions** — see DUPLICATE_LOGIC_REPORT cluster #4. | DB |
| `_loadOrCreateCandidateProfile()` | 437 | Fetch candidate_profile, create if absent. | DB, NET, STATE (`_candidateProfile`) |
| `_loadOrCreateCandidateLearning()` | 482 | Fetch candidate_learning, create if absent. | DB, NET, STATE (`_candidateLearning`) |
| `_saveCandidateDecisionExt(role, decisionType, opts)` | 514 | Insert into `role_decisions_ext`. **Decision-saving #2.** | DB |
| `_saveCandidateOutcomeExt(role, state, reason, opts)` | 552 | Upsert into `role_outcomes_ext`. | DB |
| `_updateCandidateLearningCounters(decision, role, reason)` | 598 | Update aggregate counters in `candidate_learning`. | DB, STATE |
| `_updateCandidateLearningOutcome(state)` | 651 | Same for outcomes. | DB, STATE |
| `_rebuildCandidateLearningPatterns()` | 689 | Pulls last 100 decisions+outcomes, recomputes `learned_patterns_json`. **Heavy** — runs every 5th terminal decision. | NET, DB, STATE |
| `_buildAndSetLiveCandidateContext()` | 806 | Composes context object passed to chat / analyse calls. | STATE |
| `showCandidateSetupCard(existing)` | 909 | Renders the onboarding setup card. | DOM |

---

## 3. Theme + appearance — `app.js:1137–1185`

| Function | Line | Purpose |
|---|---:|---|
| Theme application (anonymous) | 1137 | Reads `localStorage['rw-accent-theme']`; applies CSS vars from `ACCENT_THEMES`. |
| Appearance mode handler | 1171 | Reads `localStorage['rw-appearance-mode']`; toggles dark/light/system; listens to `prefers-color-scheme` MQ. |

---

## 4. Brand asset / logo system — `app.js:1484–1825`

| Function | Line | Purpose | Side effects |
|---|---:|---|---|
| (Cache primitives) | 1498 | `_brandAssetCache`, `_brandAssetCacheId`, `_logoFetchInFlight`. | STATE |
| `loadBrandAssets()` | ~1580 | Pulls `brand_assets` rows once, populates caches. | NET, STATE |
| `resolveBrandAsset(company, domain)` | ~1640 | Cache hit → return; miss → background fetch from Clearbit/Google. | NET, STATE |
| `_renderLogoEl(asset, size)` | ~1750 | DOM element factory for company logo. | DOM |

(Section is well-bounded and could be safely extracted — see MODULE_SPLIT_PROPOSAL.)

---

## 5. Inbox + role list — `app.js:3046–3580`

| Function | Line | Purpose | Side effects |
|---|---:|---|---|
| `renderInbox(roles)` | 3046 | Full inbox rebuild: filters `roles`, maps to HTML, assigns `el.innerHTML`, then reads layout for sticky positioning. **Hot path** (called 16+ times). See PERFORMANCE_HOTSPOTS #3. | DOM |
| `renderRoleCard(role)` | ~3100 | HTML string per role row. | (pure string) |
| `selectRole(roleId)` | ~3370 | Set `selectedRoleId`, scroll into view, dispatch overview render. | DOM, STATE |
| `renderCompareView()` | 3449 | Render compare grid for `compareRoleIds`. | DOM |

---

## 6. Role page — `app.js:9170–11800`

| Function | Line | Purpose | Side effects |
|---|---:|---|---|
| `renderWorkspaceView(role)` | 9170 | Mounts the entire workspace shell (header, timeline, chat bar, docs panel) into `.col-chat`. Called per role. | DOM, NET |
| `renderRoleDoc(role)` | 10504 | Renders the central role detail (overview, signals, JD section, notes). | DOM |
| `_renderRoleHeader(role)` | 1973 | Header with company/title/badges/buttons. | DOM |
| `_renderStickyHeader(role)` | 1942 | The reduced sticky variant. | DOM |
| `_renderDecisionBanner(role)` | 2153 | Banner above analysis with current decision state. | DOM |
| `_renderJDSection(role, jdText)` | 2338 | The "Job description" collapsible. | DOM |
| `renderRail(role)` | 11872 | Right-column stage tracker + outcome list + decision history. | DOM, NET |
| `_renderDecisionHistoryDL(role)` | 12837 | DL list of all decisions. | DOM |
| `showOutcomeReasonForm(roleId, state)` | 13022 | Inline outcome reason capture. | DOM, DB |

---

## 7. Ingestion overlay (paste new JD) — `app.js:13407–14210`

| Function | Line | Purpose | Side effects |
|---|---:|---|---|
| `openIngestionOverlay()` | 13450 | Show full-screen `#rw-ingestion-overlay`. | DOM |
| `_ingestionTimerStart/Stop()` | 13426 | Drives the timer pill. | DOM |
| `doIntakeSubmit(text, opts)` | ~6701 | **Main paste handler**. Orchestrates: parse → analyse-jd → save role → save match → enrich → narrative. | DB, NET, DOM, STATE |
| `_fetchLinkedInJD(url)` | ~31568 | Calls `fetch-linkedin-jd` edge function. | NET |
| `_tryAutoFillRecruiter()` | ~31019 | Inspects pasted JD/URL for known recruiter patterns. | DOM |

---

## 8. Section context (per-section notes) — `app.js:15392–15565`

| Function | Line | Purpose | Side effects |
|---|---:|---|---|
| `_scStorageKey(roleId)` | 15425 | Returns the legacy localStorage key for a role's section context. |
| `_scLoadAll(role)` | ~15440 | Loads from DB (or migrates from LS on first read). | NET, LS, STATE |
| `_scPersistToDb(roleId, ctx)` | 15449 | Writes `roles.section_context` JSON column. | DB |
| `_scGet(roleId, sectionKey)` / `_scGetRoleOnly(...)` | ~15470 | Read APIs. |
| `_scSet(roleId, sectionKey, value)` | ~15490 | Write API; also calls persist. | DB, STATE |

> Self-contained — strong candidate for extraction to `app/workspace/section-context.js`.

---

## 9. Match output rendering — `app.js:17925–18860`

| Function | Line | Purpose | Side effects |
|---|---:|---|---|
| `renderMatchOutput(role, output)` | 17925 | Top-level renderer for the analysis sections (salary, practical, culture, friction, decision lens, deep context, next steps). | DOM |
| `_normaliseWM(s)` | 17685 | One of two work-model normalisers — see DUPLICATE_LOGIC_REPORT cluster #1. |
| `_buildSimilarRolesInsight(...)` | ~17600 | Computes the "favoured / weaker" patterns. | (pure) |
| Functions in `analysis/render.js`: `renderDecisionBlock`, `renderMatchBreak` | render.js:1–305 | Section renderers used by `renderMatchOutput`. | DOM (via string return) |

---

## 10. JD Extraction Engine v2 — `app.js:21013–22460`

A pure module-within-the-monolith. Layered architecture documented in section header comments at line 21015.

| Layer | Lines | Functions |
|---|---:|---|
| Layer 1+2: field extractors + normalisers | 21082–21637 | `_extractSalary`, `_extractWorkModel`, `_extractLocation`, `_extractEmploymentType`, `_extractIR35`, `_extractDayRate`, `_extractContractLength`, `_extractStartDate`, `_extractCompany`, etc. |
| Layer 3: validators | 21640–21694 | `_validateSalaryConsistency`, `_validateLocationConsistency`, etc. |
| Assembly | 21696–21731 | `runJDExtractionV2(jdText)` |
| Merge with AI output | 21740–22461 | `_mergeJDExtractionWithAI(extracted, aiPracticalDetails)` |
| Test bank | 22462 | `window._testJDExtract()` |

> Excellent module structure — strong candidate for extraction to `app/jd-extraction/`.

---

## 11. AI / network calls — `app.js:24673–25400`

| Function | Line | Purpose | Side effects |
|---|---:|---|---|
| `callAnalysisAPI(role, jdText, opts)` | ~24710 | Invokes `analyse-jd` edge function with progress callbacks. | NET, DOM |
| `callWorkspaceChatAPI(roleId, message, context)` | 25303 | Invokes `workspace-chat` edge function. | NET |
| Generate-narrative invocation | ~25185 | Invokes `generate-narrative` edge function inline within `doIntakeSubmit`. | NET |

---

## 12. Recruiter views — `app.js:26371–27050`

| Function | Line | Purpose |
|---|---:|---|
| `renderRecruitersView()` | 26952 | Mount recruiter list in `.col-list`. |
| `renderRecruiterList(recruiters)` | 26371 | Render list pane. |
| `renderRecruiterDetail(rec)` | 26428 | Detail card. |
| `renderRecruiterEditForm(rec)` | 26707 | Edit form. |
| `renderRecruiterAddForm()` | 26845 | Add form. |
| Recruiter detection + auto-link from JD | 25855–26100 | Multiple helpers. |

---

## 13. Admin panel — `app.js:27887–29500`

| Function | Line | Purpose |
|---|---:|---|
| `renderAdminView()` | 27887 | Tab shell. |
| `_renderAdminOverview(el)` | 27933 | Stats and last-activity. |
| `_renderAdminRoles(el)` | 27983 | Role-by-role management. |
| `_renderAdminRules(el)` | 28269 | Static guardrails text. |
| `_renderAdminPrompts(el)` | 28341 | Prompt snippets. |
| `_renderAdminRadar(el)` | 28508 | Market signal radar. |
| `_renderAdminStats(el)` | 28697 | Aggregate stats. |
| `_renderAdminAudit(el)` | 28860 | Event log. |
| `_renderAdminIntelligence(el)` | 28906 | Signal extraction logs. |
| Tab IIFEs (USAGE / ABUSE / USER TRUST / EFFICIENCY) | 29250+ | Each is an inline `(() => {...})()`. |

> Each `_renderAdmin*` redefines local `_esc/_fmtDate/_fmtTs` — see UNUSED_CODE_REPORT §3.2.

---

## 14. Other top-level views

| Function | Line | Purpose |
|---|---:|---|
| `renderProfileView()` | 14862 | User profile + preferences editor. |
| `renderRadarView()` | 27458 | Market signal radar (separate from admin radar). |
| `renderReviewView()` | 29931 | Periodic review log. |
| `renderSafeguardsView()` | 29171 | Platform policies + LinkedIn session mgmt. |
| `renderNextAction(role)` | 27029 | Preparation panel (interview prep, cover letter, CV). |
| `_openMonthlyReview()` | ~30195 | Monthly review modal. |

---

## 15. App boot

| Function | Line | Purpose |
|---|---:|---|
| `refresh()` | ~31700 | Boot sequence: load roles, profile, learning, brand assets, render inbox, optionally re-render after boundary cache settles. **Calls `renderInbox` twice** — see PERFORMANCE_HOTSPOTS #5. |

---

## 16. `app/reasoning-map.js`

Self-contained ~2,763-line module. Top-level export: `window.openReasoningMap(role)`. Internally:
- Builds a node graph from role analysis output + decision history.
- Lays out using deterministic radial arcs (no force-sim) — efficient.
- Renders SVG into `#rm-overlay`.

The module is large but cohesive; treat it as a black box unless touching the reasoning map specifically.

---

## 17. `app/analysis/signals.js` and `render.js`

| File | Exports | Notes |
|---|---|---|
| `signals.js` | `window.RW_classifySignals(role, profile, learning)` | Pure function. Returns array of `{type, label, severity, reasoning}`. ~270 lines. |
| `render.js` | `window.RW_render = { renderDecisionBlock, renderMatchBreak }` | Depends on global `esc()` and `_sanitizeUiText()` from app.js. |
