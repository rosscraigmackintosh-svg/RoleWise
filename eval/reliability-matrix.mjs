// Reliability matrix runner.
// Runs the full 3-pass pipeline (analyse-jd → reasoning → narrative) for
// each (provider × fixture) cell N times, validates the narrative, and
// captures pipeline_state-shaped telemetry. Output: matrix + summary stats.
import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://peuaflazxvkkbpbhhjtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWFmbGF6eHZra2JwYmhoanR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE1NzgsImV4cCI6MjA4ODIxNzU3OH0.AZhesVch4DgVL_VRPQor_MWGx7EyGtS47D_hKRkFkSw';

const ITERATIONS_PER_CELL = parseInt(process.env.ITER || '5', 10);  // default 5; pass ITER=10 to match the full spec
const PROVIDERS  = ['openai', 'anthropic'];
const FIXTURES   = [
  { id: '11-sai-contractor',             label: 'SAI'  },
  { id: '12-clio-senior-product-designer', label: 'Clio' },
  { id: '13-zeta-senior-ux',              label: 'Zeta' },
];

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const candidateContext = JSON.parse(fs.readFileSync(path.join(repoRoot, 'eval/candidate-context.json'), 'utf8'));

async function invoke(slug, body) {
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${slug}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
      body:    JSON.stringify(body),
    });
  } catch (e) {
    return { error: `NETWORK_ERROR: ${e.message}`, code: 'NETWORK', elapsedMs: Date.now() - t0 };
  }
  const elapsedMs = Date.now() - t0;
  const text = await res.text();
  if (!res.ok) return { error: `${res.status} ${text.slice(0, 300)}`, code: `HTTP_${res.status}`, elapsedMs };
  try { return { data: JSON.parse(text), elapsedMs }; }
  catch { return { error: 'JSON_PARSE_FAIL', code: 'PARSE', elapsedMs }; }
}

// Mirror of app.js _validateNarrative.
function validateNarrative(n) {
  const reasons = [];
  if (!n || typeof n !== 'object') return { ok: false, reasons: ['not an object'] };
  const nonEmptyArr = (v, min) => Array.isArray(v) && v.length >= min && v.every(s => typeof s === 'string' && s.trim());
  const nonEmptyStr = v => typeof v === 'string' && v.trim().length > 0;
  if (!n.fit_reality?.paragraphs || !nonEmptyArr(n.fit_reality.paragraphs, 1)) reasons.push('fit_reality.paragraphs missing');
  if (!n.what_this_role_actually_is?.paragraphs || !nonEmptyArr(n.what_this_role_actually_is.paragraphs, 1)) reasons.push('what_this_role_actually_is.paragraphs missing');
  { const s = n.what_they_really_need_from_you; if (!s) reasons.push('what_they_really_need_from_you missing');
    else { const hp = Array.isArray(s.paragraphs) && s.paragraphs.length > 0; const hb = nonEmptyArr(s.bullets, 1);
      if (!hp && !hb) reasons.push('what_they_really_need_from_you empty'); } }
  { const s = n.what_you_would_actually_do; if (!s) reasons.push('what_you_would_actually_do missing');
    else { if (!nonEmptyStr(s.framing)) reasons.push('framing missing'); if (!nonEmptyArr(s.bullets, 1)) reasons.push('bullets missing'); } }
  { const s = n.practical_details; if (!s || !Array.isArray(s.items) || s.items.length < 1) reasons.push('practical_details.items missing'); }
  { const s = n.risks_and_unknowns; if (!s) reasons.push('risks_and_unknowns missing');
    else { if (!nonEmptyStr(s.stated_intro)) reasons.push('stated_intro missing'); if (!Array.isArray(s.stated)) reasons.push('stated not array'); if (!Array.isArray(s.inferred)) reasons.push('inferred not array'); } }
  if (!nonEmptyArr(n.questions_worth_asking, 1)) reasons.push('questions missing');
  if (!nonEmptyStr(n.decision?.summary) && !nonEmptyArr(n.decision?.paragraphs, 1)) reasons.push('decision missing');
  if (!nonEmptyStr(n.final_note)) reasons.push('final_note missing');
  return { ok: reasons.length === 0, reasons };
}

async function runOne(provider, fixture) {
  const jdPath = path.join(repoRoot, 'eval/jds', fixture.id + '.txt');
  const jd = fs.readFileSync(jdPath, 'utf8');
  const state = { pass1: 'pending', pass1_5: 'pending', pass2: 'pending', validation: 'pending' };
  const timings = { analyse_jd_ms: 0, reasoning_ms: 0, narrative_ms: 0, total_ms: 0 };
  const errors = [];
  const t0 = Date.now();

  // Pass 1
  const p1 = await invoke('analyse-jd', { jd_text: jd, candidate_context: candidateContext, provider });
  timings.analyse_jd_ms = p1.elapsedMs;
  if (p1.error) { state.pass1 = 'failed'; errors.push({ stage: 'pass1', code: p1.code, message: p1.error }); timings.total_ms = Date.now()-t0; return { state, timings, errors, narrative: null, sections11: false }; }
  state.pass1 = 'success';
  const extraction = p1.data?.analysis;

  // Pass 1.5
  const p15 = await invoke('generate-role-reasoning', { extraction_json: extraction, candidate_context: candidateContext, raw_jd_excerpt: jd.slice(0,4000), cleaned_jd_excerpt: jd.slice(0,4000), provider });
  timings.reasoning_ms = p15.elapsedMs;
  let reasoning = null;
  if (p15.error) { state.pass1_5 = 'failed'; errors.push({ stage: 'pass1_5', code: p15.code, message: p15.error }); }
  else { state.pass1_5 = 'success'; reasoning = p15.data?.reasoning; }

  // Pass 2
  const p2 = await invoke('generate-narrative', { extraction_json: extraction, candidate_context: candidateContext, reasoning_json: reasoning, provider });
  timings.narrative_ms = p2.elapsedMs;
  let narrative = null;
  if (p2.error) { state.pass2 = 'failed'; errors.push({ stage: 'pass2', code: p2.code, message: p2.error }); timings.total_ms = Date.now()-t0; return { state, timings, errors, narrative: null, sections11: false }; }
  state.pass2 = 'success';
  narrative = p2.data?.narrative;

  // Validation
  const v = narrative ? validateNarrative(narrative) : { ok: false, reasons: ['no narrative'] };
  state.validation = v.ok ? 'success' : 'failed';
  if (!v.ok) errors.push({ stage: 'validation', code: 'NARRATIVE_VALIDATION_FAILED', message: v.reasons.join('; ') });

  // 11-section check — does the narrative contain content for all canonical sections?
  const sections11 = !!(
    narrative?.fit_reality?.paragraphs?.length &&
    narrative?.what_this_role_actually_is?.paragraphs?.length &&
    narrative?.what_you_would_actually_do?.bullets?.length &&
    narrative?.what_they_really_need_from_you &&
    narrative?.practical_details?.items?.length &&
    narrative?.risks_and_unknowns &&
    narrative?.questions_worth_asking?.length &&
    (narrative?.decision?.summary || narrative?.decision?.paragraphs?.length) &&
    narrative?.recommended_cv &&
    narrative?.why_that_cv &&
    narrative?.final_note
  );

  timings.total_ms = Date.now() - t0;
  return { state, timings, errors, narrative, sections11 };
}

// ── Main ──
console.log(`Reliability matrix — ${ITERATIONS_PER_CELL} iterations × ${PROVIDERS.length} providers × ${FIXTURES.length} fixtures = ${ITERATIONS_PER_CELL*PROVIDERS.length*FIXTURES.length} runs\n`);

const results = [];
for (const provider of PROVIDERS) {
  for (const fixture of FIXTURES) {
    for (let iter = 1; iter <= ITERATIONS_PER_CELL; iter++) {
      process.stdout.write(`[${provider} · ${fixture.label} · ${iter}/${ITERATIONS_PER_CELL}] `);
      const r = await runOne(provider, fixture);
      const stamp = `p1=${r.state.pass1} p1.5=${r.state.pass1_5} p2=${r.state.pass2} val=${r.state.validation} 11s=${r.sections11?'Y':'N'} ${r.timings.total_ms}ms`;
      console.log(stamp);
      results.push({ provider, fixture: fixture.label, iter, ...r });
    }
  }
}

// ── Summary ──
console.log('\n================================================================');
console.log('SUMMARY MATRIX');
console.log('================================================================');
console.log('| Provider  | Fixture | Pass1 | Pass1.5 | Pass2 | Valid | 11sect | AvgMs | Errors |');
console.log('|-----------|---------|-------|---------|-------|-------|--------|-------|--------|');
for (const provider of PROVIDERS) {
  for (const fixture of FIXTURES) {
    const cell = results.filter(r => r.provider === provider && r.fixture === fixture.label);
    const succ = (key) => cell.filter(r => r.state[key] === 'success').length;
    const elevenCount = cell.filter(r => r.sections11).length;
    const avgMs = Math.round(cell.reduce((s,r) => s + r.timings.total_ms, 0) / cell.length);
    const errorSummary = cell.flatMap(r => r.errors.map(e => e.code)).reduce((m,c) => (m[c]=(m[c]||0)+1, m), {});
    const errorStr = Object.entries(errorSummary).map(([k,v]) => `${k}×${v}`).join(' ') || '—';
    console.log(`| ${provider.padEnd(9)} | ${fixture.label.padEnd(7)} | ${succ('pass1')}/${cell.length}   | ${succ('pass1_5')}/${cell.length}     | ${succ('pass2')}/${cell.length}   | ${succ('validation')}/${cell.length}   | ${elevenCount}/${cell.length}    | ${avgMs.toString().padStart(5)} | ${errorStr} |`);
  }
}
console.log('================================================================');

// Save raw results for later inspection
fs.writeFileSync(path.join(repoRoot, 'eval/results/reliability-matrix.json'), JSON.stringify(results, null, 2));
console.log('\nRaw results: eval/results/reliability-matrix.json');
