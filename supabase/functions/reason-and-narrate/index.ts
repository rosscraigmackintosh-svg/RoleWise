// =============================================================================
// reason-and-narrate — Combined Pass 1.5 + Pass 2 Edge Function (Fast mode)
//
// Replaces the sequential generate-role-reasoning -> generate-narrative chain
// with a single foreground LLM call. The model performs the editorial
// reasoning INLINE (see INTERNAL_THINKING_BLOCK in prompts/openai.ts) and
// emits the same 11-section narrative JSON the renderer already consumes.
//
// Phase 1 status: deployed in parallel; NOT wired into _runBackgroundPipeline.
// Manual invocation only until Phase 3 eval clears it.
//
// Supports: OpenAI only (gpt-4.1 family). Anthropic deferred until Phase 3+
// eval demonstrates the merged prompt holds quality on that path too.
//
// Deploy: supabase functions deploy reason-and-narrate
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callAI, type AIProvider } from '../_shared/ai-call.ts'
import { OPENAI_SYSTEM_PROMPT, REASON_AND_NARRATE_VERSION } from './prompts/openai.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

// Route-specific override takes precedence so the Fast-mode model can be
// tuned independently of extraction / Deep-mode. Fallback chain:
//   OPENAI_MODEL_REASON_AND_NARRATE -> OPENAI_MODEL -> default.
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL_REASON_AND_NARRATE')
                  || Deno.env.get('OPENAI_MODEL')
                  || 'gpt-4.1'

// JD excerpt cap. The model needs JD language directly to do the reasoning
// work that v8 generate-role-reasoning did upstream. ~4000 chars matches
// the reasoning pass's excerpt window.
const JD_EXCERPT_MAX = 4000

// ─── Candidate context formatter — identical to generate-narrative ──────────
// Keeping the formatter local rather than shared so each edge function can be
// deployed standalone. Source of truth: generate-narrative/index.ts.
function formatCandidateContext(ctx: Record<string, unknown> | null): string {
  if (!ctx || typeof ctx !== 'object') return ''

  const lines: string[] = ['CANDIDATE CONTEXT']
  lines.push('(The reader IS this candidate. The narrative addresses them as "you". Never use the name in output.)')
  lines.push('')

  const id = ctx.identity as Record<string, string> | undefined
  if (id) {
    lines.push('WHO: ' + [id.name, id.seniority, (id.years_experience ? id.years_experience + ' years experience' : null), id.location].filter(Boolean).join(' | '))
  }

  const strengths = ctx.core_strengths as string[] | undefined
  if (Array.isArray(strengths) && strengths.length) {
    lines.push('', 'CORE STRENGTHS:')
    strengths.forEach(s => lines.push('- ' + s))
  }

  const envs = ctx.preferred_environments as string[] | undefined
  if (Array.isArray(envs) && envs.length) {
    lines.push('', 'PREFERRED ENVIRONMENTS:')
    envs.forEach(s => lines.push('- ' + s))
  }

  const wm = ctx.work_model_preference as Record<string, string> | undefined
  if (wm) {
    lines.push('', 'WORK MODEL:')
    if (wm.ideal) lines.push('- Ideal: ' + wm.ideal)
    if (wm.hard_limit) lines.push('- Hard limit: ' + wm.hard_limit)
    if (wm.commute_tolerance) lines.push('- Commute tolerance: ' + wm.commute_tolerance)
    if (wm.location_base) lines.push('- Based in: ' + wm.location_base)
  }

  const blockers = ctx.hard_blockers as string[] | undefined
  if (Array.isArray(blockers) && blockers.length) {
    lines.push('', 'HARD BLOCKERS (automatic skip if any of these apply AND JD evidences them):')
    blockers.forEach(s => lines.push('- ' + s))
  }

  const frictions = ctx.known_frictions as string[] | undefined
  if (Array.isArray(frictions) && frictions.length) {
    lines.push('', 'KNOWN FRICTIONS (not blockers, but recurring problems):')
    frictions.forEach(s => lines.push('- ' + s))
  }

  const cvs = ctx.cv_variants as Array<{ id: string; label: string; best_for: string }> | undefined
  if (Array.isArray(cvs) && cvs.length) {
    lines.push('', 'CV VARIANTS AVAILABLE:')
    cvs.forEach(v => lines.push('- ' + v.label + ' (' + v.id + '): ' + v.best_for))
  }

  const lens = ctx.decision_lens as string[] | undefined
  if (Array.isArray(lens) && lens.length) {
    lines.push('', 'DECISION LENS (how this candidate evaluates roles):')
    lens.forEach(s => lines.push('- ' + s))
  }

  const lb = ctx.learned_behaviour as Record<string, unknown> | undefined
  if (lb && typeof lb === 'object') {
    let hasLearning = false
    const pushHeader = () => { if (!hasLearning) { lines.push('', 'LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true } }

    const pursue = lb.roles_you_pursue as string[] | undefined
    if (Array.isArray(pursue) && pursue.length) {
      pushHeader()
      lines.push('', 'ROLES THIS CANDIDATE TENDS TO PURSUE:')
      pursue.forEach(s => lines.push('- ' + s))
    }
    const skip = lb.roles_you_skip as string[] | undefined
    if (Array.isArray(skip) && skip.length) {
      pushHeader()
      lines.push('', 'ROLES THIS CANDIDATE TENDS TO SKIP:')
      skip.forEach(s => lines.push('- ' + s))
    }
    const success = lb.successful_role_patterns as string[] | undefined
    if (Array.isArray(success) && success.length) {
      pushHeader()
      lines.push('', 'PATTERNS FROM ROLES THAT LED TO POSITIVE OUTCOMES (interview/offer):')
      success.forEach(s => lines.push('- ' + s))
    }
    const blockerPatterns = lb.recurring_blockers as string[] | undefined
    if (Array.isArray(blockerPatterns) && blockerPatterns.length) {
      pushHeader()
      lines.push('', 'RECURRING FRICTION THEMES (from skipped or negative-outcome roles):')
      blockerPatterns.forEach(s => lines.push('- ' + s))
    }
    const frictionP = lb.friction_patterns as string[] | undefined
    if (Array.isArray(frictionP) && frictionP.length) {
      pushHeader()
      lines.push('', 'FRICTION PATTERNS:')
      frictionP.forEach(s => lines.push('- ' + s))
    }
    const cvByType = lb.preferred_cv_by_role_type as Record<string, string> | undefined
    if (cvByType && typeof cvByType === 'object') {
      const cvKeys = Object.keys(cvByType)
      if (cvKeys.length) {
        pushHeader()
        lines.push('', 'CV PREFERENCE BY ROLE TYPE (from past successful applications):')
        cvKeys.forEach(k => lines.push('- ' + k + ': ' + cvByType[k]))
      }
    }
    const total = lb.total_roles_analysed as number | undefined
    if (typeof total === 'number' && total > 0) {
      pushHeader()
      lines.push('', 'DECISION STATS: ' + total + ' roles analysed, '
        + ((lb.total_applied as number) || 0) + ' applied, '
        + ((lb.total_skipped as number) || 0) + ' skipped, '
        + ((lb.total_interviewed as number) || 0) + ' reached interview, '
        + ((lb.total_offered as number) || 0) + ' received offers')
    }
  }

  return lines.join('\n')
}

// ─── Required keys (validator) ───────────────────────────────────────────────
const REQUIRED_KEYS = [
  'fit_reality', 'what_this_role_actually_is', 'what_they_really_need_from_you',
  'what_you_would_actually_do', 'practical_details', 'risks_and_unknowns',
  'questions_worth_asking', 'decision', 'recommended_cv', 'why_that_cv', 'final_note',
]

// ─── CV tier cap (deterministic post-process) ────────────────────────────────
// The model's CV recommendation is unreliable when the candidate's CV `best_for`
// description contains scope language that conflicts with the role's title tier
// (e.g. Principal best_for says "Enterprise IC roles inside complex operational
// SaaS" — the model then picks Principal for any complex enterprise IC role,
// regardless of whether the title is "Senior Product Designer" or "Lead").
//
// This post-process enforces the title-locked floor deterministically:
//   - "Principal" / "Staff+" / "Distinguished" / "Director" / "Head of Design"
//     in the title -> Principal allowed
//   - "Staff" in the title (alone) -> max Staff
//   - "Lead Designer" / "Design Lead" -> max Lead
//   - "Founding" / "first designer" -> exactly Founding
//   - "Senior" in the title -> max Staff (Principal is impossible)
//   - No modifier -> max Staff (a plain "Product Designer" title shouldn't
//     pick Principal even when role is complex)

type CvTier = 'founding' | 'principal' | 'staff' | 'lead' | 'senior' | 'unknown'

// Tier ordering (ascending). 'founding' is treated as its own track; if title
// indicates founding, exact match wins. Otherwise tiers compared via index.
const TIER_ORDER: Record<string, number> = {
  'senior-product-designer':    1,
  'lead-product-designer':      2,
  'staff-product-designer':     3,
  'principal-product-designer': 4,
}

function detectTitleTier(jdText: string): CvTier {
  // Look at the head of the JD; titles are almost always in the first line or
  // two. Limit to 300 chars to avoid false matches deep in the body.
  const head = (jdText || '').slice(0, 300)
  const lower = head.toLowerCase()

  // Founding / first-designer is exact-match, not a tier.
  if (/\bfounding\b/i.test(head) || /\bfirst\s+(designer|design\s+hire)\b/i.test(lower)) {
    return 'founding'
  }
  // Principal-track signals — note "Head of Design" is treated as Principal-tier.
  if (/\bprincipal\b/i.test(head)
      || /\bstaff\s*\+/i.test(head)
      || /\bdistinguished\s+designer\b/i.test(lower)
      || /\bhead\s+of\s+design\b/i.test(lower)
      || /\bdesign\s+director\b/i.test(lower)) {
    return 'principal'
  }
  // Staff in title (but not Senior Staff which counts as Principal-eligible).
  if (/\bstaff\s+(product\s+)?designer\b/i.test(lower)
      && !/\bsenior\s+staff/i.test(lower)) {
    return 'staff'
  }
  // Lead Designer / Design Lead (IC track).
  if (/\b(lead\s+(product\s+|ux\s+|interaction\s+)?designer|design\s+lead)\b/i.test(lower)) {
    return 'lead'
  }
  // Senior in title.
  if (/\bsenior\b/i.test(head)) {
    return 'senior'
  }
  return 'unknown'
}

function capCvByTitle(modelCv: string | null | undefined, tier: CvTier): {
  cv: string;
  downgraded: boolean;
  reason: string | null;
} {
  const cv = typeof modelCv === 'string' ? modelCv.trim() : ''
  if (!cv) return { cv: '', downgraded: false, reason: null }

  // Founding track: exact match required when title is founding.
  if (tier === 'founding') {
    if (cv === 'founding-product-designer') return { cv, downgraded: false, reason: null }
    return { cv: 'founding-product-designer', downgraded: true, reason: 'Title indicates a founding / first-designer role.' }
  }

  // Map tier -> max allowed CV variant id.
  let maxId: string | null
  switch (tier) {
    case 'principal': maxId = null; break // no cap; model may pick any tier
    case 'staff':     maxId = 'staff-product-designer'; break
    case 'lead':      maxId = 'lead-product-designer'; break
    case 'senior':    maxId = 'staff-product-designer'; break // Senior titles cap at Staff
    case 'unknown':   maxId = 'staff-product-designer'; break // no modifier caps at Staff
    default: return { cv, downgraded: false, reason: null }
  }
  if (!maxId) return { cv, downgraded: false, reason: null }

  const modelRank = TIER_ORDER[cv]
  const maxRank   = TIER_ORDER[maxId]
  if (modelRank == null || maxRank == null) {
    // Unknown CV id (e.g. founding while title is not founding). Leave model's pick alone.
    return { cv, downgraded: false, reason: null }
  }
  if (modelRank <= maxRank) return { cv, downgraded: false, reason: null }

  return {
    cv: maxId,
    downgraded: true,
    reason: `JD title is ${tier}-tier; capped CV recommendation from ${cv} to ${maxId}.`,
  }
}

// ─── Request handler ─────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const {
      extraction_json,
      candidate_context,
      jd_text,
      jd_excerpt,
      provider: requestedProvider,
      verbosity_mode: requestedVerbosity,
    } = await req.json()

    // Normalise verbosity mode. Falls back to 'standard' for unknown values.
    const verbosityMode: 'compact' | 'standard' | 'deep' =
      requestedVerbosity === 'compact' ? 'compact' :
      requestedVerbosity === 'deep'    ? 'deep'    : 'standard'

    if (!extraction_json || typeof extraction_json !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid extraction_json' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Resolve JD excerpt. Either `jd_excerpt` (capped by caller) or `jd_text`
    // (we cap here) is accepted. Empty is allowed but degrades reasoning quality.
    const rawExcerpt = typeof jd_excerpt === 'string' && jd_excerpt.trim()
      ? jd_excerpt.trim()
      : (typeof jd_text === 'string' ? jd_text.trim() : '')
    const jdExcerpt = rawExcerpt.slice(0, JD_EXCERPT_MAX)

    // Provider: Phase 1 is OpenAI-only. Anthropic returns a clear error so
    // mistaken calls fail fast rather than producing degraded output via an
    // un-merged prompt.
    const provider: AIProvider = requestedProvider === 'openai' ? 'openai' : 'openai'
    if (requestedProvider && requestedProvider !== 'openai') {
      console.warn(`[reason-and-narrate] Provider "${requestedProvider}" requested but only OpenAI is supported in Phase 1. Routing to OpenAI.`)
    }

    const apiKey = OPENAI_API_KEY
    const model  = OPENAI_MODEL
    const systemPrompt = OPENAI_SYSTEM_PROMPT

    if (!apiKey) {
      console.error('[reason-and-narrate] Missing OPENAI_API_KEY')
      return new Response(
        JSON.stringify({ error: 'No OpenAI API key configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Build user message in cache-friendly order: stable content first
    // (candidate_context, same across roles in a session), volatile content
    // last (extraction_json + jd_excerpt, change per role). Verbosity
    // directive appended at the very end so the system-prompt + candidate
    // prefix stays maximally cache-eligible.
    let userMessage = ''

    const candidateBlock = formatCandidateContext(candidate_context || null)
    if (candidateBlock) {
      userMessage += candidateBlock + '\n\n---\n\n'
    }

    userMessage += `EXTRACTION JSON (from Pass 1 — practical-detail grounding):\n\n${JSON.stringify(extraction_json, null, 2)}`

    if (jdExcerpt) {
      userMessage += `\n\n---\n\nJD EXCERPT (raw JD language for direct signal interpretation):\n\n${jdExcerpt}`
    }

    userMessage += `\n\n---\n\nVERBOSITY: ${verbosityMode}`

    const t0 = performance.now()
    const { text: rawText, usage } = await callAI({
      provider,
      systemPrompt,
      userMessage,
      model,
      apiKey,
      maxTokens: 2500, // higher than legacy narrative (2048) to absorb inline thinking
    })
    const latencyMs = Math.round(performance.now() - t0)

    let narrative: Record<string, unknown>
    try {
      const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      narrative = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error(`[reason-and-narrate] JSON parse failed:`, parseErr, 'raw:', rawText.slice(0, 200))
      return new Response(
        JSON.stringify({ error: 'Failed to parse narrative JSON', raw: rawText.slice(0, 500) }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Strip any leaked internal-thinking object the model might have emitted
    // despite instructions. The output schema is the 11 sections only.
    const LEAKED_INTERNAL_KEYS = ['internal_thinking', 'reasoning', 'editorial_interpretation', '_thinking', 'thinking']
    LEAKED_INTERNAL_KEYS.forEach(k => { if (k in narrative) delete narrative[k] })

    // Schema-shape validation: required top-level keys.
    const missing = REQUIRED_KEYS.filter(k => !(k in narrative))
    if (missing.length) {
      console.warn(`[reason-and-narrate] Missing keys:`, missing)
      narrative._missing_keys = missing
      usage.schema_failures = missing
    }

    // ── CV tier cap (deterministic post-process) ──────────────────────────
    // The model's recommended_cv is unreliable when the candidate's CV
    // best_for descriptions semantically overlap with the JD's complexity.
    // We deterministically cap the model's pick by the JD's title tier.
    const titleTier = detectTitleTier(jdExcerpt)
    const cvCap = capCvByTitle(narrative.recommended_cv as string | null | undefined, titleTier)
    if (cvCap.downgraded) {
      console.log(`[reason-and-narrate] cv-cap downgrade  title_tier=${titleTier}  from=${narrative.recommended_cv}  to=${cvCap.cv}`)
      narrative._cv_capped_from = narrative.recommended_cv
      narrative.recommended_cv  = cvCap.cv
      // Append the cap reason to why_that_cv so the audit trail is preserved.
      const why = typeof narrative.why_that_cv === 'string' ? narrative.why_that_cv.trim() : ''
      narrative.why_that_cv = why
        ? `${why} (CV tier capped by JD title: ${titleTier}.)`
        : `CV tier capped by JD title: ${titleTier}.`
    }

    // Stamp provenance fields that the client persists onto _provenance.
    // Mirrors the legacy generate-narrative output but adds a Fast-mode marker.
    usage.narrative_version = REASON_AND_NARRATE_VERSION
    usage.reason_and_narrate_version = REASON_AND_NARRATE_VERSION
    usage.analysis_mode = 'fast'
    usage.title_tier_detected = titleTier
    if (cvCap.downgraded) usage.cv_capped = { from: narrative._cv_capped_from, to: cvCap.cv, reason: cvCap.reason }

    console.log(`[reason-and-narrate] OK provider=${provider} model=${model} version=${REASON_AND_NARRATE_VERSION} verbosity=${verbosityMode} latency_ms=${latencyMs} missing=${missing.length}`)

    return new Response(
      JSON.stringify({ narrative, usage }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (err) {
    console.error('[reason-and-narrate] Uncaught error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message || String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
