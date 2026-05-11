// =============================================================================
// run.ts — Evaluation runner for the Rolewise narrative prompts.
//
// For each JD in jds/, calls analyse-jd + generate-narrative for both providers
// (anthropic, openai) and stores results under results/{jd-id}/{provider}.json.
//
// Usage:
//   deno run --allow-net --allow-read --allow-write run.ts
//   deno run --allow-net --allow-read --allow-write run.ts --only=04          # one JD
//   deno run --allow-net --allow-read --allow-write run.ts --provider=openai  # one provider
// =============================================================================

const SUPABASE_URL      = 'https://peuaflazxvkkbpbhhjtu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWFmbGF6eHZra2JwYmhoanR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE1NzgsImV4cCI6MjA4ODIxNzU3OH0.AZhesVch4DgVL_VRPQor_MWGx7EyGtS47D_hKRkFkSw'

type Provider = 'anthropic' | 'openai'

interface RunResult {
  jd_id:           string
  provider:        Provider
  extraction:      unknown
  extraction_usage: unknown
  narrative:       unknown
  narrative_usage: unknown
  errors:          string[]
  latency_ms: {
    extraction:    number
    narrative:     number
    total:         number
  }
}

const args = parseArgs(Deno.args)
const onlyJd = args.only as string | undefined
const onlyProvider = args.provider as Provider | undefined

const evalDir = new URL('.', import.meta.url).pathname
const jdsDir = `${evalDir}jds`
const resultsDir = `${evalDir}results`
const candidateContextPath = `${evalDir}candidate-context.json`

const candidateContext = JSON.parse(await Deno.readTextFile(candidateContextPath))

// Discover JDs
const jdFiles = []
for await (const entry of Deno.readDir(jdsDir)) {
  if (entry.isFile && entry.name.endsWith('.txt')) jdFiles.push(entry.name)
}
jdFiles.sort()

const providers: Provider[] = onlyProvider ? [onlyProvider] : ['anthropic', 'openai']

console.log(`Eval run: ${jdFiles.length} JDs × ${providers.length} providers = ${jdFiles.length * providers.length} runs`)
console.log(`Filter: jd=${onlyJd || 'all'} provider=${onlyProvider || 'all'}\n`)

for (const jdFile of jdFiles) {
  const jdId = jdFile.replace(/\.txt$/, '')
  if (onlyJd && !jdId.startsWith(onlyJd)) continue

  const jdText = await Deno.readTextFile(`${jdsDir}/${jdFile}`)

  for (const provider of providers) {
    const outDir = `${resultsDir}/${jdId}`
    await Deno.mkdir(outDir, { recursive: true })
    const outPath = `${outDir}/${provider}.json`

    console.log(`[${jdId} · ${provider}] running…`)
    const result = await runOne(jdId, jdText, provider)
    await Deno.writeTextFile(outPath, JSON.stringify(result, null, 2))
    const status = result.errors.length ? `FAIL (${result.errors.length} errors)` : 'OK'
    console.log(`  ${status} · ${result.latency_ms.total}ms total · → ${outPath}`)
  }
}

console.log('\nDone.')

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function runOne(jdId: string, jdText: string, provider: Provider): Promise<RunResult> {
  const result: RunResult = {
    jd_id:             jdId,
    provider,
    extraction:        null,
    extraction_usage:  null,
    narrative:         null,
    narrative_usage:   null,
    errors:            [],
    latency_ms:        { extraction: 0, narrative: 0, total: 0 },
  }
  const t0 = performance.now()

  // ── Pass 1: analyse-jd ──
  const t1 = performance.now()
  const extractRes = await invokeFunction('analyse-jd', {
    jd_text:           jdText,
    candidate_context: candidateContext,
    provider,
  })
  result.latency_ms.extraction = Math.round(performance.now() - t1)

  if (extractRes.error) {
    result.errors.push(`analyse-jd: ${extractRes.error}`)
    result.latency_ms.total = Math.round(performance.now() - t0)
    return result
  }

  result.extraction       = extractRes.data?.analysis ?? null
  result.extraction_usage = extractRes.data?.usage    ?? null

  // ── Pass 2: generate-narrative ──
  const t2 = performance.now()
  const narrRes = await invokeFunction('generate-narrative', {
    extraction_json:   result.extraction,
    candidate_context: candidateContext,
    provider,
  })
  result.latency_ms.narrative = Math.round(performance.now() - t2)

  if (narrRes.error) {
    result.errors.push(`generate-narrative: ${narrRes.error}`)
  } else {
    result.narrative       = narrRes.data?.narrative ?? null
    result.narrative_usage = narrRes.data?.usage     ?? null
  }

  result.latency_ms.total = Math.round(performance.now() - t0)
  return result
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
    return { error: (e as Error).message }
  }
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) out[m[1]] = m[2] ?? true
  }
  return out
}
