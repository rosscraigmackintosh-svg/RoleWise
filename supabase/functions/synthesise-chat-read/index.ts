// =============================================================================
// synthesise-chat-read — Applicant Mode briefing layer for chat-ingest mode
//
// Reads the canonical _narrative (from reason-and-narrate or the Deep path)
// and produces a STRUCTURED briefing — 12 sections rendered cleanly inside
// the chat surface.
//
// IMPORTANT:
// - This does NOT replace or alter the canonical narrative. Saved role pages
//   continue to render the 11-section canonical structure independently.
// - The briefing is presentation-only. It is NOT persisted into
//   jd_matches.output_json. Chat-ingest stores it on the client-side
//   session + localStorage shadow only.
// - If this function fails, the client falls back to a deterministic
//   canonical-to-briefing mapper. The chat surface always produces a read.
// - recommended_cv_variant is OVERWRITTEN server-side with the canonical
//   narrative.recommended_cv. The model is not allowed to re-pick.
//
// Deploy: supabase functions deploy synthesise-chat-read
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callAI, type AIProvider } from '../_shared/ai-call.ts'
import { OPENAI_SYSTEM_PROMPT, CHAT_SYNTH_VERSION } from './prompts/openai.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const OPENAI_MODEL   = Deno.env.get('OPENAI_MODEL_CHAT_SYNTH') || 'gpt-4.1-mini'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCandidateContext(ctx: Record<string, unknown> | null): string {
  if (!ctx || typeof ctx !== 'object') return ''
  const lines: string[] = ['CANDIDATE CONTEXT']
  lines.push('(The reader IS this candidate. The briefing addresses them as "you". Never use the name in output.)')
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
  const frictions = ctx.known_frictions as string[] | undefined
  if (Array.isArray(frictions) && frictions.length) {
    lines.push('', 'KNOWN FRICTIONS:')
    frictions.forEach(s => lines.push('- ' + s))
  }
  return lines.join('\n')
}

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta || typeof meta !== 'object') return ''
  const lines = ['ROLE META']
  const entries: Array<[string, string]> = [
    ['Title',        String(meta.role_title    || '')],
    ['Company',      String(meta.company_name  || '')],
    ['Location',     String(meta.location      || '')],
    ['Work model',   String(meta.work_model    || '')],
    ['Engagement',   String(meta.engagement_type || '')],
    ['Salary',       String(meta.salary || '')],
    ['IR35',         String(meta.ir35 || '')],
  ]
  for (const [k, v] of entries) {
    if (v && v !== 'undefined' && v !== 'null') lines.push(`- ${k}: ${v}`)
  }
  return lines.length > 1 ? lines.join('\n') : ''
}

// ─── Output validation ──────────────────────────────────────────────────────

const PRACTICAL_KEYS = [
  'location', 'work_model', 'employment_type', 'salary',
  'monthly_equivalent', 'visa_sponsorship', 'reporting_line',
  'industry', 'company_stage',
] as const

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.every(x => isNonEmptyString(x))

function validateBriefing(parsed: unknown):
  { ok: true; briefing: Record<string, unknown> }
  | { ok: false; reason: string }
{
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'not-an-object' }
  const b = (parsed as Record<string, unknown>).applicant_briefing
  if (!b || typeof b !== 'object') return { ok: false, reason: 'missing-applicant_briefing' }
  const obj = b as Record<string, unknown>

  // Required string-array sections (must be non-empty).
  const requiredArrays = [
    'fit_reality_summary', 'role_summary',
    'what_you_would_actually_do', 'what_they_are_really_looking_for',
    'questions_worth_asking', 'suggested_actions',
  ]
  for (const k of requiredArrays) {
    if (!isStringArray(obj[k])) return { ok: false, reason: `bad-${k}` }
  }

  // Why this role exists: { stated, inferred } — at least one bucket non-empty.
  const wte = obj.why_this_role_exists as Record<string, unknown> | undefined
  if (!wte || typeof wte !== 'object') return { ok: false, reason: 'bad-why_this_role_exists' }
  const wteStated   = Array.isArray(wte.stated)   ? wte.stated   : []
  const wteInferred = Array.isArray(wte.inferred) ? wte.inferred : []
  if (![...wteStated, ...wteInferred].length) return { ok: false, reason: 'empty-why_this_role_exists' }

  // Risks: { stated, inferred, verification_points } — at least one bucket non-empty.
  const ru = obj.risks_and_unknowns as Record<string, unknown> | undefined
  if (!ru || typeof ru !== 'object') return { ok: false, reason: 'bad-risks_and_unknowns' }
  const ruStated   = Array.isArray(ru.stated)              ? ru.stated              : []
  const ruInferred = Array.isArray(ru.inferred)            ? ru.inferred            : []
  const ruVerify   = Array.isArray(ru.verification_points) ? ru.verification_points : []
  if (![...ruStated, ...ruInferred, ...ruVerify].length) return { ok: false, reason: 'empty-risks_and_unknowns' }

  // Practical details: object with the fixed key set; values may be null.
  const pd = obj.practical_details as Record<string, unknown> | undefined
  if (!pd || typeof pd !== 'object') return { ok: false, reason: 'bad-practical_details' }
  // Don't reject if some keys are missing — just normalise below.

  // why_this_cv and final_note: strings.
  if (!isNonEmptyString(obj.why_this_cv)) return { ok: false, reason: 'bad-why_this_cv' }
  if (!isNonEmptyString(obj.final_note))  return { ok: false, reason: 'bad-final_note' }

  // recommended_cv_variant: string or null. Server-side override below.
  const cv = obj.recommended_cv_variant
  if (cv !== null && !isNonEmptyString(cv)) return { ok: false, reason: 'bad-recommended_cv_variant' }

  return { ok: true, briefing: obj }
}

function normaliseBriefing(b: Record<string, unknown>, canonicalRecommendedCv: string | null): Record<string, unknown> {
  // Force the CV to mirror the canonical narrative — the model is not allowed
  // to re-pick. If the canonical is null/empty, we surface null and the
  // renderer suppresses the section.
  b.recommended_cv_variant = canonicalRecommendedCv && canonicalRecommendedCv.trim()
    ? canonicalRecommendedCv.trim()
    : null

  // Normalise practical_details: ensure every fixed key is present.
  const pd = (b.practical_details as Record<string, unknown>) || {}
  const filledPd: Record<string, string | null> = {}
  for (const k of PRACTICAL_KEYS) {
    const v = pd[k]
    filledPd[k] = (typeof v === 'string' && v.trim()) ? v.trim() : null
  }
  b.practical_details = filledPd

  // Ensure risks + why_this_role_exists sub-arrays exist (may be empty).
  const wte = b.why_this_role_exists as Record<string, unknown>
  wte.stated   = Array.isArray(wte.stated)   ? wte.stated.filter(isNonEmptyString)   : []
  wte.inferred = Array.isArray(wte.inferred) ? wte.inferred.filter(isNonEmptyString) : []
  const ru = b.risks_and_unknowns as Record<string, unknown>
  ru.stated              = Array.isArray(ru.stated)              ? ru.stated.filter(isNonEmptyString)              : []
  ru.inferred            = Array.isArray(ru.inferred)            ? ru.inferred.filter(isNonEmptyString)            : []
  ru.verification_points = Array.isArray(ru.verification_points) ? ru.verification_points.filter(isNonEmptyString) : []

  return b
}

// ─── Request handler ───────────────────────────────────────────────────────

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
      narrative,
      extraction,
      meta,
      candidate_context,
      verbosity_mode: requestedVerbosity,
      provider: requestedProvider,
    } = await req.json()

    if (!narrative || typeof narrative !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid narrative' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const verbosityMode: 'compact' | 'standard' | 'deep' =
      requestedVerbosity === 'compact' ? 'compact' :
      requestedVerbosity === 'deep'    ? 'deep'    : 'standard'

    const provider: AIProvider = requestedProvider === 'openai' ? 'openai' : 'openai'
    const apiKey = OPENAI_API_KEY
    const model  = OPENAI_MODEL
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'No OpenAI API key configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Build user message — cache-friendly order: stable candidate context
    // first, then meta, then the structured analysis, then verbosity.
    let userMessage = ''
    const candidateBlock = formatCandidateContext(candidate_context || null)
    if (candidateBlock) userMessage += candidateBlock + '\n\n---\n\n'

    const metaBlock = formatMeta(meta || null)
    if (metaBlock) userMessage += metaBlock + '\n\n---\n\n'

    if (extraction && typeof extraction === 'object') {
      userMessage += `EXTRACTION (Pass 1 practical details):\n\n${JSON.stringify(extraction, null, 2)}\n\n---\n\n`
    }

    userMessage += `NARRATIVE JSON (canonical structured analysis — interpret, do not restate):\n\n${JSON.stringify(narrative, null, 2)}\n\n---\n\nVERBOSITY: ${verbosityMode}`

    const t0 = performance.now()
    const { text: rawText, usage } = await callAI({
      provider,
      systemPrompt: OPENAI_SYSTEM_PROMPT,
      userMessage,
      model,
      apiKey,
      maxTokens: 1800, // ~700-word deep cap + JSON overhead for 12 sections
    })
    const latencyMs = Math.round(performance.now() - t0)

    let parsed: unknown
    try {
      const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('[synthesise-chat-read] JSON parse failed:', parseErr, 'raw:', rawText.slice(0, 200))
      return new Response(
        JSON.stringify({ error: 'Failed to parse synth JSON', raw: rawText.slice(0, 500) }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const validation = validateBriefing(parsed)
    if (!validation.ok) {
      console.warn('[synthesise-chat-read] validation failed:', validation.reason)
      return new Response(
        JSON.stringify({ error: 'Briefing failed validation', reason: validation.reason, raw: rawText.slice(0, 500) }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Canonical CV mirror + practical_details normalisation.
    const canonicalCv = typeof (narrative as Record<string, unknown>).recommended_cv === 'string'
      ? ((narrative as Record<string, unknown>).recommended_cv as string)
      : null
    const briefing = normaliseBriefing(validation.briefing, canonicalCv)

    usage.chat_synth_version = CHAT_SYNTH_VERSION
    usage.analysis_mode      = 'fast'

    console.log(`[synthesise-chat-read] OK provider=${provider} model=${model} version=${CHAT_SYNTH_VERSION} verbosity=${verbosityMode} latency_ms=${latencyMs}`)

    return new Response(
      JSON.stringify({ applicant_briefing: briefing, usage }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (err) {
    console.error('[synthesise-chat-read] Uncaught error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message || String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
