// =============================================================================
// generate-role-reasoning — Pass 1.5 Edge Function (provider-aware)
//
// Sits between analyse-jd (Pass 1 extraction) and generate-narrative (Pass 2
// writing). Reads structured extraction + candidate context + JD excerpt and
// produces structured interpretive observations. Does NOT write prose. Does
// NOT produce UI-ready sections.
//
// Supports: Anthropic (claude-haiku) and OpenAI (gpt-4o-mini)
// Provider selected from request body: { provider: 'anthropic' | 'openai' }
// Defaults to 'anthropic' if not specified.
//
// Deploy: supabase functions deploy generate-role-reasoning
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callAI, type AIProvider } from '../_shared/ai-call.ts'
import { ROLE_REASONING_SYSTEM_PROMPT, ROLE_REASONING_VERSION, HIGH_SIGNAL_FAMILIES } from './prompts/openai.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const OPENAI_API_KEY    = Deno.env.get('OPENAI_API_KEY') || ''

const ANTHROPIC_MODEL = Deno.env.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001'
const OPENAI_MODEL    = Deno.env.get('OPENAI_MODEL')    || 'gpt-4o-mini'

// Anthropic uses the same composable prompt — we don't keep a separate inline
// prompt for the reasoning pass because the spec is already declarative and
// model-neutral. If Anthropic-specific tuning becomes necessary, add a
// prompts/anthropic.ts file and switch on provider.
const ANTHROPIC_SYSTEM_PROMPT = ROLE_REASONING_SYSTEM_PROMPT
const OPENAI_SYSTEM_PROMPT    = ROLE_REASONING_SYSTEM_PROMPT

// ─── Candidate context formatter ─────────────────────────────────────────────
// Same shape as the narrative pass — keep them in sync if the format changes.
function formatCandidateContext(ctx: Record<string, unknown> | null): string {
  if (!ctx || typeof ctx !== 'object') return ''

  const lines: string[] = ['CANDIDATE CONTEXT']
  lines.push('(Compare the role against this specific candidate. Cite candidate-context lines when producing user_fit_map items.)')
  lines.push('')

  const id = ctx.identity as Record<string, string> | undefined
  if (id) {
    lines.push('WHO: ' + [id.name, id.seniority, id.years_experience + ' years experience', id.location].filter(Boolean).join(' | '))
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
    if (wm.ideal)             lines.push('- Ideal: ' + wm.ideal)
    if (wm.hard_limit)        lines.push('- Hard limit: ' + wm.hard_limit)
    if (wm.commute_tolerance) lines.push('- Commute tolerance: ' + wm.commute_tolerance)
    if (wm.location_base)     lines.push('- Based in: ' + wm.location_base)
  }

  const blockers = ctx.hard_blockers as string[] | undefined
  if (Array.isArray(blockers) && blockers.length) {
    lines.push('', 'HARD BLOCKERS (automatic skip if any apply):')
    blockers.forEach(s => lines.push('- ' + s))
  }

  const frictions = ctx.known_frictions as string[] | undefined
  if (Array.isArray(frictions) && frictions.length) {
    lines.push('', 'KNOWN FRICTIONS (recurring problems, not blockers):')
    frictions.forEach(s => lines.push('- ' + s))
  }

  const cvs = ctx.cv_variants as Array<{ id: string; label: string; best_for: string }> | undefined
  if (Array.isArray(cvs) && cvs.length) {
    lines.push('', 'CV VARIANTS AVAILABLE:')
    cvs.forEach(v => lines.push('- ' + v.label + ' (' + v.id + '): ' + v.best_for))
  }

  const lens = ctx.decision_lens as string[] | undefined
  if (Array.isArray(lens) && lens.length) {
    lines.push('', 'DECISION LENS:')
    lens.forEach(s => lines.push('- ' + s))
  }

  return lines.join('\n')
}

// ─── JSON recovery helper ────────────────────────────────────────────────────
// Same balanced-brace extraction used by analyse-jd. Tolerates preamble /
// trailing prose from non-JSON-mode model responses.
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape)             { escape = false; continue }
    if (ch === '\\')        { escape = true; continue }
    if (ch === '"')         { inString = !inString; continue }
    if (inString)           continue
    if (ch === '{')         depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

// ─── Request handler ─────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const {
      extraction_json,
      candidate_context,
      raw_jd_excerpt:     rawJdExcerpt,
      cleaned_jd_excerpt: cleanedJdExcerpt,
      provider: requestedProvider,
    } = await req.json()

    if (!extraction_json || typeof extraction_json !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid extraction_json' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const provider: AIProvider = requestedProvider === 'openai' ? 'openai' : 'anthropic'
    const apiKey       = provider === 'openai' ? OPENAI_API_KEY     : ANTHROPIC_API_KEY
    const model        = provider === 'openai' ? OPENAI_MODEL       : ANTHROPIC_MODEL
    const systemPrompt = provider === 'openai' ? OPENAI_SYSTEM_PROMPT : ANTHROPIC_SYSTEM_PROMPT

    if (!apiKey) {
      console.error(`[generate-role-reasoning] Missing API key for provider: ${provider}`)
      return new Response(
        JSON.stringify({ error: `No API key configured for provider: ${provider}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Build user message: extraction JSON + candidate context + JD excerpts.
    // Excerpts are capped client-side (~800 chars each) so the model has
    // direct access to JD language for phrase-level signal interpretation.
    let userMessage = `EXTRACTION JSON (from Pass 1):\n\n${JSON.stringify(extraction_json, null, 2)}`

    if (rawJdExcerpt && typeof rawJdExcerpt === 'string' && rawJdExcerpt.trim()) {
      userMessage += `\n\n---\n\nRAW JD EXCERPT (for language-level signal interpretation):\n\n${rawJdExcerpt.trim()}`
    } else if (cleanedJdExcerpt && typeof cleanedJdExcerpt === 'string' && cleanedJdExcerpt.trim()) {
      userMessage += `\n\n---\n\nCLEANED JD EXCERPT (for language-level signal interpretation):\n\n${cleanedJdExcerpt.trim()}`
    }

    const candidateBlock = formatCandidateContext(candidate_context || null)
    if (candidateBlock) {
      userMessage += '\n\n---\n\n' + candidateBlock
    }

    const { text: rawText, usage } = await callAI({
      provider,
      systemPrompt,
      userMessage,
      model,
      apiKey,
      maxTokens: 3000,
    })

    // Lenient JSON parse: try direct, then balanced-brace extract, then 422.
    let reasoning: Record<string, unknown>
    const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    try {
      reasoning = JSON.parse(cleaned)
    } catch (parseErr) {
      const blob = extractFirstJsonObject(cleaned)
      if (blob) {
        try {
          reasoning = JSON.parse(blob)
          console.warn('[generate-role-reasoning] recovered via blob extraction. length=' + blob.length)
        } catch (blobErr) {
          console.error('[generate-role-reasoning] JSON parse failed (both direct and blob):',
            'direct=', String(parseErr),
            'blob=',   String(blobErr),
            'rawLen=', rawText.length,
            'rawHead=', rawText.slice(0, 400),
            'rawTail=', rawText.slice(-400))
          return new Response(
            JSON.stringify({ error: 'Failed to parse reasoning JSON', raw: rawText.slice(0, 1000) }),
            { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      } else {
        console.error('[generate-role-reasoning] JSON parse failed and no JSON object found.',
          'direct=', String(parseErr),
          'rawLen=', rawText.length,
          'rawHead=', rawText.slice(0, 400),
          'rawTail=', rawText.slice(-400))
        return new Response(
          JSON.stringify({ error: 'Failed to parse reasoning JSON', raw: rawText.slice(0, 1000) }),
          { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
    }

    // Soft validation — log missing top-level keys but do not fail.
    const REQUIRED_KEYS = [
      'signal_analysis', 'role_shape', 'senior_interpretation',
      'user_fit_map', 'trade_offs', 'cv_recommendation', 'reasoning_summary',
    ]
    const missing = REQUIRED_KEYS.filter(k => !(k in reasoning))
    if (missing.length) {
      console.warn(`[generate-role-reasoning] Missing keys (${provider}):`, missing)
      reasoning._missing_keys = missing
      usage.schema_failures = missing
    }

    // ── Deterministic post-process: salary verification + Staff CV tiebreak ──
    // These guards run AFTER the model returns so they are not subject to
    // model judgement. They mirror the prompt rules and are the final say.
    try {
      // 1. Salary normalisation — treat any salary-shaped field as missing if
      //    empty / null / "Not stated" / missing across known extraction schemas.
      const isMissingSalary = (() => {
        const ex = extraction_json as Record<string, unknown>
        const candidates = [
          (ex.practical as Record<string, unknown> | undefined)?.salary,
          (ex.practical_details as Record<string, unknown> | undefined)?.salary,
          (ex.practical_details as Record<string, unknown> | undefined)?.salary_annual,
          (ex.practical_details as Record<string, unknown> | undefined)?.salary_min,
          (ex.practical_details as Record<string, unknown> | undefined)?.salary_max,
          ex.salary,
          ex.compensation,
        ]
        const hasValue = candidates.some(v => {
          if (v == null) return false
          if (typeof v === 'string') {
            const t = v.trim().toLowerCase()
            return t !== '' && t !== 'not stated' && t !== 'not specified' && t !== 'unknown' && t !== 'n/a'
          }
          if (typeof v === 'number') return v > 0
          return false
        })
        return !hasValue
      })()

      const tradeOffs = reasoning.trade_offs as Record<string, unknown> | undefined
      const vps: string[] = Array.isArray(tradeOffs?.verification_points)
        ? (tradeOffs!.verification_points as string[]).slice()
        : []

      if (isMissingSalary) {
        const alreadyMentions = vps.some(v => /salary|compensation|day[- ]?rate|pay\b/i.test(v))
        if (!alreadyMentions) {
          vps.push('Clarify the compensation structure for this contract engagement.')
          if (tradeOffs) tradeOffs.verification_points = vps
          console.log('[generate-role-reasoning] post-process: salary verification point injected')
        }
      }

      // 1b. Coding verification — same deterministic shape as salary.
      // Inject a calibration if the JD is silent on production-coding expectations.
      // Suppress if the JD explicitly states either direction (stated requirement
      // or stated prototyping-only). In the explicit-requirement case the
      // narrative will treat it as a stated risk, not a calibration.
      const jdForCoding = ((rawJdExcerpt as string) || (cleanedJdExcerpt as string) || '').toLowerCase()
      const explicitProductionCoding = /production (frontend|front-end|fe |code|coding|implementation|pr|prs|pull request)|ship (frontend|front-end )?code|production-?level coding|ship (production )?code|react delivery|deliver (production )?code|merge to (main|master)|production deploys?/.test(jdForCoding)
      const explicitPrototypingOnly  = /prototyping only|no coding required|will not (be expected to )?code|design only|hand off to engineering|work closely with engineers (to|on)|engineers will implement/.test(jdForCoding)
      const explicitFromExtraction   = (() => {
        const ex = extraction_json as Record<string, unknown>
        const codingReq = String(ex.coding_requirement || '').toLowerCase()
        if (codingReq === 'required' || codingReq === 'expected' || codingReq === 'yes') return 'required'
        if (codingReq === 'no' || codingReq === 'not_required' || codingReq === 'prototyping_only') return 'none'
        return null
      })()

      const codingAlreadyInVps = vps.some(v => /coding|frontend|production code|prototype|prototyping/i.test(v))

      if (
        !codingAlreadyInVps &&
        !explicitProductionCoding &&
        !explicitPrototypingOnly &&
        explicitFromExtraction !== 'required' &&
        explicitFromExtraction !== 'none'
      ) {
        vps.push('Confirm whether the role expects prototyping only, or production frontend code.')
        if (tradeOffs) tradeOffs.verification_points = vps
        console.log('[generate-role-reasoning] post-process: coding verification point injected')
      } else if (explicitProductionCoding || explicitFromExtraction === 'required') {
        console.log('[generate-role-reasoning] post-process: coding is an explicit JD requirement — no calibration injected')
      } else if (explicitPrototypingOnly || explicitFromExtraction === 'none') {
        console.log('[generate-role-reasoning] post-process: coding is explicitly prototyping-only — no calibration injected')
      }

      // 2. Staff CV routing tiebreak — deterministic enforcement.
      // Bias toward Staff for IC roles in systems-heavy / workflow / platform /
      // enterprise-SaaS contexts unless the JD title explicitly signals Principal.
      const roleShape = reasoning.role_shape as Record<string, unknown> | undefined
      const ownership  = String(roleShape?.ownership_level || '').toLowerCase()
      const complexity = String(roleShape?.product_complexity || '').toLowerCase()
      const primary    = String(roleShape?.primary_shape || '').toLowerCase()
      const cvRec      = reasoning.cv_recommendation as Record<string, unknown> | undefined

      const isICOwnership = /individual contributor|senior ic|tech lead|lead ic/.test(ownership)
      const isSystemsHeavy =
        /platform|systems|operational saas|transformation/.test(primary) ||
        /complex|highly complex/.test(complexity)

      const jdBlob = ((rawJdExcerpt as string) || (cleanedJdExcerpt as string) || '').toLowerCase()
      const titleSignalsPrincipal =
        /\bprincipal\b/.test(jdBlob.slice(0, 800)) ||  // title typically appears early
        /\bstaff\+|head of design|director of design|vp of design/.test(jdBlob.slice(0, 800))
      const orgWideAuthority =
        /design strategy across the org|across (the )?org|across teams|cross-org|multiple product groups/.test(jdBlob)

      if (
        isICOwnership && isSystemsHeavy &&
        !titleSignalsPrincipal && !orgWideAuthority &&
        cvRec && String(cvRec.variant || '').toLowerCase().includes('principal')
      ) {
        const prevVariant = cvRec.variant
        cvRec.variant = 'staff-product-designer'
        cvRec.reason = 'Best fit for systems-heavy IC work across complex enterprise workflows without overstating principal-level organisational ownership.'
        console.log('[generate-role-reasoning] post-process: CV tiebreak forced staff-product-designer (was ' + prevVariant + ')')
      }
    } catch (postErr) {
      console.warn('[generate-role-reasoning] post-process error (non-fatal):', String(postErr))
    }

    // Provenance — stamp the deployed reasoning prompt version.
    usage.role_reasoning_version = ROLE_REASONING_VERSION

    // ── SIGNAL RETENTION DIAGNOSTIC ──
    // If the JD excerpt contains any high-signal family phrase but neither
    // signal_analysis.high_signal_phrases nor senior_interpretation.what_stands_out
    // mentions a related concept, log a SIGNAL LOSS WARNING. Non-fatal — for
    // future prompt tuning.
    try {
      const jdText = ((rawJdExcerpt as string) || (cleanedJdExcerpt as string) || '').toLowerCase()
      const highSigPhrases = ((reasoning.signal_analysis as Record<string, unknown>)?.high_signal_phrases as string[] | undefined) || []
      const standsOut       = ((reasoning.senior_interpretation as Record<string, unknown>)?.what_stands_out      as string[] | undefined) || []
      const reasoningBlob   = (highSigPhrases.join(' ') + ' ' + standsOut.join(' ')).toLowerCase()
      const lost: string[] = []
      for (const fam of HIGH_SIGNAL_FAMILIES) {
        const presentInJd = fam.phrases.some(p => jdText.includes(p.toLowerCase()))
        if (!presentInJd) continue
        const surfacedInReasoning = fam.phrases.some(p => reasoningBlob.includes(p.toLowerCase()))
        if (!surfacedInReasoning) lost.push(fam.family)
      }
      if (lost.length) {
        console.warn('[generate-role-reasoning] SIGNAL LOSS WARNING — JD contained these high-signal families but reasoning did not surface them:', lost)
      }
    } catch (_diagErr) {
      // Diagnostic only — never affects the response.
    }

    // Diagnostic log — visible in Supabase function logs.
    console.log('[generate-role-reasoning] OK (' + provider + ')', JSON.stringify({
      one_line_read:    (reasoning.reasoning_summary as Record<string, unknown>)?.one_line_read,
      primary_shape:    (reasoning.role_shape         as Record<string, unknown>)?.primary_shape,
      high_signal_count: Array.isArray((reasoning.signal_analysis as Record<string, unknown>)?.high_signal_phrases)
        ? ((reasoning.signal_analysis as { high_signal_phrases: unknown[] }).high_signal_phrases).length : 0,
      stands_out_count:  Array.isArray((reasoning.senior_interpretation as Record<string, unknown>)?.what_stands_out)
        ? ((reasoning.senior_interpretation as { what_stands_out: unknown[] }).what_stands_out).length : 0,
    }))

    return new Response(
      JSON.stringify({ reasoning, usage }),
      {
        status:  200,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('[generate-role-reasoning] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
