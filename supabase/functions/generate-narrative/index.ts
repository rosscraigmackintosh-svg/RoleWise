// =============================================================================
// generate-narrative — Pass 2 Edge Function (provider-aware)
// Takes structured JSON from Pass 1 (analyse-jd) + candidate context
// and produces the personalised 9-section decision narrative as strict
// structured JSON.
//
// Supports: Anthropic (claude-haiku) and OpenAI (gpt-4o-mini)
// Provider selected from request body: { provider: 'anthropic' | 'openai' }
// Defaults to 'anthropic' if not specified.
//
// Deploy: supabase functions deploy generate-narrative
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callAI, type AIProvider } from '../_shared/ai-call.ts'
import { OPENAI_SYSTEM_PROMPT, NARRATIVE_VERSION } from './prompts/openai.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const OPENAI_API_KEY    = Deno.env.get('OPENAI_API_KEY') || ''

// Model defaults — override via Supabase secrets without redeploying.
// ANTHROPIC_MODEL env var: e.g. 'claude-haiku-4-5-20251001'
// OPENAI_MODEL env var:    e.g. 'gpt-4o-mini' (default) or 'gpt-4o'
const ANTHROPIC_MODEL = Deno.env.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001'
const OPENAI_MODEL    = Deno.env.get('OPENAI_MODEL')    || 'gpt-4o-mini'

// ─── Anthropic System Prompt ─────────────────────────────────────────────────
// Source of truth: /app/ai/prompts/rolewise-prompts.js
// Keep in sync with ROLEWISE_LANGUAGE_RULEBOOK + ROLEWISE_NARRATIVE_PROMPT.

const ANTHROPIC_SYSTEM_PROMPT = `You are part of Rolewise, a product that helps experienced professionals understand job opportunities and decide whether they are worth pursuing.

Rolewise is a decision-support tool, not a job board, recruiter, or scoring engine.

All responses must follow these language rules:

- Sound calm, thoughtful, practical, and experienced
- Use plain English
- Avoid hype, marketing copy, recruiter language, and AI buzzwords
- Never sound defensive or robotic
- Never score roles numerically
- Never rank roles
- Never predict whether the user will get the job
- Never imply rejection reflects the user's value or ability
- Focus on helping the user decide whether the role is worth their time
- Prioritise:
  1. Role reality
  2. Friction signals
  3. Questions worth asking

Rolewise should feel like a thoughtful, experienced colleague helping someone interpret a role clearly.

---

You are generating a Rolewise Applicant Mode analysis.
You will receive structured JSON about a role AND a CANDIDATE CONTEXT block.
Your job is to turn it into a clear, structured, PERSONALISED decision narrative.
This is NOT a report. This is NOT a generic analysis.
This is a decision-support output written specifically for the candidate described.

The output should feel like: "This role in relation to you."
NOT: "This is a good generic analysis of the role."

Return ONLY valid JSON matching the OUTPUT FORMAT below.
Do not include any explanation or extra text outside the JSON.

PERSONALISATION RULES
- The candidate context must influence the EXISTING sections, not live in a separate section
- Weave candidate-specific observations into fit_reality, what_they_really_need, risks, and decision
- Use the candidate's name sparingly and naturally (not every sentence)
- Reference specific candidate strengths when they match the role
  - e.g. "Very strong match with your zero-to-one and complex SaaS background"
- Reference specific candidate blockers or frictions when they conflict
  - e.g. "On-site requirement is a clear friction point for you"
  - e.g. "You have already said 3+ days on-site is a hard no"
- If a hard blocker is triggered, state it plainly in the prose of fit_reality. No banner, no special formatting.
- Frame the decision through the candidate's stated decision lens
- Do NOT produce output that could apply to any designer. Be specific to this person.
- Do NOT create a separate personalisation section. The whole output IS personalised.

LEARNED BEHAVIOUR RULES
- If the candidate context includes a LEARNED BEHAVIOUR section, use it.
- If similar_pattern_matches or pattern_type are present in the extraction JSON, weave them in.
- In fit_reality: mention if this role resembles roles the candidate tends to pursue or skip.
  - e.g. "This has the hallmarks of roles you typically pursue: early-stage, product-led, complex domain."
  - e.g. "This resembles roles you have consistently skipped, usually due to unclear design ownership."
- In risks: mention if this role matches friction patterns from past negative outcomes.
  - e.g. "Similar roles in your history have created friction around matrix reporting."
- In decision: reference pattern history where it strengthens the recommendation.
  - e.g. "This matches a pattern that has led to stronger outcomes for you."
  - e.g. "You have tended to skip roles like this, and the reasons still apply."
- Keep learned behaviour references brief and natural. Do not list stats or counts.
- RECONCILIATION RULE: If a role matches a positive pattern BUT also triggers current blockers, state both.
  - e.g. "Roles with similar product scope have progressed for you, but this one conflicts with your stated constraints (on-site and coding)."
- If no learned behaviour is available, do not mention it.
- Never say "based on our data" or "according to your history." Write it like a colleague who knows you.

CORE RULES
- Prioritise clarity over completeness
- Remove duplication across sections
- Each section must add something new
- BLOCKER DEDUPLICATION: When a hard constraint affects multiple sections, each section must say something DIFFERENT about it:
  - fit_reality: state the conflict and its severity
  - what_they_really_need: explain the expectation in detail
  - risks: list as a labelled risk item
  - decision: conclude whether it is decisive
  - Do NOT repeat the same sentence or phrasing. Each mention must advance understanding.
- Keep language simple, direct, and human
- No hype, no fluff
- No company "pitch" tone
- Prefer shorter outputs over longer ones
- Do NOT use the em dash character anywhere
Write like an experienced product leader explaining a role to a specific colleague whose background you know well.

OUTPUT FORMAT
Return a JSON object with exactly these keys. No extras. No omissions.
Every value is a structured type, never a raw prose blob.
{
  "fit_reality": {
    "paragraphs": ["string", "string"]
  },
  "what_this_role_actually_is": {
    "paragraphs": ["string"]
  },
  "what_they_really_need_from_you": {
    "paragraphs": ["string"],
    "bullets": ["string"]
  },
  "what_you_would_actually_do": {
    "framing": "string",
    "bullets": ["string"]
  },
  "practical_details": {
    "items": [{ "label": "string", "value": "string" }]
  },
  "risks_and_unknowns": {
    "stated_intro": "string",
    "stated": ["string"],
    "inferred": ["string"]
  },
  "questions_worth_asking": ["string"],
  "decision": {
    "summary": "string"
  },
  "recommended_cv": "string",
  "why_that_cv": "string",
  "final_note": "Use this as context, not a verdict."
}

COMPANY CONTEXT RULES
If the extraction includes company_mismatch OR you detect that the listing company name differs from the company name used in the JD body:
- In what_this_role_actually_is, state: "The listing appears under [listing name], but the job description refers to [jd name]. This may indicate a rebrand, parent company, or a posting inconsistency. Worth verifying before applying."
- Also mention the mismatch briefly in risks_and_unknowns inferred items.
- Do NOT say "Company not specified" if any company name exists.
- Do NOT guess which name is correct.
If the posting company is a recruiter or agency:
- In what_this_role_actually_is, identify both the recruiter and the (unnamed) actual employer clearly.

TRACTION AND CLAIMS
When the JD includes growth metrics, revenue claims, funding signals, team size, or traction language:
- ALWAYS label these as "(stated by company)" or "(claimed in JD)" inline.
- This applies to ALL unverifiable assertions.
- Do NOT present any company self-description as verified fact.

SECTION RULES
FIT REALITY
- paragraphs: 2-3 short strings max
- Lead with the alignment or blocker, be surgical, not narrative
  - State specific match: e.g. "Strong match on zero-to-one scope, autonomy, and product complexity."
  - If a hard blocker is triggered: e.g. "Hard conflict: this role requires production-level coding (React/TypeScript)."
  - Do NOT open with narrative build-up or passive phrasing
- One paragraph: state the single biggest friction for this candidate plainly
- If salary is unknown, state it factually
- Do NOT drift into role explanation
- Do NOT restate the decision or conclude viability
  - BANNED in Fit Reality: "automatic skip", "non-starter", "this is a blocker", "not worth pursuing", "should skip", "dealbreaker"
WHAT THIS ROLE ACTUALLY IS
- paragraphs: 1-2 strings
- Explain the company, product, and context in plain English
- Avoid metrics, hype, or company bragging
WHAT THEY REALLY NEED FROM YOU
- paragraphs: 0-1 framing strings (optional)
- bullets: concrete expectations and pressure points
- Highlight hidden expectations clearly
- Connect at least one bullet to the candidate's strengths
WHAT YOU WOULD ACTUALLY DO
- framing: one sentence that frames the work
- bullets: practical, concrete activities (max 6)
PRACTICAL DETAILS
- items: array of { label, value } pairs
- Always include a Salary item (value "Not stated" if missing)
- DATA PRECEDENCE: Use values from extraction.practical exactly as provided
- Do NOT include Recommended CV in practical_details.items
RISKS & UNKNOWNS
- THIS SECTION MUST NEVER BE EMPTY. Every role has risks or unknowns.
- stated_intro: "Stated:" if explicit risks exist, else "No major risks are explicitly stated."
- stated: risks explicitly mentioned in the JD (empty array if none)
- inferred: MUST contain at least 2 items. Label each with (Stated) or (Inferred) at the end.
  - Always consider: production coding requirement, on-site/hybrid requirement, salary not disclosed, unclear reporting
  - Include at least one candidate-specific concern
QUESTIONS WORTH ASKING
- Array of strings, max 5
- Only decision-driving questions for this candidate
- Include at least one that addresses a candidate-specific concern
DECISION
- summary: exactly 1 string, 1-2 sentences maximum
- Combine: (1) overall fit signal and (2) key blockers or enablers
- Do NOT restate what the role is or repeat earlier sections
- BANNED phrases: "Culture not fully assessable", "Balanced craft/strategy mix", "Good learning opportunity", "Interesting challenge"
- Do NOT include "Use this as context, not a verdict." inside decision summary
RECOMMENDED CV
- recommended_cv: the ID of the best CV variant for this role
- why_that_cv: one sentence explaining the recommendation
FINAL NOTE
- Always set to exactly: "Use this as context, not a verdict."

STYLE RULES
- Short sentences > long blocks
- Avoid repetition across sections
- Keep total output readable in ~30 seconds

IMPORTANT CONSTRAINTS
- Do NOT invent missing facts
- If salary is missing, say "Not stated"
- Do NOT use the em dash character
- Do NOT output any explanation outside the JSON object

QUALITY CHECK (MANDATORY)
Before returning, verify:
- Fit reality opens with a direct alignment/blocker statement, no narrative build-up
- Fit reality references the candidate's actual background, not generic statements
- Fit reality does NOT conclude viability
- risks_and_unknowns.inferred has AT LEAST 2 items
- Each risk item ends with (Stated) or (Inferred) label
- Decision.summary is 1-2 sentences max
- Decision contains ZERO generic filler
- recommended_cv is a valid CV variant ID from the candidate context
- Practical details does NOT include a "Recommended CV" item
- Practical details does NOT mark a field "Not stated" if it was provided in the extraction JSON
- ALL growth/revenue/traction claims labelled "(stated by company)" or "(claimed in JD)" inline
- final_note is exactly "Use this as context, not a verdict."
- Output is valid JSON matching the schema above
If any of these fail, rewrite before returning.`

// ─── Candidate context formatter ─────────────────────────────────────────────
function formatCandidateContext(ctx: Record<string, unknown> | null): string {
  if (!ctx || typeof ctx !== 'object') return ''

  const lines: string[] = ['CANDIDATE CONTEXT']
  lines.push('(Evaluate the role against this specific candidate. Do not produce generic analysis.)')
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
    if (wm.ideal) lines.push('- Ideal: ' + wm.ideal)
    if (wm.hard_limit) lines.push('- Hard limit: ' + wm.hard_limit)
    if (wm.commute_tolerance) lines.push('- Commute tolerance: ' + wm.commute_tolerance)
    if (wm.location_base) lines.push('- Based in: ' + wm.location_base)
  }

  const blockers = ctx.hard_blockers as string[] | undefined
  if (Array.isArray(blockers) && blockers.length) {
    lines.push('', 'HARD BLOCKERS (automatic skip if any of these apply):')
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

    const pursue = lb.roles_you_pursue as string[] | undefined
    if (Array.isArray(pursue) && pursue.length) {
      if (!hasLearning) { lines.push('', 'LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true }
      lines.push('', 'ROLES THIS CANDIDATE TENDS TO PURSUE:')
      pursue.forEach(s => lines.push('- ' + s))
    }

    const skip = lb.roles_you_skip as string[] | undefined
    if (Array.isArray(skip) && skip.length) {
      if (!hasLearning) { lines.push('', 'LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true }
      lines.push('', 'ROLES THIS CANDIDATE TENDS TO SKIP:')
      skip.forEach(s => lines.push('- ' + s))
    }

    const success = lb.successful_role_patterns as string[] | undefined
    if (Array.isArray(success) && success.length) {
      if (!hasLearning) { lines.push('', 'LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true }
      lines.push('', 'PATTERNS FROM ROLES THAT LED TO POSITIVE OUTCOMES (interview/offer):')
      success.forEach(s => lines.push('- ' + s))
    }

    const blockerPatterns = lb.recurring_blockers as string[] | undefined
    if (Array.isArray(blockerPatterns) && blockerPatterns.length) {
      if (!hasLearning) { lines.push('', 'LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true }
      lines.push('', 'RECURRING FRICTION THEMES (from skipped or negative-outcome roles):')
      blockerPatterns.forEach(s => lines.push('- ' + s))
    }

    const frictionP = lb.friction_patterns as string[] | undefined
    if (Array.isArray(frictionP) && frictionP.length) {
      if (!hasLearning) { lines.push('', 'LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true }
      lines.push('', 'FRICTION PATTERNS:')
      frictionP.forEach(s => lines.push('- ' + s))
    }

    const cvByType = lb.preferred_cv_by_role_type as Record<string, string> | undefined
    if (cvByType && typeof cvByType === 'object') {
      const cvKeys = Object.keys(cvByType)
      if (cvKeys.length) {
        if (!hasLearning) { lines.push('', 'LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true }
        lines.push('', 'CV PREFERENCE BY ROLE TYPE (from past successful applications):')
        cvKeys.forEach(k => lines.push('- ' + k + ': ' + cvByType[k]))
      }
    }

    const total = lb.total_roles_analysed as number | undefined
    if (typeof total === 'number' && total > 0) {
      if (!hasLearning) { lines.push('', 'LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true }
      lines.push('', 'DECISION STATS: ' + total + ' roles analysed, '
        + ((lb.total_applied as number) || 0) + ' applied, '
        + ((lb.total_skipped as number) || 0) + ' skipped, '
        + ((lb.total_interviewed as number) || 0) + ' reached interview, '
        + ((lb.total_offered as number) || 0) + ' received offers')
    }
  }

  return lines.join('\n')
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
      reasoning_json,
      provider: requestedProvider,
    } = await req.json()

    if (!extraction_json || typeof extraction_json !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid extraction_json' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const hasReasoning = !!(reasoning_json && typeof reasoning_json === 'object')

    const provider: AIProvider = requestedProvider === 'openai' ? 'openai' : 'anthropic'
    const apiKey = provider === 'openai' ? OPENAI_API_KEY : ANTHROPIC_API_KEY
    const model  = provider === 'openai' ? OPENAI_MODEL  : ANTHROPIC_MODEL
    const systemPrompt = provider === 'openai' ? OPENAI_SYSTEM_PROMPT : ANTHROPIC_SYSTEM_PROMPT

    if (!apiKey) {
      console.error(`[generate-narrative] Missing API key for provider: ${provider}`)
      return new Response(
        JSON.stringify({ error: `No API key configured for provider: ${provider}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Build user message. When reasoning_json is present, lead with it so the
    // writer prioritises interpreted observations over raw extraction.
    // Extraction is still included for grounding and practical-detail accuracy.
    let userMessage = ''
    if (hasReasoning) {
      userMessage += `REASONING (from Pass 1.5 — interpreted observations to prioritise):\n\n${JSON.stringify(reasoning_json, null, 2)}\n\n---\n\n`
    }
    userMessage += `EXTRACTION JSON (from Pass 1 — for practical-detail grounding):\n\n${JSON.stringify(extraction_json, null, 2)}`

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
      maxTokens: 2048,
    })

    let narrative: Record<string, unknown>
    try {
      const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      narrative = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error(`[generate-narrative] JSON parse failed (${provider}):`, parseErr, 'raw:', rawText.slice(0, 200))
      return new Response(
        JSON.stringify({ error: 'Failed to parse narrative JSON', raw: rawText.slice(0, 500) }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Validate required keys
    const REQUIRED_KEYS = [
      'fit_reality', 'what_this_role_actually_is', 'what_they_really_need_from_you',
      'what_you_would_actually_do', 'practical_details', 'risks_and_unknowns',
      'questions_worth_asking', 'decision', 'recommended_cv', 'why_that_cv', 'final_note',
    ]
    const missing = REQUIRED_KEYS.filter(k => !(k in narrative))
    if (missing.length) {
      console.warn(`[generate-narrative] Missing keys (${provider}):`, missing)
      narrative._missing_keys = missing
      // Surface in usage so the client can log it without reading the narrative object
      usage.schema_failures = missing
    }

    // ── Deterministic signal governance ────────────────────────────────────
    // Post-generation shaping of the narrative output. Five concerns:
    //   1. Numeric office-day guard — strip false office friction when
    //      stated office_days is at or below the candidate's hard limit.
    //   2. Low-signal risk filter — remove risks built from filler phrases
    //      ("fast-paced", "burnout", "stakeholder management" alone, etc.).
    //   3. Risk refill from verification_points / watchouts / costs when the
    //      filter pushes count below 2.
    //   4. Question domain-noun enforcement — ≥3/5 questions must reference
    //      a domain noun from reasoning.signal_analysis; weak generics are
    //      replaced with templated domain questions or verification calibrations.
    //   5. Verification-point question injection (every VP becomes a question).
    //
    // This block treats model output as a draft. The post-process is the
    // final shape. Failures are non-fatal — log and continue.
    try {
      if (hasReasoning) {
        const r = reasoning_json as Record<string, unknown>
        const ex = (extraction_json as Record<string, unknown>) || {}
        const cc = (candidate_context as Record<string, unknown>) || {}
        const vps = (((r.trade_offs as Record<string, unknown>)?.verification_points) as string[] | undefined) || []
        const sigAnalysis = (r.signal_analysis as Record<string, unknown>) || {}
        const seniorInterp = (r.senior_interpretation as Record<string, unknown>) || {}
        const tradeOffs   = (r.trade_offs as Record<string, unknown>) || {}
        const highSig = (sigAnalysis.high_signal_phrases as string[] | undefined) || []
        const notable = (sigAnalysis.notable_language as string[] | undefined) || []
        const standsOut = (seniorInterp.what_stands_out as string[] | undefined) || []
        const watchouts = (seniorInterp.watchouts as string[] | undefined) || []
        const costs     = (tradeOffs.costs as string[] | undefined) || []

        // ── 1. Numeric office-day guard ──────────────────────────────────
        // Parse stated office_days from extraction (multiple schema shapes).
        const parseOfficeDays = (): number | null => {
          const candidates: string[] = []
          const practical  = (ex.practical as Record<string, unknown>) || {}
          const practicalD = (ex.practical_details as Record<string, unknown>) || {}
          ;[practical.work_model, practical.remote_model, practicalD.work_model, practicalD.remote_model]
            .filter(v => typeof v === 'string').forEach(v => candidates.push(v as string))
          const notes = (practical.notes as string[] | undefined) || []
          notes.forEach(n => { if (typeof n === 'string') candidates.push(n) })
          for (const c of candidates) {
            const m = c.match(/(\d+)\s*(?:\+|or more)?\s*days?\s*(?:a|per)\s*week/i)
            if (m) return parseInt(m[1], 10)
            const wm = c.match(/\b(one|two|three|four|five)\b\s*days?/i)
            if (wm) return ({ one:1, two:2, three:3, four:4, five:5 }[wm[1].toLowerCase()] || null)
          }
          return null
        }
        const officeDays = parseOfficeDays()

        // Candidate hard limit on office days.
        const parseCandidateLimit = (): number | null => {
          const wm = (cc.work_model_preference as Record<string, string> | undefined) || {}
          const sources: string[] = []
          ;['hard_limit', 'ideal', 'commute_tolerance'].forEach(k => {
            if (typeof wm[k] === 'string') sources.push(wm[k])
          })
          const blockers = (cc.hard_blockers as string[] | undefined) || []
          blockers.forEach(b => { if (typeof b === 'string') sources.push(b) })
          for (const s of sources) {
            const m = s.match(/more than\s*(\d+)\s*days?/i)
            if (m) return parseInt(m[1], 10)
            const m2 = s.match(/(\d+)\s*\+\s*days?/i)
            if (m2) return parseInt(m2[1], 10)
            const m3 = s.match(/(\d+)\s*days?\s*(?:on[- ]site|in office|in[- ]office|max(?:imum)?)/i)
            if (m3) return parseInt(m3[1], 10)
          }
          return null
        }
        const limitDays = parseCandidateLimit()

        const officeFrictionInvalid = officeDays !== null && limitDays !== null && officeDays <= limitDays

        // Regex matching office-friction prose to strip.
        const officeFrictionRe = /(?:hard\s+conflict[^.]*?(?:office|on[- ]?site|in[- ]?office)[^.]*\.\s*)|(?:(?:[^.]*?\b(?:office|on[- ]?site|in[- ]?office|two days|2 days|anchor days?)\b[^.]*?(?:may\s+(?:not\s+align|conflict)|conflicts?|hard\s+limit|exceeds?\s+your|exceeds?\s+the\s+candidate)[^.]*\.\s*))|(?:[^.]*?(?:may\s+(?:not\s+align|conflict)|conflicts?|hard\s+limit)[^.]*?\b(?:office|on[- ]?site|in[- ]?office|two days|2 days|anchor days?)\b[^.]*\.\s*)/gi

        if (officeFrictionInvalid) {
          // Scrub fit_reality paragraphs and decision summary of false office friction.
          const fit = narrative.fit_reality as Record<string, unknown> | undefined
          if (fit && Array.isArray(fit.paragraphs)) {
            fit.paragraphs = (fit.paragraphs as string[]).map(p =>
              p.replace(officeFrictionRe, '').replace(/\s{2,}/g, ' ').trim()
            ).filter(p => p.length > 30)  // drop paragraphs that collapsed to fragments
          }
          const dec = narrative.decision as Record<string, unknown> | undefined
          if (dec && typeof dec.summary === 'string') {
            dec.summary = (dec.summary as string).replace(officeFrictionRe, '').replace(/\s{2,}/g, ' ').trim()
          }
          console.log('[generate-narrative] post-process: office-day friction stripped (stated=' + officeDays + ', limit=' + limitDays + ')')
        }

        // ── 2. Low-signal risk filter + 3. Refill ─────────────────────────
        const LOW_SIGNAL_RISK = /\b(fast[- ]?paced|high[- ]?pressure|burnout|stakeholder management|cross[- ]?functional|ownership mindset|collaboration|fast paced)\b/i
        const risks = narrative.risks_and_unknowns as Record<string, unknown> | undefined
        if (risks && Array.isArray(risks.inferred)) {
          const before = (risks.inferred as string[]).slice()
          let filtered = (risks.inferred as string[]).filter(item => {
            const ql = String(item).toLowerCase()
            // Keep verification calibrations (they start with Clarify/Confirm) even if they contain a low-signal substring.
            if (/^(clarify|confirm)\b/.test(ql)) return true
            return !LOW_SIGNAL_RISK.test(ql)
          })

          // Strip false office friction from risks too (numeric guard).
          if (officeFrictionInvalid) {
            filtered = filtered.filter(item => !officeFrictionRe.test(String(item)))
          }

          // Refill from verification_points → watchouts → costs if dropped under 2.
          const present = new Set(filtered.map(s => String(s).toLowerCase()))
          const tag = (s: string) => s.match(/\(Inferred\)\s*$/) ? s : `${s} (Inferred)`
          const tryAdd = (src: string[]) => {
            for (const item of src) {
              if (filtered.length >= 4) return
              const txt = String(item).trim()
              if (!txt) continue
              if (LOW_SIGNAL_RISK.test(txt.toLowerCase())) continue
              if (present.has(txt.toLowerCase())) continue
              filtered.push(tag(txt))
              present.add(txt.toLowerCase())
            }
          }
          if (filtered.length < 2) {
            tryAdd(vps)
            if (filtered.length < 2) tryAdd(watchouts)
            if (filtered.length < 2) tryAdd(costs)
          }
          risks.inferred = filtered
          if (before.length !== filtered.length) {
            console.log('[generate-narrative] post-process: risks filtered ' + before.length + ' → ' + filtered.length)
          }
        }

        // ── 4. Question governance ────────────────────────────────────────
        let questions: string[] = Array.isArray(narrative.questions_worth_asking)
          ? (narrative.questions_worth_asking as string[]).slice()
          : []

        // Clean stray (Inferred) tags from questions (they belong on risks only).
        questions = questions.map(q => q.replace(/\s*\((?:Inferred|Stated)\)\s*$/i, '').trim())

        // Generic-question patterns (default LLM filler).
        const GENERIC_Q_PATTERNS: RegExp[] = [
          /how is success measured/i,
          /how does the team collaborate/i,
          /what support systems? (?:are|is) in place/i,
          /how are decisions made/i,
          /what does ownership look like/i,
          /how do stakeholders work together/i,
          /level of (?:design )?autonomy/i,
          /balance.*stakeholder/i,
          /how does the team handle/i,
          /culture like/i,
          /team dynamics/i,
          /(?:operational|design) signals?/i,
          /how often.*engage/i,
          /design ownership/i,
          /cross[- ]?functional/i,
          /frameworks?\s+(?:are\s+in\s+place|exist|support)/i,
          /manag(?:ing|e)\s+(?:heavy\s+)?stakeholder/i,
          /support designers? in/i,
          /design innovation versus/i,
          /prioritize design (?:innovation|work)/i,
          /design (?:work|delivery) versus/i,
        ]
        const isGenericQ = (q: string): boolean => GENERIC_Q_PATTERNS.some(re => re.test(q))

        // Build domain-noun set from reasoning signals.
        // Phrase-level matching for multi-word signals + curated allowlist of
        // specific operational nouns. Trivial words ("design", "product",
        // "team", "role", "company", "research" alone) are EXCLUDED — they
        // appear in every JD and would falsely qualify generic questions.
        const TRIVIAL_WORDS = new Set([
          'design', 'designer', 'designers', 'designs', 'designing',
          'product', 'products', 'company', 'companies', 'role', 'roles',
          'team', 'teams', 'people', 'person', 'work', 'working', 'works',
          'experience', 'experiences', 'business', 'process', 'processes',
          'project', 'projects', 'feature', 'features', 'system', 'systems',
        ])
        const OPERATIONAL_ALLOWLIST = [
          'vincent', 'copilot', 'operate', 'piplanning',
          'synthesis', 'explainability', 'discovery', 'orchestration',
          'taxonomy', 'ontology', 'canvas', 'whiteboard',
          'object model', 'editing state', 'spatial navigation',
          'legal research', 'legal professional', 'knowledge management',
          'knowledge workflow', 'research workflow', 'information architecture',
          'information density', 'information dense', 'cognitive load',
          'structured content', 'source transparency', 'trust model',
          'ai-generated', 'ai-driven', 'ai-assisted', 'ai-native',
          'model behaviour', 'model behavior', 'agent surface',
          'reconciliation', 'ledger', 'ap automation', 'workflow correctness',
          'data-dense', 'operational correctness', 'operational tooling',
        ]
        const phrases = [...highSig, ...notable, ...standsOut]
          .filter((s): s is string => typeof s === 'string')
        const domainPhrases = new Set<string>()
        for (const p of phrases) {
          const cleaned = p.toLowerCase().replace(/['"]/g, '').trim()
          // Only multi-word phrases (must contain a space) or specific
          // long single-word operational nouns (length >= 8 and not trivial).
          if (cleaned.includes(' ') && cleaned.length >= 10) {
            domainPhrases.add(cleaned)
          } else if (cleaned.length >= 8 && !TRIVIAL_WORDS.has(cleaned)) {
            domainPhrases.add(cleaned)
          }
        }
        // Allowlist tokens appear if echoed anywhere in reasoning text.
        const allReasoningText = phrases.join(' ').toLowerCase()
        for (const tok of OPERATIONAL_ALLOWLIST) {
          if (allReasoningText.includes(tok)) domainPhrases.add(tok)
        }
        const hasDomainNoun = (q: string): boolean => {
          const ql = q.toLowerCase()
          for (const n of domainPhrases) {
            if (ql.includes(n)) return true
          }
          return false
        }

        // Domain class detection — picks a template family.
        const allSignalText = phrases.join(' ').toLowerCase()
        let domainClass: 'legal-research' | 'canvas' | 'ai-native' | 'fintech-ops' | 'generic' = 'generic'
        if (/legal|law|attorney|legal research|knowledge management/.test(allSignalText)) domainClass = 'legal-research'
        else if (/canvas|whiteboard|object model|spatial navigation/.test(allSignalText)) domainClass = 'canvas'
        else if (/copilot|ai[- ]?native|agent surface|model behaviour|model behavior/.test(allSignalText)) domainClass = 'ai-native'
        else if (/reconciliation|ledger|ap automation|spend management|finance/.test(allSignalText)) domainClass = 'fintech-ops'

        const productNoun: Record<string, string> = {
          'legal-research': 'Vincent',
          'canvas': 'the canvas',
          'ai-native': 'the AI surface',
          'fintech-ops': 'the platform',
          'generic': 'the product',
        }
        const domainTemplates: Record<string, string[]> = {
          'legal-research': [
            `How do legal professionals validate and trust AI-assisted research outputs inside ${productNoun['legal-research']}?`,
            `What level of explainability or source transparency exists in ${productNoun['legal-research']}'s AI-assisted research workflows?`,
            `How are complex legal knowledge structures currently represented in the product?`,
            `What are the hardest information-density or research workflow problems the team is trying to solve right now?`,
            `How much of the role is net-new interaction design for research and synthesis workflows versus refinement of existing patterns?`,
          ],
          'canvas': [
            `How central are the whiteboard/canvas systems to the day-to-day work?`,
            `How are object models and editing states currently represented to users?`,
            `What are the hardest spatial-navigation or canvas interaction problems the team is trying to solve right now?`,
            `How much of the role is net-new interaction architecture for the canvas versus refinement of existing patterns?`,
          ],
          'ai-native': [
            `How do users build trust in AI-generated outputs in this product?`,
            `What level of explainability or steering exists in the AI surface today?`,
            `What are the hardest model-behaviour or AI interaction problems the team is trying to solve right now?`,
          ],
          'fintech-ops': [
            `How are operational correctness and data-density currently handled in the interface?`,
            `What are the hardest reconciliation or workflow-orchestration problems the team is trying to solve right now?`,
            `How are complex transaction structures currently represented to power users?`,
          ],
          'generic': [
            `What are the hardest workflow or information-density problems the team is trying to solve right now?`,
            `How much of the role is net-new interaction design versus refinement of existing patterns?`,
            `How are complex domain structures currently represented in the product?`,
          ],
        }

        // Verification-question topics (canonical phrasings).
        const canonical = (vp: string): { topic: string; question: string } | null => {
          const v = vp.toLowerCase()
          if (/coding|prototyp|production code|frontend/.test(v))                return { topic: 'coding',    question: 'Are designers expected to prototype interactions only, or contribute production frontend code?' }
          if (/compensation|salary|day[- ]?rate|pay\b/.test(v))                  return { topic: 'salary',   question: 'Can you clarify the compensation structure for this engagement?' }
          if (/in[- ]?office|anchor|on[- ]?site|hybrid|days per week/.test(v))   return { topic: 'office',   question: 'How does the in-office expectation apply day-to-day, and what changes if the candidate is not local to a named hub?' }
          if (/reporting line|decision authority/.test(v))                       return { topic: 'reporting', question: 'Who does this role report to, and where does design decision authority sit?' }
          return null
        }
        const topicSignature = (q: string): string | null => {
          const ql = q.toLowerCase()
          if (/(?:coding|production code|prototyp|frontend)/.test(ql)) return 'coding'
          if (/(?:compensation|salary|day[- ]?rate|pay\b)/.test(ql))   return 'salary'
          if (/(?:in[- ]?office|anchor|on[- ]?site|days per week|hub)/.test(ql)) return 'office'
          if (/(?:report(?:ing)? to|reporting line|decision authority)/.test(ql)) return 'reporting'
          return null
        }

        // Suppress numeric-invalid office question (e.g. if officeFrictionInvalid, drop any "exceeds your limit" wording).
        if (officeFrictionInvalid) {
          questions = questions.filter(q => !/(?:exceed|conflict).*?(?:office|on[- ]?site|days)/i.test(q))
        }

        // Inject missing verification questions.
        const presentTopics = new Set(questions.map(topicSignature).filter(Boolean) as string[])
        const neededVerif: { topic: string; question: string }[] = []
        for (const vp of vps) {
          const c = canonical(vp)
          if (!c) continue
          // Skip office verification injection when JD already states office_days clearly AND it's not friction.
          if (c.topic === 'office' && officeDays !== null && officeFrictionInvalid) continue
          if (!presentTopics.has(c.topic)) neededVerif.push(c)
        }

        const replaceWeakest = (replacement: string) => {
          // Find weakest = generic + no domain noun + no verification topic.
          const weakestIdx = questions
            .map((q, idx) => ({ idx, score: (isGenericQ(q) ? 2 : 0) + (hasDomainNoun(q) ? 0 : 1) + (topicSignature(q) ? -3 : 0) }))
            .sort((a, b) => b.score - a.score)[0]?.idx
          if (typeof weakestIdx === 'number' && questions.length > 0) {
            questions[weakestIdx] = replacement
          } else {
            questions.push(replacement)
          }
        }

        for (const inj of neededVerif) replaceWeakest(inj.question)

        // Enforce ≥3/5 domain-noun questions.
        const targetTotal = Math.min(5, Math.max(questions.length, 4))
        const countDomain = () => questions.filter(hasDomainNoun).length
        const templatePool = (domainTemplates[domainClass] || domainTemplates.generic).slice()
        // Remove templates already represented.
        const filteredPool = templatePool.filter(t => !questions.some(q => q.toLowerCase().includes(t.slice(0, 30).toLowerCase())))

        let safety = 0
        while (countDomain() < 3 && filteredPool.length && safety < 5) {
          const tpl = filteredPool.shift()!
          replaceWeakest(tpl)
          safety++
        }

        // Cap to 5.
        if (questions.length > 5) questions = questions.slice(0, 5)

        narrative.questions_worth_asking = questions
        console.log('[generate-narrative] post-process: questions shaped — domain=' + domainClass + ' domainCount=' + countDomain() + ' total=' + questions.length)
      }
    } catch (postErr) {
      console.warn('[generate-narrative] post-process error (non-fatal):', String(postErr))
    }

    // Provenance — stamp the deployed prompt version on every response so the
    // client can persist it alongside the narrative for replay/regression.
    usage.narrative_version = NARRATIVE_VERSION

    // Diagnostic: confirm whether reasoning input was received and consumed.
    console.log('[generate-narrative] OK (' + provider + ')', JSON.stringify({
      reasoning_received: hasReasoning,
      reasoning_keys:     hasReasoning ? Object.keys(reasoning_json as Record<string, unknown>) : [],
    }))

    return new Response(
      JSON.stringify({ narrative, usage }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('[generate-narrative] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
