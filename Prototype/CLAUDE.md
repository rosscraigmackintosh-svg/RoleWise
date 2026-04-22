# CLAUDE.md

## Purpose

This file is the working handoff context for continuing the Rolewise prototype.

Read the existing prototype in the local project folder first and treat that as the current visual and interaction source of truth:

`dropbox/claude/02_products/rolewise/prototype`

The goal is to continue the prototype from its current state, not to restart or replace its design direction.

## First rule

Before making any design or code changes:

1. Inspect the prototype folder thoroughly.
2. Understand the current layout, navigation, component patterns, spacing, typography, tone, and interaction style.
3. Reuse and extend the existing prototype direction.
4. Do not introduce a new visual system unless there is a clear existing gap.

## What Rolewise is

Rolewise is a decision support product for job seekers.

It helps people decide whether a role is worth pursuing.

It is not:
- a job board
- a CRM
- an ATS
- a productivity dashboard
- an optimisation engine
- a scoring system

The product should help the user:
- understand what a role really is
- spot friction and uncertainty early
- track decisions and outcomes
- learn from patterns over time

## Core product principles

These principles matter across the whole product:

- Clarity over optimism
- Judgement over automation
- Trust over persuasion
- Calm tone
- Plain English
- No hype
- No cheerleading
- No scores
- No ranking
- No prediction
- No traffic-light verdicts
- No fake precision

The product should feel calm, structured, helpful, and grounded in reality.

## Important behavioural rules

- Do not invent missing information.
- If something is unclear, mark it as not stated or unknown.
- Separate stated facts from inferred observations where relevant.
- Do not force a verdict when key facts are missing.
- If salary is stated annually, always also show the monthly equivalent.
- If a salary range is given, show both monthly equivalents.
- If no salary is stated, write `Salary: Not stated`.
- If a role requires production-level coding from the designer, treat it as a hard no.
- If coding is only for prototyping or exploratory work, it is acceptable.
- Never use em dashes in user-facing copy.

## Product areas defined in this conversation

The following product surfaces have been conceptually defined and should be treated as part of the current product model.

### 1. Overview
A live briefing page that shows what is happening right now.
It should feel like a calm snapshot, not a KPI dashboard.

### 2. Roles
The primary working surface.
A contextual list of roles the user is actively considering.
Not a spreadsheet or CRM table.

### 3. Applications
A record of real commitments and outcomes.
Should feel time-aware and grounded in actual progress.

### 4. Recruiters
A memory of recruiter interactions over time.
Should feel human and narrative, not CRM-like.

### 5. Insights
A reflection layer for patterns emerging over time.
Should be observational, not analytical theatre.

### 6. Documents
A place for CV variants and working application materials.
Should feel like working tools, not file storage.

### 7. Settings
A place for preferences and control.
Should feel like how the system works for the user, not a settings dump.

### 8. Profile
A reflection of what Rolewise understands about the user.
Should feel derived and trust-building, not like a static social profile.

### 9. Pattern History
A deeper long-term understanding layer, likely part of Rolewise Plus.
Should feel earned through repeated behaviour and outcomes, not like premium analytics.

### 10. Weekly Review
A structured reflection ritual for reviewing one week of search activity.
Should feel like a calm check-in, not a report.

### 11. Decision History
A record of decisions over time, with reasoning.
Should reinforce judgement and reduce second-guessing.

### 12. Add Role / Ingestion
The front door into the product.
Should feel lightweight, smart, and low-friction.
Not a form.

### 13. Role Analysis / Detail Page
This is the core decision surface.
It turns a job description into structured understanding.
This is one of the most important screens in the product.

### 14. Compensation Panel
A contextual salary and compensation utility that can open from salary references.
It should help users understand stated salary, monthly equivalent, and comparison with preferences.
It should not feel like a finance tool.

## Analysis page structure already defined

The role analysis page has a locked conceptual section order:

1. Sticky Role Header
2. Fit Reality Summary
3. Role Summary
4. Why This Role Exists
5. What You Would Actually Do
6. What They’re Really Looking For
7. Practical Details
8. Risks & Unknowns
9. Questions Worth Asking
10. Suggested Actions

This structure is important because the page is meant to support thinking, not just display AI output.

## Navigation consistency

Navigation should be consistent across screens.

The conceptual navigation model discussed was:

Primary:
- Overview
- Roles
- Applications
- Recruiters

Secondary:
- Insights
- Documents
- Settings

Other surfaces such as Weekly Review, Pattern History, and Decision History may be reached contextually rather than always appearing as top-level navigation.

Use the current prototype as the source of truth if the existing nav differs.

## Prototype-first working rule

When making future changes:

- inspect current patterns before adding new ones
- reuse existing spacing, rhythm, type scale, card treatment, and component behaviour
- extend the prototype coherently rather than rebuilding it
- preserve current design direction unless there is a strong reason to improve it
- aim for high visual quality and strong hierarchy
- be creative within the existing system, not against it

## Creativity guidance

Creativity is welcome.

However, it should show up through:
- layout quality
- hierarchy
- rhythm
- composition
- thoughtful interaction
- visual polish
- restraint

It should not show up through:
- novelty for novelty's sake
- random new patterns
- noisy visual effects
- dashboard clutter
- unnecessarily complex UI

## Interaction philosophy

The product should feel:
- alive
- current
- contextual
- grounded in real behaviour

The product should not feel:
- static
- over-instrumented
- dashboard-heavy
- enterprise-noisy

Prefer:
- narrative grouping
- state-based grouping
- contextual entry points
- lightweight slide-ins or panels where appropriate
- real-world labels and language

Avoid:
- giant control bars
- dense tables by default
- excessive filtering UI
- multiple competing CTAs

## Data and intelligence principles

Rolewise should always behave as a decision support product.

Important constraints:
- no scoring
- no ranking
- no success prediction
- no confidence meter
- no gamified progress
- no aggressive recommendation language

The system may surface:
- observations
- patterns
- questions worth asking
- risk signals
- practical comparisons

If data is weak, it should say there is not enough data yet.

## Compensation handling

Compensation logic discussed so far:

- always show monthly equivalent when salary is stated
- if annual range is provided, show both monthly equivalents
- if salary is missing, state that clearly and do not invent figures
- for contract roles, day-rate equivalents can be shown
- IR35-aware handling matters
- inside IR35 can allow indicative take-home ranges
- outside IR35 should avoid take-home modelling and stay gross-only
- compensation utilities should remain calm and contextual

## User preference rules that matter to the product

These matter to decision logic and future screens:

- Production-level coding required by the designer is a hard no
- Prototyping code is acceptable
- Heavy onsite expectations are usually a strong friction point
- Salary transparency matters
- Complex SaaS, AI tooling, data-heavy workflows, and high-ownership roles are often positive signals
- Marketing-heavy roles are often a negative signal
- Large organisation tolerance may matter as a late-stage filter

## Suggested working approach for Claude

When taking over the prototype:

1. Read the code and files in the prototype folder.
2. Summarise the current design system and interaction model.
3. Identify what already exists versus what is only conceptual.
4. Extend the current prototype carefully.
5. Keep screens coherent with one another.
6. Preserve trust, calmness, and clarity in all UI.

## What not to do

- Do not replace the existing prototype styling with a new visual direction.
- Do not turn Rolewise into a dashboard product.
- Do not add scores, gauges, progress circles, or visual verdict systems.
- Do not make screens feel like CRMs, ATS tools, BI dashboards, or spreadsheet UIs.
- Do not use em dashes in user-facing content.

## Practical next step

Before any design work:

- inspect the prototype folder
- understand the current prototype deeply
- document the current structure, screens, components, and design direction
- then propose the next change from that grounded understanding

