#!/usr/bin/env python3
"""
check-no-em-dash.py — guard against em-dashes (U+2014) in UI source.

Rolewise must not use em-dashes in user-facing UI strings. This is a
lightweight, deterministic linter that fails when an em-dash appears in
likely user-facing source.

Scope (UI-facing only):
    app/*.{js,html,css}
    app/analysis/*.js
    app/reasoning-map.{js,css}

Detected:
    literal em-dash    —
    unicode escape     \\u2014

Ignored (out of scope):
    - line comments (// ... and # ... in shell-style heredocs)
    - block comments (/* ... */ and <!-- ... -->)
    - regex character classes containing — or \\u2014
    - console.log / console.warn / console.error / console.info / console.debug
    - throw new Error(...) and friends
    - lines explicitly marked  allow-em-dash
    - blocks wrapped between /* allow-em-dash-block */ and /* end-allow-em-dash-block */
    - file-level skips (LLM prompts, sample JD seeds, dev-only scripts)
    - mock and test HTML drafts (rolewise-*.html, _test-layout.html)
    - design-system tokens, devtools, ai/prompts (entire trees)
    - conflicted-copy backup files

Bypass:
    Add the literal comment marker on the same line:
        const placeholder = '—'; // allow-em-dash: missing-value glyph

    Or wrap a block:
        /* allow-em-dash-block: sample JD content */
        ...
        /* end-allow-em-dash-block */

Usage:
    scripts/check-no-em-dash.py            # report only (always exit 0)
    scripts/check-no-em-dash.py --strict   # exit 1 if any violations

Pre-commit wiring (optional):
    Append this to .git/hooks/pre-commit:
        ./scripts/check-no-em-dash.py --strict || exit 1
"""

import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))

# Files / folders that are entirely out of scope.
SKIP_FILE_PATTERNS = [
    re.compile(r'conflicted copy', re.IGNORECASE),
    re.compile(r'/_test-layout\.html$'),
    re.compile(r'/rolewise-(ballpark|frameio|linear)[\w.-]*\.html$'),
    re.compile(r'/design-system/'),
    re.compile(r'/devtools/'),
    re.compile(r'/ai/prompts/'),
    re.compile(r'/recruiter-backfill\.js$'),
    re.compile(r'/REASONING-MAP-LOG\.md$'),
]

# Top-level UI source roots to scan. Anything outside these is ignored.
INCLUDE_ROOTS = ['app']
INCLUDE_EXTS  = ('.js', '.html', '.css')

EM_DASH_PATTERNS = [
    ('literal',  re.compile(r'—')),     # —
    ('escape',   re.compile(r'\\u2014')),    # —  (literal in source)
]

ALLOW_LINE_MARKER  = 'allow-em-dash'
ALLOW_BLOCK_OPEN   = 'allow-em-dash-block'
ALLOW_BLOCK_CLOSE  = 'end-allow-em-dash-block'

# A regex character class containing a dash:  [...]
CHARCLASS_RE = re.compile(r'\[[^\]]*(?:—|\\u2014)[^\]]*\]')

# A JS regex literal:  /pattern/flags  — used to skip em-dashes that ARE
# the regex pattern itself (e.g. replace(/—/g, ',')).
REGEX_LITERAL_RE = re.compile(r'/(?:\\.|[^/\n])+/[gimsuy]*')

# Quick "is this a console/throw call line?" heuristic.
CONSOLE_RE = re.compile(r'\bconsole\.(log|warn|error|info|debug|group|groupEnd|trace|table)\b')
THROW_RE   = re.compile(r'\bthrow\s+new\b')


def should_skip_file(path: str) -> bool:
    rel = path.replace(ROOT, '').replace(os.sep, '/')
    return any(p.search(rel) for p in SKIP_FILE_PATTERNS)


def iter_target_files():
    for root_name in INCLUDE_ROOTS:
        base = os.path.join(ROOT, root_name)
        if not os.path.isdir(base):
            continue
        for dirpath, _dirnames, filenames in os.walk(base):
            for name in filenames:
                if not name.endswith(INCLUDE_EXTS):
                    continue
                full = os.path.join(dirpath, name)
                if should_skip_file(full):
                    continue
                yield full


def strip_comments(line: str, in_block_comment: bool, in_html_comment: bool):
    """Remove comment regions from `line`. Returns (cleaned, in_block, in_html).

    Cleans:
      - state-tracked /* ... */ that spans lines
      - inline /* ... */ blocks (any number)
      - state-tracked <!-- ... --> that spans lines
      - inline <!-- ... --> blocks (any number)
      - // line comments (only when outside a string literal)
    """

    # 1. /* ... */ block comment continuation.
    if in_block_comment:
        end = line.find('*/')
        if end == -1:
            return '', True, in_html_comment
        line = line[end + 2:]
        in_block_comment = False

    # 2. Strip every inline /* ... */ on this line; if last one is unclosed,
    #    truncate and enter block-comment state.
    while True:
        o = line.find('/*')
        if o == -1:
            break
        c = line.find('*/', o + 2)
        if c == -1:
            line = line[:o]
            in_block_comment = True
            break
        line = line[:o] + line[c + 2:]

    # 3. <!-- ... --> continuation.
    if in_html_comment:
        end = line.find('-->')
        if end == -1:
            return '', in_block_comment, True
        line = line[end + 3:]
        in_html_comment = False

    # 4. Strip every inline <!-- ... -->; track unclosed.
    while True:
        o = line.find('<!--')
        if o == -1:
            break
        c = line.find('-->', o + 4)
        if c == -1:
            line = line[:o]
            in_html_comment = True
            break
        line = line[:o] + line[c + 3:]

    # 5. // line comment — strip from first // that sits outside a string.
    i = 0
    while True:
        idx = line.find('//', i)
        if idx == -1:
            break
        before = line[:idx]
        # Heuristic: count unescaped quotes before this position.
        sq = before.count("'") - before.count("\\'")
        dq = before.count('"') - before.count('\\"')
        bq = before.count('`')
        if (sq % 2) or (dq % 2) or (bq % 2):
            # Inside a string literal — keep scanning past this //.
            i = idx + 2
            continue
        line = before
        break

    return line, in_block_comment, in_html_comment


def line_has_skipped_context(raw_line: str) -> bool:
    """Reasons to skip an entire line outright (regardless of comment stripping)."""
    if ALLOW_LINE_MARKER in raw_line:
        return True
    if CONSOLE_RE.search(raw_line) or THROW_RE.search(raw_line):
        return True
    return False


def find_em_dashes(line: str):
    """Return list of (kind, col) hits in this line.

    Drops hits that fall inside:
      - regex character classes  /[...]/
      - JS regex literals        /pattern/flags  (the dash IS the pattern)
    """
    hits = []
    for kind, pattern in EM_DASH_PATTERNS:
        for m in pattern.finditer(line):
            hits.append((kind, m.start(), m.end()))
    if not hits:
        return []

    skip_ranges = []
    for cls in CHARCLASS_RE.finditer(line):
        skip_ranges.append((cls.start(), cls.end()))
    for rx in REGEX_LITERAL_RE.finditer(line):
        skip_ranges.append((rx.start(), rx.end()))

    kept = []
    for kind, s, e in hits:
        if any(rs <= s and e <= re_ for rs, re_ in skip_ranges):
            continue
        kept.append((kind, s))
    return kept


def scan_file(path: str):
    violations = []
    in_block_comment = False
    in_html_comment  = False
    in_allow_block   = False

    try:
        with open(path, encoding='utf-8') as f:
            lines = f.readlines()
    except (UnicodeDecodeError, OSError):
        return []

    for lineno, raw in enumerate(lines, 1):
        # Block-allow markers take precedence over everything else.
        if ALLOW_BLOCK_OPEN in raw:
            in_allow_block = True
        if in_allow_block:
            if ALLOW_BLOCK_CLOSE in raw:
                in_allow_block = False
            continue

        if line_has_skipped_context(raw):
            # Still need to keep block-comment state in sync, in case a /* */
            # opens here.
            _, in_block_comment, in_html_comment = strip_comments(
                raw, in_block_comment, in_html_comment
            )
            continue

        cleaned, in_block_comment, in_html_comment = strip_comments(
            raw, in_block_comment, in_html_comment
        )
        if not cleaned.strip():
            continue

        for kind, col in find_em_dashes(cleaned):
            violations.append({
                'file':    os.path.relpath(path, ROOT),
                'line':    lineno,
                'col':     col + 1,
                'kind':    kind,
                'snippet': raw.rstrip('\n'),
            })

    return violations


def main():
    strict = '--strict' in sys.argv

    all_violations = []
    file_count = 0
    for path in iter_target_files():
        file_count += 1
        all_violations.extend(scan_file(path))

    if not all_violations:
        print(f'check-no-em-dash: scanned {file_count} files, no UI em-dashes found.')
        sys.exit(0)

    print(f'check-no-em-dash: scanned {file_count} files, found {len(all_violations)} violation(s):')
    print('')
    for v in all_violations:
        snippet = v['snippet'].lstrip()
        if len(snippet) > 140:
            snippet = snippet[:140] + '…'
        print(f"  {v['file']}:{v['line']}:{v['col']}  [{v['kind']}]  {snippet}")
    print('')
    print('To allow an intentional em-dash, add the comment marker on the same line:')
    print("    const placeholder = '—'; // allow-em-dash: missing-value glyph")
    print('')
    print('Or wrap a block:')
    print('    /* allow-em-dash-block: sample JD seed */')
    print('    ...')
    print('    /* end-allow-em-dash-block */')

    if strict:
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
