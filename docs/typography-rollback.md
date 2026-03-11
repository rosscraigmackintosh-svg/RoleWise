# Typography Rollback Reference
Generated before the Inter Tight + JetBrains Mono update.
To fully revert: restore the 5 blocks below to their original files.

---

## 1. index.html — font import (line 9)

**Original:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**What replaced it:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 2. styles.css — font tokens in :root (line 15)

**Original (single line):**
```css
--font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**What replaced it:** the rollback comment block + three token lines (--font, --font-head, --font-mono).
To revert: delete the entire rollback comment block and the --font-head / --font-mono lines. Keep --font unchanged.

---

## 3. styles.css — html, body smoothing (line 91)

**Original:**
```css
-webkit-font-smoothing: antialiased;
```

**What was added on the next line:**
```css
-moz-osx-font-smoothing: grayscale;
```
To revert: delete the -moz-osx-font-smoothing line.

---

## 4. styles.css — .ar-prompts-text monospace stack (line 1295)

**Original:**
```css
font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
```

**What replaced it:**
```css
font-family: var(--font-mono);
```
To revert: replace `var(--font-mono)` with the original string above.

---

## 5. styles.css — .share-link-text bare monospace (line 2437)

**Original:**
```css
font-family: monospace;
```

**What replaced it:**
```css
font-family: var(--font-mono);
```
To revert: replace `var(--font-mono)` with `monospace`.

---

## 6. styles.css — heading selectors that gained font-family: var(--font-head)

These selectors had **no font-family declaration before** — they inherited Inter from html/body.
To revert: remove the `font-family: var(--font-head);` line from each of these selectors.

| Selector            | Font size      | Context                     |
|---------------------|----------------|-----------------------------|
| `.logo-btn`         | 20px           | Brand name in nav           |
| `.radar-page-title` | 20px           | Radar page heading          |
| `.stats-page-title` | 20px           | Stats page heading          |
| `.review-page-title`| 22px (--text-2xl) | Review page heading      |
| `.admin-section-title` | 18px (--text-xl) | Admin section heading   |
| `.rc-detail-name`   | 22px           | Recruiter contact name      |
| `.rc-form-title`    | 18px           | Recruiter form heading      |
| `.snap-page-title`  | 20px           | Snapshot page heading       |
| `.radar2-page-title`| 20px           | Radar v2 page heading       |
| `.doc-role-title`   | 22px (--text-2xl) | Document role title      |
| `.ws-blank-title`   | 22px           | Workspace blank state title |

---

## Quick full rollback (4 steps)

1. **index.html line 9** — restore original Inter-only `<link>` (block 1 above)
2. **styles.css `:root`** — delete rollback comment block + `--font-head` + `--font-mono` lines
3. **styles.css heading selectors** — remove `font-family: var(--font-head);` from the 11 selectors in block 6
4. **styles.css `.ar-prompts-text` + `.share-link-text`** — restore original font-family strings (blocks 4–5)

Total lines to touch to fully revert: ~15.
