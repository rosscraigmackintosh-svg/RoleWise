// =============================================================================
// test-reason-and-narrate.ts — Phase 1 manual invocation harness.
//
// Runs a single JD through BOTH paths and writes results side by side:
//   FAST: analyse-jd -> reason-and-narrate          (combined, 2 calls)
//   DEEP: analyse-jd -> generate-role-reasoning -> generate-narrative (3 calls)
//
// Prints latency comparison, schema-validity check, and key narrative
// section excerpts so quality can be eyeballed.
//
// Usage:
//   deno run --allow-net --allow-read --allow-write test-reason-and-narrate.ts
//   deno run --allow-net --allow-read --allow-write test-reason-and-narrate.ts --jd=14
//   deno run --allow-net --allow-read --allow-write test-reason-and-narrate.ts --verbosity=standard
// =============================================================================

const SUPABASE_URL      = 'https://peuaflazxvkkbpbhhjtu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWFmbGF6eHZra2JwYmhoanR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE1NzgsImV4cCI6MjA4ODIxNzU3OH0.AZhesVch4DgVL_VRPQor_MWGx7EyGtS47D_hKRkFkSw'

const args = Object.fromEntries(
  Deno.args.filter(a => a.startsWith('--')).map(a => {
    const eq = a.indexOf('=')
    return eq === -1 ? [a.slice(2), 'true'] : [a.slice(2, eq), a.slice(eq + 1)]
  })
)
const jdId       = (args.jd as string)        || '14'      // mobile-interaction-designer
const verbosity  = (args.verbosity as string) || 'compact' // matches what the live flow picks for short JDs
const provider   = 'openai'

const evalDir = new URL('.', import.meta.url).pathname
const jdsDir  = `${evalDir}jds`
const resultsDir = `${evalDir}results`

// ── Locate JD file ─────────────────────────────────────────────────────────
const jdFiles: string[] = []
for await (const entry of Deno.readDir(jdsDir)) {
  if (entry.isFile && entry.name.endsWith('.txt') && entry.name.startsWith(jdId + '-')) {
    jdFiles.push(entry.name)
  }
}
if (!jdFiles.length) {
  console.error(`No JD file found matching --jd=${jdId} in ${jdsDir}`)
  Deno.exit(1)
}
const jdFile = jdFiles[0]
const jdText = await Deno.readTextFile(`${jdsDir}/${jdFile}`)

// ── Candidate context (shared by both runs) ────────────────────────────────
const candidateContext = JSON.parse(await Deno.readTextFile(`${evalDir}candidate-context.json`))

console.log(`\n=== Phase 1 manual invocation ===`)
console.log(`JD:         ${jdFile} (${jdText.length} chars)`)
console.log(`Verbosity:  ${verbosity}`)
console.log(`Provider:   ${provider}\n`)

// ── Shared: Pass 1 extraction (run once, reuse for both paths) ─────────────
console.log(`[shared] analyse-jd ...`)
const tEx0 = performance.now()
const exRes = await invokeFunction('analyse-jd', {
  jd_text:           jdText,
  candidate_context: candidateContext,
  provider,
})
const tExMs = Math.round(performance.now() - tEx0)
if (exRes.error) {
  console.error(`  FAIL: ${exRes.error}`)
  Deno.exit(1)
}
const extraction = exRes.data.analysis
console.log(`  OK  ${tExMs}ms  model=${exRes.data?.usage?.model || '?'}\n`)

// ── FAST PATH: reason-and-narrate ──────────────────────────────────────────
console.log(`[FAST] reason-and-narrate ...`)
const tF0 = performance.now()
const fastRes = await invokeFunction('reason-and-narrate', {
  extraction_json:   extraction,
  candidate_context: candidateContext,
  jd_text:           jdText,
  provider,
  verbosity_mode:    verbosity,
})
const tFMs = Math.round(performance.now() - tF0)
const fastTotal = tExMs + tFMs

if (fastRes.error) {
  console.error(`  FAIL: ${fastRes.error}`)
} else {
  console.log(`  OK  ${tFMs}ms  model=${fastRes.data?.usage?.model || '?'}  version=${fastRes.data?.usage?.reason_and_narrate_version || '?'}`)
}

// ── DEEP PATH: generate-role-reasoning + generate-narrative ───────────────
console.log(`\n[DEEP] generate-role-reasoning ...`)
const tR0 = performance.now()
const reasRes = await invokeFunction('generate-role-reasoning', {
  extraction_json:    extraction,
  candidate_context:  candidateContext,
  raw_jd_excerpt:     jdText.slice(0, 4000),
  cleaned_jd_excerpt: jdText.slice(0, 4000),
  provider,
})
const tRMs = Math.round(performance.now() - tR0)
if (reasRes.error) console.error(`  FAIL: ${reasRes.error}`)
else console.log(`  OK  ${tRMs}ms  model=${reasRes.data?.usage?.model || '?'}`)

console.log(`[DEEP] generate-narrative ...`)
const tN0 = performance.now()
const narrRes = await invokeFunction('generate-narrative', {
  extraction_json:   extraction,
  candidate_context: candidateContext,
  reasoning_json:    reasRes.data?.reasoning ?? null,
  provider,
  verbosity_mode:    verbosity,
})
const tNMs = Math.round(performance.now() - tN0)
const deepTotal = tExMs + tRMs + tNMs

if (narrRes.error) console.error(`  FAIL: ${narrRes.error}`)
else console.log(`  OK  ${tNMs}ms  model=${narrRes.data?.usage?.model || '?'}  version=${narrRes.data?.usage?.narrative_version || '?'}`)

// ── Persist results ───────────────────────────────────────────────────────
const outDir = `${resultsDir}/${jdId}-phase1-comparison`
await Deno.mkdir(outDir, { recursive: true })
await Deno.writeTextFile(`${outDir}/fast.json`, JSON.stringify({
  path: 'fast',
  jd:   jdFile,
  verbosity,
  latency_ms: { extraction: tExMs, reason_and_narrate: tFMs, total: fastTotal },
  extraction,
  narrative: fastRes.data?.narrative ?? null,
  usage:     fastRes.data?.usage     ?? null,
  error:     fastRes.error           ?? null,
}, null, 2))
await Deno.writeTextFile(`${outDir}/deep.json`, JSON.stringify({
  path: 'deep',
  jd:   jdFile,
  verbosity,
  latency_ms: { extraction: tExMs, reasoning: tRMs, narrative: tNMs, total: deepTotal },
  extraction,
  reasoning: reasRes.data?.reasoning ?? null,
  narrative: narrRes.data?.narrative ?? null,
  usage:     narrRes.data?.usage     ?? null,
  errors: { reasoning: reasRes.error, narrative: narrRes.error },
}, null, 2))

// ── Comparison summary ───────────────────────────────────────────────────
console.log(`\n=== LATENCY ===`)
console.log(`FAST total:   ${fastTotal}ms  (analyse-jd ${tExMs}ms + reason-and-narrate ${tFMs}ms)`)
console.log(`DEEP total:   ${deepTotal}ms  (analyse-jd ${tExMs}ms + reasoning ${tRMs}ms + narrative ${tNMs}ms)`)
const speedup = deepTotal > 0 ? ((deepTotal - fastTotal) / deepTotal * 100).toFixed(1) : '0'
console.log(`Saving:       ${deepTotal - fastTotal}ms (${speedup}% reduction)`)

console.log(`\n=== SCHEMA CHECK ===`)
const REQUIRED_KEYS = [
  'fit_reality', 'what_this_role_actually_is', 'what_they_really_need_from_you',
  'what_you_would_actually_do', 'practical_details', 'risks_and_unknowns',
  'questions_worth_asking', 'decision', 'recommended_cv', 'why_that_cv', 'final_note',
]
const checkSchema = (label: string, narr: Record<string, unknown> | null | undefined) => {
  if (!narr) { console.log(`${label}: NO NARRATIVE`); return }
  const missing = REQUIRED_KEYS.filter(k => !(k in narr))
  const leaked = ['internal_thinking', 'reasoning', 'editorial_interpretation', 'thinking'].filter(k => k in narr)
  console.log(`${label}: ${missing.length === 0 ? 'all 11 sections present' : `MISSING ${missing.join(', ')}`}`)
  if (leaked.length) console.log(`  WARN: leaked internal keys: ${leaked.join(', ')}`)
}
checkSchema('FAST', fastRes.data?.narrative)
checkSchema('DEEP', narrRes.data?.narrative)

console.log(`\n=== SECTION EXCERPTS (FAST vs DEEP) ===`)
const excerpt = (s: unknown, max = 280): string => {
  if (typeof s === 'string') return s.length > max ? s.slice(0, max) + '…' : s
  if (Array.isArray(s)) return s.map(x => excerpt(x, max)).join(' || ')
  return JSON.stringify(s).slice(0, max)
}
const fNarr = (fastRes.data?.narrative || {}) as Record<string, any>
const dNarr = (narrRes.data?.narrative || {}) as Record<string, any>

console.log(`\n--- fit_reality.paragraphs[0] ---`)
console.log(`FAST: ${excerpt(fNarr.fit_reality?.paragraphs?.[0])}`)
console.log(`DEEP: ${excerpt(dNarr.fit_reality?.paragraphs?.[0])}`)

console.log(`\n--- what_this_role_actually_is.paragraphs[0] ---`)
console.log(`FAST: ${excerpt(fNarr.what_this_role_actually_is?.paragraphs?.[0])}`)
console.log(`DEEP: ${excerpt(dNarr.what_this_role_actually_is?.paragraphs?.[0])}`)

console.log(`\n--- what_you_would_actually_do (framing + first 3 bullets) ---`)
console.log(`FAST framing: ${excerpt(fNarr.what_you_would_actually_do?.framing, 200)}`)
console.log(`FAST bullets: ${excerpt((fNarr.what_you_would_actually_do?.bullets || []).slice(0, 3))}`)
console.log(`DEEP framing: ${excerpt(dNarr.what_you_would_actually_do?.framing, 200)}`)
console.log(`DEEP bullets: ${excerpt((dNarr.what_you_would_actually_do?.bullets || []).slice(0, 3))}`)

console.log(`\n--- risks_and_unknowns.inferred (first 3) ---`)
console.log(`FAST: ${excerpt((fNarr.risks_and_unknowns?.inferred || []).slice(0, 3))}`)
console.log(`DEEP: ${excerpt((dNarr.risks_and_unknowns?.inferred || []).slice(0, 3))}`)

console.log(`\n--- questions_worth_asking (first 3) ---`)
console.log(`FAST: ${excerpt((fNarr.questions_worth_asking || []).slice(0, 3))}`)
console.log(`DEEP: ${excerpt((dNarr.questions_worth_asking || []).slice(0, 3))}`)

console.log(`\n--- decision.summary ---`)
console.log(`FAST: ${excerpt(fNarr.decision?.summary, 400)}`)
console.log(`DEEP: ${excerpt(dNarr.decision?.summary, 400)}`)

console.log(`\n=== BANNED PHRASE SCAN (FAST narrative) ===`)
const BANNED = [
  'operationally dense', 'systems-heavy', 'high-velocity', 'craft-led',
  'signal-to-hype', 'feature-theatre', 'change-for-its-own-sake',
  'translating complex workflows', 'through the wickets',
  'classic process heavy delivery', 'classic process-heavy delivery',
  'brainpower goes toward', 'brainpower is spent on',
  'moving the needle', 'wearing many hats',
]
const flatFast = JSON.stringify(fastRes.data?.narrative || {}).toLowerCase()
const flatDeep = JSON.stringify(narrRes.data?.narrative || {}).toLowerCase()
const fastHits = BANNED.filter(p => flatFast.includes(p.toLowerCase()))
const deepHits = BANNED.filter(p => flatDeep.includes(p.toLowerCase()))
console.log(`FAST hits: ${fastHits.length ? fastHits.join(', ') : 'none'}`)
console.log(`DEEP hits: ${deepHits.length ? deepHits.join(', ') : 'none'}`)

console.log(`\n=== FILES WRITTEN ===`)
console.log(`  ${outDir}/fast.json`)
console.log(`  ${outDir}/deep.json`)
console.log(`\nDone.\n`)

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function invokeFunction(slug: string, body: unknown): Promise<{ data?: any; error?: string }> {
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
    if (!res.ok) return { error: `${res.status} ${text.slice(0, 300)}` }
    return { data: JSON.parse(text) }
  } catch (e) {
    return { error: (e as Error).message || String(e) }
  }
}
