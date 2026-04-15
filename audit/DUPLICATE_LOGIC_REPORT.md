# DUPLICATE_LOGIC_REPORT — RoleWise

> Generated: 2026-04-14. Twelve clusters investigated. Each backed by literal grep evidence. Risk-classed.

---

## 1. Work Model normalisation — **HIGH duplication**

`'Remote' / 'Hybrid' / 'On site'` mapping is redefined at least 4 places.

| Site | File:line | Form |
|---|---|---|
| Canonical location parser | `app.js:1261` | `_parseLocationString()` — does the regex extraction |
| Sticky header inline map | `app.js:1948` | `_shdWmMap = { remote, hybrid, onsite }` |
| Role header inline map | `app.js:2020, 2024` | `_rhWmMap` — same shape, redefined twice in 4 lines |
| Filter ternaries | `app.js:2705, 2730, 2734` | `wm.includes('remote') ? 'remote' : ...` |
| Filter labels | `app.js:2721, 2743` | `_labels = { remote: 'Remote', ... }` |
| Inbox filter | `app.js:3091–3093` | Case-by-case `filterState` matching |

**Recommendation**: Add a top-level `WORK_MODEL_LABELS = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On site' }` and a `normaliseWorkModel(raw)` helper. Replace 7+ sites. **Risk: low**. **Effort: 30 min**.

---

## 2. Currency / salary formatting — LOW

| Site | File:line | Notes |
|---|---|---|
| `_fmtSalaryK(n)` | `app.js:5492` | `£{k}k` GBP formatter |
| Used at | `app.js:6658–6660` | Midpoint / lower / upper |
| `_fmtCost = v => …` | `app.js:29201` | USD cost formatter (admin telemetry) |

No `Intl.NumberFormat` in app.js. Two formatters serve different contexts. **No action recommended** — keep both. If a third currency emerges, extract `formatCurrency(value, code)`.

---

## 3. Date / Timestamp formatting — **CRITICAL duplication**

Two complete redefinitions of `_fmtDate / _fmtTs` plus 9 inline `toLocaleDateString` calls.

| Function / pattern | File:line | Notes |
|---|---|---|
| `_fmtDate` (admin Overview) | `app.js:27901` | `{ day: '2-digit', month: 'short', year: 'numeric' }` |
| `_fmtTs` (admin Overview) | `app.js:27906` | adds hour/minute |
| `_fmtDate` (admin Radar) | `app.js:28512` | **identical to v1** |
| `_fmtTs` (admin Radar) | `app.js:28517` | **identical to v1** |
| `_fmtDate` (admin Audit) | `app.js:29200` | lambda, `[]` locale, `{ month: 'short', day: 'numeric' }` |
| Inline `toLocaleDateString('en-GB', …)` | `app.js` (9 sites) | bare calls |

**Recommendation**: Promote `_fmtDate` and `_fmtTs` to module-scope (next to `esc()` at `app.js:1398`). Remove the two redefinitions. Audit the 9 inline calls. **Risk: low**. **Effort: 1 hr**.

---

## 4. Decision-saving overlap — **NOT duplication, intentional**

Three functions, three different tables.

| Function | Line | Table | Role |
|---|---:|---|---|
| `wsAppendDecision()` | 61 | `role_decisions` | Primary ledger (also fires the other two) |
| `_saveDecisionSnapshot()` | 393 | `role_decision_snapshots` | Frozen role DNA at decision time |
| `_saveCandidateDecisionExt()` | 514 | `role_decisions_ext` | Extended learning profile |

Each saves disjoint data. Comments at definition explain intent. **Keep as-is**. The only smell is the chain of fire-and-forget `.catch(()=>{})` after `wsAppendDecision` (lines 94–100) — see Performance Hotspot #11.

---

## 5. HTML escaping — **MEDIUM duplication**

| Function | File:line | Notes |
|---|---|---|
| `esc(s)` | `app.js:1398` | Canonical: `&<>"`, calls `_fixPunct()` |
| `_esc` (lambda) | `app.js:29203` | Local in admin tab; **does not escape `"`** |
| `_esc` (lambda) | `app.js:31863` | Local; same as v1 plus `"` |
| `_esc` admin redefinitions | `app.js:27891, 28441, 28509, 28698` | Each admin renderer has its own copy |

**Recommendation**: Delete every local `_esc`; rely on the global `esc()`. The local lambdas are *less* safe (one omits quotes, none call `_fixPunct`). **Risk: low**. **Effort: 30 min**.

---

## 6. Location parsing — none

| Function | Line | Notes |
|---|---:|---|
| `_parseLocationString(raw)` | 1261 | Parses `{ geo, workModel, officeDays }` |
| `_hasGeographicLocation()` | 1318 | thin wrapper |

Used 4 times (1319, 18256, 19258, 21901). **Keep as-is.**

---

## 7. Section context CRUD — none

`_scLoadAll`, `_scPersistToDb`, `_scGet`, `_scGetRoleOnly`, `_scSet`, `_scDelete` (`app.js:15432–15500`) are a cohesive 6-function module. **No duplication outside the cluster.** Strong candidate for extraction to `app/workspace/section-context.js` — see MODULE_SPLIT_PROPOSAL.

---

## 8. Salary-absent detection — **MEDIUM duplication**

Six different ad-hoc predicates for "we don't know the salary".

| Site | File:line | Form |
|---|---|---|
| `_noSalary` filter | `app.js:11419` | `_analysed.filter(r => …)` |
| `_salaryMissing` flag | `app.js:12624` | `!pd.salary_annual && !role.salary_text_raw` |
| Inline checks | `app.js:16032, 21764` | `!salaryAnnual \|\| salaryAnnual === 'Not stated'` |
| Stop-word regex | `app.js:16675` | `/competitive\|negotiable\|not stated\|tbc\|attractive\|doe/i` |
| `_aiSalIsWeak` | `app.js:22909` | combined null + sentinel string check |
| `noSalaryRoles` | `app.js:27105–27107` | `rolesWithAnalysis.filter(r => !r.salary_text_raw)` |

**Recommendation**: Extract `SALARY_MISSING_RE` and `isSalaryMissing(annual, raw) → boolean`. Replace 6 sites. **Risk: low** (each check is already conservative). **Effort: 1 hr**.

---

## 9. Modal show/hide patterns — none extractable

Each modal has its own form-reset, class-toggle, and overflow-management logic.

| Pair | Lines |
|---|---|
| `_rwOpenJdModal` / `_rwCloseJdModal` | 8694 / 8711 |
| `openAddModal` / `closeAddModal` | 14031 / 14068 |
| `openEditRoleModal` / `closeEditRoleModal` | 14478 / 14495 |
| `openShareModal` / `closeShareModal` | 27738 / 27801 |

**No shared boilerplate to extract**. There is, however, a single global Escape handler at `app.js:30818` that dismisses any open modal — that's the one cross-cutting concern, and it is already centralised.

---

## 10. Supabase update boilerplate — **HIGH duplication**

`await db.from('roles').update({...}).eq('id', roleId)` appears **17 times**.

Sites: `app.js:4238, 5245, 8405, 11835, 12076, 12440, 12498, 12964, 12980, 13157, 13289, 13331, 13809, 14520, 27070, 27083, 28138`.

10 sites swallow errors silently. 7 sites destructure `{ error }` but only console.warn.

**Recommendation**: Add a 10-line helper.

```js
async function updateRole(id, patch) {
  const { error } = await db.from('roles').update(patch).eq('id', id);
  if (error) console.warn('[updateRole]', id, error.message);
  return { error };
}
```

Replace all 17 sites. **Risk: low**. **Effort: 1 hr**. **Bonus**: a single point to add optimistic UI / retry / telemetry later.

---

## 11. Decision-stars / confidence rendering — none found

Searches for `renderStars`, `_renderConfidence` returned 0 matches. Stars (if any) are inlined in the decision banner template literal at `app.js:2153`. Not a duplication concern — confirm by reading the renderer if you decide to extract a `<StarRating>` component.

---

## 12. Empty-state UI — minimal

No shared `renderEmptyState()` helper. Each list builds its own "no roles yet" string inline (e.g., `app.js:3127`). With ~5 distinct empty-state strings across the app, the duplication is **low**, but a `renderEmptyState({ title, body, action })` helper would tidy it up if you ever standardise the visual.

---

## Summary

| Cluster | Severity | Action | Effort | Risk |
|---|---|---|---|---|
| 1. Work model normalisation | High | Extract const + helper | 30 min | Low |
| 2. Currency formatting | Low | Keep as-is | — | — |
| 3. Date/Timestamp formatting | **Critical** | Promote to module scope | 1 hr | Low |
| 4. Decision saving | None | Keep as-is (intentional) | — | — |
| 5. HTML escaping | Medium | Delete local `_esc` copies | 30 min | Low |
| 6. Location parsing | None | Keep as-is | — | — |
| 7. Section context CRUD | None | (Extract to module — separate concern) | — | — |
| 8. Salary-absent detection | Medium | Extract predicate + regex | 1 hr | Low |
| 9. Modal show/hide | None | Not actionable | — | — |
| 10. Supabase update boilerplate | **High** | Add `updateRole()` wrapper | 1 hr | Low |
| 11. Stars/confidence rendering | None found | — | — | — |
| 12. Empty-state UI | Low | Optional helper | 30 min | Low |

**Total realisable today: ~4 hours of work, ~150–200 lines saved, 0 behaviour change.**
