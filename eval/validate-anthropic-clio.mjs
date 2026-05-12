// Validates the full 3-pass pipeline against the Anthropic provider using
// the Clio JD — exercises the exact code path that has been failing in prod.
// Posts to the deployed edge functions and reproduces the same validation +
// error-capture logic the app uses, so we can see whether the narrative
// would have been accepted or where it would have failed.
import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://peuaflazxvkkbpbhhjtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWFmbGF6eHZra2JwYmhoanR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE1NzgsImV4cCI6MjA4ODIxNzU3OH0.AZhesVch4DgVL_VRPQor_MWGx7EyGtS47D_hKRkFkSw';
const PROVIDER = 'anthropic';

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const jd = fs.readFileSync(path.join(repoRoot, 'eval/jds/12-clio-senior-product-designer.txt'), 'utf8');
const candidateContext = JSON.parse(fs.readFileSync(path.join(repoRoot, 'eval/candidate-context.json'), 'utf8'));

async function invoke(slug, body) {
  const t0 = Date.now();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${slug}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
    },
    body: JSON.stringify(body),
  });
  const elapsedMs = Date.now() - t0;
  const text = await res.text();
  if (!res.ok) return { error: `${res.status} ${text.slice(0, 400)}`, elapsedMs };
  return { data: JSON.parse(text), elapsedMs };
}

// Mirror of app.js's _validateNarrative.
function validateNarrative(n) {
  const reasons = [];
  if (!n || typeof n !== 'object') return { ok: false, reasons: ['not an object'] };
  const nonEmptyArr = (v, min) => Array.isArray(v) && v.length >= min && v.every(s => typeof s === 'string' && s.trim());
  const nonEmptyStr = v => typeof v === 'string' && v.trim().length > 0;

  if (!n.fit_reality?.paragraphs || !nonEmptyArr(n.fit_reality.paragraphs, 1)) reasons.push('fit_reality.paragraphs missing or empty');
  if (!n.what_this_role_actually_is?.paragraphs || !nonEmptyArr(n.what_this_role_actually_is.paragraphs, 1)) reasons.push('what_this_role_actually_is.paragraphs missing or empty');
  {
    const sec = n.what_they_really_need_from_you;
    if (!sec || typeof sec !== 'object') reasons.push('what_they_really_need_from_you missing');
    else {
      const hasParagraphs = Array.isArray(sec.paragraphs) && sec.paragraphs.length > 0;
      const hasBullets    = nonEmptyArr(sec.bullets, 1);
      if (!hasParagraphs && !hasBullets) reasons.push('what_they_really_need_from_you has no paragraphs or bullets');
    }
  }
  {
    const sec = n.what_you_would_actually_do;
    if (!sec || typeof sec !== 'object') reasons.push('what_you_would_actually_do missing');
    else {
      if (!nonEmptyStr(sec.framing)) reasons.push('what_you_would_actually_do.framing missing');
      if (!nonEmptyArr(sec.bullets, 1)) reasons.push('what_you_would_actually_do.bullets missing or empty');
    }
  }
  {
    const sec = n.practical_details;
    if (!sec || !Array.isArray(sec.items) || sec.items.length < 1) reasons.push('practical_details.items missing or empty');
    else if (!sec.items.every(i => nonEmptyStr(i?.label))) reasons.push('practical_details.items has entries without labels');
  }
  {
    const sec = n.risks_and_unknowns;
    if (!sec || typeof sec !== 'object') reasons.push('risks_and_unknowns missing');
    else {
      if (!nonEmptyStr(sec.stated_intro)) reasons.push('risks_and_unknowns.stated_intro missing');
      if (!Array.isArray(sec.stated))     reasons.push('risks_and_unknowns.stated not an array');
      if (!Array.isArray(sec.inferred))   reasons.push('risks_and_unknowns.inferred not an array');
    }
  }
  if (!nonEmptyArr(n.questions_worth_asking, 1)) reasons.push('questions_worth_asking missing or empty');
  if (!nonEmptyStr(n.decision?.summary) && !nonEmptyArr(n.decision?.paragraphs, 1)) reasons.push('decision.summary or decision.paragraphs missing or empty');
  if (n.recommended_cv !== null && n.recommended_cv !== undefined && !nonEmptyStr(n.recommended_cv)) reasons.push('recommended_cv must be a non-empty string or null');
  if (n.why_that_cv   !== null && n.why_that_cv   !== undefined && !nonEmptyStr(n.why_that_cv))     reasons.push('why_that_cv must be a non-empty string or null');
  if (!nonEmptyStr(n.final_note)) reasons.push('final_note missing');
  return { ok: reasons.length === 0, reasons };
}

console.log(`Running full pipeline against Anthropic for Clio JD (${jd.length} chars)...\n`);

const t0 = Date.now();

// Pass 1
console.log('[1/3] analyse-jd...');
const p1 = await invoke('analyse-jd', { jd_text: jd, candidate_context: candidateContext, provider: PROVIDER });
if (p1.error) { console.error('Pass 1 failed:', p1.error); process.exit(1); }
const extraction = p1.data?.analysis;
console.log(`      ✓ ${p1.elapsedMs}ms · version=${p1.data?.usage?.analyse_jd_version}\n`);

// Pass 1.5
console.log('[2/3] generate-role-reasoning...');
const p15 = await invoke('generate-role-reasoning', {
  extraction_json:    extraction,
  candidate_context:  candidateContext,
  raw_jd_excerpt:     jd.slice(0, 4000),
  cleaned_jd_excerpt: jd.slice(0, 4000),
  provider:           PROVIDER,
});
let reasoning = null;
let reasoningVersion = null;
if (p15.error) {
  console.error(`      ✗ ${p15.elapsedMs}ms · ERROR: ${p15.error.slice(0, 200)}\n`);
  console.log('      (continuing without reasoning — narrative path tolerates null)\n');
} else {
  reasoning = p15.data?.reasoning;
  reasoningVersion = p15.data?.usage?.role_reasoning_version;
  console.log(`      ✓ ${p15.elapsedMs}ms · version=${reasoningVersion}\n`);
}

// Pass 2
console.log('[3/3] generate-narrative...');
const p2 = await invoke('generate-narrative', {
  extraction_json:   extraction,
  candidate_context: candidateContext,
  reasoning_json:    reasoning,
  provider:          PROVIDER,
});
if (p2.error) { console.error('Pass 2 failed:', p2.error); process.exit(1); }
const narrative = p2.data?.narrative;
const narrativeVersion = p2.data?.usage?.narrative_version;
console.log(`      ✓ ${p2.elapsedMs}ms · version=${narrativeVersion}\n`);

// Run the same validation the app uses.
const valid = validateNarrative(narrative);

console.log('================================================================');
console.log('PIPELINE RESULT');
console.log('================================================================');
console.log(`Total time:                ${Date.now() - t0}ms`);
console.log(`Provider:                  ${PROVIDER}`);
console.log(`analyse_jd_version:        ${p1.data?.usage?.analyse_jd_version}`);
console.log(`role_reasoning_version:    ${reasoningVersion}`);
console.log(`narrative_version:         ${narrativeVersion}`);
console.log(`Narrative validation:      ${valid.ok ? 'PASS ✓' : 'FAIL ✗'}`);
if (!valid.ok) {
  console.log(`Validation reasons:`);
  valid.reasons.forEach(r => console.log(`  - ${r}`));
  console.log(`\nWould produce _narrative_error:`);
  console.log(JSON.stringify({
    code:      'NARRATIVE_VALIDATION_FAILED',
    message:   'NARRATIVE_VALIDATION_FAILED: ' + valid.reasons.join('; '),
    reasons:   valid.reasons,
    provider:  PROVIDER,
    context:   {
      provider:           PROVIDER,
      narrative_version:  narrativeVersion,
      reasoning_present:  !!reasoning,
      narrative_keys:     Object.keys(narrative || {}),
    },
    timestamp: new Date().toISOString(),
  }, null, 2));
}
console.log('================================================================');
console.log(`\nNarrative top-level keys: ${Object.keys(narrative || {}).join(', ')}`);
