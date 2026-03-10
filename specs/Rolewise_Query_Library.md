## 1. Rolewise Query Library

Purpose:

Define the questions Ross can ask about his job search data.

The queries use data from:

Rolewise_Applications_Log.md 

Rolewise_Stats.md 

Rolewise_Recruiter_Intelligence.md 

---

Pipeline Queries

Show open pipeline

Returns:

- Roles awaiting response

- Roles in interview stages

- Roles near decision

---

Show applied roles

Returns all roles where:

Decision = Applied

---

Show roles in process

Returns roles with stage:

Recruiter Screen 

Hiring Manager 

Task / Take-home 

Panel 

Final 

---

Show closed roles

Returns roles where:

Outcome = Closed

---

Market Queries

Show roles by industry

Groups roles by:

AI SaaS 

Enterprise SaaS 

Developer Tools 

Fintech 

Creative Tech 

---

Show company stages

Groups roles by:

Startup 

Early Stage 

Scaleup 

Enterprise 

---

Salary Queries

Show highest salary roles

Returns roles sorted by salary.

---

Show roles with no salary

Returns roles where:

Salary = Not stated

---

Work Model Queries

Show remote roles

Returns roles where:

Work Model = Remote

---

Show hybrid roles

Returns roles where:

Work Model = Hybrid

---

Risk Queries

Show coding requirement roles

Returns roles where:

Risk Flags include:

Production coding requirement

---

Show recruiter intermediary roles

Returns roles flagged:

Recruiter intermediary

---

Response Intelligence

Show fastest responses

Sort by:

Days to Response

---

Show ghosted applications

Returns roles where:

Applied 

AND

First Response Date = blank 

AND

Days since applied &gt; 14

---

Strategy Queries

Show best performing channels

Uses:

Source Channel

Shows which sources produce interviews.

---

Show apply vs skip ratio

Calculates:

Applied roles vs skipped roles.

---

Show interview conversion

Calculates:

Applications → Recruiter Screen 

Recruiter Screen → Hiring Manager 

Hiring Manager → Offer

---

Weekly Queries

Show weekly activity

Uses data from Rolewise_Weekly_Review.md

Returns:

Roles seen 

Roles applied 

Responses 

Interviews

---

Decision Pattern Queries

Show apply reasons

Reads:

Rolewise_Decision_Patterns.md

---

Show skip reasons

Reads:

Rolewise_Decision_Patterns.md



