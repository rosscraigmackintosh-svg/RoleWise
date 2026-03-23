// =============================================================================
// generate-narrative — Pass 2 Edge Function (v4.0 candidate-aware)
// Takes structured JSON from Pass 1 (analyse-jd) + candidate context
// and produces the personalised 9-section decision narrative as strict
// structured JSON.
//
// Deploy: supabase functions deploy generate-narrative
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const MODEL = 'claude-haiku-4-5-20251001'

// ─── System Prompt ──────────────────────────────────────────────────────────
// Source of truth: /app/ai/prompts/rolewise-prompts.js
// This MUST stay in sync with ROLEWISE_LANGUAGE_RULEBOOK + ROLEWISE_NARRATIVE_PROMPT.
// If you update the prompt in rolewise-prompts.js, copy the changes here.
// NOTE: Candidate context is injected dynamically from the request body,
// not embedded in the system prompt.

const SYSTEM_PROMPT = `You are part of Rolewise, a product that helps experienced professionals understand job opportunities and decide whether they are worth pursuing.

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
- If no learned behaviour is available, do not mention it. The output should still work perfectly.
- Never say "based on our data" or "according to your history." Write it like a colleague who knows you.

CORE RULES
- Prioritise clarity over completeness
- Remove duplication across sections
- Each section must add something new
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
    "paragraphs": ["string", "string"]
  },
  "recommended_cv": "string",
  "why_that_cv": "string",
  "final_note": "Use this as context, not a verdict."
}

COMPANY CONTEXT RULES
If extraction includes company_mismatch (two different company names detected):
- In what_this_role_actually_is, state: "The listing appears under [listing name], but the job description refers to [jd name]. This may indicate a rebrand, parent company, or a posting error — worth verifying before applying."
- Do NOT say "Company not specified" if any company name exists.
- Do NOT guess which name is correct.
If the posting company is a recruiter or agency (not the actual employer):
- In what_this_role_actually_is, identify both the recruiter and the (unnamed) actual employer clearly.
- e.g. "This is posted by [Recruiter], not the hiring company. The actual employer is not named in the JD."

TRACTION AND CLAIMS
When the JD includes growth metrics, revenue claims, funding signals, or "post-PMF" language:
- Label these as "Stated by company" or "Claimed in JD" — not as facts.
- e.g. "They describe themselves as post-PMF with 3x YoY growth (company claim)."
- Do NOT present unverified company assertions as verified facts.

SECTION RULES
FIT REALITY
- paragraphs: 2-3 short strings max
- Lead with the alignment or blocker — be surgical, not narrative
  - State specific match: e.g. "Strong match on 0→1 scope, autonomy, and product complexity."
  - If a hard blocker is triggered, state it plainly and immediately: e.g. "Blocked by explicit requirement for production frontend coding (React/TypeScript), which is a hard constraint."
  - Do NOT open with narrative build-up ("This looks compelling...", "Interesting opportunity...")
  - Do NOT use emotional or hype language
- One paragraph: state the single biggest friction for this candidate plainly
- If salary is unknown, state it factually (e.g. "Compensation not stated.")
- Do NOT drift into role explanation
WHAT THIS ROLE ACTUALLY IS
- paragraphs: 1-2 strings
- Explain the company, product, and context in plain English
- Focus only on what matters for understanding the role
- Avoid metrics, hype, or company bragging
WHAT THEY REALLY NEED FROM YOU
- paragraphs: 0-1 framing strings (optional)
- bullets: concrete expectations and pressure points
- Interpret beyond the title
- Highlight hidden expectations clearly
- Where relevant, connect to the candidate's strengths naturally
  - e.g. "Own design end-to-end, which plays to your cross-functional leadership experience"
WHAT YOU WOULD ACTUALLY DO
- framing: one sentence that frames the work
- bullets: practical, concrete activities (max 6)
PRACTICAL DETAILS
- items: array of { label, value } pairs
- Always include a Salary item (value "Not stated" if missing)
- DATA PRECEDENCE: Use values from extraction.practical exactly as provided. If work_model is "On-site", the Work Model item MUST say "On-site" — not "Not stated", not inferred.
- Only factual information. Do NOT mark a field "Not stated" if it appears in the extraction data.
- Do NOT include Recommended CV in practical_details.items — it is a separate top-level field
RISKS & UNKNOWNS
- stated_intro: contextual lead-in for stated risks
  - If no explicit risks: "No major risks are explicitly stated."
  - If explicit risks exist: "Stated:"
- stated: risks explicitly mentioned in the JD (empty array if none)
- inferred: logical risks based on context AND candidate-specific concerns
  - Include risks that relate to the candidate's known frictions
  - e.g. "Matrix reporting with no clear design leadership is a recurring friction for you"
- Focus on real decision friction for this candidate
QUESTIONS WORTH ASKING
- Array of strings, max 5
- Only decision-driving questions for this candidate
- Include at least one that addresses a candidate-specific concern
- No filler
DECISION
- paragraphs: exactly 2 strings
- First: summarise alignment and opportunity, referencing how the role connects to what the candidate values. Be direct — no narrative build-up.
- Second: clear conditional framed for this candidate. Format: "If X, pursue. If Y, skip."
- Only include signals that are clearly stated or clearly inferred with evidence. If a signal is weak or uncertain, omit it rather than pad with filler.
- Do NOT include generic observations like "Culture not assessable from JD alone" or "Balanced craft/strategy focus".
- Do NOT include "Use this as context, not a verdict." inside decision paragraphs
RECOMMENDED CV
- recommended_cv: the ID of the best CV variant for this role (e.g. "founding-product-designer")
- why_that_cv: one sentence explaining the recommendation
FINAL NOTE
- Always set to exactly: "Use this as context, not a verdict."
- This is rendered separately after the Decision section

STYLE RULES
- Short sentences > long blocks
- Avoid repetition across sections
- Avoid corporate or AI-sounding language
- Keep total output readable in ~30 seconds

IMPORTANT CONSTRAINTS
- Do NOT invent missing facts
- If salary is missing, say "Not stated"
- Do NOT use the em dash character
- Do NOT output any explanation outside the JSON object

QUALITY CHECK (MANDATORY)
Before returning, verify:
- Fit reality opens with a direct alignment/blocker statement — no narrative build-up
- Fit reality references the candidate's actual background, not generic statements
- Fit reality mentions hard blockers in the prose if any are triggered (no separate field)
- What they really need from you connects at least one bullet to the candidate's strengths
- Risks section includes at least one candidate-specific concern
- Decision is framed for this specific candidate, not generically
- Decision contains no generic filler ("Culture not assessable", "Balanced craft/strategy", etc.)
- recommended_cv is a valid CV variant ID from the candidate context
- Practical details does NOT include a "Recommended CV" item (the renderer handles placement)
- Practical details does NOT mark a field "Not stated" if it was provided in the extraction JSON
- Company mismatch: if company_mismatch is set in extraction, it is called out in what_this_role_actually_is
- Growth/revenue claims from the JD are labelled "Stated by company" or "Claimed in JD" — not presented as fact
- If learned behaviour data was provided, at least one reference appears in fit_reality or decision
- Learned behaviour references are brief and natural, not statistical
- No section repeats the same idea
- No company pitch language or unnecessary metrics
- Decision paragraphs do NOT contain "Use this as context, not a verdict."
- final_note is exactly "Use this as context, not a verdict."
- Output is valid JSON matching the schema above
If any of these fail, rewrite before returning.`

// ─── Helper: Format candidate context for prompt injection ──────────────────
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

  // Learned behaviour (populated at runtime from candidate_learning)
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

serve(async (req: Request) => {
  // CORS
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
    const { extraction_json, candidate_context } = await req.json()
    if (!extraction_json || typeof extraction_json !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid extraction_json' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Build user message with extraction JSON + candidate context
    let userMessage = `Here is the structured JSON from Pass 1 extraction:\n\n${JSON.stringify(extraction_json, null, 2)}`

    // Inject candidate context if provided
    const candidateBlock = formatCandidateContext(candidate_context || null)
    if (candidateBlock) {
      userMessage += '\n\n---\n\n' + candidateBlock
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[generate-narrative] Anthropic API error:', response.status, errText)
      return new Response(
        JSON.stringify({ error: 'Anthropic API error', status: response.status }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const result = await response.json()
    const rawText = result.content?.[0]?.text || ''

    // Parse the JSON from the response
    let narrative: Record<string, unknown>
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      narrative = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('[generate-narrative] JSON parse failed:', parseErr, 'raw:', rawText.slice(0, 200))
      return new Response(
        JSON.stringify({ error: 'Failed to parse narrative JSON', raw: rawText.slice(0, 500) }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Validate required keys
    const REQUIRED_KEYS = [
      'fit_reality', 'what_this_role_actually_is', 'what_they_really_need_from_you',
      'what_you_would_actually_do', 'practical_details', 'risks_and_unknowns',
      'questions_worth_asking', 'decision', 'recommended_cv', 'why_that_cv',
    ]
    const missing = REQUIRED_KEYS.filter(k => !(k in narrative))
    if (missing.length) {
      console.warn('[generate-narrative] Missing keys:', missing)
      narrative._missing_keys = missing
    }

    // Usage info for cost tracking
    const usage = {
      model: MODEL,
      input_tokens: result.usage?.input_tokens || null,
      output_tokens: result.usage?.output_tokens || null,
    }

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
