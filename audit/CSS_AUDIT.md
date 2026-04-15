# CSS_AUDIT — RoleWise

> Generated: 2026-04-14. `app/styles.css` is 15,995 lines / ~498 KB / ~1,646 selectors.
> Every claim grep-backed; deletions classed by risk.

---

## 1. Duplicate `.hidden` rule — Safe to delete

Two identical `.hidden { display: none !important; }` rules.

| Line | Rule |
|---:|---|
| 8106 | `.hidden { display: none !important; }` |
| 10498 | `.hidden { display: none !important; }` (DUPLICATE) |

**Action**: delete line 10498. **Risk: zero**.

---

## 2. Duplicate `.rw-doc-bullets` !important block — Safe to delete

Identical 3-line override appears at two locations.

| Lines | Rule |
|---:|---|
| 3415–3419 | `.rw-doc-bullets, .rw-doc-bullets * { white-space: normal !important; overflow: visible !important; text-overflow: unset !important; }` |
| 5706–5708 | **identical** |

**Action**: delete second copy. **Risk: zero**.

---

## 3. Unused selector classes

### 3.1 `.modal-overlay` (`styles.css:14081`) — Safe to delete

`grep -n "modal-overlay" app/app.js app/index.html app/analysis/*.js` → 0 production matches. Only present in `design-system/index.html` demo (45 matches). The active class is `.modal-backdrop` (`styles.css:7929`).

**Action**: delete. ~10 lines. **Risk: zero**.

### 3.2 `.snap-divider` (`styles.css:2891`) — Safe to delete

Zero references in any production file.

**Action**: delete. ~5 lines. **Risk: zero**.

### 3.3 `.yl-*` family (`styles.css:11034–11090`) — Safe to delete

8 selectors: `.yl-panel`, `.yl-heading`, `.yl-label`, `.yl-label--weaker`, `.yl-list`, `.yl-list li`, `.yl-list li::before`, `.yl-list--weaker li`, `.yl-note`.

`grep -n "\\.yl-" app/app.js app/analysis/*.js` → 0. The replacement (`.rw-lens-panel__*`) is in active use, and `index.html:32` carries a comment explicitly noting the legacy status.

**Action**: delete. ~120 lines. **Risk: zero**.

### 3.4 `.alert__*` family (`styles.css:14500–14577`) — Move or delete

10 selectors: `.alert__icon`, `.alert__content`, `.alert__title`, `.alert__desc`, `.alert__actions`, `.alert__action`, `.alert__close`, plus icon variants and dark-mode overrides.

`grep -n "alert__" app/app.js` → 0. Present only in design-system demo.

**Action**: delete from `styles.css` OR migrate to `design-system/styles.css`. ~80 lines. **Risk: low** (only matters if a planned alert component intends to use these).

### 3.5 `.badge-pill` and `.badge-pill--*` (`styles.css:1387–1390+`) — Move or delete

Variants: `--brand`, `--gray`, `--error`, `--warning`, `--success`. Plus `.badge-pill-sm/md/lg`.

`grep -n "badge-pill" app/app.js` → 0. Demo-only.

**Action**: delete or move. ~40 lines. **Risk: low** (medium if planned).

### 3.6 `.avatar--2xl / --lg / --sm / --initials / --photo` — Safe to delete

`grep -n "avatar--" app/app.js app/analysis/*.js` → 0 production matches.

**Action**: delete the variant rules. ~30 lines. **Risk: zero**.

### 3.7 `.ars-*` — **KEEP — actively used**

`app.js:30018–30024` references `ars-active`, `ars-waiting`, `ars-stale`, `ars-ghosted` for hiring-signal badges. Do NOT delete.

---

## 4. Hardcoded colours — top 10

```
grep -oE '#[0-9a-fA-F]{3,6}' app/styles.css | sort | uniq -c | sort -rn | head
```

| Count | Hex | Should be |
|---:|---|---|
| 50 | `#fff` | `var(--color-white)` |
| 19 | `#fafafa` | `var(--gray-50)` |
| 13 | `#374151` | `var(--gray-700)` |
| 11 | `#3b7cff` | `var(--brand-600)` |
| 10 | `#6b7280` | `var(--gray-500)` |
| 10 | `#181d27` | `var(--gray-900)` |
| 9 | `#9aa0ab` | `var(--gray-400)` |
| 9 | `#2563EB` | `var(--blue-600)` (case variant of `#2563eb`) |
| 8 | `#6366f1` | (token missing — add `--indigo-500`) |
| 8 | `#22262f` | `var(--gray-800)` |

A representative sample of inconsistent sites:
- `styles.css:316` `.radar-signal-tag.info { border-color: #BAE6FD; ... }` → `var(--blue-100)`
- `styles.css:947` `.sg-badge.trusted { background: #DBEAFE; ... }` → `var(--blue-50)`
- `styles.css:1104` `.ar-row.selected { background: #EFF6FF; ... }` → `var(--blue-25)`
- `styles.css:14512–14515` `.alert__icon--*` (these will go away anyway — see §3.4)

**Action**: tokenise ~30 colour properties. **Risk: low** (theme integrity actually improves).

---

## 5. Token system — exists but underused

`design-system/tokens.css` (1,327 lines, 849 CSS variables) covers:

- **Colour primitives**: gray (modern + neutral), blue, success, warning, error, brand, light/dark mode pairs
- **Typography**: `--font`, `--font-head`, `--font-mono`, `--text-xs/sm/base/md/lg/xl/2xl/3xl`
- **Spacing**: `--space-tight`, `--space-block`, `--spacing-md/lg`
- **Components**: avatar sizes, online indicators, company logo dimensions
- **Borders & radius**: `--border`, `--border-light`, `--border-strong`, `--radius-sm/md/lg/full`
- **Theme**: `--accent`, `--accent-soft`, `--bg`, `--bg-card`, `--bg-subtle`, `--text`, `--text-light`, `--text-muted`

Adoption in `styles.css` is ~70% of properties. The remaining 30% is the technical debt.

**Gaps**:
1. ~30 hardcoded colour properties where a token exists
2. Typography fragmentation (see §7)
3. Some component vars defined locally rather than in `tokens.css` (e.g., `--step-v-pad` at `styles.css:7754`)

---

## 6. !important density — healthy

`grep -c '!important' app/styles.css` = **18** (a healthy number; threshold of concern is ~100).

| Lines | Count | Reason |
|---|---:|---|
| 1108, 1614 | 2 | Form padding overrides |
| 3417–3419 | 3 | `.rw-doc-bullets` overflow trio |
| 5706–5708 | 3 | **DUPLICATE** of above (delete) |
| 6619–6620 | 2 | Muted text/background |
| 8106, 10498 | 2 | `.hidden` (one is duplicate — delete) |
| 8284–8285 | 2 | Page-section margins |
| 11852–11853 | 2 | Animation/transform reset |
| 12521 | 1 | Margin reset |
| 13179 | 1 | Padding reset |

**Action**: deletions in §1 and §2 drop this from 18 → 14. No further action needed.

---

## 7. Selector specificity — good

`grep -En "^\\s*\\.[A-Za-z0-9_-]+ \\.[A-Za-z0-9_-]+ \\.[A-Za-z0-9_-]+ \\.[A-Za-z0-9_-]+" app/styles.css` → 0 matches. **No selector goes 4+ deep**. Specificity wars are not a problem here.

---

## 8. Typography fragmentation — **HIGH**

`grep -h 'font-size:' app/styles.css | sed 's/.*font-size: *//' | sort | uniq -c | sort -rn`

Top ~20 distinct values:

| Count | Value | Notes |
|---:|---|---|
| 126 | `13px` | Hardcoded — should be `--text-sm` |
| 107 | `12px` | Hardcoded |
| 97 | `12.5px` | No token — half-step value |
| 93 | `11px` | Hardcoded |
| 67 | `11.5px` | No token |
| 64 | `var(--text-sm)` | tokenised ✓ |
| 47 | `14px` | Hardcoded |
| 39 | `var(--text-base)` | tokenised ✓ |
| 34 | `var(--text-xs)` | tokenised ✓ |
| 26 | `10.5px` | No token |
| 24 | `13.5px` | No token |
| 22 | `10px` | Hardcoded |
| 13 | `16px` | Hardcoded |
| 10 | `20px` | Hardcoded |
| 9  | `var(--text-md)` | tokenised ✓ |
| 9  | `var(--text-lg)` | tokenised ✓ |
| 8  | `var(--btn-font-size)` | tokenised ✓ |
| 8  | `15px` | No token |
| 7  | `22px` | Hardcoded |

40+ distinct font sizes; only ~8 are token references. This is the single largest CSS smell.

**Recommendation**: standardise to ~8 sizes — `--text-2xs (10px)`, `--text-xs (11px)`, `--text-xs-plus (12px)`, `--text-sm (13px)`, `--text-base (14px)`, `--text-md (16px)`, `--text-lg (20px)`, `--text-xl (22px)`. Then refactor systematically. **Effort: 4–6 hours**. **Risk: medium** — visual diffs need eyeballing on a few key surfaces.

---

## 9. Estimated unused selectors

A targeted scan of high-confidence orphans yields:

| Family | Approx lines | Risk |
|---|---:|---|
| `.modal-overlay` | 10 | zero |
| `.snap-divider` | 5 | zero |
| `.yl-*` | 120 | zero |
| `.alert__*` | 80 | low |
| `.badge-pill*` | 40 | low |
| `.avatar--*` variants | 30 | zero |
| **Confirmed deletable** | **~285 lines** | — |

A broader unused-selector estimate (sampling 50 random top-level classes against `app.js`+`index.html`+`analysis/*.js`) suggests another **150–250 lines** of dead rules, but these need per-selector checking before deletion.

---

## 10. Summary of actionable cleanup

| Action | Where | Lines | Risk | Priority |
|---|---|---:|---|---|
| Delete duplicate `.hidden` | `:10498` | 1 | zero | **High** |
| Delete duplicate `.rw-doc-bullets` block | `:5706–5708` | 3 | zero | **High** |
| Delete `.modal-overlay` | `:14081` | 10 | zero | High |
| Delete `.snap-divider` | `:2891` | 5 | zero | High |
| Delete `.yl-*` family | `:11034–11090` | 120 | zero | High |
| Delete `.avatar--*` variants | various | 30 | zero | Medium |
| Move/delete `.alert__*` | `:14500–14577` | 80 | low | Medium |
| Move/delete `.badge-pill*` | `:1387–1390+` | 40 | low | Medium |
| Tokenise hardcoded colours | ~30 sites | ~60 | low | Medium |
| Consolidate typography to 8 tokens | ~500 sites | ~300 | medium | Medium |
| **Confirmed-safe deletions** | — | **~290** | zero–low | — |
| **Including refactors** | — | **~600–800** | — | — |

**Today**: ~290 lines safe to delete with no eyeballing. 30 minutes' work.
