// =============================================================================
// test-synthesise-chat-read.ts — Phase 4 synth eval harness.
//
// For each JD fixture, runs the chained pipeline:
//   analyse-jd  ->  reason-and-narrate  ->  synthesise-chat-read
// then writes the resulting chat_read alongside word counts, turn counts,
// and a small handful of automated tone heuristics so we can eyeball
// before flipping CHAT_SYNTH_ENABLED in the client.
//
// This does NOT call OpenAI directly; it goes through the deployed edge
// functions on rolewise-v0. Anti-burst: 5s sleep between fixtures.
//
// Usage:
//   deno run --allow-net --allow-read --allow-write test-synthesise-chat-read.ts
//   deno run --allow-net --allow-read --allow-write test-synthesise-chat-read.ts --jd=14
//   deno run --allow-net --allow-read --allow-write test-synthesise-chat-read.ts --verbosity=deep
// =============================================================================

const SUPABASE_URL      = 'https://peuaflazxvkkbpbhhjtu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWFmbGF6eHZra2JwYmhoanR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE1NzgsImV4cCI6MjA4ODIxNzU3OH0.AZhesVch4DgVL_VRPQor_MWGx7EyGtS47D_hKRkFkSw'

const args = Object.fromEntries(
  Deno.args.filter(a => a.startsWith('--')).map(a => {
    const eq = a.indexOf('=')
    return eq === -1 ? [a.slice(2), 'true'] : [a.slice(2, eq), a.slice(eq + 1)]
  })
)
const onlyJd     = (args.jd as string)        || ''
const verbosity  = (args.verbosity as string) || 'standard'
const provider   = 'openai'

const evalDir    = new URL('.', import.meta.url).pathname
const jdsDir     = `${evalDir}jds`
const resultsDir = `${evalDir}results`

const candidateContext = JSON.parse(await Deno.readTextFile(`${evalDir}candidate-context.json`))

// ── Locate JD fixtures ───────────────────────────────────────────────────────
const jdFiles: string[] = []
for await (const entry of Deno.readDir(jdsDir)) {
  if (entry.isFile && entry.name.endsWith('.txt')) {
    if (onlyJd && !entry.name.startsWith(onlyJd + '-')) continue
    jdFiles.push(entry.name)
  }
}
jdFiles.sort()

if (!jdFiles.length) {
  console.error(`No JD fixtures found in ${jdsDir} matching --jd=${onlyJd || '<all>'}`)
  Deno.exit(1)
}

console.log(`\n=== Phase 4 synth eval ===`)
console.log(`Fixtures:  ${jdFiles.length}`)
console.log(`Verbosity: ${verbosity}`)
console.log(`Provider:  ${provider}\n`)

const stampDir = `${resultsDir}/phase4-synth-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)}`
await Deno.mkdir(stampDir, { recursive: true })

const summary: Array<Record<string, unknown>> = []

for (let i = 0; i < jdFiles.length; i++) {
  const jdFile = jdFiles[i]
  const jdId   = jdFile.split('-')[0]
  const jdText = await Deno.readTextFile(`${jdsDir}/${jdFile}`)
  console.log(`[${i + 1}/${jdFiles.length}] ${jdFile}  (${jdText.length} chars)`)

  // Pass 1 ───────────────────────────────────────────────────────────────
  const t1 = performance.now()
  const exRes = await retryFn('analyse-jd', { jd_text: jdText, candidate_context: candidateContext, provider })
  const exMs  = Math.round(performance.now() - t1)
  if (exRes.error) { console.log(`  analyse-jd FAILED: ${exRes.error}`); continue }
  const extraction = exRes.data.analysis

  // Reason + narrate ────────────────────────────────────────────────────
  const t2 = performance.now()
  const rnRes = await retryFn('reason-and-narrate', {
    extraction_json:   extraction,
    candidate_context: candidateContext,
    jd_text:           jdText,
    provider,
    verbosity_mode:    verbosity,
  })
  const rnMs = Math.round(performance.now() - t2)
  if (rnRes.error) { console.log(`  reason-and-narrate FAILED: ${rnRes.error}`); continue }
  const narrative = rnRes.data.narrative

  // Synthesis ──────────────────────────────────────────────────────────
  const meta = {
    role_title:      extraction?.role_title    || null,
    company_name:    extraction?.company_name  || null,
    location:        extraction?.location      || null,
    work_model:      extraction?.remote_model  || null,
    engagement_type: extraction?.engagement_type || null,
    salary:          extraction?.salary_annual || null,
    ir35:            extraction?.ir35_status   || null,
  }
  const t3 = performance.now()
  const synRes = await retryFn('synthesise-chat-read', {
    narrative,
    extraction,
    meta,
    candidate_context: candidateContext,
    provider,
    verbosity_mode:    verbosity,
  })
  const synMs = Math.round(performance.now() - t3)

  if (synRes.error) {
    console.log(`  synthesise-chat-read FAILED: ${synRes.error}`)
    summary.push({ jd: jdFile, status: 'failed', error: synRes.error })
    await sleep(3000)
    continue
  }

  const turns = synRes.data?.chat_read?.turns || []
  const heuristics = analyseTone(turns)

  console.log(`  OK  pass1=${exMs}ms  rn=${rnMs}ms  synth=${synMs}ms  turns=${turns.length}  words=${heuristics.totalWords}  flags=${heuristics.flags.join(',') || 'clean'}`)

  await Deno.writeTextFile(`${stampDir}/${jdId}.json`, JSON.stringify({
    jd:        jdFile,
    verbosity,
    latency_ms: { analyse_jd: exMs, reason_and_narrate: rnMs, synth: synMs },
    meta,
    chat_read: { turns },
    heuristics,
    usage:     synRes.data?.usage || null,
    canonical: { extraction, narrative },
  }, null, 2))

  summary.push({
    jd:               jdFile,
    status:           'ok',
    turns:            turns.length,
    total_words:      heuristics.totalWords,
    bullets_turns:    heuristics.bulletsTurnCount,
    flags:            heuristics.flags,
    leads_with_pos:   heuristics.leadsWithPositive,
    leads_with_caut:  heuristics.leadsWithCaution,
    synth_ms:         synMs,
  })

  // Anti-burst: 5s sleep between fixtures.
  if (i < jdFiles.length - 1) await sleep(5000)
}

await Deno.writeTextFile(`${stampDir}/_summary.json`, JSON.stringify({
  ran_at:    new Date().toISOString(),
  verbosity,
  fixtures:  summary,
}, null, 2))

console.log(`\n=== SUMMARY ===`)
console.log(`Wrote ${summary.length} fixture results to:`)
console.log(`  ${stampDir}`)
console.log(`\nQuick stats:`)
const ok = summary.filter(s => s.status === 'ok')
console.log(`  OK:                  ${ok.length}/${summary.length}`)
console.log(`  Avg turns:           ${(ok.reduce((a, s) => a + (s.turns as number || 0), 0) / Math.max(ok.length, 1)).toFixed(1)}`)
console.log(`  Avg total words:     ${(ok.reduce((a, s) => a + (s.total_words as number || 0), 0) / Math.max(ok.length, 1)).toFixed(0)}`)
console.log(`  Avg synth latency:   ${(ok.reduce((a, s) => a + (s.synth_ms as number || 0), 0) / Math.max(ok.length, 1)).toFixed(0)}ms`)
const flaggedCount = ok.filter(s => Array.isArray(s.flags) && (s.flags as string[]).length).length
console.log(`  Fixtures with flags: ${flaggedCount}/${ok.length}`)
console.log(`\nReview each ${stampDir}/<id>.json for the actual chat_read prose.`)

// ── Helpers ──────────────────────────────────────────────────────────────

function analyseTone(turns: Array<Record<string, unknown>>) {
  let totalWords = 0
  let bulletsTurnCount = 0
  const flags: string[] = []
  const firstTurn = turns[0]
  const firstText = (firstTurn?.type === 'p' ? String(firstTurn.text || '')
                   : firstTurn?.type === 'bullets' ? String(firstTurn.lead || '') : '').toLowerCase()
  const positiveLeadHints = ['strongest signal', 'cleanest brief', 'genuinely', 'good sign', 'reads exactly', 'rare', 'best-in-class', 'sharp brief']
  const cautionLeadHints  = ['watchout', 'concern', 'gap', 'missing', 'no salary', 'biggest thing i\'d', 'careful about', 'would want to know']
  const leadsWithPositive = positiveLeadHints.some(h => firstText.includes(h))
  const leadsWithCaution  = cautionLeadHints.some(h => firstText.includes(h))

  // Joined text for scans
  const joined = turns.map(t => {
    if (t.type === 'p')       return String(t.text || '')
    if (t.type === 'bullets') return [String(t.lead || ''), ...((t.items as string[]) || [])].join(' ')
    return ''
  }).join(' ')

  totalWords = joined.split(/\s+/).filter(Boolean).length
  bulletsTurnCount = turns.filter(t => t.type === 'bullets').length

  // Heuristic flags
  if (/—/.test(joined))                             flags.push('em-dash')
  if (/\b(chafe|chafes|struggles|hates|won't cope|can't cope)\b/i.test(joined)) flags.push('candidate-pejorative')
  if (/\b(fit[_ ]reality|risks_and_unknowns|recommended[_ ]cv|why[_ ]that[_ ]cv|practical[_ ]details)\b/i.test(joined)) flags.push('leaked-schema-name')
  if (/\b(apply (now|today|to this)|definitely (apply|skip)|don't (bother|apply))\b/i.test(joined)) flags.push('verdict-imperative')
  if (bulletsTurnCount > 1)                         flags.push('multiple-bullet-turns')
  if (turns.length < 3)                             flags.push('too-few-turns')
  if (turns.length > 7)                             flags.push('too-many-turns')
  if (totalWords < 80)                              flags.push('too-short')
  if (totalWords > 380)                             flags.push('too-long')

  return { totalWords, bulletsTurnCount, flags, leadsWithPositive, leadsWithCaution }
}

async function retryFn(slug: string, body: unknown, attempts = 2): Promise<{ data?: any; error?: string }> {
  let lastErr = ''
  for (let i = 0; i <= attempts; i++) {
    const res = await invokeFunction(slug, body)
    if (!res.error) return res
    lastErr = res.error
    if (/429|rate limit|try again in (\d+)s/i.test(res.error)) {
      const m = res.error.match(/try again in (\d+)s/i)
      const waitS = m ? parseInt(m[1], 10) + 2 : (10 * (i + 1))
      console.log(`  ${slug} 429, retrying in ${waitS}s ...`)
      await sleep(waitS * 1000)
      continue
    }
    if (i < attempts) {
      await sleep(2000 * (i + 1))
      continue
    }
  }
  return { error: lastErr }
}

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

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
