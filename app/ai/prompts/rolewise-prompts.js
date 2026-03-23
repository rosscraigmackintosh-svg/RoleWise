// =============================================================================
// Rolewise Prompt Layer — v4.0 (candidate-aware)
// Three-brain AI architecture. Source of truth for all Claude API calls.
//
// Loaded as a plain <script> before app.js.  No bundler or ES modules required.
//
// ─── WHY THREE BRAINS ──────────────────────────────────────────────────────
// Rolewise has three distinct AI jobs:
//
//   Pass 1: Extraction Brain — structured, precise, signal-driven.
//   Used for: analysing pasted JDs, extracting structured JSON with
//   fit signals, responsibilities, risks, practical details, and
//   decision factors — all evaluated against candidate context.
//
//   Pass 2: Narrative Brain — editorial, concise, decision-focused.
//   Used for: turning Pass 1 JSON into the 8-section decision narrative.
//   Personalised to the candidate. This is the FINAL output step.
//
//   Chat Guidance Brain — conversational, calm, advisory.
//   Used for: user questions about a role, follow-up advice, commute and
//   practical questions, "is this worth my time?" style conversation.
//
// All brains share the same underlying language rules (ROLEWISE_LANGUAGE_RULEBOOK)
// but behave differently. The split keeps each feeling like Rolewise — just
// in the right way.
//
// ─── CANDIDATE CONTEXT ───────────────────────────────────────────────────────
// Both Pass 1 and Pass 2 receive a CANDIDATE CONTEXT block that describes
// the user's background, strengths, preferences, blockers, and CV variants.
// This is how Rolewise makes output feel like "this role in relation to you"
// rather than "a generic analysis of the role."
//
// The context is USER-DRIVEN, not hardcoded. At runtime, app.js loads the
// user's candidate_profile + candidate_learning from Supabase and builds
// the live context object. ROLEWISE_CANDIDATE_SEED below is seed data for
// first-time setup only.
//
// Injected into prompts via buildCandidateContextBlock().
//
// ─── ROUTING REFERENCE ───────────────────────────────────────────────────────
//   callAnalysisAPI()       → Pass 1 (buildExtractionPrompt + candidate context)
//                           → Pass 2 (buildNarrativePrompt + candidate context)
//   callWorkspaceChatAPI()  → buildRolewiseChatSystemPrompt() → workspace-chat edge fn
//
// All must follow ROLEWISE_LANGUAGE_RULEBOOK. Do not bypass it.
// =============================================================================


// ─── Shared Language Layer ────────────────────────────────────────────────────
// Source: /specs/Rolewise Language Rulebook v1.md
// Used by all brains. Do not duplicate this text in individual prompts.

var ROLEWISE_LANGUAGE_RULEBOOK = `You are part of Rolewise, a product that helps experienced professionals understand job opportunities and decide whether they are worth pursuing.

Rolewise is a decision-support tool, not a job board, recruiter, or scoring engine.

All responses must follow these language rules:

- Sound calm, thoughtful, practical, and experienced
- Use plain English
- Avoid hype, marketing copy, recruiter language, and AI buzzwords
- Never sound defensive or robotic
- Never say things like "I can't do that", "that's outside what I can do", or "you need to search for that yourself"
- If exact information is unavailable, provide a useful estimate or practical context
- Never score roles numerically
- Never rank roles
- Never predict whether the user will get the job
- Never imply rejection reflects the user's value or ability
- Focus on helping the user decide whether the role is worth their time
- Prefer confidence-weighted phrasing such as:
  - "This role appears to..."
  - "The JD suggests..."
  - "Signals in the description indicate..."
  - "This may involve..."
- Prioritise:
  1. Role reality
  2. Friction signals
  3. Questions worth asking

Rolewise should feel like a thoughtful, experienced colleague helping someone interpret a role clearly.`.trim();


// ─── Candidate Context ──────────────────────────────────────────────────────
// Source of truth for who the user is. Injected into Pass 1 and Pass 2 prompts.
// Future: replace with a live read from a user profile DB table.
//
// Schema:
//   identity          — name, seniority, years of experience
//   core_strengths    — what the candidate is known for (used to evaluate fit)
//   preferred_envs    — types of company/team environments they thrive in
//   work_model_pref   — remote, hybrid, on-site preference + tolerance
//   hard_blockers     — things that are an automatic skip
//   known_frictions   — recurring issues that often cause problems
//   cv_variants       — available CV versions with short descriptions
//   decision_lens     — personal rules for evaluating roles
//   learned_behaviour — patterns from past decisions and outcomes (populated at runtime)

// Seed data — used to populate candidate_profile for first-time users.
// NOT used directly by the pipeline. The pipeline reads from the live context.
var ROLEWISE_CANDIDATE_SEED = {
  identity: {
    name: 'Ross',
    seniority: 'Senior / Lead Product Designer',
    years_experience: '15+',
    location: 'Surrey, UK',
  },
  core_strengths: [
    'Zero-to-one product design in complex SaaS and health-tech environments',
    'Design systems architecture and component library ownership',
    'Cross-functional leadership without formal management title',
    'Research-driven design process with strong discovery skills',
    'Simplifying complex workflows for non-technical users',
    'Founding/early-stage design function build-out',
  ],
  preferred_environments: [
    'Product-led companies where design has real influence',
    'Small to mid-size teams (5-50 people)',
    'Series A through Series C stage',
    'Complex problem domains (health, fintech, enterprise SaaS)',
    'Teams that ship iteratively, not waterfall',
  ],
  work_model_preference: {
    ideal: 'Remote or hybrid (max 2 days in office)',
    hard_limit: '3+ days on-site is a hard no',
    commute_tolerance: '~60 minutes each way',
    location_base: 'Surrey, UK',
  },
  hard_blockers: [
    'Roles requiring production-level frontend coding',
    '3+ days per week on-site',
    'Pure visual/brand design roles with no product ownership',
    'Agencies or outsourced design services',
    'Roles where design reports into marketing',
  ],
  known_frictions: [
    'Large enterprise orgs with slow decision-making',
    'Companies that treat design as a service function',
    'Roles where "senior" actually means mid-level execution only',
    'JDs heavy on tools (Figma expert, Sketch guru) rather than outcomes',
    'Matrix reporting with no clear design leadership',
  ],
  cv_variants: [
    { id: 'founding-product-designer', label: 'Founding Product Designer', best_for: 'Zero-to-one roles, early stage, building design from scratch' },
    { id: 'senior-product-designer', label: 'Senior Product Designer', best_for: 'Established teams, IC-heavy roles, hands-on product design' },
    { id: 'design-lead', label: 'Design Lead', best_for: 'Team leadership, design ops, cross-functional coordination' },
    { id: 'product-design-contractor', label: 'Product Design Contractor', best_for: 'Contract roles, short-term engagements, specific project scopes' },
  ],
  decision_lens: [
    'Does this role give me real product ownership or am I a pixel pusher?',
    'Will I be solving genuinely complex problems?',
    'Is the work model compatible with my life?',
    'Is the seniority level honest or inflated?',
    'Does the company actually value design?',
    'Can I see myself staying 2+ years?',
  ],
};

// Backwards-compat alias — any code referencing ROLEWISE_CANDIDATE_CONTEXT
// gets the seed until app.js replaces it with the live DB-loaded context.
var ROLEWISE_CANDIDATE_CONTEXT = ROLEWISE_CANDIDATE_SEED;

/**
 * Replaces the live candidate context at runtime.
 * Called by app.js after loading candidate_profile + candidate_learning from DB.
 *
 * @param {Object} liveCtx - Full context object (same shape as seed + learned_behaviour)
 */
function _setLiveCandidateContext(liveCtx) {
  if (liveCtx && typeof liveCtx === 'object') {
    ROLEWISE_CANDIDATE_CONTEXT = liveCtx;
  }
}


/**
 * Formats the candidate context into a plain-text block for prompt injection.
 * Used by both Pass 1 and Pass 2 prompts.
 *
 * @param {Object} [ctx] - Override context object. Defaults to ROLEWISE_CANDIDATE_CONTEXT.
 * @returns {string}
 */
function buildCandidateContextBlock(ctx) {
  var c = ctx || ROLEWISE_CANDIDATE_CONTEXT;
  if (!c || typeof c !== 'object') return '';

  var lines = ['CANDIDATE CONTEXT'];
  lines.push('(Evaluate the role against this specific candidate. Do not produce generic analysis.)');
  lines.push('');

  // Identity
  if (c.identity) {
    var id = c.identity;
    lines.push('WHO: ' + [id.name, id.seniority, id.years_experience + ' years experience', id.location].filter(Boolean).join(' | '));
  }

  // Core strengths
  if (Array.isArray(c.core_strengths) && c.core_strengths.length) {
    lines.push('');
    lines.push('CORE STRENGTHS:');
    c.core_strengths.forEach(function(s) { lines.push('- ' + s); });
  }

  // Preferred environments
  if (Array.isArray(c.preferred_environments) && c.preferred_environments.length) {
    lines.push('');
    lines.push('PREFERRED ENVIRONMENTS:');
    c.preferred_environments.forEach(function(s) { lines.push('- ' + s); });
  }

  // Work model
  if (c.work_model_preference) {
    var wm = c.work_model_preference;
    lines.push('');
    lines.push('WORK MODEL:');
    if (wm.ideal) lines.push('- Ideal: ' + wm.ideal);
    if (wm.hard_limit) lines.push('- Hard limit: ' + wm.hard_limit);
    if (wm.commute_tolerance) lines.push('- Commute tolerance: ' + wm.commute_tolerance);
    if (wm.location_base) lines.push('- Based in: ' + wm.location_base);
  }

  // Hard blockers
  if (Array.isArray(c.hard_blockers) && c.hard_blockers.length) {
    lines.push('');
    lines.push('HARD BLOCKERS (automatic skip if any of these apply):');
    c.hard_blockers.forEach(function(s) { lines.push('- ' + s); });
  }

  // Known frictions
  if (Array.isArray(c.known_frictions) && c.known_frictions.length) {
    lines.push('');
    lines.push('KNOWN FRICTIONS (not blockers, but recurring problems):');
    c.known_frictions.forEach(function(s) { lines.push('- ' + s); });
  }

  // CV variants
  if (Array.isArray(c.cv_variants) && c.cv_variants.length) {
    lines.push('');
    lines.push('CV VARIANTS AVAILABLE:');
    c.cv_variants.forEach(function(v) {
      lines.push('- ' + v.label + ' (' + v.id + '): ' + v.best_for);
    });
  }

  // Decision lens
  if (Array.isArray(c.decision_lens) && c.decision_lens.length) {
    lines.push('');
    lines.push('DECISION LENS (how this candidate evaluates roles):');
    c.decision_lens.forEach(function(s) { lines.push('- ' + s); });
  }

  // ── Learned behaviour (populated at runtime from candidate_learning) ──
  var lb = c.learned_behaviour;
  if (lb && typeof lb === 'object') {
    var hasLearning = false;

    if (Array.isArray(lb.roles_you_pursue) && lb.roles_you_pursue.length) {
      if (!hasLearning) { lines.push(''); lines.push('LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true; }
      lines.push('');
      lines.push('ROLES THIS CANDIDATE TENDS TO PURSUE:');
      lb.roles_you_pursue.forEach(function(s) { lines.push('- ' + s); });
    }

    if (Array.isArray(lb.roles_you_skip) && lb.roles_you_skip.length) {
      if (!hasLearning) { lines.push(''); lines.push('LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true; }
      lines.push('');
      lines.push('ROLES THIS CANDIDATE TENDS TO SKIP:');
      lb.roles_you_skip.forEach(function(s) { lines.push('- ' + s); });
    }

    if (Array.isArray(lb.successful_role_patterns) && lb.successful_role_patterns.length) {
      if (!hasLearning) { lines.push(''); lines.push('LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true; }
      lines.push('');
      lines.push('PATTERNS FROM ROLES THAT LED TO POSITIVE OUTCOMES (interview/offer):');
      lb.successful_role_patterns.forEach(function(s) { lines.push('- ' + s); });
    }

    if (Array.isArray(lb.recurring_blockers) && lb.recurring_blockers.length) {
      if (!hasLearning) { lines.push(''); lines.push('LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true; }
      lines.push('');
      lines.push('RECURRING FRICTION THEMES (from skipped or negative-outcome roles):');
      lb.recurring_blockers.forEach(function(s) { lines.push('- ' + s); });
    }

    if (Array.isArray(lb.friction_patterns) && lb.friction_patterns.length) {
      if (!hasLearning) { lines.push(''); lines.push('LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true; }
      lines.push('');
      lines.push('FRICTION PATTERNS:');
      lb.friction_patterns.forEach(function(s) { lines.push('- ' + s); });
    }

    if (lb.preferred_cv_by_role_type && typeof lb.preferred_cv_by_role_type === 'object') {
      var cvKeys = Object.keys(lb.preferred_cv_by_role_type);
      if (cvKeys.length) {
        if (!hasLearning) { lines.push(''); lines.push('LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true; }
        lines.push('');
        lines.push('CV PREFERENCE BY ROLE TYPE (from past successful applications):');
        cvKeys.forEach(function(k) { lines.push('- ' + k + ': ' + lb.preferred_cv_by_role_type[k]); });
      }
    }

    if (typeof lb.total_roles_analysed === 'number' && lb.total_roles_analysed > 0) {
      if (!hasLearning) { lines.push(''); lines.push('LEARNED BEHAVIOUR (from past decisions):'); hasLearning = true; }
      lines.push('');
      lines.push('DECISION STATS: ' + lb.total_roles_analysed + ' roles analysed, '
        + (lb.total_applied || 0) + ' applied, '
        + (lb.total_skipped || 0) + ' skipped, '
        + (lb.total_interviewed || 0) + ' reached interview, '
        + (lb.total_offered || 0) + ' received offers');
    }
  }

  return lines.join('\n');
}


// ─── Pass 1: Extraction Brain ───────────────────────────────────────────────
// Used by: callAnalysisAPI() → analyse-jd edge function (first pass)
// Optimised for: precise structured extraction, no interpretation,
// no narrative, deterministic JSON output.
// Now candidate-aware: extracts fit signals and frictions relative to
// the specific candidate, not generically.

var ROLEWISE_EXTRACTION_PROMPT = `You are extracting structured insights from a job description.
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
- e.g. "This is a zero-to-one role building design from scratch, which maps directly to your Founding Product Designer positioning."
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
- A work_model of "On-site" in metadata MUST appear as "On-site" in output — do NOT mark it "Not stated".
- Same rule applies to location and employment_type.
For fields absent from any metadata: extract only what is explicitly stated in the JD. If genuinely absent everywhere, use "Not stated".
company_mismatch:
- If a STRUCTURED_METADATA block provides a company_name AND the JD text references a clearly different company, set company_mismatch to the JD company name.
- If names match or only one source has a company name, set company_mismatch to null.
- Do NOT guess which name is correct.
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
- e.g. "3+ days per week on-site"
- If no hard blocker is triggered, return null
similar_pattern_matches:
- If the LEARNED BEHAVIOUR section is present in the candidate context, compare this role against it
- Return up to 3 short observations about how this role matches or diverges from learned patterns
- e.g. "This resembles roles the candidate tends to pursue (early-stage, product-led)"
- e.g. "Similar company stage to roles where the candidate has had positive outcomes"
- e.g. "On-site requirement matches a recurring skip reason"
- If no learned behaviour is available, return an empty array
pattern_type:
- Based on learned behaviour, classify this role: "pursue_pattern" | "skip_pattern" | "mixed" | null
- "pursue_pattern": this role matches patterns the candidate tends to apply to
- "skip_pattern": this role matches patterns the candidate tends to skip
- "mixed": some signals match pursue, some match skip
- null: no learned behaviour available or no clear match

CONSTRAINTS
- No repetition across fields
- Keep arrays concise (max ~6 items each)
- Do not use the em dash character anywhere
- Do not include commentary
- Output must be valid JSON
- candidate_fit_signals and candidate_specific_frictions must reference the actual candidate context, not generic observations`.trim();


// ─── Pass 2: Narrative Brain ────────────────────────────────────────────────
// Used by: callAnalysisAPI() → analyse-jd edge function (second pass)
// Optimised for: editorial clarity, decision-support, the 8-section
// narrative structure. Now candidate-aware: output is personalised
// to the specific candidate, not generic. This is the FINAL output step.

var ROLEWISE_NARRATIVE_PROMPT = `You are generating a Rolewise Applicant Mode analysis.
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
- framing: one sentence that frames the work (e.g. "Mix of product design, systems work, and team enablement.")
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
- Short paragraphs > long blocks
- Bullet points only where helpful (use - prefix)
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
- Total output is readable in under 30 seconds
- Output is valid JSON matching the schema above
If any of these fail, rewrite before returning.`.trim();


// ─── Pass 3: Refinement Brain (DEBUG ONLY) ──────────────────────────────────
// NOT part of the normal pipeline. Kept as a fallback/debug tool.
// Only called manually or when Pass 2 output fails quality validation.

var ROLEWISE_REFINEMENT_PROMPT = `You are refining a Rolewise Applicant Mode output.
Your job is to make this tighter, clearer, and more decisive.
Do NOT change the structure.
Do NOT add new content.
Only improve clarity and sharpness.

RULES
- Remove repetition across sections
- Shorten sentences wherever possible
- Remove any "report-like" or generic phrasing
- Keep tone calm, direct, and human
- Prefer clarity over completeness

SECTION FIXES
Fit reality:
- Keep to 2-3 short paragraphs max
- Ensure one clear friction is obvious
- Remove any drift into role explanation
Role section:
- Remove any company "pitch" language
- Keep only what matters for understanding the role
What they need:
- Focus on expectations, not descriptions
- Remove any soft or generic phrasing
What you would do:
- Ensure first sentence frames the work clearly
- Keep bullets tight and practical
Risks:
- Make scannable (use bullets if needed)
- Remove dense paragraphs
Decision:
- Must be sharp and easy to act on
- Remove soft language
- Ensure clear conditional:
  If X, pursue
  If Y, skip

STYLE
- Cut length by ~20%
- No fluff
- No repetition
- No "AI tone"
- No em dash character

FINAL LINE
Ensure it ends with:
Use this as context, not a verdict.`.trim();


// ─── Chat Guidance Brain ────────────────────────────────────────────────────
// Used by: callWorkspaceChatAPI() → workspace-chat edge function
// Optimised for: natural conversation, helpful estimates, practical advice,
// decision support, calm tone, zero chatbot defensiveness.

var ROLEWISE_CHAT_GUIDANCE_PROMPT = `You are the Rolewise Chat Guidance Brain.

Your job is to help users think clearly about a role, a company, a commute, a process, or whether something is worth pursuing.

You are not a generic assistant.
You are a calm, experienced job-decision companion.

When answering users:

- Interpret the decision behind the question, not just the literal wording
- Be helpful even when information is incomplete
- Use estimates where appropriate
- Provide practical context
- Keep the conversation moving forward
- Sound natural, thoughtful, and grounded
- Never sound defensive or blocked by system limits
- Never say "I can't do that" or similar phrases
- Avoid over-analysis if the user needs a practical answer

For practical questions (commute, salary, location, visa, remote policy, and similar):

- Answer the question directly first
- Only reference the broader role analysis if it materially changes the answer
- Do not repeat earlier role evaluation unless the user explicitly asks about fit, whether to apply, or a specific decision

For recruiter-posted roles (when the company name in the JD is a recruitment firm):

- Identify the recruiter as a recruiter, not as the hiring company
- Explain both layers: who is advertising the role, and who the actual employer is
- If the employer is not named in the JD, say so clearly, do not guess

For example:

- If asked about commute, help the user judge whether it is realistic
- If asked about salary, help the user judge whether it is likely viable
- If asked about role fit, help the user think about leverage, ownership, and friction
- If details are missing, acknowledge uncertainty calmly and offer a reasonable approximation

You should feel like an experienced colleague helping the user make better role decisions in real time.`.trim();


// Keep old variable name as alias for backwards compatibility with
// any edge function code referencing ROLEWISE_JD_ANALYSIS_PROMPT.
var ROLEWISE_JD_ANALYSIS_PROMPT = ROLEWISE_EXTRACTION_PROMPT;


// ─── Prompt Assembly Helpers ────────────────────────────────────────────────

/**
 * Returns the system prompt for Pass 1: JD extraction.
 * Includes candidate context so extraction is personalised.
 *
 * @param {Object} [candidateCtx] - Override candidate context. Defaults to ROLEWISE_CANDIDATE_CONTEXT.
 * @returns {string}
 */
function buildExtractionPrompt(candidateCtx) {
  var candidateBlock = buildCandidateContextBlock(candidateCtx);
  return ROLEWISE_LANGUAGE_RULEBOOK + '\n\n---\n\n' + ROLEWISE_EXTRACTION_PROMPT
    + (candidateBlock ? '\n\n---\n\n' + candidateBlock : '');
}

/**
 * Returns the system prompt for Pass 2: narrative generation.
 * Includes candidate context so the narrative is personalised.
 * This is the FINAL output step in the normal pipeline.
 *
 * @param {Object} [candidateCtx] - Override candidate context. Defaults to ROLEWISE_CANDIDATE_CONTEXT.
 * @returns {string}
 */
function buildNarrativePrompt(candidateCtx) {
  var candidateBlock = buildCandidateContextBlock(candidateCtx);
  return ROLEWISE_LANGUAGE_RULEBOOK + '\n\n---\n\n' + ROLEWISE_NARRATIVE_PROMPT
    + (candidateBlock ? '\n\n---\n\n' + candidateBlock : '');
}

/**
 * Returns the system prompt for Pass 3: refinement (debug only).
 * NOT called in the normal pipeline.
 *
 * @returns {string}
 */
function buildRefinementPrompt() {
  return ROLEWISE_LANGUAGE_RULEBOOK + '\n\n---\n\n' + ROLEWISE_REFINEMENT_PROMPT;
}

/**
 * Backwards-compatible alias. Returns extraction prompt.
 * Used by: the analyse-jd edge function if it still references this name.
 *
 * @returns {string}
 */
function buildRolewiseJDSystemPrompt() {
  return buildExtractionPrompt();
}

/**
 * Returns the full system prompt for chat guidance requests.
 * Combines the shared language rulebook with the Chat Guidance Brain prompt.
 *
 * Used by: callWorkspaceChatAPI() and the workspace-chat edge function.
 *
 * @returns {string}
 */
function buildRolewiseChatSystemPrompt() {
  return ROLEWISE_LANGUAGE_RULEBOOK + '\n\n---\n\n' + ROLEWISE_CHAT_GUIDANCE_PROMPT;
}

/**
 * Converts a live role context object into a compact plain-text block
 * suitable for embedding in a Claude user message.
 *
 * Handles all fields assembled by app.js for callWorkspaceChatAPI:
 *   company_name, role_title, stage, role_summary, practical_details,
 *   risks, memory_signals, briefing, decisions, salary_calc.
 *
 * @param {Object} context
 * @returns {string}
 */
function buildRolewiseContextBlock(context) {
  if (!context || typeof context !== 'object') return '';

  var lines = [];

  if (context.role_title || context.company_name) {
    var who = [context.role_title, context.company_name].filter(Boolean).join(' at ');
    lines.push('ROLE: ' + who);
  }
  if (context.stage) {
    lines.push('STAGE: ' + context.stage);
  }
  if (context.role_summary) {
    lines.push('ROLE SUMMARY: ' + context.role_summary);
  }

  if (context.practical_details && typeof context.practical_details === 'object') {
    var pd = context.practical_details;
    var pdParts = [];
    if (pd.location)         pdParts.push('Location: '   + pd.location);
    if (pd.remote_model)     pdParts.push('Work model: ' + pd.remote_model);
    if (pd.employment_type)  pdParts.push('Type: '       + pd.employment_type);
    if (pd.salary_annual)    pdParts.push('Salary: '     + pd.salary_annual);
    if (pd.reporting_line)   pdParts.push('Reports to: ' + pd.reporting_line);
    if (pdParts.length > 0)  lines.push('PRACTICAL DETAILS: ' + pdParts.join(' | '));
  }

  if (context.risks) {
    lines.push('RISKS / UNKNOWNS: ' + context.risks);
  }

  if (Array.isArray(context.memory_signals) && context.memory_signals.length > 0) {
    lines.push('USER SIGNALS:');
    context.memory_signals.forEach(function(s) { lines.push('  ' + s); });
  }

  if (context.salary_calc && context.salary_calc.breakdowns) {
    lines.push('SALARY BREAKDOWN (' + (context.salary_calc.note || 'UK PAYE estimate') + '):');
    context.salary_calc.breakdowns.forEach(function(b) {
      lines.push(
        '  ' + b.label + ': gross \u00A3' + b.gross_monthly + '/mo | ' +
        'pension \u00A3' + b.pension_monthly + '/mo | ' +
        'tax \u00A3' + b.tax_monthly + '/mo | ' +
        'NI \u00A3' + b.ni_monthly + '/mo | ' +
        'take-home \u00A3' + b.take_home_monthly + '/mo'
      );
    });
  }

  if (context.briefing && typeof context.briefing === 'object') {
    var br = context.briefing;
    var brParts = [];
    if (br.headline)      brParts.push(br.headline);
    if (br.salary)        brParts.push('Salary: ' + br.salary);
    if (br.work_model)    brParts.push('Work model: ' + br.work_model);
    if (br.last_decision) brParts.push('Last decision: ' + br.last_decision);
    if (brParts.length > 0) lines.push('BRIEFING: ' + brParts.join(' | '));
  }

  return lines.join('\n');
}


// ─── Verification ─────────────────────────────────────────────────────────────
console.log(
  '[Rolewise] Prompt layer loaded (three-brain v4.0, candidate-aware).',
  '| Extraction:', buildExtractionPrompt().length, 'chars',
  '| Narrative:',  buildNarrativePrompt().length, 'chars',
  '| Chat:',       buildRolewiseChatSystemPrompt().length, 'chars',
  '| Candidate:',  buildCandidateContextBlock().length, 'chars'
);
