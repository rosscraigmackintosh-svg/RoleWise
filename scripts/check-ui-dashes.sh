#!/usr/bin/env bash
# ============================================================================
# check-ui-dashes.sh
# Scans app source files for disallowed dash characters in user-facing strings.
#
# Usage:
#   ./scripts/check-ui-dashes.sh          # scan and report
#   ./scripts/check-ui-dashes.sh --strict  # exit 1 if violations found (for CI)
#
# What it checks:
#   1. Em dash (U+2014) and en dash (U+2013) in .js files
#   2. Hyphenated compound words inside likely user-facing string literals
#
# What it skips:
#   - CSS class names (rw-*, doc-*, section-*)
#   - Internal code comments (lines starting with // or *)
#   - Variable names and object keys
#   - Regex patterns
#   - URLs and file paths
#   - Data attribute values (data-*)
#   - Known safe internal values (enum keys, DB column names)
# ============================================================================

set -euo pipefail
STRICT=false
[[ "${1:-}" == "--strict" ]] && STRICT=true

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../app" && pwd)"

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

VIOLATIONS=0

echo "Scanning for UI dash violations in: $APP_DIR"
echo "=============================================="

# --- Check 1: Em dash and en dash in JS files ---
echo ""
echo "--- Em dash / en dash (U+2014, U+2013) ---"

EM_EN_HITS=$(grep -rn $'[\u2014\u2013]' "$APP_DIR"/*.js "$APP_DIR"/analysis/*.js 2>/dev/null \
  | grep -v 'conflicted copy' \
  | grep -v '^\s*//' \
  | grep -v 'COMMENT' \
  | grep -v '// ' \
  | grep -v '_sanitizeUiText' \
  | grep -v 'replace.*\\u201' \
  || true)

if [[ -n "$EM_EN_HITS" ]]; then
  echo -e "${RED}FOUND:${NC}"
  echo "$EM_EN_HITS"
  VIOLATIONS=$((VIOLATIONS + $(echo "$EM_EN_HITS" | wc -l)))
else
  echo -e "${GREEN}None found.${NC}"
fi

# --- Check 2: Hyphenated compounds in user-facing strings ---
echo ""
echo "--- Hyphenated compounds in string literals ---"

# Match lines containing quoted strings with word-hyphen-word patterns
# Exclude known safe patterns: CSS classes, data attributes, regex, URLs, internal keys
HYPHEN_HITS=$(grep -rn "['\"\`][^'\"\`]*[a-zA-Z]-[a-zA-Z][^'\"\`]*['\"\`]" "$APP_DIR"/*.js "$APP_DIR"/analysis/*.js 2>/dev/null \
  | grep -v 'conflicted copy' \
  | grep -v '^\s*//' \
  | grep -v 'rw-\|doc-\|section-\|col-\|btn-\|rail-\|pref-\|tab-\|card-\|grid-' \
  | grep -v 'data-\|aria-\|role-\|class=' \
  | grep -v 'http\|www\.\|\.com\|\.js\|\.css\|\.html' \
  | grep -v '_sanitizeUiText\|replace.*\\u201' \
  | grep -v 'startsWith\|indexOf\|includes\|match\|test\|regex\|RegExp' \
  | grep -v 'remote_model\|work_model\|company_stage\|role_type\|employment_type' \
  | grep -v 'on-site.*startsWith\|on-site.*===\|on-site.*!=' \
  | grep -v "re: /" \
  | grep -v "value: '" \
  | grep -v 'early-startup.*value\|scale-up.*value' \
  || true)

if [[ -n "$HYPHEN_HITS" ]]; then
  echo -e "${YELLOW}POTENTIAL VIOLATIONS (review manually):${NC}"
  echo "$HYPHEN_HITS" | head -50
  REMAINING=$(echo "$HYPHEN_HITS" | wc -l)
  if [[ $REMAINING -gt 50 ]]; then
    echo "  ... and $((REMAINING - 50)) more"
  fi
  VIOLATIONS=$((VIOLATIONS + REMAINING))
else
  echo -e "${GREEN}None found.${NC}"
fi

# --- Summary ---
echo ""
echo "=============================================="
if [[ $VIOLATIONS -gt 0 ]]; then
  echo -e "${RED}Total potential violations: $VIOLATIONS${NC}"
  echo "Review each finding. Not all hyphen hits are user-facing."
  if $STRICT; then
    echo "Strict mode: exiting with code 1"
    exit 1
  fi
else
  echo -e "${GREEN}No violations found. All clear.${NC}"
fi
