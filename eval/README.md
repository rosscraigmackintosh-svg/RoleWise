# Rolewise Narrative Eval Harness

Lightweight evaluation tooling for the OpenAI narrative prompt. Stress-tests
the prompt against representative JD archetypes and measures recurring weakness
patterns empirically.

## Goal

Surface regressions and quality patterns through evidence, not intuition. The
harness is deliberately small — it is meant to be re-run after prompt changes
and to identify recurring weaknesses, not to grade individual outputs.

## What it measures

- **Filler-phrase frequency** — counts of "focused on", "centered on", "aimed at",
  "this role is centered on", etc.
- **Weak verbs** — engage, support, improve, help, contribute, collaborate on.
- **Abstract nouns** — "product improvements", "design enhancements",
  "evolving product vision", "user-centered innovations", etc.
- **Hedging words** — likely, appears to, seems to, probably.
- **Avg sentence length** (chars) — proxy for compression.
- **% bullets containing a concrete operational noun** from the JD vocabulary.
- **Concrete-noun density** — nouns per 100 words across the whole narrative.
- **Per-section noun density** — same metric broken down by section.

Concrete nouns: see `CONCRETE_NOUNS` in `analyze.ts`. Extend that list as the
domain vocabulary grows.

## JD archetypes (10)

| ID | Archetype |
|---|---|
| 01 | Enterprise transformation (Medius-style spend management) |
| 02 | Founder zero-to-one (Series A AI startup) |
| 03 | Ambiguous recruiter-written (confidential client, fintech) |
| 04 | AI-heavy SaaS (Loom Copilot, Staff IC) |
| 05 | Platform modernisation (Sage, Principal IC) |
| 06 | Corporate enterprise (Aviva, FTSE 100) |
| 07 | Vague innovation (stealth-mode buzzword salad) |
| 08 | Design-system/platform (Atlassian, Staff systems) |
| 09 | Fintech operational SaaS (Modern Treasury) |
| 10 | PM-heavy coordination (Monzo Customer Platform) |

Each JD lives at `jds/{id}-{slug}.txt`. The set is intentionally representative
of recurring failure cases, not exhaustive.

## Candidate context

`candidate-context.json` mirrors the shape consumed by the deployed
`formatCandidateContext()` in both edge functions. Update it if the live
context shape changes.

## Usage

```bash
# Full run: 10 JDs × 2 providers × 2 passes = 40 API calls
deno run --allow-net --allow-read --allow-write run.ts

# One JD, one provider (debugging)
deno run --allow-net --allow-read --allow-write run.ts --only=04 --provider=openai

# Generate the report from existing results/
deno run --allow-read analyze.ts > report.md
```

The runner stores raw outputs at `results/{jd-id}/{provider}.json`. The
analyzer reads those files and emits a markdown report to stdout.

## How to use the report

1. Run the harness after any OpenAI prompt change.
2. Compare aggregate metrics (Anthropic vs OpenAI) — the goal is that OpenAI
   stays at or below Anthropic on filler/weak-verb/abstract-noun counts and at
   or above on bullets-grounded-% and noun density.
3. The "Top filler/abstract phrases" table identifies what specific phrases the
   model is still leaking. Use this list to inform targeted prompt tightening.
4. Per-section noun density isolates which section is weakest.

## What this is NOT

- Not a grading system. Counts are signal, not verdict.
- Not a regression gate. There are no pass/fail thresholds yet.
- Not a comparison vs historical outputs. Frozen golden outputs are not stored.

## Cost

claude-haiku-4-5 + gpt-4o-mini, ~40 calls total. Roughly $0.10–$0.30 per full run.

## Files

```
eval/
├── README.md                  this file
├── .gitignore                 ignores results/ + report.md
├── candidate-context.json     representative candidate
├── jds/                       10 synthetic JDs (archetype-tagged)
├── run.ts                     Deno runner
├── analyze.ts                 Deno analyser
└── results/                   raw outputs (gitignored)
```
