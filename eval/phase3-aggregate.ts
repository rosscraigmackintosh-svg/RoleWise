// =============================================================================
// phase3-aggregate.ts — Run all eval fixtures through FAST and DEEP paths,
// produce aggregate quality + latency report for Phase 3 gate.
//
// For each JD in jds/:
//   1. analyse-jd        (shared — run once, reused by both paths)
//   2. FAST: reason-and-narrate
//   3. DEEP: generate-role-reasoning + generate-narrative
//
// Verbosity per fixture: derived from JD length using the same dominant
// signal the live _computeVerbosityMode heuristic uses:
//   <1500 chars -> compact
//   >7000 chars -> deep
//   else        -> standard
//
// Quality gate (from the Fast-mode plan):
//   100% schema pass
//   0 canonical section omissions
//   0 banned-phrase regressions (FAST hits where DEEP has 0)
//   decision quality equal-or-better in >= 12/14 (manual flag)
//   no candidate-name leaks
//   average latency reduction >= 50%
//
// Usage:
//   deno run --allow-net --allow-read --allow-write phase3-aggregate.ts
//   deno run --allow-net --allow-read --allow-write phase3-aggregate.ts --only=04,12,14
//   deno run --allow-net --allow-read --allow-write phase3-aggregate.ts --verbosity-override=standard
// =============================================================================

const SUPABASE_URL      = 'https://peuaflazxvkkbpbhhjtu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWFmbGF6eHZra2JwYmhoanR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE1NzgsImV4cCI6MjA4ODIxNzU3OH0.AZhesVch4DgVL_VRPQor_MWGx7EyGtS47D_hKRkFkSw'

const args = Object.fromEntries(
  Deno.args.filter(a => a.startsWith('--')).map(a => {
    const eq = a.indexOf('=')
    return eq === -1 ? [a.slice(2), 'true'] : [a.slice(2, eq), a.slice(eq + 1)]
  })
)
const onlyFilter   = (args.only       as string | undefined)?.split(',').map(s => s.trim())
const verbOverride = args['verbosity-override'] as string | undefined
const provider     = 'openai'

const evalDir = new URL('.', import.meta.url).pathname
const jdsDir  = `${evalDir}jds`
const resultsDir = `${evalDir}results/phase3-aggregate`
await Deno.mkdir(resultsDir, { recursive: true })

const candidateContext = JSON.parse(await Deno.readTextFile(`${evalDir}candidate-context.json`))
const candidateName    = candidateContext?.identity?.name as string | undefined
const candidateFirstName = candidateName ? candidateName.split(/\s+/)[0] : undefined
const candidateStrengths: string[] = candidateContext?.core_strengths || []

// ── Discover fixtures ──────────────────────────────────────────────────────
const jdFiles: string[] = []
for await (const entry of Deno.readDir(jdsDir)) {
  if (entry.isFile && entry.name.endsWith('.txt')) jdFiles.push(entry.name)
}
jdFiles.sort()

const filteredFiles = onlyFilter && onlyFilter.length
  ? jdFiles.filter(f => onlyFilter.some(id => f.startsWith(id + '-') || f === id))
  : jdFiles

console.log(`\n=== Phase 3 aggregate eval ===`)
console.log(`Fixtures: ${filteredFiles.length} of ${jdFiles.length}`)
console.log(`Provider: ${provider}`)
console.log(`Candidate name leak check: "${candidateFirstName || '(none)'}"`)
console.log(``)

// ── Constants ─────────────────────────────────────────────────────────────
const REQUIRED_KEYS = [
  'fit_reality', 'what_this_role_actually_is', 'what_they_really_need_from_you',
  'what_you_would_actually_do', 'practical_details', 'risks_and_unknowns',
  'questions_worth_asking', 'decision', 'recommended_cv', 'why_that_cv', 'final_note',
]
const BANNED_PHRASES = [
  'operationally dense', 'systems-heavy', 'high-velocity', 'craft-led',
  'signal-to-hype', 'feature-theatre', 'change-for-its-own-sake',
  'translating complex workflows', 'through the wickets',
  'classic process heavy delivery', 'classic process-heavy delivery',
  'brainpower goes toward', 'brainpower is spent on',
  'moving the needle', 'wearing many hats',
  // Generic decision filler the prompts ban explicitly
  'interesting opportunity', 'balanced opportunity', 'good opportunity',
  'culture not assessable',
]
const LOADED_EMOTION_VERBS = [
  ' chafes ', ' chafe ', ' hates ', ' dislikes ', ' is bored by',
  ' is frustrated by ', ' burns out at ', ' thrives on ',
]

interface FixtureResult {
  jd_id: string
  jd_file: string
  jd_chars: number
  verbosity: 'compact' | 'standard' | 'deep'
  latency_ms: {
    analyse_jd: number
    fast_reason_and_narrate: number
    deep_reasoning: number
    deep_narrative: number
    fast_total: number
    deep_total: number
  }
  fast: PathMetrics
  deep: PathMetrics
  divergence: {
    recommended_cv: boolean
    fast_cv: string | null
    deep_cv: string | null
  }
  errors: string[]
  rate_limited_429: { fast: boolean; deep: boolean } // separates infra from quality
}

interface PathMetrics {
  schema_pass:        boolean
  missing_keys:       string[]
  framing_present:    boolean
  intro_present:      boolean
  final_note_correct: boolean
  paragraphs_present: boolean
  bullets_present:    boolean
  banned_hits:        string[]
  loaded_emotion_hits: string[]
  candidate_name_leaks: number
  fit_reality_uses_you: boolean
  fit_reality_excerpt:  string
  decision_excerpt:     string
  cv_id:                string | null
  questions_count:      number
  risks_inferred_count: number
}

// ── Verbosity decision per fixture (matches client _computeVerbosityMode dominant signal) ──
function pickVerbosity(chars: number): 'compact' | 'standard' | 'deep' {
  if (verbOverride === 'compact' || verbOverride === 'standard' || verbOverride === 'deep') {
    return verbOverride
  }
  if (chars < 1500) return 'compact'
  if (chars > 7000) return 'deep'
  return 'standard'
}

// ── Per-path metric computation ─────────────────────────────────────────────
function computeMetrics(narr: Record<string, any> | null): PathMetrics {
  const empty: PathMetrics = {
    schema_pass: false, missing_keys: REQUIRED_KEYS.slice(),
    framing_present: false, intro_present: false, final_note_correct: false,
    paragraphs_present: false, bullets_present: false,
    banned_hits: [], loaded_emotion_hits: [], candidate_name_leaks: 0,
    fit_reality_uses_you: false, fit_reality_excerpt: '', decision_excerpt: '',
    cv_id: null, questions_count: 0, risks_inferred_count: 0,
  }
  if (!narr) return empty

  const missing = REQUIRED_KEYS.filter(k => !(k in narr))
  const flat = JSON.stringify(narr).toLowerCase()
  const fitFirst = (narr.fit_reality?.paragraphs?.[0] as string) || ''
  const decision = (narr.decision?.summary as string) || ''

  // Candidate-name leak: count case-insensitive occurrences of the first name
  // as a standalone word.
  let nameLeaks = 0
  if (candidateFirstName) {
    const nameRe = new RegExp(`\\b${candidateFirstName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'gi')
    const matches = flat.match(nameRe)
    nameLeaks = matches ? matches.length : 0
  }

  return {
    schema_pass: missing.length === 0,
    missing_keys: missing,
    framing_present: typeof narr.what_you_would_actually_do?.framing === 'string'
                     && narr.what_you_would_actually_do.framing.trim().length > 0,
    intro_present:  typeof narr.risks_and_unknowns?.stated_intro === 'string'
                     && narr.risks_and_unknowns.stated_intro.trim().length > 0,
    final_note_correct: narr.final_note === 'Use this as context, not a verdict.',
    paragraphs_present: Array.isArray(narr.fit_reality?.paragraphs) && narr.fit_reality.paragraphs.length > 0,
    bullets_present: Array.isArray(narr.what_you_would_actually_do?.bullets) && narr.what_you_would_actually_do.bullets.length > 0,
    banned_hits: BANNED_PHRASES.filter(p => flat.includes(p.toLowerCase())),
    loaded_emotion_hits: LOADED_EMOTION_VERBS.filter(p => flat.includes(p.toLowerCase())),
    candidate_name_leaks: nameLeaks,
    fit_reality_uses_you: /\b(you|your)\b/i.test(fitFirst),
    fit_reality_excerpt: fitFirst.slice(0, 240),
    decision_excerpt:    decision.slice(0, 320),
    cv_id: typeof narr.recommended_cv === 'string' ? narr.recommended_cv : null,
    questions_count: Array.isArray(narr.questions_worth_asking) ? narr.questions_worth_asking.length : 0,
    risks_inferred_count: Array.isArray(narr.risks_and_unknowns?.inferred) ? narr.risks_and_unknowns.inferred.length : 0,
  }
}

// ── Throttling: token-budget-aware sleep between fixtures ──────────────────
// gpt-4.1 org TPM cap is 30,000 tokens/minute. A single fixture (both paths
// run) burns ~45–55k tokens spread across 50–90s of wall clock. Sleeping
// 60s between fixtures keeps the rolling 60s window comfortably under cap.
const INTER_FIXTURE_SLEEP_MS = 60_000

// ── Main loop ─────────────────────────────────────────────────────────────
const all: FixtureResult[] = []

for (let fi = 0; fi < filteredFiles.length; fi++) {
  const jdFile = filteredFiles[fi]
  const jdId = jdFile.replace(/\.txt$/, '').split('-')[0]
  const jdText = await Deno.readTextFile(`${jdsDir}/${jdFile}`)
  const verbosity = pickVerbosity(jdText.length)
  const errors: string[] = []
  const rateLimited = { fast: false, deep: false }

  if (fi > 0) {
    console.log(`  (throttling — sleeping ${INTER_FIXTURE_SLEEP_MS / 1000}s before next fixture)`)
    await sleep(INTER_FIXTURE_SLEEP_MS)
  }

  console.log(`[${jdFile}] chars=${jdText.length} verbosity=${verbosity}`)

  // Pass 1
  const t0 = performance.now()
  const exRes = await invokeFunction('analyse-jd', { jd_text: jdText, candidate_context: candidateContext, provider })
  const tExMs = Math.round(performance.now() - t0)
  if (exRes.rate_limited) rateLimited.fast = true // analyse-jd is shared; mark both
  if (exRes.error) {
    errors.push(`analyse-jd: ${exRes.error}`)
    console.log(`  analyse-jd FAIL: ${exRes.error}`)
    all.push({
      jd_id: jdId, jd_file: jdFile, jd_chars: jdText.length, verbosity,
      latency_ms: { analyse_jd: tExMs, fast_reason_and_narrate: 0, deep_reasoning: 0, deep_narrative: 0, fast_total: tExMs, deep_total: tExMs },
      fast: computeMetrics(null), deep: computeMetrics(null),
      divergence: { recommended_cv: false, fast_cv: null, deep_cv: null },
      errors,
      rate_limited_429: rateLimited,
    })
    continue
  }
  const extraction = exRes.data.analysis
  console.log(`  analyse-jd OK ${tExMs}ms${exRes.rate_limited ? ' (after 429 retry)' : ''}`)

  // FAST
  const tF0 = performance.now()
  const fastRes = await invokeFunction('reason-and-narrate', {
    extraction_json: extraction, candidate_context: candidateContext, jd_text: jdText,
    provider, verbosity_mode: verbosity,
  })
  const tFMs = Math.round(performance.now() - tF0)
  if (fastRes.rate_limited) rateLimited.fast = true
  if (fastRes.error) {
    errors.push(`reason-and-narrate: ${fastRes.error}`)
    console.log(`  reason-and-narrate FAIL ${tFMs}ms${fastRes.rate_limited ? ' (after 429 retries)' : ''}: ${fastRes.error}`)
  } else {
    console.log(`  reason-and-narrate OK ${tFMs}ms${fastRes.rate_limited ? ' (after 429 retry)' : ''}`)
  }

  // DEEP
  const tR0 = performance.now()
  const reasRes = await invokeFunction('generate-role-reasoning', {
    extraction_json: extraction, candidate_context: candidateContext,
    raw_jd_excerpt: jdText.slice(0, 4000), cleaned_jd_excerpt: jdText.slice(0, 4000),
    provider,
  })
  const tRMs = Math.round(performance.now() - tR0)
  if (reasRes.rate_limited) rateLimited.deep = true
  if (reasRes.error) {
    errors.push(`generate-role-reasoning: ${reasRes.error}`)
    console.log(`  role-reasoning FAIL ${tRMs}ms${reasRes.rate_limited ? ' (after 429 retries)' : ''}`)
  } else {
    console.log(`  role-reasoning OK ${tRMs}ms${reasRes.rate_limited ? ' (after 429 retry)' : ''}`)
  }

  const tN0 = performance.now()
  const narrRes = await invokeFunction('generate-narrative', {
    extraction_json: extraction, candidate_context: candidateContext,
    reasoning_json: reasRes.data?.reasoning ?? null,
    provider, verbosity_mode: verbosity,
  })
  const tNMs = Math.round(performance.now() - tN0)
  if (narrRes.rate_limited) rateLimited.deep = true
  if (narrRes.error) {
    errors.push(`generate-narrative: ${narrRes.error}`)
    console.log(`  narrative FAIL ${tNMs}ms${narrRes.rate_limited ? ' (after 429 retries)' : ''}`)
  } else {
    console.log(`  narrative OK ${tNMs}ms${narrRes.rate_limited ? ' (after 429 retry)' : ''}`)
  }

  const fastNarr = fastRes.data?.narrative ?? null
  const deepNarr = narrRes.data?.narrative ?? null
  const fastMetrics = computeMetrics(fastNarr)
  const deepMetrics = computeMetrics(deepNarr)

  const result: FixtureResult = {
    jd_id: jdId, jd_file: jdFile, jd_chars: jdText.length, verbosity,
    latency_ms: {
      analyse_jd: tExMs,
      fast_reason_and_narrate: tFMs,
      deep_reasoning: tRMs,
      deep_narrative: tNMs,
      fast_total: tExMs + tFMs,
      deep_total: tExMs + tRMs + tNMs,
    },
    fast: fastMetrics,
    deep: deepMetrics,
    divergence: {
      recommended_cv: fastMetrics.cv_id !== deepMetrics.cv_id,
      fast_cv: fastMetrics.cv_id,
      deep_cv: deepMetrics.cv_id,
    },
    errors,
    rate_limited_429: rateLimited,
  }
  all.push(result)

  // Persist per-fixture
  await Deno.writeTextFile(`${resultsDir}/${jdId}-fast.json`, JSON.stringify({
    jd_file: jdFile, verbosity,
    latency_ms: result.latency_ms,
    extraction,
    narrative: fastNarr,
    usage: fastRes.data?.usage,
  }, null, 2))
  await Deno.writeTextFile(`${resultsDir}/${jdId}-deep.json`, JSON.stringify({
    jd_file: jdFile, verbosity,
    latency_ms: result.latency_ms,
    extraction,
    reasoning: reasRes.data?.reasoning,
    narrative: deepNarr,
    usage: narrRes.data?.usage,
  }, null, 2))
}

// ── Aggregate report ─────────────────────────────────────────────────────
console.log(`\n\n=== AGGREGATE REPORT ===\n`)

// Latency table
console.log(`LATENCY (ms)`)
console.log(`${'jd'.padEnd(36)} ${'verb'.padEnd(10)} ${'FAST'.padStart(8)} ${'DEEP'.padStart(8)} ${'savings'.padStart(10)} ${'%'.padStart(7)}`)
console.log('-'.repeat(86))
let fastSum = 0, deepSum = 0, fixtures = 0
for (const r of all) {
  const savings = r.latency_ms.deep_total - r.latency_ms.fast_total
  const pct = r.latency_ms.deep_total > 0 ? (savings / r.latency_ms.deep_total * 100).toFixed(1) : '0'
  console.log(`${r.jd_file.padEnd(36)} ${r.verbosity.padEnd(10)} ${String(r.latency_ms.fast_total).padStart(8)} ${String(r.latency_ms.deep_total).padStart(8)} ${String(savings).padStart(10)} ${(pct + '%').padStart(7)}`)
  if (r.latency_ms.fast_total > 0 && r.latency_ms.deep_total > 0) {
    fastSum += r.latency_ms.fast_total
    deepSum += r.latency_ms.deep_total
    fixtures++
  }
}
const avgPct = deepSum > 0 ? ((deepSum - fastSum) / deepSum * 100).toFixed(1) : '0'
console.log('-'.repeat(86))
console.log(`${('AVG (' + fixtures + ' fixtures)').padEnd(47)} ${String(Math.round(fastSum / Math.max(1, fixtures))).padStart(8)} ${String(Math.round(deepSum / Math.max(1, fixtures))).padStart(8)} ${(((deepSum - fastSum) / Math.max(1, fixtures)) | 0).toString().padStart(10)} ${(avgPct + '%').padStart(7)}`)

// Schema check
console.log(`\nSCHEMA & FRAMING`)
console.log(`${'jd'.padEnd(36)} ${'FAST schema'.padStart(12)} ${'FAST frame'.padStart(11)} ${'FAST intro'.padStart(11)} ${'FAST final'.padStart(11)} ${'DEEP schema'.padStart(12)} ${'DEEP frame'.padStart(11)} ${'DEEP intro'.padStart(11)} ${'DEEP final'.padStart(11)}`)
console.log('-'.repeat(124))
let fastSchemaFails = 0, deepSchemaFails = 0
for (const r of all) {
  if (!r.fast.schema_pass) fastSchemaFails++
  if (!r.deep.schema_pass) deepSchemaFails++
  console.log(`${r.jd_file.padEnd(36)} ${(r.fast.schema_pass ? 'PASS' : 'FAIL').padStart(12)} ${(r.fast.framing_present ? '✓' : 'X').padStart(11)} ${(r.fast.intro_present ? '✓' : 'X').padStart(11)} ${(r.fast.final_note_correct ? '✓' : 'X').padStart(11)} ${(r.deep.schema_pass ? 'PASS' : 'FAIL').padStart(12)} ${(r.deep.framing_present ? '✓' : 'X').padStart(11)} ${(r.deep.intro_present ? '✓' : 'X').padStart(11)} ${(r.deep.final_note_correct ? '✓' : 'X').padStart(11)}`)
}

// Banned phrases
console.log(`\nBANNED PHRASE HITS`)
let fastBanned = 0, deepBanned = 0, fastBannedRegressions = 0
for (const r of all) {
  if (r.fast.banned_hits.length) fastBanned++
  if (r.deep.banned_hits.length) deepBanned++
  if (r.fast.banned_hits.length > 0 && r.deep.banned_hits.length === 0) fastBannedRegressions++
  if (r.fast.banned_hits.length || r.deep.banned_hits.length) {
    console.log(`  ${r.jd_file}: FAST=[${r.fast.banned_hits.join(', ') || 'none'}] DEEP=[${r.deep.banned_hits.join(', ') || 'none'}]`)
  }
}
if (fastBanned === 0 && deepBanned === 0) console.log(`  (0 hits across all fixtures, both paths)`)

// Loaded emotion verbs
console.log(`\nLOADED EMOTION VERBS (candidate tone violations)`)
let fastEmotion = 0, deepEmotion = 0
for (const r of all) {
  if (r.fast.loaded_emotion_hits.length) fastEmotion++
  if (r.deep.loaded_emotion_hits.length) deepEmotion++
  if (r.fast.loaded_emotion_hits.length || r.deep.loaded_emotion_hits.length) {
    console.log(`  ${r.jd_file}: FAST=[${r.fast.loaded_emotion_hits.join(', ') || 'none'}] DEEP=[${r.deep.loaded_emotion_hits.join(', ') || 'none'}]`)
  }
}
if (fastEmotion === 0 && deepEmotion === 0) console.log(`  (0 hits across all fixtures, both paths)`)

// Candidate-name leaks
console.log(`\nCANDIDATE-NAME LEAKS (looking for "${candidateFirstName}")`)
let fastNameLeaks = 0, deepNameLeaks = 0
for (const r of all) {
  if (r.fast.candidate_name_leaks > 0) fastNameLeaks++
  if (r.deep.candidate_name_leaks > 0) deepNameLeaks++
  if (r.fast.candidate_name_leaks > 0 || r.deep.candidate_name_leaks > 0) {
    console.log(`  ${r.jd_file}: FAST=${r.fast.candidate_name_leaks} DEEP=${r.deep.candidate_name_leaks}`)
  }
}
if (fastNameLeaks === 0 && deepNameLeaks === 0) console.log(`  (0 leaks across all fixtures, both paths)`)

// Voice rule
console.log(`\nFIT_REALITY USES "you/your" (second-person voice rule)`)
let fastVoice = 0, deepVoice = 0
for (const r of all) {
  if (r.fast.fit_reality_uses_you) fastVoice++
  if (r.deep.fit_reality_uses_you) deepVoice++
}
console.log(`  FAST: ${fastVoice}/${all.length}    DEEP: ${deepVoice}/${all.length}`)

// CV divergence
console.log(`\nRECOMMENDED CV DIVERGENCE`)
let cvDivergences = 0
for (const r of all) {
  if (r.divergence.recommended_cv) {
    cvDivergences++
    console.log(`  ${r.jd_file}: FAST=${r.divergence.fast_cv || '(none)'}  DEEP=${r.divergence.deep_cv || '(none)'}`)
  }
}
if (cvDivergences === 0) console.log(`  (all ${all.length} fixtures agree on CV variant)`)

// Decision excerpts for manual review
console.log(`\nDECISION SUMMARIES (manual quality check)`)
for (const r of all) {
  console.log(`\n  ${r.jd_file} (${r.verbosity}):`)
  console.log(`    FAST: ${r.fast.decision_excerpt}`)
  console.log(`    DEEP: ${r.deep.decision_excerpt}`)
}

// FIT_REALITY excerpts for manual review (compact ones especially)
console.log(`\n\nFIT_REALITY[0] EXCERPTS (manual quality check)`)
for (const r of all) {
  console.log(`\n  ${r.jd_file} (${r.verbosity}):`)
  console.log(`    FAST: ${r.fast.fit_reality_excerpt}`)
  console.log(`    DEEP: ${r.deep.fit_reality_excerpt}`)
}

// ── Quality gate evaluation ───────────────────────────────────────────────
// Separate infrastructure failures (429 rate limit on a path the harness
// could not recover from) from quality failures. Only quality failures
// count against the gate.
const fastInfraFails = all.filter(r => r.errors.some(e => /reason-and-narrate.*(429|rate limit)/i.test(e))).length
const deepInfraFails = all.filter(r => r.errors.some(e => /(role-reasoning|generate-narrative).*(429|rate limit)/i.test(e))).length

// Quality fail = schema fail WITHOUT 429 cause
const fastQualitySchemaFails = all.filter(r => !r.fast.schema_pass && !r.errors.some(e => /reason-and-narrate.*(429|rate limit)/i.test(e))).length
const deepQualitySchemaFails = all.filter(r => !r.deep.schema_pass && !r.errors.some(e => /(role-reasoning|generate-narrative).*(429|rate limit)/i.test(e))).length

// Latency comparison: only count fixtures where BOTH paths succeeded (clean
// comparison; 429s on either path make the times meaningless).
const cleanFixtures = all.filter(r => r.fast.schema_pass && r.deep.schema_pass)
const cleanFastSum = cleanFixtures.reduce((s, r) => s + r.latency_ms.fast_total, 0)
const cleanDeepSum = cleanFixtures.reduce((s, r) => s + r.latency_ms.deep_total, 0)
const cleanPct = cleanDeepSum > 0 ? ((cleanDeepSum - cleanFastSum) / cleanDeepSum * 100) : 0

console.log(`\n\n=== INFRASTRUCTURE vs QUALITY ===\n`)
console.log(`FAST 429 (rate-limit) failures:   ${fastInfraFails}/${all.length}`)
console.log(`DEEP 429 (rate-limit) failures:   ${deepInfraFails}/${all.length}`)
console.log(`FAST quality schema failures:     ${fastQualitySchemaFails}/${all.length}  (schema fails NOT caused by 429)`)
console.log(`DEEP quality schema failures:     ${deepQualitySchemaFails}/${all.length}`)
console.log(`Clean-comparison fixtures (both succeeded): ${cleanFixtures.length}/${all.length}`)
console.log(`Clean-comparison latency reduction: ${cleanPct.toFixed(1)}%`)

console.log(`\n=== QUALITY GATE ===\n`)
const total = all.length
const checks = [
  { name: 'FAST 0 quality schema failures',  pass: fastQualitySchemaFails === 0,             detail: `${fastQualitySchemaFails} quality fails (excluding ${fastInfraFails} × 429)` },
  { name: 'FAST 0 banned-phrase regressions', pass: fastBannedRegressions === 0,             detail: `${fastBannedRegressions} fixtures where FAST hit and DEEP did not` },
  { name: 'FAST 0 candidate-name leaks',     pass: fastNameLeaks === 0,                      detail: `${fastNameLeaks} fixtures with leaks` },
  { name: 'FAST 0 loaded-emotion verbs',     pass: fastEmotion === 0,                        detail: `${fastEmotion} fixtures with hits` },
  { name: 'Clean-comparison latency ≥50%',   pass: cleanPct >= 50,                           detail: `${cleanPct.toFixed(1)}% on ${cleanFixtures.length} clean fixtures` },
  { name: 'FAST fit_reality uses "you" ≥12', pass: fastVoice >= Math.min(12, total),         detail: `${fastVoice}/${total}` },
  { name: 'FAST framing 100% (excl 429)',    pass: all.filter(r => !r.rate_limited_429.fast).every(r => r.fast.framing_present),   detail: `${all.filter(r => !r.rate_limited_429.fast && r.fast.framing_present).length}/${all.filter(r => !r.rate_limited_429.fast).length}` },
  { name: 'FAST risks intro 100% (excl 429)',pass: all.filter(r => !r.rate_limited_429.fast).every(r => r.fast.intro_present),     detail: `${all.filter(r => !r.rate_limited_429.fast && r.fast.intro_present).length}/${all.filter(r => !r.rate_limited_429.fast).length}` },
  { name: 'FAST final_note 100% (excl 429)', pass: all.filter(r => !r.rate_limited_429.fast).every(r => r.fast.final_note_correct),detail: `${all.filter(r => !r.rate_limited_429.fast && r.fast.final_note_correct).length}/${all.filter(r => !r.rate_limited_429.fast).length}` },
  { name: 'FAST Principal CV ≤ 3/14',        pass: all.filter(r => r.fast.cv_id === 'principal-product-designer').length <= 3, detail: `${all.filter(r => r.fast.cv_id === 'principal-product-designer').length}/${total} chose Principal` },
]
let gatePass = true
for (const c of checks) {
  const tick = c.pass ? '✅' : '❌'
  if (!c.pass) gatePass = false
  console.log(`  ${tick}  ${c.name.padEnd(45)} ${c.detail}`)
}

console.log(`\n${gatePass ? '✅ GATE PASS' : '❌ GATE FAIL'} — see top-3 regressions and recommendation below.\n`)

// ── Top 3 regressions ─────────────────────────────────────────────────────
const regressions: Array<{ severity: number; fixture: string; reason: string }> = []
for (const r of all) {
  if (!r.fast.schema_pass && r.deep.schema_pass) {
    regressions.push({ severity: 100, fixture: r.jd_file, reason: `Schema FAIL on FAST (missing: ${r.fast.missing_keys.join(', ')}) while DEEP passed` })
  }
  if (r.fast.banned_hits.length > 0 && r.deep.banned_hits.length === 0) {
    regressions.push({ severity: 80, fixture: r.jd_file, reason: `FAST hit banned phrases [${r.fast.banned_hits.join(', ')}] while DEEP clean` })
  }
  if (r.fast.candidate_name_leaks > 0) {
    regressions.push({ severity: 70, fixture: r.jd_file, reason: `FAST leaked candidate name ${r.fast.candidate_name_leaks}x` })
  }
  if (r.fast.loaded_emotion_hits.length > 0) {
    regressions.push({ severity: 60, fixture: r.jd_file, reason: `FAST used loaded emotion verbs [${r.fast.loaded_emotion_hits.join(', ')}]` })
  }
  if (!r.fast.framing_present && r.deep.framing_present) {
    regressions.push({ severity: 50, fixture: r.jd_file, reason: `FAST missing what_you_would_actually_do.framing (DEEP had it)` })
  }
  if (!r.fast.intro_present && r.deep.intro_present) {
    regressions.push({ severity: 50, fixture: r.jd_file, reason: `FAST missing risks_and_unknowns.stated_intro (DEEP had it)` })
  }
  if (r.fast.latency_ms == null) continue
  if (r.latency_ms.fast_total > r.latency_ms.deep_total) {
    regressions.push({ severity: 30, fixture: r.jd_file, reason: `FAST slower than DEEP (${r.latency_ms.fast_total}ms vs ${r.latency_ms.deep_total}ms)` })
  }
}
regressions.sort((a, b) => b.severity - a.severity)
const top3 = regressions.slice(0, 3)
if (top3.length === 0) {
  console.log(`TOP 3 REGRESSIONS:  (none — no automatic regressions detected)`)
} else {
  console.log(`TOP ${top3.length} REGRESSIONS:`)
  top3.forEach((r, i) => console.log(`  ${i + 1}. [${r.fixture}] ${r.reason}`))
}

// ── Recommendation ────────────────────────────────────────────────────────
console.log(`\nRECOMMENDATION:`)
if (gatePass && regressions.length === 0) {
  console.log(`  PROCEED to Phase 2 (client branching). All automatic gate checks pass and no auto-detected regressions.`)
  console.log(`  Manual review still needed on:`)
  console.log(`    - decision quality (12/${total} or better must hold under read-through)`)
  console.log(`    - CV divergences (${cvDivergences} fixtures) — review which CV is more accurate`)
  console.log(`    - fit_reality candidate-context integration (read the excerpts above)`)
} else if (gatePass) {
  console.log(`  PROCEED with caution. Gate checks pass but ${regressions.length} soft regressions detected.`)
  console.log(`  Review the top regressions above before flipping the FAST_MODE_ROUTING_ENABLED flag in Phase 4.`)
} else {
  console.log(`  HOLD Phase 2. Fix prompt issues surfaced by the failing gate checks first.`)
  console.log(`  Priority: address the top regressions above, then re-run this eval.`)
}

// ── Persist aggregate JSON ────────────────────────────────────────────────
await Deno.writeTextFile(`${resultsDir}/summary.json`, JSON.stringify({
  total_fixtures: total,
  avg_latency_ms: { fast: Math.round(fastSum / Math.max(1, fixtures)), deep: Math.round(deepSum / Math.max(1, fixtures)) },
  avg_savings_pct: parseFloat(avgPct),
  gate_pass: gatePass,
  checks,
  regressions: regressions.slice(0, 10),
  per_fixture: all,
}, null, 2))
console.log(`\nWritten: ${resultsDir}/summary.json`)
console.log(`         ${resultsDir}/*-fast.json   ${resultsDir}/*-deep.json`)
console.log(``)

async function invokeFunction(slug: string, body: unknown): Promise<{ data?: any; error?: string; rate_limited?: boolean }> {
  // Retry on 429 (OpenAI TPM cap, surfaced as 500 from the edge function).
  // Parse the "Please try again in Xs" from the OpenAI error and sleep that
  // long; cap retries at 3. Non-429 errors are returned immediately.
  const MAX_RETRIES = 3
  let rateLimited = false
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${slug}`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey':        SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
      })
      const text = await res.text()
      if (res.ok) return { data: JSON.parse(text), rate_limited: rateLimited }

      const is429 = /429|rate limit/i.test(text)
      if (is429 && attempt < MAX_RETRIES) {
        rateLimited = true
        // Try to extract "Please try again in Xs" or X.Xs from the message
        const m = text.match(/try again in\s*([\d.]+)\s*s/i)
        const waitS = m ? Math.min(60, Math.max(2, parseFloat(m[1]) + 1)) : (15 * (attempt + 1))
        console.log(`    [${slug}] 429 hit (attempt ${attempt + 1}/${MAX_RETRIES + 1}); sleeping ${waitS.toFixed(1)}s before retry`)
        await new Promise(r => setTimeout(r, waitS * 1000))
        continue
      }
      return { error: `${res.status} ${text.slice(0, 300)}`, rate_limited: rateLimited }
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        console.log(`    [${slug}] network error (attempt ${attempt + 1}/${MAX_RETRIES + 1}); retrying in 5s`)
        await new Promise(r => setTimeout(r, 5000))
        continue
      }
      return { error: (e as Error).message || String(e), rate_limited: rateLimited }
    }
  }
  return { error: 'exhausted retries', rate_limited: rateLimited }
}

// Sleep helper for inter-fixture throttling.
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
