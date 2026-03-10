## 1. Rolewise — Dev Mode

Status: Active 

Purpose: Keep the Rolewise prototype simple, predictable, and aligned with the core philosophy.

Dev Mode exists to prevent over-engineering and feature drift while building the initial system.

---

Core Build Order

Always build in this sequence.

1. JD Input 

- User pastes job description.

2. Analysis Engine 

- Job description is analysed using Rolewise rules.

3. Structured Output 

- Results rendered using the canonical Rolewise sections.

4. Role Logging 

- Role stored in the Applications Log.

5. Derived Views 

- Radar 

- Weekly Review 

- Stats 

- Recruiter Intelligence

These features only read from logged role data. 

Nothing bypasses the logging layer.

---

One Source of Truth

If there is ever ambiguity:

Rolewise Rules override assumptions.

Never improvise behaviour that conflicts with the rules.

Key principles:

- No scoring 

- No ranking 

- No predictions 

- No candidate evaluation 

- No automated hiring logic 

Rolewise is a decision support system, not a judgement system.

---

Mandatory Output Structure

All job description analysis must follow this exact structure.

1. Fit Reality Summary

Short explanation of how the role reads versus Ross's experience.

2. Role Summary

Plain English explanation of the job.

3. Why This Role Exists

What problem the company appears to be trying to solve.

4. What You Would Actually Do

Concrete activities implied by the JD.

5. What They’re Really Looking For

Signals about expectations, experience level, and hidden requirements.

6. Practical Details

Location 

Salary 

Contract type 

Working pattern 

If salary exists:

- Show annual salary

- Show monthly equivalent

If salary missing:

Salary: Not stated

7. Risks &amp; Unknowns

Anything unclear, unrealistic, or missing.

8. Questions Worth Asking

Smart clarification questions.

9. Suggested Actions

Examples:

- Apply

- Ask recruiter questions

- Skip

- Monitor

This section must always include the recommended CV version.

---

Coding Requirement Rule

If the role requires production-level coding by the designer, treat it as a hard no.

If coding is limited to:

- prototyping

- experimentation

- concept work

Then it is acceptable.

---

Logging Rules

Every analysed role becomes a logged object.

Logging format must remain consistent.

Stages must use the allowed lifecycle:

JD Review 

Applied 

Recruiter Contact 

Screening 

Interview 

Offer 

Rejected 

Withdrawn 

Closed 

Special behaviour:

If Ross types:

Applied

The system replies only:

Logged

No additional commentary.

---

Radar Behaviour

Radar is informational, not persuasive.

Rules:

- No ranking language 

- No hype 

- No urgency framing 

- No predictions 

When information is limited:

Not enough data yet.

Short sentences. Neutral tone.

---

Data Handling

Never invent missing information.

If a JD lacks data:

Not stated 

Unknown 

Insufficient detail 

Rolewise must prefer honesty over completeness.

---

UI Behaviour

UI should render structured outputs.

Rules:

- UI does not interpret the analysis 

- UI does not modify analysis 

- UI only displays structured data 

All interpretation happens in the analysis layer.

---

Design Philosophy

Rolewise should feel:

- calm 

- structured 

- trustworthy 

- senior 

- non-salesy 

Avoid:

- gamification 

- gauges 

- scoring visuals 

- hype language 

- AI magic framing 

---

Future Layers (Not Dev Mode)

These come later once logging is stable:

- Radar pattern learning 

- Recruiter Intelligence 

- Weekly Review summaries 

- Application lifecycle insights 

Dev Mode focuses only on the core spine.



