## 1. Rolewise — Analysis Output Schema

Status: Active 

Purpose: Define the required JSON structure for job description analysis. 

Used by: Rolewise Applicant Mode, Logging Engine, Radar, Stats, Weekly Review, Recruiter Intelligence.

---

Overview

Every job description analysis must return a single JSON object following this schema.

This output is used for:

- UI rendering 

- Logging the role 

- Triggering downstream insights (Radar, Stats, etc.)

The schema must remain stable so the UI and logging system do not break.

---

Required Structure

{

"reality_snapshot": [{ "label": "string", "value": "string" }],

"fit_reality_summary": [{ "text": "string", "evidence": "string | null" }],

"role_reality": "string",

"role_archetype": { "primary": "string", "secondary": "string | null" },

"friction_signals": [{ "label": "string", "text": "string" }],

"rolewise_verdict": { "outcome": "string", "reasoning": "string" },

"role_summary": "string",

"why_this_role_exists": "string",

"what_you_would_do": [{ "text": "string", "evidence": "string | null" }],

"what_they_are_looking_for": [{ "text": "string", "evidence": "string | null" }],

"practical_details": {

"location": "string",

"salary_annual": "string",

"salary_monthly": "string",

"working_pattern": "string",

"contract_type": "string"

},

"risks_and_unknowns": [{ "text": "string", "evidence": "string | null" }],

"questions_worth_asking": "string",

"suggested_actions": {

"next_step": "string",

"recommended_cv": "string"

}

}

---

Field Descriptions

reality_snapshot

An array of exactly 5 key fact pairs, each with a "label" and a "value". Use these labels in this order:

  "Role level"       — e.g. "Senior IC", "Head of", "Manager"
  "Domain"           — e.g. "B2B SaaS · CLM", "FinTech · Payments"
  "Work model"       — e.g. "Remote (UK)", "Hybrid · London"
  "Salary clarity"   — e.g. "£90k–£110k stated", "UK salary not specified"
  "Primary risk"     — one-line description of the most important unknown or concern

Values must be concise (under 10 words each). Do not include labels in the value string.

---

fit_reality_summary

An array of bullet objects. Each object has:

"text" — the plain-language interpretation statement.

"evidence" — a short direct quote from the job description that supports the statement (20 words or fewer). Use null if no specific quote applies.

Example:

[
  {
    "text": "Strong B2B SaaS design experience expected.",
    "evidence": "5+ years product design experience, ideally with complex B2B SaaS workflows."
  }
]

role_archetype

An object with `primary` (string, required) and `secondary` (string or null, optional).

`primary` must be one of:
- "Founding Product Designer"
- "Product Squad Designer"
- "Platform Systems Designer"
- "Enterprise UX Operator"
- "Design Systems Designer"
- "Growth Product Designer"
- "Service / Workflow Designer"
- "Craft-led UI/Product Designer"

`secondary` is an optional 2–6 word phrase adding domain or environment context. Null if not useful.

Example:
{ "primary": "Product Squad Designer", "secondary": "Data-rich B2B SaaS" }

---

role_summary

A concise explanation of what the role actually is.

why_this_role_exists 

The likely business problem the company is trying to solve.

what_you_would_do

Array of bullet objects (same {text, evidence} shape as fit_reality_summary). Each item describes an expected day-to-day responsibility with a supporting quote where possible.

what_they_are_looking_for

Array of bullet objects (same {text, evidence} shape). Each item describes a signal about expectations, seniority, or hidden requirements, with a supporting quote where possible.

---

Practical Details Fields

location 

Example: 

London, UK (Hybrid) 

Remote (Europe)

salary_annual 

Example: 

£90,000 

Not stated

salary_monthly

Only include if the salary is stated in GBP (£) for a UK-based role.

Example:

£7,500

If salary is in a foreign currency or listed for another geography:

null

If salary is missing:

Not stated

Never compute or estimate a GBP monthly figure from a foreign-currency salary.

working_pattern 

Examples:

Full-time 

4 days per week 

Contract

contract_type 

Examples:

Permanent 

Fixed-term 

Outside IR35

---

Risks and Unknowns

This field should highlight anything unclear or risky in the role.

Examples:

- No reporting structure mentioned 

- Scope appears unusually broad 

- Role may combine design and engineering responsibilities 

- Salary not listed 

- Success metrics not defined

---

Questions Worth Asking

Provide 3–5 questions that would help clarify the role.

Examples:

- What does success look like after six months?

- How are design and product decisions made today?

- What is the current team structure?

- Is this a new role or a replacement?

Questions can be written as bullet points.

---

Suggested Actions

next_step

Possible values include:

Apply 

Skip 

Ask recruiter questions 

Monitor role 

Review later

recommended_cv

Must match one of the user's CV versions.

Examples:

Founding Product Designer 

Principal Product Designer 

Senior Product Designer

---

Rules

All fields must be present.

If information is missing use:

Not stated 

Unknown 

Insufficient detail

Never invent information.

The output must always be valid JSON.

The output must contain only the structured JSON object.

No markdown. 

No extra explanation. 

No HTML.

---

Example Output

{

"fit_reality_summary": "This role appears broadly aligned but includes significant front-end coding responsibilities which may be a blocker.",

"role_summary": "The company is hiring a designer to lead the UX and UI of their analytics platform.",

"why_this_role_exists": "They appear to be rebuilding their product interface and need someone to own the design direction.",

"what_you_would_do": "Design product features, improve information architecture, collaborate with engineering, and deliver high fidelity UI.",

"what_they_are_looking_for": "A senior product designer comfortable working in a fast moving environment with high ownership.",

"practical_details": {

"location": "Remote (Europe)",

"salary_annual": "€70,000",

"salary_monthly": "€5,833",

"working_pattern": "Full-time",

"contract_type": "Permanent"

},

"risks_and_unknowns": "No reporting structure mentioned and coding expectations are unclear.",

"questions_worth_asking": "- What is the expected balance between design and engineering work?\n- Who would this role report to?\n- What are the main priorities for the first six months?",

"suggested_actions": {

"next_step": "Ask recruiter questions",

"recommended_cv": "Senior Product Designer"

}

}

---

Stability Rule

This schema must remain stable.

Changes should only happen if:

- the logging system is updated

- the UI rendering changes

- new structured analysis fields are introduced



