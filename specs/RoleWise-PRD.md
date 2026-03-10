# RoleWise — Product Requirements Document

**Version:** 1.0
**Date:** March 2026
**Status:** Draft
**Author:** Ross Mackintosh

---

## Overview

RoleWise is a calm decision layer between job seekers and job listings. It helps users decide whether a role is worth pursuing before they invest time applying — translating noisy, often misleading job descriptions into plain-language reality checks and tracking the full application lifecycle.

---

## 1. Problem Statement

Job listings are frequently misleading, vague, or unrealistic. They obscure real expectations, omit salary, blur boundaries between disciplines, and exaggerate scope — making it genuinely difficult for experienced professionals to quickly assess whether a role is a good fit.

The result is a familiar pattern: a user applies hastily, invests significant time tailoring a CV, then discovers in a first call that the role requires production coding, is entirely on-site, or is actually junior despite the senior title. This wastes time on both sides and erodes confidence in the job search process.

**Who experiences this:** Mid-to-senior individual contributors — particularly in design, product, and adjacent knowledge work roles — who are either actively searching or open to the right opportunity. These users value judgment over volume and want to protect their time.

**How often:** Every time a role is encountered, typically multiple times per week during an active search.

**Cost of not solving it:**
- Users send 40–60 applications hoping something sticks, rather than 10–15 targeted ones
- Time lost on unsuitable interviews and screening calls
- No structured record of what was applied to, when, and what happened
- No visibility into market patterns (what companies actually pay, what skills are actually in demand)

---

## 2. Goals

### User Goals

1. **Reduce decision time per listing.** A user should be able to evaluate a job listing and reach a clear go / no-go decision in under 5 minutes, compared to an estimated 20–30 minutes of reading, re-reading, and second-guessing today.

2. **Eliminate avoidable mismatches.** Users should never reach a recruiter screen only to discover a dealbreaker that was knowable from the listing. RoleWise should surface those mismatches immediately at the analysis stage.

3. **Remove the overhead of application tracking.** Users should be able to maintain a clear, structured record of their pipeline without managing spreadsheets or remembering where things stand.

4. **Build personal market intelligence over time.** After 10+ roles analysed, users should be able to see patterns in the market — salary ranges, coding expectations, hybrid requirements — that inform their strategy.

### Business Goals

5. **Establish RoleWise as the default job analysis layer for senior IC job seekers**, particularly in design and product disciplines, measured by DAU/WAU ratio and qualitative retention signals.

---

## 3. Non-Goals

The following are explicitly out of scope for v1:

1. **Scoring or ranking jobs.** RoleWise does not produce a numeric fit score or rank roles against each other. Reducing a nuanced decision to a score undermines the user's judgment and invites gaming. Scores may be revisited in a later Radar Mode feature for market-level benchmarking, but never for individual application decisions.

2. **Predicting hiring outcomes.** RoleWise does not estimate a user's probability of getting the job. This requires data RoleWise does not have, risks false confidence, and shifts focus from decision quality to outcome prediction.

3. **CV or cover letter generation.** RoleWise recommends which CV version to use but does not write or rewrite CVs. Generating application materials is a separate, substantial product surface that would change the positioning from "decision layer" to "application assistant."

4. **Company rating or ranking.** RoleWise does not score employers, display Glassdoor-style reviews, or rank companies. This is legally complex, requires external data, and distracts from the core use case.

5. **Pushing users to apply.** RoleWise contains no CTAs encouraging users to submit applications, no "Apply now" integrations, and no nudges toward higher application volume. The product philosophy is quality over quantity.

---

## 4. User Stories

### Core Analysis Flow

**US-01 — Paste and analyse a listing**
> As an active job seeker, I want to paste a job description into RoleWise and receive a structured breakdown so that I can quickly understand what the role actually involves without re-reading the listing three times.

**US-02 — Surface practical details**
> As a job seeker, I want to see salary, location, and work model clearly extracted and presented so that I do not have to hunt through a wall of text to find the basics.

**US-03 — Identify risks and unknowns**
> As a job seeker, I want RoleWise to flag risks and ambiguities in the listing (e.g. "no salary stated", "scope unclear", "requires production coding") so that I can decide quickly whether to proceed or skip.

**US-04 — Apply personal rules**
> As a job seeker, I want to define my own non-negotiables (e.g. "hard no if production coding required", "flag if no salary disclosed") so that RoleWise can surface violations automatically without me having to check them manually each time.

**US-05 — View a plain-language role summary**
> As a job seeker, I want a plain-English summary of what I would actually do day-to-day in this role so that I can make an honest assessment of whether the work appeals to me.

### CV Version Recommendation

**US-06 — Get a CV version recommendation**
> As a job seeker who maintains multiple CV versions (e.g. Founding Designer, Principal Designer, Lead Designer), I want RoleWise to recommend the most appropriate version based on the role so that my application is calibrated to the seniority and scope the company is looking for.

**US-07 — Understand the reasoning behind the recommendation**
> As a job seeker, I want to see why a particular CV version was recommended so that I can agree or override the suggestion with confidence.

### Application Tracking

**US-08 — Save a role to my pipeline**
> As a job seeker, I want to save a role I have analysed into my application pipeline so that I have a structured record of everything I am tracking.

**US-09 — Update application stage**
> As a job seeker, I want to move a saved role through lifecycle stages (JD Review → Saved → Applied → Recruiter Screen → Hiring Manager → Panel → Final → Offer → Closed) so that I always know where things stand without maintaining a separate spreadsheet.

**US-10 — View my full pipeline at a glance**
> As a job seeker with multiple active applications, I want to see all my tracked roles in one view with their current stage so that I can prioritise follow-ups and manage my energy.

**US-11 — Close a role with context**
> As a job seeker, I want to mark a role as Closed and record why (e.g. "withdrew", "rejected at panel", "offer declined") so that my pipeline stays clean and I can learn from patterns over time.

### Market Intelligence (Radar Mode — v1 foundation)

**US-12 — View aggregate stats from my pipeline**
> As a job seeker who has tracked 10+ roles, I want to see summary statistics about the roles I have reviewed (e.g. % requiring coding, typical salary range, most common work model) so that I can understand the market I am operating in.

**US-13 — Identify where my applications are converting**
> As a job seeker with several applications in flight, I want to see which channels and company types have led to the most responses so that I can focus my efforts more effectively.

### Edge Cases

**US-14 — Handle incomplete listings**
> As a job seeker pasting a partial or unusually formatted listing, I want RoleWise to still extract what it can and clearly flag what is missing so that I know where the gaps are.

**US-15 — Re-analyse a listing**
> As a job seeker, I want to re-run analysis on a previously saved listing (e.g. after the posting was updated) so that my assessment reflects the current version of the role.

**US-16 — Empty state — no tracked roles yet**
> As a new user with no pipeline history, I want clear prompts and context about what to do next so that I can start immediately without confusion.

---

## 5. Requirements

### Must-Have — P0 (v1 cannot ship without these)

**R-01 — JD Analysis Engine**
- Accept free-text paste of a job description (minimum 100 characters)
- Extract and structure: role title, company name, role summary, day-to-day responsibilities, requirements, salary (if stated), location, and work model
- Generate a plain-English "What this role is really about" summary
- Flag risks and unknowns (missing salary, vague scope, coding required, excessive seniority mismatch)
- *Acceptance criteria:* Given a pasted JD, the analysis output renders within 10 seconds; all extractable fields are populated; missing fields are clearly marked as "not stated"

**R-02 — Personal Rules Engine**
- User can define up to 20 personal non-negotiable rules
- Rules are evaluated against each JD analysis automatically
- Violations are surfaced prominently in the analysis output (not buried)
- *Acceptance criteria:* Given a rule "flag if no salary stated", when a JD with no salary is analysed, then the flag appears in the risk section before the user has to scroll

**R-03 — CV Version Recommendation**
- User can register up to 10 named CV versions
- Based on the analysed role, RoleWise recommends the most appropriate version
- Reasoning for the recommendation is displayed in 1–3 sentences
- *Acceptance criteria:* A recommendation is always produced; if no clear fit exists, RoleWise states why and suggests the closest match

**R-04 — Pipeline Tracking**
- User can save any analysed role to their pipeline
- Roles can be moved through 9 lifecycle stages: JD Review, Saved, Applied, Recruiter Screen, Hiring Manager, Panel, Final, Offer, Closed
- Each stage change is timestamped
- *Acceptance criteria:* Stage changes persist across sessions; closing a role prompts for a reason (optional); closed roles are visually distinct from active ones

**R-05 — Pipeline Dashboard**
- Single-view display of all tracked roles, grouped or filterable by stage
- Each card shows: company, role title, current stage, days since last update
- *Acceptance criteria:* Dashboard renders in under 2 seconds; updating a stage from the dashboard does not require navigating away

### Nice-to-Have — P1

**R-06 — Stats Dashboard (Radar Mode foundation)**
- Aggregate view of all analysed roles with summary statistics
- Metrics: % roles requiring coding, % with disclosed salary, average stated salary range, most common work model, breakdown by seniority level
- Available after 5+ roles have been analysed

**R-07 — Channel tracking on applications**
- When marking a role as Applied, user can log the channel (LinkedIn, direct, referral, recruiter outreach, job board)
- Channel-level conversion stats surface in the Stats dashboard

**R-08 — Notes per role**
- Free-text notes field on each tracked role
- Visible in the role detail view and exportable

**R-09 — Bulk import of existing applications**
- CSV upload to seed pipeline with roles not entered via the analysis flow
- Required fields: company, role title, current stage

### Future Considerations — P2 (design for, do not build)

**R-10 — Radar Mode (standalone market intelligence product)**
- Aggregate anonymised data across all RoleWise users to surface market-level signals
- Distinct product surface from Applicant Mode, potentially with its own pricing tier

**R-11 — Direct ATS / job board integrations**
- Browser extension or API integrations to pull listings directly from LinkedIn, Greenhouse, Lever, etc., without manual paste

**R-12 — Team / cohort mode**
- Share pipeline visibility within a trusted group (e.g. a job search accountability group)
- Requires privacy controls and explicit opt-in

**R-13 — Interview preparation module**
- After reaching Hiring Manager stage, surface role-specific prep prompts based on the original JD analysis

---

## 6. Success Metrics

### Leading Indicators (measure at 2 weeks and 4 weeks post-launch)

| Metric | Target | Stretch |
|--------|--------|---------|
| % of users who analyse 3+ roles in first week | 50% | 70% |
| % of users who save at least 1 role to pipeline | 60% | 80% |
| Time to complete first analysis (from paste to output) | < 5 min | < 3 min |
| Analysis task completion rate (user reaches output screen) | 85% | 95% |

### Lagging Indicators (measure at 60 and 90 days)

| Metric | Target | Stretch |
|--------|--------|---------|
| Week-4 retention (users still active after 4 weeks) | 30% | 50% |
| Avg roles tracked per active user | 5+ | 10+ |
| % of users with a defined Personal Rules set | 40% | 65% |
| Qualitative satisfaction (post-session prompt, 1–5) | ≥ 4.0 | ≥ 4.5 |

### Anti-Metrics (things RoleWise should not do)
- Do not optimise for volume of applications submitted — this is counter to the product philosophy
- Do not track time-on-site as a success metric — the product should help users make decisions faster, not keep them engaged longer

---

## 7. Open Questions

| # | Question | Owner | Blocking? |
|---|----------|-------|-----------|
| OQ-01 | What AI model powers the JD analysis? What is the latency / cost profile at scale? | Engineering | Yes — needed before R-01 design |
| OQ-02 | How are Personal Rules structured internally — natural language, structured fields, or hybrid? | Engineering + Design | Yes — affects R-02 UX |
| OQ-03 | Where are CV versions stored — uploaded files, named references, or metadata only? | Design | Yes — affects R-03 scope |
| OQ-04 | Should Radar Mode be a separate product with separate auth / pricing, or a feature of the same account? | Product | No — can be deferred to v2 planning |
| OQ-05 | Is there a mobile-first use case? Most JD reading happens on desktop, but pipeline checking could be mobile. | Design | No — but affects responsive design priority |
| OQ-06 | What is the data retention policy for stored JD analyses and pipeline data? | Legal / Product | No — needed before public launch |
| OQ-07 | Is there a free tier, or is RoleWise subscription-only from day one? | Product / Business | No — does not affect v1 feature scope |

---

## 8. Timeline Considerations

### Phasing Recommendation

**Phase 1 — Core Analysis (Weeks 1–6)**
JD analysis engine (R-01), Personal Rules (R-02), CV version recommendation (R-03). This is the minimum testable product: does the analysis output create value on its own?

**Phase 2 — Pipeline (Weeks 7–10)**
Pipeline tracking (R-04) and Pipeline dashboard (R-05). Adds persistence and the lifecycle tracking loop.

**Phase 3 — Intelligence (Weeks 11–16)**
Stats dashboard (R-06), channel tracking (R-07), notes (R-08). Begins the transition toward Radar Mode.

### Hard Dependencies
- Phase 1 is dependent on selecting and integrating an AI analysis model (OQ-01)
- Phase 2 requires a data persistence layer (database + auth), which should be scoped before Phase 1 completes

---

## Appendix: Product Philosophy Notes

RoleWise is built around **judgement, not automation.** The system helps users think more clearly, not think less. This has implications for design:

- Output should feel like a thoughtful colleague summarising a listing, not a dashboard of metrics
- Language should be direct and plain — no jargon, no hedging
- The interface should never pressure users to act; it should inform and step back
- The two product modes (Applicant Mode and Radar Mode) should eventually be separable — Radar Mode has distinct B2B potential as a market intelligence product, and the architecture should anticipate this split

