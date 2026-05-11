// =============================================================================
// analyze.ts — Metrics analyser for Rolewise narrative eval results.
//
// Reads results/{jd-id}/{provider}.json files produced by run.ts and emits a
// comparison report measuring:
//   - filler-phrase frequency
//   - weak verb frequency
//   - abstract noun frequency
//   - hedging word frequency
//   - average sentence length
//   - % of bullets containing a concrete JD noun
//   - operational noun density per section
//
// Output: markdown report to stdout. Pipe to a file to save.
//
// Usage:
//   deno run --allow-read analyze.ts
//   deno run --allow-read analyze.ts > report.md
// =============================================================================

type Provider = 'anthropic' | 'openai'

interface RunResult {
  jd_id:           string
  provider:        Provider
  extraction:      unknown
  narrative:       Narrative | null
  errors:          string[]
  latency_ms:      { extraction: number; narrative: number; total: number }
}

interface Narrative {
  fit_reality?:                 { paragraphs?: string[] }
  what_this_role_actually_is?:  { paragraphs?: string[] }
  what_they_really_need_from_you?: { paragraphs?: string[]; bullets?: string[] }
  what_you_would_actually_do?:  { framing?: string; bullets?: string[] }
  practical_details?:           { items?: Array<{ label: string; value: string }> }
  risks_and_unknowns?:          { stated_intro?: string; stated?: string[]; inferred?: string[] }
  questions_worth_asking?:      string[]
  decision?:                    { summary?: string }
  recommended_cv?:              string
  why_that_cv?:                 string
}

// ─── Pattern dictionaries ────────────────────────────────────────────────────

const FILLER_PHRASES = [
  'focused on', 'centered on', 'centered around', 'helping improve', 'involved in',
  'engage in', 'engaging in', 'aimed at', 'positioned within', 'situated within',
  'through innovative technology', 'significant redesign', 'this is a design role',
  'this role focuses on', 'this position', 'the role centers',
  'support product iteration', 'various operational activities',
  'the role likely involves', 'the position is situated within',
  'the company focuses on', 'this role is centered on', 'this position emphasizes',
]

const WEAK_VERBS = [
  'engage', 'support', 'improve', 'help', 'helps', 'contribute', 'contributing',
  'collaborate on', 'collaborating on', 'enhance', 'enhancing',
]

const ABSTRACT_NOUNS = [
  'product improvements', 'innovative technology', 'impactful initiatives',
  'design enhancements', 'strategic collaboration', 'evolving experiences',
  'design clarity', 'product clarity', 'stakeholder overhead', 'design excellence',
  'improve user interactions', 'user-centered innovations', 'enhanced experiences',
  'strategic initiatives', 'evolving product vision', 'innovative', 'seamless',
  'transformational', 'product improvements', 'design improvements',
]

const HEDGING_WORDS = [
  'likely', 'appears to', 'seems to', 'probably', 'perhaps', 'might be',
  'arguably', 'potentially',
]

// Factual-discipline failure patterns. Counts in this category indicate
// hallucination risk — invented ambiguity, invented dysfunction, mature-company
// misclassification, or unsupported startup framing.
const FACTUAL_LEAKS = {
  invented_ambiguity: [
    'scope is ambiguous', 'details are limited',
    'the exact nature of the role remains unclear', 'it is hard to tell',
  ],
  invented_dysfunction: [
    'product clarity challenges', 'strategic ambiguity', 'unclear product direction',
    'product confusion', 'strategic dysfunction', 'leadership instability',
    'ambiguity in product direction', 'lack of structure',
  ],
  startup_misclassification: [
    'within a startup', 'startup context', 'startup-style', 'startup-like',
    'startup feel', 'in a scale-up environment', 'early-stage feel',
    'company labelled as a startup',
  ],
}

// Operational nouns we consider "concrete". A bullet/sentence counts as grounded
// if it contains ANY of these (case-insensitive substring match).
const CONCRETE_NOUNS = [
  // Finance / ops SaaS
  'accounts payable', 'spend management', 'ap automation', 'onboarding flow',
  'roadmap', 'enterprise finance', 'workflow', 'reconciliation', 'ledger',
  'navigation model', 'information architecture', 'migration path',
  'pension', 'isa', 'retirement', 'wcag', 'safe',
  'customer record', 'customer operations', 'event-history',

  // Design / systems
  'design system', 'design tokens', 'figma', 'token', 'primitive component',
  'token architecture', 'theming model', 'governance',
  'platform-wide', 'design system governance', 'activation surface',
  'retention loop', 'checkout flow', 'billing surface', 'data model',
  'design quality', 'ux consistency', 'cross-product ux', 'pattern library',
  'interaction model', 'interaction pattern',

  // Org / people nouns
  'pms', 'ems', 'gpms', 'researcher', 'squad', 'product group',
  'cross-squad', 'cross-functional', 'engineering leadership',
  'ml team', 'ml researcher', 'product team', 'design lead',
  'product manager', 'engineering manager',

  // AI / copilot domain (added v30)
  'copilot', 'agent', 'agentic', 'invocation surface', 'invocation',
  'trust model', 'permission', 'undo', 'escalation', 'disclosure',
  'steerability', 'steering', 'model behaviour', 'model behavior',
  'model spec', 'uncertainty', 'async video', 'summarisation',
  'summarization', 'agent layer', 'on-behalf-of', 'permission flow',

  // Generic product surfaces
  'mobile app', 'user journey', 'product surface', 'platform surface',
  'workspace', 'dashboard', 'admin surface', 'internal tool',
]

// ─── Metric types (declared before use because of TDZ) ──────────────────────

interface Metrics {
  fillerCount:        number
  weakVerbCount:      number
  abstractNounCount:  number
  hedgingCount:       number
  avgSentenceLen:     number
  bulletsGroundedPct: number
  nounDensity:        number
}

const LABEL: Record<keyof Metrics, string> = {
  fillerCount:        'Filler phrases (lower better)',
  weakVerbCount:      'Weak verbs (lower better)',
  abstractNounCount:  'Abstract nouns (lower better)',
  hedgingCount:       'Hedging words (lower better)',
  avgSentenceLen:     'Avg sentence length (chars)',
  bulletsGroundedPct: '% bullets with concrete noun',
  nounDensity:        'Concrete nouns per 100 words',
}

// ─── Main ────────────────────────────────────────────────────────────────────

const evalDir    = new URL('.', import.meta.url).pathname
const resultsDir = `${evalDir}results`

const byJd = new Map<string, Map<Provider, RunResult>>()

for await (const jdEntry of Deno.readDir(resultsDir)) {
  if (!jdEntry.isDirectory) continue
  const jdId   = jdEntry.name
  const jdMap  = new Map<Provider, RunResult>()
  byJd.set(jdId, jdMap)

  for await (const fileEntry of Deno.readDir(`${resultsDir}/${jdId}`)) {
    if (!fileEntry.isFile || !fileEntry.name.endsWith('.json')) continue
    const provider = fileEntry.name.replace(/\.json$/, '') as Provider
    const text     = await Deno.readTextFile(`${resultsDir}/${jdId}/${fileEntry.name}`)
    jdMap.set(provider, JSON.parse(text))
  }
}

const sortedJdIds = [...byJd.keys()].sort()

// ─── Report ──────────────────────────────────────────────────────────────────

console.log('# Rolewise Narrative Eval Report')
console.log(`Generated: ${new Date().toISOString()}`)
console.log(`JDs analysed: ${sortedJdIds.length}`)
console.log()

// Per-JD per-provider summary
console.log('## Per-JD metrics')
console.log()
console.log('| JD | Provider | Filler | Weak verbs | Abstract nouns | Hedging | Avg sent len | % bullets grounded | Noun density | Latency |')
console.log('|---|---|---|---|---|---|---|---|---|---|')

const aggregate: Record<Provider, Metrics[]> = { anthropic: [], openai: [] }

for (const jdId of sortedJdIds) {
  const jdMap = byJd.get(jdId)!
  for (const provider of ['anthropic', 'openai'] as Provider[]) {
    const result = jdMap.get(provider)
    if (!result) continue
    if (!result.narrative) {
      console.log(`| ${jdId} | ${provider} | — | — | — | — | — | — | — | ${result.latency_ms.total}ms (errors: ${result.errors.length}) |`)
      continue
    }
    const m = computeMetrics(result.narrative)
    aggregate[provider].push(m)
    console.log(
      `| ${jdId} | ${provider} | ${m.fillerCount} | ${m.weakVerbCount} | ${m.abstractNounCount} | ${m.hedgingCount} | ${m.avgSentenceLen.toFixed(1)} | ${(m.bulletsGroundedPct * 100).toFixed(0)}% | ${m.nounDensity.toFixed(2)} | ${result.latency_ms.total}ms |`
    )
  }
}

// Aggregate summary
console.log()
console.log('## Aggregate by provider')
console.log()
console.log('| Metric | Anthropic | OpenAI | Δ |')
console.log('|---|---|---|---|')
for (const key of ['fillerCount','weakVerbCount','abstractNounCount','hedgingCount','avgSentenceLen','bulletsGroundedPct','nounDensity'] as (keyof Metrics)[]) {
  const a = mean(aggregate.anthropic.map(x => x[key] as number))
  const o = mean(aggregate.openai.map(x    => x[key] as number))
  const label = LABEL[key]
  const delta = o - a
  const arrow = key === 'bulletsGroundedPct' || key === 'nounDensity'
    ? (delta > 0 ? '↑ openai better' : delta < 0 ? '↓ openai worse' : '=')
    : (delta < 0 ? '↓ openai better' : delta > 0 ? '↑ openai worse' : '=')
  console.log(`| ${label} | ${a.toFixed(2)} | ${o.toFixed(2)} | ${delta.toFixed(2)} ${arrow} |`)
}

// Top-offender phrases
console.log()
console.log('## Top filler/abstract phrases observed (across all outputs)')
console.log()
const phraseCounts = new Map<string, { anthropic: number; openai: number }>()
for (const jdId of sortedJdIds) {
  const jdMap = byJd.get(jdId)!
  for (const provider of ['anthropic', 'openai'] as Provider[]) {
    const result = jdMap.get(provider)
    if (!result?.narrative) continue
    const text = allText(result.narrative).toLowerCase()
    for (const phrase of [...FILLER_PHRASES, ...ABSTRACT_NOUNS, ...HEDGING_WORDS]) {
      const re = new RegExp(`\\b${escapeRegExp(phrase.toLowerCase())}\\b`, 'g')
      const matches = text.match(re)
      if (matches?.length) {
        const cur = phraseCounts.get(phrase) ?? { anthropic: 0, openai: 0 }
        cur[provider] += matches.length
        phraseCounts.set(phrase, cur)
      }
    }
  }
}
const ranked = [...phraseCounts.entries()].sort(
  (a, b) => (b[1].anthropic + b[1].openai) - (a[1].anthropic + a[1].openai)
).slice(0, 20)
console.log('| Phrase | Anthropic | OpenAI |')
console.log('|---|---|---|')
for (const [phrase, counts] of ranked) {
  console.log(`| \`${phrase}\` | ${counts.anthropic} | ${counts.openai} |`)
}

// ─── Metrics by category (Factual discipline vs Editorial quality) ──────────
console.log()
console.log('## Metrics by category')
console.log()
console.log('Two categories — *Factual discipline* tracks hallucination risk; *Editorial quality* tracks writing density.')
console.log()
console.log('### A. Factual discipline (lower = better)')
console.log()
console.log('| Metric | Anthropic | OpenAI |')
console.log('|---|---|---|')

const factualSums: Record<string, Record<Provider, number>> = {}
for (const cat of Object.keys(FACTUAL_LEAKS) as (keyof typeof FACTUAL_LEAKS)[]) {
  factualSums[cat] = { anthropic: 0, openai: 0 }
  for (const jdId of sortedJdIds) {
    const jdMap = byJd.get(jdId)!
    for (const provider of ['anthropic', 'openai'] as Provider[]) {
      const r = jdMap.get(provider)
      if (!r?.narrative) continue
      const text = allText(r.narrative).toLowerCase()
      factualSums[cat][provider] += countPhrases(text, FACTUAL_LEAKS[cat])
    }
  }
}
const factualLabels: Record<string, string> = {
  invented_ambiguity:        'Invented ambiguity (banned hedge phrases)',
  invented_dysfunction:      'Invented dysfunction (banned dysfunction phrases)',
  startup_misclassification: 'Startup misclassification (mature company mislabelled)',
}
for (const cat of Object.keys(FACTUAL_LEAKS) as (keyof typeof FACTUAL_LEAKS)[]) {
  console.log(`| ${factualLabels[cat]} | ${factualSums[cat].anthropic} | ${factualSums[cat].openai} |`)
}
const hedgingA = mean(aggregate.anthropic.map(x => x.hedgingCount))
const hedgingO = mean(aggregate.openai.map(x    => x.hedgingCount))
console.log(`| Hedging words (avg per JD) | ${hedgingA.toFixed(2)} | ${hedgingO.toFixed(2)} |`)

console.log()
console.log('### B. Editorial quality')
console.log()
console.log('| Metric | Anthropic | OpenAI | Direction |')
console.log('|---|---|---|---|')
const editorial = [
  { key: 'fillerCount',        label: 'Filler phrases',       lowerBetter: true  },
  { key: 'weakVerbCount',      label: 'Weak verbs',           lowerBetter: true  },
  { key: 'abstractNounCount',  label: 'Abstract nouns',       lowerBetter: true  },
  { key: 'avgSentenceLen',     label: 'Avg sentence length',  lowerBetter: false }, // not lower/higher — context-dependent
  { key: 'bulletsGroundedPct', label: '% bullets grounded',   lowerBetter: false },
  { key: 'nounDensity',        label: 'Concrete nouns / 100w', lowerBetter: false },
] as const
for (const m of editorial) {
  const a = mean(aggregate.anthropic.map(x => x[m.key as keyof Metrics] as number))
  const o = mean(aggregate.openai.map(x    => x[m.key as keyof Metrics] as number))
  const arrow = m.lowerBetter
    ? (o < a ? '↓ openai better' : o > a ? '↑ openai worse' : '=')
    : (m.key === 'avgSentenceLen'
        ? (o === a ? '=' : `delta ${(o - a).toFixed(1)}`)
        : (o > a ? '↑ openai better' : o < a ? '↓ openai worse' : '='))
  console.log(`| ${m.label} | ${a.toFixed(2)} | ${o.toFixed(2)} | ${arrow} |`)
}

// ─── Per-section noun density ────────────────────────────────────────────────
console.log()
console.log('## Noun density by section (per provider)')
console.log()
console.log('| Section | Anthropic | OpenAI |')
console.log('|---|---|---|')
const sections = [
  'what_this_role_actually_is',
  'what_they_really_need_from_you',
  'what_you_would_actually_do',
  'fit_reality',
  'decision',
] as const
for (const section of sections) {
  const a = mean(sortedJdIds.flatMap(id => {
    const r = byJd.get(id)?.get('anthropic')
    return r?.narrative ? [sectionNounDensity(r.narrative, section)] : []
  }))
  const o = mean(sortedJdIds.flatMap(id => {
    const r = byJd.get(id)?.get('openai')
    return r?.narrative ? [sectionNounDensity(r.narrative, section)] : []
  }))
  console.log(`| ${section} | ${a.toFixed(2)} | ${o.toFixed(2)} |`)
}

// ─── Metric helpers ──────────────────────────────────────────────────────────

function computeMetrics(narr: Narrative): Metrics {
  const allTxt   = allText(narr).toLowerCase()
  const words    = allTxt.split(/\s+/).filter(Boolean)
  const sents    = allTxt.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
  const bullets  = collectBullets(narr)

  return {
    fillerCount:        countPhrases(allTxt, FILLER_PHRASES),
    weakVerbCount:      countWords(allTxt, WEAK_VERBS),
    abstractNounCount:  countPhrases(allTxt, ABSTRACT_NOUNS),
    hedgingCount:       countPhrases(allTxt, HEDGING_WORDS),
    avgSentenceLen:     sents.length ? mean(sents.map(s => s.length)) : 0,
    bulletsGroundedPct: bullets.length ? bullets.filter(isGrounded).length / bullets.length : 0,
    nounDensity:        words.length ? (countConcreteNouns(allTxt) / words.length) * 100 : 0,
  }
}

function allText(narr: Narrative): string {
  const parts: string[] = []
  for (const k of Object.keys(narr) as (keyof Narrative)[]) {
    const v = narr[k]
    if (v == null) continue
    if (typeof v === 'string') parts.push(v)
    else parts.push(JSON.stringify(v))
  }
  // Strip JSON punctuation so we count words, not braces
  return parts.join(' ').replace(/[\{\}\[\]"]/g, ' ')
}

function collectBullets(narr: Narrative): string[] {
  const b: string[] = []
  if (narr.what_they_really_need_from_you?.bullets) b.push(...narr.what_they_really_need_from_you.bullets)
  if (narr.what_you_would_actually_do?.bullets)     b.push(...narr.what_you_would_actually_do.bullets)
  return b
}

function isGrounded(text: string): boolean {
  const lower = text.toLowerCase()
  return CONCRETE_NOUNS.some(n => lower.includes(n))
}

function sectionNounDensity(narr: Narrative, section: keyof Narrative): number {
  const v = narr[section]
  if (!v) return 0
  const text = (typeof v === 'string' ? v : JSON.stringify(v))
    .replace(/[\{\}\[\]"]/g, ' ')
    .toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return 0
  return (countConcreteNouns(text) / words.length) * 100
}

function countPhrases(text: string, phrases: string[]): number {
  let total = 0
  for (const p of phrases) {
    const re = new RegExp(`\\b${escapeRegExp(p.toLowerCase())}\\b`, 'g')
    total += (text.match(re) ?? []).length
  }
  return total
}

function countWords(text: string, words: string[]): number {
  let total = 0
  for (const w of words) {
    const re = new RegExp(`\\b${escapeRegExp(w.toLowerCase())}\\b`, 'g')
    total += (text.match(re) ?? []).length
  }
  return total
}

function countConcreteNouns(text: string): number {
  let total = 0
  for (const n of CONCRETE_NOUNS) {
    const re = new RegExp(`\\b${escapeRegExp(n.toLowerCase())}\\b`, 'g')
    total += (text.match(re) ?? []).length
  }
  return total
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mean(xs: number[]): number {
  if (!xs.length) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}
