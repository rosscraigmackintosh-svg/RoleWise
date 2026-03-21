# analyse-jd Edge Function — Required Remote Update

The `analyse-jd` function exists only on the remote Supabase instance.
Apply these changes directly in the Supabase Dashboard (Edge Functions editor).

## 1. Add `formatCandidateContext()` with learned behaviour support

If the function already has a `formatCandidateContext()`, replace it.
If it doesn't (and just passes `candidate_context` as raw JSON), add this function
and call it to build the candidate block in the user message.

```typescript
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
```

## 2. Add `similar_pattern_matches` and `pattern_type` to the extraction output schema

In the system prompt, add these two fields to the OUTPUT SCHEMA:

```
  "similar_pattern_matches": [],
  "pattern_type": null
```

And add these FIELD RULES:

```
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
```

## 3. Inject candidate context into the user message

Where the function builds the user message, append the candidate context block:

```typescript
const { jd_text, candidate_context } = await req.json()

let userMessage = `Here is the job description:\n\n${jd_text}`

const candidateBlock = formatCandidateContext(candidate_context || null)
if (candidateBlock) {
  userMessage += '\n\n---\n\n' + candidateBlock
}
```

## 4. Verification

After applying, the function should:
- Accept `{ jd_text, candidate_context }` in the request body
- Format `candidate_context` (including `learned_behaviour`) into prompt text
- Include `similar_pattern_matches` and `pattern_type` in the extraction output
- Return `{ analysis, usage }` as before
