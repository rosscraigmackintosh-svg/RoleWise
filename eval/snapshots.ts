// =============================================================================
// snapshots.ts — Structural regression assertions for the eval harness.
//
// These are NOT string-match assertions against frozen outputs. They check
// structural properties that should hold across rewrites:
//   - defining-signal appears in the narrative (when the JD contains one)
//   - startup hallucination absent (when the JD describes a mature company)
//   - operational nouns present (when the JD provides them)
//   - banned filler phrases absent
//   - grounded-bullets threshold met
//   - hallucination-discipline rules respected
//
// The expectations live in SNAPSHOTS below, keyed by JD id. Each assertion
// returns { name, passed, detail } and the runner emits a markdown report.
//
// Usage:
//   deno run --allow-read snapshots.ts            // run against existing results/
//   deno run --allow-read snapshots.ts > snapshots-report.md
// =============================================================================

type Provider = 'anthropic' | 'openai'

interface RunResult {
  jd_id:     string
  provider:  Provider
  narrative: Narrative | null
  errors:    string[]
}

interface Narrative {
  fit_reality?:                    { paragraphs?: string[] }
  what_this_role_actually_is?:     { paragraphs?: string[] }
  what_they_really_need_from_you?: { paragraphs?: string[]; bullets?: string[] }
  what_you_would_actually_do?:     { framing?: string; bullets?: string[] }
  practical_details?:              { items?: Array<{ label: string; value: string }> }
  risks_and_unknowns?:             { stated_intro?: string; stated?: string[]; inferred?: string[] }
  questions_worth_asking?:         string[]
  decision?:                       { summary?: string }
  recommended_cv?:                 string
  why_that_cv?:                    string
}

type Check = (n: Narrative) => { passed: boolean; detail?: string }

interface Snapshot {
  description: string
  checks:      Record<string, Check>
}

// ─── Reusable check builders ─────────────────────────────────────────────────

const all = (n: Narrative): string =>
  JSON.stringify(n).replace(/[\{\}\[\]"]/g, ' ').toLowerCase()

const section = (n: Narrative, key: keyof Narrative): string => {
  const v = n[key]
  if (!v) return ''
  return JSON.stringify(v).replace(/[\{\}\[\]"]/g, ' ').toLowerCase()
}

const allBullets = (n: Narrative): string[] => [
  ...(n.what_they_really_need_from_you?.bullets ?? []),
  ...(n.what_you_would_actually_do?.bullets ?? []),
]

const definingSignalAppears = (phrases: string[]): Check => (n) => {
  const text = all(n)
  const hits = phrases.filter(p => text.includes(p.toLowerCase()))
  return {
    passed: hits.length > 0,
    detail: hits.length ? `found: ${hits.join(', ')}` : `missing all of: ${phrases.join(', ')}`,
  }
}

const startupFramingAbsent = (): Check => (n) => {
  // Allowed everywhere only when the JD self-identifies. For the mature-company
  // JDs in our set, the JD does NOT self-identify, so all variants should be absent.
  const banned = [
    'startup', 'scale-up', 'scaleup', 'early-stage', 'early stage',
    'startup context', 'startup-style', 'startup-like', 'startup feel',
    'within a startup', 'scale-up environment',
  ]
  const text = all(n)
  const hits = banned.filter(b => text.includes(b))
  return {
    passed: hits.length === 0,
    detail: hits.length ? `leaked: ${hits.join(', ')}` : 'clean',
  }
}

const operationalNounsPresent = (nouns: string[], minCount = 2): Check => (n) => {
  const text = all(n)
  const hits = nouns.filter(noun => text.includes(noun.toLowerCase()))
  return {
    passed: hits.length >= minCount,
    detail: `${hits.length}/${nouns.length} present (need ≥${minCount}): ${hits.join(', ')}`,
  }
}

const bannedFillerAbsent = (phrases: string[]): Check => (n) => {
  const text = all(n)
  const hits = phrases.filter(p => text.includes(p.toLowerCase()))
  return {
    passed: hits.length === 0,
    detail: hits.length ? `leaked: ${hits.join(', ')}` : 'clean',
  }
}

const groundedBulletsThreshold = (nouns: string[], minPct: number): Check => (n) => {
  const bullets = allBullets(n)
  if (!bullets.length) return { passed: false, detail: 'no bullets' }
  const grounded = bullets.filter(b => {
    const lower = b.toLowerCase()
    return nouns.some(noun => lower.includes(noun.toLowerCase()))
  })
  const pct = grounded.length / bullets.length
  return {
    passed: pct >= minPct,
    detail: `${grounded.length}/${bullets.length} (${(pct * 100).toFixed(0)}%) grounded, need ≥${(minPct * 100).toFixed(0)}%`,
  }
}

const sectionPresent = (key: keyof Narrative, minLength = 1): Check => (n) => {
  const text = section(n, key).trim()
  return {
    passed: text.length >= minLength,
    detail: text.length ? `${text.length} chars` : 'empty / missing',
  }
}

const ambiguityHedgingAbsent = (): Check => (n) => {
  const text = all(n)
  const banned = [
    'scope is ambiguous', 'details are limited', 'the exact nature of the role remains unclear',
    'it is hard to tell',
  ]
  const hits = banned.filter(b => text.includes(b))
  return {
    passed: hits.length === 0,
    detail: hits.length ? `leaked: ${hits.join(', ')}` : 'clean',
  }
}

const inventedDysfunctionAbsent = (): Check => (n) => {
  const text = all(n)
  const banned = [
    'product clarity challenges', 'strategic ambiguity', 'unclear product direction',
    'product confusion', 'strategic dysfunction', 'leadership instability',
    'ambiguity in product direction', 'lack of structure',
  ]
  const hits = banned.filter(b => text.includes(b))
  return {
    passed: hits.length === 0,
    detail: hits.length ? `leaked: ${hits.join(', ')}` : 'clean',
  }
}

const risksStartupGate = (): Check => (n) => {
  // Inside risks_and_unknowns, startup/scale-up framing must not appear at all
  // for the mature-company JDs in our set.
  const risks = section(n, 'risks_and_unknowns')
  const banned = ['startup', 'scale-up', 'scaleup', 'early-stage', 'early stage']
  const hits = banned.filter(b => risks.includes(b))
  return {
    passed: hits.length === 0,
    detail: hits.length ? `leaked in risks: ${hits.join(', ')}` : 'risks clean of startup framing',
  }
}

// ─── Snapshot definitions (5 canonical JDs) ──────────────────────────────────

const SNAPSHOTS: Record<string, Snapshot> = {
  '01-enterprise-transformation': {
    description: 'Medius — mature enterprise transformation role',
    checks: {
      'defining signal (UX overhaul / transformation)':
        definingSignalAppears(['ux overhaul', 'ux/ui overhaul', 'transformation', 'modernise', 'unify']),
      'no startup framing':            startupFramingAbsent(),
      'risks startup gate':            risksStartupGate(),
      'operational nouns present':     operationalNounsPresent(
        ['accounts payable', 'spend management', 'design system', 'gpms', 'squads', 'roadmap', 'cross-squad'], 3),
      'banned filler absent':          bannedFillerAbsent([
        'design excellence', 'innovative technology', 'product improvements', 'impactful initiatives',
      ]),
      'bullets grounded ≥60%':         groundedBulletsThreshold(
        ['accounts payable', 'spend management', 'workflow', 'design system', 'squad', 'roadmap',
         'product group', 'transformation', 'overhaul', 'consistency'], 0.60),
      'invented dysfunction absent':   inventedDysfunctionAbsent(),
      'fit_reality present':           sectionPresent('fit_reality', 50),
      'what_this_role_actually_is present': sectionPresent('what_this_role_actually_is', 80),
    },
  },

  '04-ai-heavy-saas': {
    description: 'Loom Copilot — AI-native staff IC',
    checks: {
      'defining signal (copilot/AI surface)':
        definingSignalAppears(['copilot', 'agent', 'invocation', 'ai surface', 'ai-native']),
      'no startup framing':            startupFramingAbsent(),
      'risks startup gate':            risksStartupGate(),
      'operational nouns present':     operationalNounsPresent(
        ['copilot', 'agent', 'invocation surface', 'trust', 'permission', 'undo', 'model behaviour', 'model behavior'], 3),
      'banned filler absent':          bannedFillerAbsent([
        'design excellence', 'innovative technology', 'product improvements',
      ]),
      'bullets grounded ≥50%':         groundedBulletsThreshold(
        ['copilot', 'agent', 'invocation', 'trust', 'permission', 'undo', 'escalation',
         'model behaviour', 'model behavior', 'ml team', 'ml researcher', 'activation flow'], 0.50),
      'ambiguity hedging absent':      ambiguityHedgingAbsent(),
      'invented dysfunction absent':   inventedDysfunctionAbsent(),
      'fit_reality present':           sectionPresent('fit_reality', 50),
    },
  },

  '03-ambiguous-recruiter': {
    description: 'Vague recruiter post — must NOT manufacture detail',
    checks: {
      // Recruiter posts are intentionally vague. The narrative should call this out.
      'risks include recruiter / unnamed employer concern': (n) => {
        const risks = section(n, 'risks_and_unknowns')
        const hits = ['recruiter', 'unnamed', 'confidential', 'unclear employer', 'not named'].filter(p => risks.includes(p))
        return { passed: hits.length > 0, detail: hits.length ? `signals: ${hits.join(', ')}` : 'no recruiter caveat surfaced' }
      },
      'no startup framing':            startupFramingAbsent(),
      'invented dysfunction absent':   inventedDysfunctionAbsent(),
      // The role does NOT have a defining signal — the narrative should not invent one.
      // We expect grounded-bullets to be lower here. No threshold check.
      'banned filler absent':          bannedFillerAbsent([
        'design excellence', 'innovative technology', 'evolving product vision',
      ]),
      'fit_reality present':           sectionPresent('fit_reality', 50),
    },
  },

  '02-founder-zero-to-one': {
    description: 'Verra Series A — founding designer, zero-to-one',
    checks: {
      // This IS a Series A startup — startup framing is ALLOWED here, only check
      // that the JD-self-identification path is used (the JD literally calls itself
      // a Series A startup). So we do NOT run startupFramingAbsent here.
      'defining signal (founding / zero-to-one)':
        definingSignalAppears(['founding', 'first designer', 'zero-to-one', 'zero to one', 'series a']),
      'operational nouns present':     operationalNounsPresent(
        ['activation', 'agent', 'design system', 'product surface', 'onboarding', 'demo'], 2),
      'ambiguity hedging absent':      ambiguityHedgingAbsent(),
      'fit_reality present':           sectionPresent('fit_reality', 50),
      'what_this_role_actually_is present': sectionPresent('what_this_role_actually_is', 80),
    },
  },

  '05-platform-modernisation': {
    description: 'Sage — mature platform-modernisation programme',
    checks: {
      'defining signal (platform unification / modernisation)':
        definingSignalAppears(['platform unification', 'unify', 'modernise', 'modernisation', 'navigation model', 'information architecture']),
      'no startup framing':            startupFramingAbsent(),
      'risks startup gate':            risksStartupGate(),
      'operational nouns present':     operationalNounsPresent(
        ['navigation', 'information architecture', 'design system', 'migration', 'platform', 'transformation'], 3),
      'banned filler absent':          bannedFillerAbsent([
        'design excellence', 'innovative technology', 'evolving product vision', 'impactful initiatives',
      ]),
      'invented dysfunction absent':   inventedDysfunctionAbsent(),
      'fit_reality present':           sectionPresent('fit_reality', 50),
    },
  },
}

// ─── Runner ──────────────────────────────────────────────────────────────────

const evalDir    = new URL('.', import.meta.url).pathname
const resultsDir = `${evalDir}results`

const PROVIDERS: Provider[] = ['openai', 'anthropic']

interface ProviderResult { passed: number; failed: number; rows: string[] }
const byProvider: Record<Provider, ProviderResult> = {
  openai:    { passed: 0, failed: 0, rows: [] },
  anthropic: { passed: 0, failed: 0, rows: [] },
}

console.log('# Regression snapshot report')
console.log(`Generated: ${new Date().toISOString()}`)
console.log()

for (const jdId of Object.keys(SNAPSHOTS).sort()) {
  const snap = SNAPSHOTS[jdId]
  console.log(`## ${jdId} — ${snap.description}`)
  console.log()
  console.log('| Check | OpenAI | Anthropic |')
  console.log('|---|---|---|')

  for (const checkName of Object.keys(snap.checks)) {
    const row: string[] = [`\`${checkName}\``]
    for (const provider of PROVIDERS) {
      const result = loadResult(jdId, provider)
      if (!result || !result.narrative) {
        row.push('— (no run)')
        continue
      }
      const { passed, detail } = snap.checks[checkName](result.narrative)
      byProvider[provider][passed ? 'passed' : 'failed']++
      row.push(passed ? `✅` : `❌ ${detail ?? ''}`.trim())
    }
    console.log(`| ${row.join(' | ')} |`)
  }
  console.log()
}

// Summary
console.log('## Summary')
console.log()
console.log('| Provider | Passed | Failed | Pass rate |')
console.log('|---|---|---|---|')
for (const p of PROVIDERS) {
  const r = byProvider[p]
  const total = r.passed + r.failed
  const pct = total ? ((r.passed / total) * 100).toFixed(1) : '—'
  console.log(`| ${p} | ${r.passed} | ${r.failed} | ${pct}% |`)
}

// Exit non-zero if any failures (useful in CI)
const totalFailures = byProvider.openai.failed + byProvider.anthropic.failed
Deno.exit(totalFailures > 0 ? 1 : 0)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadResult(jdId: string, provider: Provider): RunResult | null {
  const path = `${resultsDir}/${jdId}/${provider}.json`
  try {
    const text = Deno.readTextFileSync(path)
    return JSON.parse(text) as RunResult
  } catch {
    return null
  }
}
