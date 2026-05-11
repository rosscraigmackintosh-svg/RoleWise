// =============================================================================
// analyse-jd — Pass 1 Edge Function (provider-aware)
// Extracts structured JSON from a job description, evaluated against
// the candidate's profile and learned behaviour.
//
// Supports: Anthropic (claude-haiku) and OpenAI (gpt-4o-mini)
// Provider selected from request body: { provider: 'anthropic' | 'openai' }
// Defaults to 'anthropic' if not specified.
//
// Deploy: supabase functions deploy analyse-jd
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callAI, type AIProvider } from '../_shared/ai-call.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const OPENAI_API_KEY    = Deno.env.get('OPENAI_API_KEY') || ''

// Model defaults — override via Supabase secrets without redeploying.
// ANTHROPIC_MODEL env var: e.g. 'claude-haiku-4-5-20251001'
// OPENAI_MODEL env var:    e.g. 'gpt-4o-mini' (default) or 'gpt-4o'
const ANTHROPIC_MODEL = Deno.env.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001'
const OPENAI_MODEL    = Deno.env.get('OPENAI_MODEL')    || 'gpt-4o-mini'

// ─── System Prompts ───────────────────────────────────────────────────────────
// Source of truth: /app/ai/prompts/rolewise-prompts.js → ROLEWISE_EXTRACTION_PROMPT
// Keep in sync if the canonical prompt changes.

const ANTHROPIC_SYSTEM_PROMPT = `You are extracting structured insights from a job description.
You will also receive a CANDIDATE CONTEXT block describing who this analysis is for.
Return ONLY valid JSON.
Do not include any explanation or extra text.

GOAL
Convert the job description into structured, reusable data.
Evaluate everything through the lens of the specific candidate provided.
Be precise.
Do not invent missing information.
If something is not stated, return null or an empty array.

OUTPUT SCHEMA
{
  "fit_signals": [],
  "candidate_fit_signals": [],
  "candidate_specific_frictions": [],
  "recommended_cv": "",
  "why_that_cv": "",
  "role_summary": "",
  "role_type": "",
  "company_stage": "",
  "responsibilities": [],
  "hidden_expectations": [],
  "practical": {
    "location": "",
    "work_model": "",
    "employment_type": "",
    "salary": "",
    "equity": "",
    "notes": []
  },
  "risks": {
    "stated": [],
    "inferred": []
  },
  "questions": [],
  "decision_factors": [],
  "hard_blocker_triggered": null,
  "similar_pattern_matches": [],
  "pattern_type": null,
  "company_mismatch": null
}

FIELD RULES
fit_signals:
- General alignment signals between the role and candidate profile
- Focus on experience, domain, seniority, environment
candidate_fit_signals:
- Specific ways this role connects to the candidate's stated strengths
- Reference actual strengths from the candidate context
- e.g. "Your zero-to-one experience maps directly to their need for a founding designer"
- e.g. "Your health-tech background is a strong match for this domain"
- Max 4 items. Only include genuine matches, not stretches.
candidate_specific_frictions:
- Specific conflicts between this role and the candidate's preferences, blockers, or known frictions
- Reference actual items from the candidate context
- e.g. "3 days on-site conflicts with your 2-day max"
- e.g. "Reports into marketing, which is on your hard blocker list"
- Max 4 items. Only include real conflicts, not hypotheticals.
recommended_cv:
- The ID of the CV variant from the candidate context that best fits this role
- e.g. "founding-product-designer"
- If no clear match, use the closest fit
why_that_cv:
- One sentence explaining why this CV variant is the best match
role_summary:
- 1-2 sentence plain English summary of company + product
role_type:
- e.g. "founding designer", "scale-up", "maintenance", "enterprise IC"
company_stage:
- early-stage / growth / established / enterprise
responsibilities:
- What the candidate will actually do (practical, not fluffy)
hidden_expectations:
- What is implied but not clearly stated
practical:
DATA PRECEDENCE RULE (mandatory):
If the input begins with a STRUCTURED_METADATA block, those values are authoritative.
- Use them verbatim. Do NOT override with inference from JD text.
- A work_model of "On-site" in metadata MUST appear as "On-site" in output.
- Same rule applies to location and employment_type.
For fields absent from any metadata: extract only what is explicitly stated in the JD. If genuinely absent everywhere, use "Not stated".
WORK MODEL CLASSIFICATION RULES (CRITICAL):
A. "on-site required", "5 days in office", "full-time office" → On-site.
B. "hybrid" AND specifies days (e.g. "3 days per week") → Hybrid, include day count.
C. "hybrid" or "flexible hybrid" without day count → Hybrid. Do NOT assume any number of days.
D. "remote" or "fully remote" → Remote.
NEVER infer commute days not explicitly stated. NEVER treat unspecified hybrid as a hard blocker.
company_mismatch:
- If STRUCTURED_METADATA provides a company_name AND the JD references a clearly different company, set to JD company name.
- If names match or only one source has a name, set to null.
risks.stated:
- Explicit risks from the JD
risks.inferred:
- Logical risks based on context and candidate fit
questions:
- Only decision-driving questions relevant to this candidate
- Include at least one question that addresses a candidate-specific friction
decision_factors:
- Key variables that determine whether to pursue or skip
- Must include candidate-specific factors, not just generic ones
hard_blocker_triggered:
- If the role triggers any of the candidate's hard blockers, return the blocker text
- If no hard blocker is triggered, return null
similar_pattern_matches:
- If the LEARNED BEHAVIOUR section is present in the candidate context, compare this role against it
- Return up to 3 short observations about how this role matches or diverges from learned patterns
- If no learned behaviour is available, return an empty array
pattern_type:
- Based on learned behaviour: "pursue_pattern" | "skip_pattern" | "mixed" | null

CONSTRAINTS
- No repetition across fields
- Keep arrays concise (max ~6 items each)
- Do not use the em dash character anywhere
- Output must be valid JSON
- candidate_fit_signals and candidate_specific_frictions must reference the actual candidate context`

// OpenAI prompt: same constitutional rules as Anthropic, more declarative style.
// Relies on JSON mode for format enforcement. Must be comprehensive — GPT-4o-mini
// does not infer field intent from schema alone; every field needs explicit instruction.
const OPENAI_SYSTEM_PROMPT = `You are a Rolewise extraction engine. Extract structured insights from a job description and a CANDIDATE CONTEXT block.

Return ONLY valid JSON matching the schema below. No text outside JSON. No em dashes anywhere.

CORE RULES:
- Do not invent missing information. Use null or [] for absent fields.
- Evaluate everything against the specific candidate provided — never generically.
- Do not collapse arrays to empty when the JD contains extractable content.
- Output must be valid JSON. No explanation text outside the JSON object.

FIELD RULES:

fit_signals: General alignment signals between the role and the candidate's profile (experience, domain, seniority, environment). Max 6 items.

candidate_fit_signals: Specific matches to the candidate's stated strengths. Reference actual strengths from the CANDIDATE CONTEXT. e.g. "Your zero-to-one experience maps to their need for a founding designer." Max 4. Only genuine matches, not stretches.

candidate_specific_frictions: Specific conflicts with the candidate's stated blockers, hard limits, or known frictions. Reference actual items from context. e.g. "3 days on-site conflicts with your 2-day max." Max 4. Only real conflicts.

recommended_cv: The CV variant ID from the candidate context that best fits this role. If no clear match, use the closest fit. Never null.

why_that_cv: One sentence explaining the CV variant recommendation.

role_summary: 1-2 sentence plain English summary of the company and product. No hype or metrics.
- ANTI-HALLUCINATION ON MATURITY: Respect explicit JD facts about company age and scale. If the JD states a founding year ≥10 years ago, OR uses phrases like "global leader", "thousands of organisations/customers", "Fortune 500 customers", "decades of", "publicly listed", the company is mature — do NOT describe it as a startup or scale-up. Modern UI/UX language in the JD does NOT make a 20-year-old company a startup.
- Lead with what the company actually does, not how it describes its culture.

role_type: e.g. "founding designer", "scale-up IC", "enterprise IC", "growth-stage lead", "maintenance role", "transformation lead", "platform redesign lead".
- ANTI-HALLUCINATION: Do not call something a "founding" or "scale-up" role unless the JD describes that context. A senior IC inside a 20-year-old company is NOT a founding role. If the JD describes a redesign, modernisation, or UX/UI transformation of an existing product, prefer "transformation lead" or "platform redesign lead" over startup framings.

company_stage: one of: early-stage / growth / established / enterprise.
- ANTI-HALLUCINATION: Company stage MUST respect explicit JD facts over modern-SaaS connotations.
- "established" or "enterprise" is REQUIRED when ANY of these signals are present: founding year ≥10 years ago, "global leader" / "industry leader" claims, "thousands of customers/organisations/users", multi-region offices, publicly listed status, formal compliance/regulatory positioning, named Fortune-500-class customers.
- Do NOT default to "early-stage" or "growth" because the language is modern or the JD describes a transformation. A mature company going through redesign is still "established" or "enterprise".

responsibilities: What the candidate will actually do. Extract practical work activities as stated.
- ANTI-COLLAPSE: Do not return an empty array if the JD describes any practical work.
- If the JD names specific product areas (onboarding, activation, engagement, retention, mobile, payments, checkout, search, personalisation, etc.), include them.
- Examples: "Own and redesign the onboarding experience end to end", "Run usability sessions on the activation funnel", "Ship UI components for the mobile app", "Define design system patterns for the growth team".

hidden_expectations: What is implied but not explicitly stated. Infer behavioural demands from the JD's tone, language, and responsibilities.
- ANTI-COLLAPSE: Do not return an empty array if the JD has any practical content to infer from.
- Signal interpretation guide:
  - "fast-paced" or "fast-moving" = tolerance for ambiguity, shipping before perfect, rapid iteration
  - "hands-on designer" or "execution-focused" = making things, not just directing; high craft output expected
  - "ownership" = self-directed delivery, minimal hand-holding, you define the problem and solve it
  - "collaborative" or "cross-functional" = strong async communication, influencing without authority, stakeholder management
  - "strategic" = expected to set direction, not just execute tasks
  - "ambiguous" = comfort with undefined scope, ability to structure your own work
  - "visual polish" or "high quality bar" = pixel-level execution expected alongside strategy
  - early-stage or Series A/B = wearing multiple hats, no dedicated research or PM support guaranteed

practical fields:
DATA PRECEDENCE: If the input begins with a STRUCTURED_METADATA block, use those values verbatim. Do NOT override them with inference from JD text.
WORK MODEL CLASSIFICATION (mandatory — do not skip or guess):
A. "on-site", "5 days in office", "full-time office", "office-based" → work_model: "On-site"
B. JD states hybrid AND an explicit day count ("1 day/week", "one day per week", "minimum 2 days", "3 days per month") → work_model: "Hybrid". Capture the exact count in practical.notes, e.g. "1 day per week in office (stated)".
C. "hybrid" or "flexible" without any day count → work_model: "Hybrid". Do NOT guess frequency.
D. "remote" or "fully remote" → work_model: "Remote"
CRITICAL: "1 day/week in office", "one day a week", "(Hybrid - 1 day/week in office)", "one day per week" are EXPLICIT statements. They must be captured. Do not treat them as unstated.

risks.stated: Risks or concerns explicitly mentioned in the JD (probation, performance metrics, high pressure, travel, etc.). Empty array if none.
risks.inferred: Logical risks based on context and candidate fit. Include at least 2. Each must end with (Stated) or (Inferred) label.

questions: Decision-driving questions relevant to this candidate. Include at least one that addresses a candidate-specific friction. Max 6.

decision_factors: Key variables that determine whether to pursue or skip. Must include candidate-specific factors.

hard_blocker_triggered: Return the blocker text if a hard blocker from the candidate context applies to this role. Null if no hard blocker.

company_mismatch: If STRUCTURED_METADATA provides a company_name AND the JD references a clearly different company, return the JD company name. Null otherwise.

similar_pattern_matches: If LEARNED BEHAVIOUR is present in candidate context, return up to 3 short observations comparing this role to learned patterns. Empty array if no learned behaviour.

pattern_type: Based on learned behaviour: "pursue_pattern" | "skip_pattern" | "mixed" | null. Null if no learned behaviour.

SCHEMA:
{
  "fit_signals": [],
  "candidate_fit_signals": [],
  "candidate_specific_frictions": [],
  "recommended_cv": "",
  "why_that_cv": "",
  "role_summary": "",
  "role_type": "",
  "company_stage": "",
  "responsibilities": [],
  "hidden_expectations": [],
  "practical": {
    "location": "",
    "work_model": "",
    "employment_type": "",
    "salary": "",
    "equity": "",
    "notes": []
  },
  "risks": { "stated": [], "inferred": [] },
  "questions": [],
  "decision_factors": [],
  "hard_blocker_triggered": null,
  "similar_pattern_matches": [],
  "pattern_type": null,
  "company_mismatch": null
}`

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

// ─── JSON recovery helper ────────────────────────────────────────────────────
// Find the first balanced top-level {...} substring. Tolerates preamble
// text ("Here is the analysis:") and trailing prose after the JSON closes.
// Tracks string state so braces inside strings are ignored.
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) { escape = false; continue }
    if (ch === '\\') { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

// ─── Provenance ──────────────────────────────────────────────────────────────
const ANALYSE_JD_VERSION = 'v20'

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
    const { jd_text, candidate_context, provider: requestedProvider } = await req.json()

    if (!jd_text || typeof jd_text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid jd_text' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const provider: AIProvider = requestedProvider === 'openai' ? 'openai' : 'anthropic'
    const apiKey = provider === 'openai' ? OPENAI_API_KEY : ANTHROPIC_API_KEY
    const model  = provider === 'openai' ? OPENAI_MODEL  : ANTHROPIC_MODEL
    const systemPrompt = provider === 'openai' ? OPENAI_SYSTEM_PROMPT : ANTHROPIC_SYSTEM_PROMPT

    if (!apiKey) {
      console.error(`[analyse-jd] Missing API key for provider: ${provider}`)
      return new Response(
        JSON.stringify({ error: `No API key configured for provider: ${provider}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    let userMessage = `Here is the job description:\n\n${jd_text}`
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
      maxTokens: 3500,
    })

    // Lenient JSON parsing:
    //  1. Strip fenced code blocks, try direct parse.
    //  2. If that fails, extract the first balanced {...} blob (handles preamble/postamble).
    //  3. If that also fails, 422 with a diagnostic log including a longer raw excerpt.
    let analysis: Record<string, unknown>
    const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    try {
      analysis = JSON.parse(cleaned)
    } catch (parseErr) {
      const blob = extractFirstJsonObject(cleaned)
      if (blob) {
        try {
          analysis = JSON.parse(blob)
          console.warn('[analyse-jd] direct JSON.parse failed; recovered via blob extraction. length=' + blob.length)
        } catch (blobErr) {
          console.error('[analyse-jd] JSON parse failed (both direct and blob):',
            'direct=', String(parseErr),
            'blob=', String(blobErr),
            'rawLen=', rawText.length,
            'rawHead=', rawText.slice(0, 400),
            'rawTail=', rawText.slice(-400))
          return new Response(
            JSON.stringify({ error: 'Failed to parse extraction JSON', raw: rawText.slice(0, 1000) }),
            { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      } else {
        console.error('[analyse-jd] JSON parse failed and no JSON object found:',
          'direct=', String(parseErr),
          'rawLen=', rawText.length,
          'rawHead=', rawText.slice(0, 400),
          'rawTail=', rawText.slice(-400))
        return new Response(
          JSON.stringify({ error: 'Failed to parse extraction JSON', raw: rawText.slice(0, 1000) }),
          { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
    }

    // DEBUG: log extraction result so it's visible in Supabase function logs
    console.log('[analyse-jd] extraction result (' + provider + '):', JSON.stringify({
      work_model: (analysis.practical as Record<string, unknown>)?.work_model,
      notes: (analysis.practical as Record<string, unknown>)?.notes,
      responsibilities: analysis.responsibilities,
      hidden_expectations: analysis.hidden_expectations,
      candidate_specific_frictions: analysis.candidate_specific_frictions,
    }, null, 2))

    // Provenance — stamp the deployed extraction prompt version on every response.
    usage.analyse_jd_version = ANALYSE_JD_VERSION

    return new Response(
      JSON.stringify({ analysis, usage }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('[analyse-jd] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
