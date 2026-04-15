# UI_SURFACE_MAP — RoleWise

> Generated: 2026-04-14. Each surface is mapped to its DOM root, the function that renders it, and the user action that opens it.

## 1. App shell (always-on grid)

```
.col-left  │ .col-filter │ .col-list (role-inbox)  │ .col-center (role detail) │ .col-chat (workspace) │ .col-rail-section
```

- **DOM root**: `<body>` → static markup in `index.html` lines ~880–975.
- **Render entry**: most columns are pre-baked HTML; render functions write into specific `id`s inside them.
- **Visibility**: `listPanelVisible`, `rightPanelVisible`, `filterPanelOpen` (state vars in app.js) control which columns are shown for each `currentNav`.

| Column | DOM id / class | Renders from | What's inside |
|---|---|---|---|
| Left sidebar | `<aside class="col-left">` | static HTML | Logo, nav buttons (overview/inbox/radar/recruiters/admin/profile), version |
| Filter panel | `#col-filter` | static HTML; handlers in `app.js:30746–30808` | Decision/engagement/work-model checkboxes, search |
| Role list (inbox) | `#col-list` → `#role-inbox` | `renderInbox(roles)` `app.js:3046` | Role cards via `renderRoleCard` |
| Center column | `#col-center` → `#col-overview-body`, `#col-overview-cards` | `renderWorkspaceView` (mount), `renderRoleDoc` `app.js:10504`, `renderMatchOutput` `app.js:17925` | Role header, sticky bar, JD section, match output |
| Workspace/chat | `<aside class="col-chat">` → `#ws-timeline`, `#ws-chat-bar`, `#ws-documents-section` | `renderWorkspaceView(role)` `app.js:9170` | Conversation, chat bar, docs |
| Stage rail | `#col-rail-section` → `#rail-stepper`, `#rail-outcome-list`, `#ws-decision-history-dl` | `renderRail(role)` `app.js:11872` | Stage chips, outcome chips, decision history |

---

## 2. Role list / inbox

| Element | Selector / id | Renders from | User action |
|---|---|---|---|
| Inbox container | `#role-inbox` | `renderInbox(allRoles)` `app.js:3046` | Page load / nav click |
| Each role card | `.role-card[data-role-id]` | `renderRoleCard(role)` `app.js:~3100` | (rendered inside renderInbox) |
| Card click | — | `selectRole(roleId)` `app.js:~3370` | Click anywhere on card |
| Compare checkbox | `.role-card .compare-check` | `change` handler `app.js:3378` | Toggles `compareRoleIds` |
| Compare bar | `.compare-bar` | `renderInbox` re-render | Visible when `compareRoleIds.size >= 2` |
| Inbox tab toggle (Active / Archive) | `.inbox-tabs button` | re-renders inbox with filter | Click |

---

## 3. Role detail (centre column)

| Surface | DOM id | Renders from | Notes |
|---|---|---|---|
| Sticky header | `#role-sticky-header` | `_renderStickyHeader(role)` `app.js:1942` | Reveals on scroll past detail strip; trigger is an `IntersectionObserver` at `app.js:11340` |
| Role header | `#col-role-header` | `_renderRoleHeader(role)` `app.js:1973` | Tags, status badges, action buttons |
| Decision banner | inline above analysis | `_renderDecisionBanner(role)` `app.js:2153` | Shows current decision state |
| Match output | `.rw-overview-wrap` inside `#col-overview-cards` | `renderMatchOutput(role, output)` `app.js:17925` | Top-level analysis renderer; calls into `analysis/render.js` for sub-blocks |
| JD section | `#col-jd-section` | `_renderJDSection(role, jdText)` `app.js:2338` | Collapsible raw JD |
| Notes (inline) | `#role-notes` (textarea) | inline in `renderRoleDoc` `app.js:10053` | Persisted to `localStorage['rw_role_notes_<id>']`, debounced save at line 10165 |
| Preparation / Next action | `#ws-next-action` | `renderNextAction(role)` `app.js:27029` | Renders interview prep, cover letter, CV alignment cards |

---

## 4. Workspace / chat panel

| Surface | DOM id | Renders from |
|---|---|---|
| Workspace header | `#ws-workspace-header` | inside `renderWorkspaceView` `app.js:9220` |
| Timeline | `#ws-timeline` | rows appended via `_wsAppend(...)` `app.js:~4867` |
| Chat input bar | `#ws-chat-bar` → `#ws-chat-input`, `#ws-chat-send` | listeners at `app.js:9626–9627` |
| Documents panel | `#ws-documents-section` → renders via `_renderDocumentsPanel(role)` `app.js:4711` | docs/source cards |
| Decision history (mini) | `.ws-decision-history` inside timeline | `wsRefreshDecisionHistory` `app.js:142` | Auto-refresh after each decision |

Custom event: `timelineEl` listens for `ws:chip-send` (`app.js:9637`) — chips dispatched from `app.js:5073` and `6014` route through this hub.

---

## 5. Stage rail (right column)

| Surface | DOM id | Renders from |
|---|---|---|
| Stepper | `#rail-stepper` | `buildStepperItems()` inside `renderRail` |
| Outcome chips | `#rail-outcome-list` | `renderRail(role)` `app.js:11872` |
| Outcome reason form | `#rail-outcome-form` | `showOutcomeReasonForm(roleId, state)` `app.js:13022` | Click an outcome chip |
| Decision history list | `#ws-decision-history-dl` | `_renderDecisionHistoryDL(role)` `app.js:12837` |

---

## 6. Modals & overlays

| Modal | DOM id | Show fn | Hide fn | Trigger |
|---|---|---|---|---|
| Unified JD ingestion overlay | `#rw-ingestion-overlay` | `openIngestionOverlay()` `app.js:13450` | (close button + Escape via global handler `app.js:30818`) | `+ Add JD` button `app.js:30869` |
| Add JD modal (legacy / advanced) | `#modal-add` | `showAddJdModal()` `app.js:14064` | `hideAddJdModal()` `app.js:14069` | `#btn-open-add` |
| Edit details modal | `#modal-edit-details` | `showEditDetailsModal()` `app.js:14492` | `hideEditDetailsModal()` `app.js:14496` | "Edit details" in role header |
| Share modal | `#modal-share` | `showShareModal()` `app.js:27739` | (close button) | "Share" in role menu |
| Confirmation modal | (built ad hoc in JS) | `app.js:9045–9061` | (yes/no buttons) | various destructive actions |
| Reasoning map overlay | `#rm-overlay` | `window.openReasoningMap(role)` (`reasoning-map.js`) | (close button + Escape) | "Reasoning map" button in role header |
| Inspect mode overlay | `#__rw_inspect_highlight__`, `#__rw_inspect_pill__`, `#__rw_inspect_panel__` | `window.RW_INSPECT.enable()` (`inspect-mode.js`) | `disable()` | localhost only — keyboard shortcut |
| Monthly review modal | (built in JS) | `_openMonthlyReview()` `app.js:30195` | (close + backdrop + Escape) | "Monthly review" button |

---

## 7. Recruiter views

| Surface | DOM id / mount | Renders from | Trigger |
|---|---|---|---|
| Recruiter list panel | `#rc-list-panel-wrapper` (inside `#col-list`) | `renderRecruitersView()` `app.js:26952` | Nav: "Role Contacts" |
| Recruiter detail | inside the wrapper | `renderRecruiterDetail(rec)` `app.js:26428` | Click recruiter |
| Recruiter edit form | inside the wrapper | `renderRecruiterEditForm(rec)` `app.js:26707` | "Edit" button |
| Recruiter add form | inside the wrapper | `renderRecruiterAddForm()` `app.js:26845` | "Add recruiter" button |

---

## 8. Admin panel (10 sub-tabs)

Mount: `renderAdminView()` `app.js:27887` writes a tab shell into `#col-center`. Each tab has its own renderer:

| Tab | Render fn (line) |
|---|---|
| Overview | `_renderAdminOverview` `27933` |
| Roles | `_renderAdminRoles` `27983` |
| Rules | `_renderAdminRules` `28269` |
| Prompts | `_renderAdminPrompts` `28341` |
| Radar | `_renderAdminRadar` `28508` |
| Stats | `_renderAdminStats` `28697` |
| Audit | `_renderAdminAudit` `28860` |
| Intelligence | `_renderAdminIntelligence` `28906` |
| (Inline tab IIFEs: Usage / Abuse & Rate Limits / User Trust / Efficiency) | `app.js:29250–29499` |

Trigger: nav button "Admin" → `switchNav('admin')`.

---

## 9. Other top-level views

| Surface | DOM root | Renders from | Trigger |
|---|---|---|---|
| Profile | `#col-center` | `renderProfileView()` `app.js:14862` | Profile button |
| Radar (market signals) | `#col-center` | `renderRadarView()` `app.js:27458` | Nav: "Radar" |
| Review | `#col-center` | `renderReviewView()` `app.js:29931` | Nav: "Review" |
| Safeguards | `#col-center` | `renderSafeguardsView()` `app.js:29171` | Nav: "Platform Safeguards" |
| Comparison | `#col-center` | `renderCompareView()` `app.js:3449` | Click "Compare" with ≥2 roles selected |
| Candidate setup card | `#col-overview-cards` (appended) | `showCandidateSetupCard(existing)` `app.js:909` | First load OR "Edit setup" |

---

## 10. Brand asset / logo system (cross-cutting)

- Mount points are wherever a logo is needed: role cards, role headers, sticky header, recruiter cards.
- Render entry: `_renderLogoEl(asset, size)` `app.js:~1750`.
- Resolution: `resolveBrandAsset(company, domain)` `app.js:~1640` — cache-first, network fallback.
- Cache state: `_brandAssetCache`, `_brandAssetCacheId`, `_logoFetchInFlight` `app.js:1498`.

---

## 11. Section context UI (per-section notes & corrections)

- Trigger: small "Add note" / "Correct this" affordance attached to each section in match output.
- State: `roles[i].section_context` JSON column.
- API: `_scGet`, `_scSet`, `_scPersistToDb` (`app.js:15392–15565`).
- The UI elements are built inline alongside section rendering inside `renderMatchOutput` — there is no single `renderSectionContext` function. → Candidate for extraction.

---

## 12. Inspect mode (dev-only)

- Localhost guard at top of `inspect-mode.js`. Returns immediately on prod.
- Three floating elements:
  - `#__rw_inspect_highlight__` — outlines hovered element with `data-node-id`
  - `#__rw_inspect_pill__` — bottom-left status pill
  - `#__rw_inspect_panel__` — locked-selection panel with selector + slot info
- API: `window.RW_INSPECT.{enable,disable,toggle,isActive}`.
- Used by: `aiMeta()` from `devtools/inspect/ai-meta.js` (called 7+ times in app.js).

---

## ~45 distinct surfaces total

Grouped:
- **5 columns** in the main grid (left nav, filter, list, centre, chat) plus the rail
- **5 modals** (ingestion overlay, add JD, edit details, share, confirmation)
- **3 dev/admin overlays** (reasoning map, inspect, monthly review)
- **10 admin sub-tabs**
- **6 full-view panels** (recruiters, admin shell, review, safeguards, profile, radar, compare)
- **7 role detail surfaces** (sticky header, header, decision banner, match output, JD section, notes, next-action)
- **6 workspace surfaces** (header, timeline, chat bar, docs, decision history mini, signals/insights captures)

All surfaces mount into pre-existing DOM containers via `el.innerHTML = …` or `appendChild`. There is no virtual DOM and no diffing — see PERFORMANCE_HOTSPOTS for the cost.
