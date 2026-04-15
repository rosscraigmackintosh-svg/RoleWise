# WHERE_THINGS_LIVE — RoleWise

> Generated: 2026-04-14. The "I need to find X" lookup table. Bookmark this.
>
> Lines are approximate (audit snapshot). When in doubt, grep the function/symbol name.

---

## Ingestion / paste a JD

| What | File:line | Function |
|---|---|---|
| `+ Add JD` button wired | `app.js:30869` | nav handler → `openIngestionOverlay()` |
| Open the overlay | `app.js:13450` | `openIngestionOverlay()` |
| Overlay DOM | `index.html` | `#rw-ingestion-overlay` |
| Submit / parse pipeline | `app.js:~6701` | `doIntakeSubmit(text, opts)` |
| LinkedIn URL fetch | `app.js:31568` | `_fetchLinkedInJD(url)` → edge function `fetch-linkedin-jd` |
| Recruiter auto-detect | `app.js:31019` | `_tryAutoFillRecruiter()` |
| Logo resolution | `app.js:1640` | `resolveBrandAsset(company, domain)` |

## JD parsing (extract structured data from raw text)

| What | File:line | Function |
|---|---|---|
| Engine entry point | `app.js:21696` | `runJDExtractionV2(jdText)` |
| Salary | `app.js:21082+` | `_extractSalary` |
| Work model (remote/hybrid/onsite) | inside engine | `_extractWorkModel` |
| Location | `app.js:1261` | `_parseLocationString` (canonical) |
| Employment type | inside engine | `_extractEmploymentType` |
| IR35 / day rate / contract length | inside engine | `_extractIR35`, `_extractDayRate`, `_extractContractLength` |
| Start date | inside engine | `_extractStartDate` |
| Company | inside engine | `_extractCompany` |
| Validators | `app.js:21640+` | `_validateSalaryConsistency`, etc. |
| Merge with AI | `app.js:21740+` | `_mergeJDExtractionWithAI` |
| Test bank (console) | `app.js:22466` | `window._testJDExtract()` |

## AI / network calls

| What | File:line | Function | Edge function |
|---|---|---|---|
| Main analysis | `app.js:24710` | `callAnalysisAPI` | `analyse-jd` |
| Workspace chat | `app.js:25303` | `callWorkspaceChatAPI` | `workspace-chat` |
| Narrative gen | `app.js:25185` (inline in `doIntakeSubmit`) | — | `generate-narrative` |
| Enrich role | `app.js:25349` (inline) | — | `enrich-role` |
| Commute | `app.js:18000+` | commute panel logic | `commute-estimate` |
| LinkedIn fetch | `app.js:31568` | `_fetchLinkedInJD` | `fetch-linkedin-jd` |
| Memory extract | inside `wsLoadMemory` flow | — | `memory-extract` |

Edge function source:
- `supabase/functions/commute-estimate/index.ts`
- `supabase/functions/fetch-linkedin-jd/index.ts`
- `supabase/functions/generate-narrative/index.ts`
- (others deployed but not in repo)

## Inbox / role list

| What | File:line | Function |
|---|---|---|
| Render full inbox | `app.js:3046` | `renderInbox(roles)` |
| Single card HTML | `app.js:~3100` | `renderRoleCard(role)` |
| Click a role | `app.js:~3370` | `selectRole(roleId)` |
| Compare checkbox | `app.js:3378` | per-row change handler |
| Compare grid | `app.js:3449` | `renderCompareView()` |
| Inbox tab toggle (Active/Archive) | `app.js:1473` | `inboxTab` state var |
| Search input | `app.js:30746` | `_filterSearch` (input listener) |
| Filter checkboxes | `app.js:30746–30808` | filter panel handlers |

## Role page (centre column)

| What | File:line | Function |
|---|---|---|
| Mount workspace | `app.js:9170` | `renderWorkspaceView(role)` |
| Render role doc | `app.js:10504` | `renderRoleDoc(role)` |
| Sticky header | `app.js:1942` | `_renderStickyHeader(role)` |
| Role header | `app.js:1973` | `_renderRoleHeader(role)` |
| Decision banner | `app.js:2153` | `_renderDecisionBanner(role)` |
| JD section (collapsible) | `app.js:2338` | `_renderJDSection(role, jdText)` |
| Match output (the big card) | `app.js:17925` | `renderMatchOutput(role, output)` |
| Notes textarea | `app.js:10053` | inline in `renderRoleDoc` |
| Notes save (debounced LS) | `app.js:10165` | `_notesTimer` |
| Next action / preparation | `app.js:27029` | `renderNextAction(role)` |

## Stage rail (right column)

| What | File:line | Function |
|---|---|---|
| Render entire rail | `app.js:11872` | `renderRail(role)` |
| Decision history list | `app.js:12837` | `_renderDecisionHistoryDL(role)` |
| Outcome reason form | `app.js:13022` | `showOutcomeReasonForm(roleId, state)` |
| IntersectionObserver (sticky reveal) | `app.js:11340` | (inside renderRail-adjacent code) |

## Decisions / learning

| What | File:line | Function |
|---|---|---|
| Append decision (primary) | `app.js:61` | `wsAppendDecision()` |
| Snapshot of role at decision time | `app.js:393` | `_saveDecisionSnapshot()` |
| Extended learning row | `app.js:514` | `_saveCandidateDecisionExt()` |
| Outcome ext save | `app.js:552` | `_saveCandidateOutcomeExt()` |
| Update aggregate counters | `app.js:598` | `_updateCandidateLearningCounters()` |
| Update outcome counters | `app.js:651` | `_updateCandidateLearningOutcome()` |
| Rebuild patterns (every 5th) | `app.js:689` | `_rebuildCandidateLearningPatterns()` |
| Confidence stars update | `app.js:110` | `wsUpdateDecisionConfidence()` |
| Refresh history mini-panel | `app.js:142` | `wsRefreshDecisionHistory()` |
| Decision stats | `app.js:166` | `wsDecisionStats()` |
| Reconsider / revert | `app.js:5213` | revert handler |

## Workspace chat / timeline

| What | File:line | Function |
|---|---|---|
| Add chat message | `app.js:48` | `wsAddMessage()` |
| Load messages | `app.js:187` | `wsLoadMessages()` |
| Append timeline row | `app.js:~4867` | `_wsAppend(...)` |
| Memory load (parallel) | `app.js:245` | `wsLoadMemory()` |
| Add interaction | `app.js:198` | `wsAddInteraction()` |
| Add insight | `app.js:210` | `wsAddInsight()` |
| Add artifact / doc | `app.js:222 / 320` | `wsAddArtifact / wsAddDocument` |
| Documents panel | `app.js:4711` | `_renderDocumentsPanel(role)` |
| Chat input listeners | `app.js:9626–9627` | `#ws-chat-input`, `#ws-chat-send` |
| Custom event hub | `app.js:9637` | `ws:chip-send` listener on `#ws-timeline` |

## Section context (per-section notes / corrections)

| What | File:line | Function |
|---|---|---|
| Load all for role | `app.js:15432` | `_scLoadAll(role)` |
| Persist to DB | `app.js:15449` | `_scPersistToDb(roleId, ctx)` |
| Get one section | `app.js:15475` | `_scGet(roleId, sectionKey)` |
| Set one section | `app.js:15488` | `_scSet(roleId, sectionKey, value)` |
| Delete one section | `app.js:15500` | `_scDelete` |

## Brand assets / logos

| What | File:line | Function |
|---|---|---|
| Cache state | `app.js:1498` | `_brandAssetCache`, `_logoFetchInFlight` |
| Bulk load | `app.js:~1580` | `loadBrandAssets()` |
| Resolve one | `app.js:~1640` | `resolveBrandAsset(company, domain)` |
| Render `<img>` element | `app.js:~1750` | `_renderLogoEl(asset, size)` |
| Validation timeout | `app.js:1674` | 6000 ms (drop to 2000 ms) |

## Recruiter views

| What | File:line | Function |
|---|---|---|
| Mount list panel | `app.js:26952` | `renderRecruitersView()` |
| Render recruiter list | `app.js:26371` | `renderRecruiterList(recs)` |
| Detail card | `app.js:26428` | `renderRecruiterDetail(rec)` |
| Edit form | `app.js:26707` | `renderRecruiterEditForm(rec)` |
| Add form | `app.js:26845` | `renderRecruiterAddForm()` |
| Auto-link from JD | `app.js:25855–26100` | helpers |

## Admin panel

| What | File:line | Function |
|---|---|---|
| Tab shell | `app.js:27887` | `renderAdminView()` |
| Overview | `app.js:27933` | `_renderAdminOverview` |
| Roles | `app.js:27983` | `_renderAdminRoles` |
| Rules | `app.js:28269` | `_renderAdminRules` |
| Prompts | `app.js:28341` | `_renderAdminPrompts` |
| Radar | `app.js:28508` | `_renderAdminRadar` |
| Stats | `app.js:28697` | `_renderAdminStats` |
| Audit | `app.js:28860` | `_renderAdminAudit` |
| Intelligence | `app.js:28906` | `_renderAdminIntelligence` |
| Usage / Abuse / User trust / Efficiency | `app.js:29250+` | inline IIFEs |

## Other top-level views

| What | File:line | Function |
|---|---|---|
| Profile | `app.js:14862` | `renderProfileView()` |
| Radar (market signals) | `app.js:27458` | `renderRadarView()` |
| Review | `app.js:29931` | `renderReviewView()` |
| Safeguards / LinkedIn session | `app.js:29171` | `renderSafeguardsView()` |
| Compare grid | `app.js:3449` | `renderCompareView()` |
| Setup card (onboarding) | `app.js:909` | `showCandidateSetupCard(existing)` |
| Monthly review modal | `app.js:30195` | `_openMonthlyReview()` |

## Modals

| What | DOM id | Show fn | Hide fn |
|---|---|---|---|
| Ingestion overlay | `#rw-ingestion-overlay` | `openIngestionOverlay` `:13450` | close button + global Esc `:30818` |
| Add JD (legacy) | `#modal-add` | `showAddJdModal` `:14064` | `hideAddJdModal` `:14069` |
| Edit details | `#modal-edit-details` | `showEditDetailsModal` `:14492` | `hideEditDetailsModal` `:14496` |
| Share | `#modal-share` | `showShareModal` `:27739` | close button |
| Reasoning map | `#rm-overlay` | `window.openReasoningMap` (`reasoning-map.js`) | close + Esc |
| Inspect (dev) | `#__rw_inspect_*` | `window.RW_INSPECT.enable` | `disable` |

## Theme / appearance

| What | File:line | Function |
|---|---|---|
| Accent theme | `app.js:1137–1170` | reads `localStorage['rw-accent-theme']` |
| Light/dark mode | `app.js:1171–1185` | reads `localStorage['rw-appearance-mode']` |
| OS scheme listener | `app.js:1177` | `matchMedia('prefers-color-scheme').addEventListener('change', ...)` |
| Theme map | `app.js:1137` | `ACCENT_THEMES` |

## Boot

| What | File:line | Function |
|---|---|---|
| Entry | `app.js:~31700` | `refresh()` |
| Order | — | load roles → load profile → load learning → load brand assets → render inbox → re-render after boundary cache settles (calls `renderInbox` twice — see PERFORMANCE_HOTSPOTS #5 dispatcher note) |

## Storage

| What | Where | Notes |
|---|---|---|
| Roles, decisions, etc. | Supabase | ~30 tables; see STATE_AND_STORAGE_MAP §4 |
| Theme | `localStorage['rw-accent-theme']` | preference |
| Appearance mode | `localStorage['rw-appearance-mode']` | preference |
| Per-role notes | `localStorage['rw_role_notes_<id>']` | **smell — should move to DB (R35)** |
| Intel feature flags | `localStorage['rw_intel_*']` and `rw_*` | scattered across `app.js:19355–19581` |
| Last active | `localStorage['rw_last_active']` | away-summary marker |

## Globals exported on `window.*`

| Symbol | Where |
|---|---|
| `window.openReasoningMap(role)` | `reasoning-map.js` |
| `window.RW_INSPECT` | `inspect-mode.js` |
| `window.RW_classifySignals` | `analysis/signals.js` |
| `window.RW_render = { renderDecisionBlock, renderMatchBreak }` | `analysis/render.js` |
| `window._rwCommuteGen` | `app.js:18065` (race-condition counter, **required**) |
| `window._testJDExtract` | `app.js:22466` (console only) |
| `window._debugRoleAnalysis` | `app.js:22555` (console only) |
| `window.__RW_SELECTED_NODE__` | `inspect-mode.js` (dev only) |
