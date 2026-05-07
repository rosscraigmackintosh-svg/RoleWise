// Pattern history data.
// Patterns are grouped into five sections (per spec):
//   works · stalls · market · decision · response
// Each pattern includes:
//   statement      — the primary line
//   evidence       — 2–4 supporting rows (structured)
//   outcome        — optional behaviour → outcome link
//   stability      — "Emerging" | "Consistent" | "Strong signal"
//   visual         — optional { kind: 'bars' | 'split' | 'trend', ... }
//   minRoles       — the confidence gate: roles needed for this pattern
//   window         — "30d" | "60d" | "all" (shortest window in which this pattern holds)
//
// Three data states, matching the rest of the app:
//   early   — under the confidence threshold; show empty state
//   active  — ~48 roles; meaningful but not saturated
//   heavy   — ~127 roles; every section populated, stronger signals

const PATTERN_DATA = {
  active: {
    context: {
      rolesAnalysed: 48,
      range: "Last 60 days",
      since: "Feb 19",
      enough: true,
    },
    sections: [
      {
        key: "works",
        title: "What tends to work",
        sub: "Roles where your behaviour and outcomes align",
        patterns: [
          {
            id: "w1",
            statement: "Roles aligned with your stated preferences are more likely to progress",
            evidence: [
              { k: "Matched preferences",  v: "12 roles" },
              { k: "Reached interview",    v: "6 roles"  },
              { k: "Stalled at application", v: "1 role"  },
            ],
            outcome: { from: "Applied — matched preferences", to: "Interview stage", rate: "50%" },
            stability: "Consistent pattern",
            window: "60d",
            visual: {
              kind: "split",
              total: 12,
              parts: [
                { label: "Interview",   n: 6, tone: "pos" },
                { label: "Awaiting",    n: 5, tone: "mid" },
                { label: "Stalled",     n: 1, tone: "neg" },
              ],
            },
          },
          {
            id: "w2",
            statement: "Roles introduced by a warm intro or referral consistently reach a recruiter screen",
            evidence: [
              { k: "Warm-intro roles",   v: "4 roles" },
              { k: "Reached recruiter",  v: "4 roles" },
              { k: "Median time to reply", v: "2 days" },
            ],
            outcome: { from: "Warm intro", to: "Recruiter screen", rate: "4 of 4" },
            stability: "Emerging pattern",
            window: "60d",
          },
          {
            id: "w3",
            statement: "Applications sent within 3 days of seeing the role respond faster",
            evidence: [
              { k: "Applied within 3 days",  v: "18 roles" },
              { k: "Average response",       v: "4 days"   },
              { k: "Applied later — response", v: "11 days"  },
            ],
            stability: "Consistent pattern",
            window: "60d",
            visual: {
              kind: "bars",
              rows: [
                { k: "Within 3 days", v: 4,  max: 14, unit: "days" },
                { k: "After 3 days",  v: 11, max: 14, unit: "days" },
              ],
            },
          },
        ],
      },

      {
        key: "stalls",
        title: "What tends not to work",
        sub: "Patterns that reliably stall or get skipped",
        patterns: [
          {
            id: "s1",
            statement: "Roles with 3+ office days consistently stall or are skipped",
            evidence: [
              { k: "Roles identified",    v: "7 roles" },
              { k: "Skipped outright",    v: "5 roles" },
              { k: "Applied — no response", v: "2 roles" },
            ],
            outcome: { from: "3+ office days", to: "No progression", rate: "7 of 7" },
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "split",
              total: 7,
              parts: [
                { label: "Skipped",    n: 5, tone: "neg" },
                { label: "No reply",   n: 2, tone: "mid" },
              ],
            },
          },
          {
            id: "s2",
            statement: "Roles without a listed salary respond much more slowly",
            evidence: [
              { k: "No salary listed",      v: "22 roles" },
              { k: "Average response",      v: "11 days"  },
              { k: "Salary listed — response", v: "4 days"   },
            ],
            stability: "Consistent pattern",
            window: "60d",
            visual: {
              kind: "bars",
              rows: [
                { k: "Salary listed",    v: 4,  max: 14, unit: "days" },
                { k: "No salary listed", v: 11, max: 14, unit: "days" },
              ],
            },
          },
          {
            id: "s3",
            statement: "Production-coding take-homes haven't led past the task stage",
            evidence: [
              { k: "Take-homes received", v: "4 roles" },
              { k: "Advanced past task",  v: "0 roles" },
              { k: "Time spent, median",  v: "6 hours" },
            ],
            stability: "Emerging pattern",
            window: "60d",
          },
        ],
      },

      {
        key: "market",
        title: "Market patterns",
        sub: "What the roles you see tell you about the market you're in",
        patterns: [
          {
            id: "m1",
            statement: "Salary transparency correlates with engagement",
            evidence: [
              { k: "Roles with salary",    v: "26 roles" },
              { k: "Applied",              v: "18 roles" },
              { k: "Reached interview",    v: "7 roles"  },
            ],
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "split",
              total: 26,
              parts: [
                { label: "Applied",      n: 18, tone: "pos" },
                { label: "Saved only",   n: 5,  tone: "mid" },
                { label: "Skipped",      n: 3,  tone: "neg" },
              ],
            },
          },
          {
            id: "m2",
            statement: "Hybrid roles have grown as a share of what you see",
            evidence: [
              { k: "Hybrid — last 30 days", v: "46%" },
              { k: "Hybrid — prior 30 days", v: "28%" },
              { k: "Remote — last 30 days", v: "38%" },
            ],
            stability: "Consistent pattern",
            window: "60d",
            visual: {
              kind: "trend",
              rows: [
                { k: "Prior 30 days", pct: 28 },
                { k: "Last 30 days",  pct: 46 },
              ],
            },
          },
          {
            id: "m3",
            statement: "AI & ML roles are the largest single category in your feed",
            evidence: [
              { k: "AI & ML",            v: "14 roles" },
              { k: "Enterprise SaaS",    v: "12 roles" },
              { k: "Developer tools",    v: "9 roles"  },
            ],
            stability: "Consistent pattern",
            window: "60d",
          },
        ],
      },

      {
        key: "decision",
        title: "Decision behaviour",
        sub: "How you tend to move — not what you say",
        patterns: [
          {
            id: "d1",
            statement: "You apply most often within 48 hours of first seeing a role",
            evidence: [
              { k: "Applied within 48h", v: "31 of 48" },
              { k: "Applied after 48h",  v: "17 of 48" },
              { k: "Median time to apply", v: "19 hours" },
            ],
            stability: "Consistent pattern",
            window: "60d",
          },
          {
            id: "d2",
            statement: "Roles saved for more than 7 days rarely get applied to",
            evidence: [
              { k: "Saved 7+ days",      v: "11 roles" },
              { k: "Later applied",      v: "2 roles"  },
              { k: "Eventually skipped", v: "9 roles"  },
            ],
            outcome: { from: "Saved 7+ days", to: "Skipped or ignored", rate: "9 of 11" },
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "split",
              total: 11,
              parts: [
                { label: "Skipped",  n: 9, tone: "neg" },
                { label: "Applied",  n: 2, tone: "pos" },
              ],
            },
          },
        ],
      },

      {
        key: "response",
        title: "Response patterns",
        sub: "What happens after you apply",
        patterns: [
          {
            id: "r1",
            statement: "Most responses arrive within the first 7 days or not at all",
            evidence: [
              { k: "Replies 0–7 days",   v: "21 roles" },
              { k: "Replies 8–14 days",  v: "3 roles"  },
              { k: "No reply after 14d", v: "14 roles" },
            ],
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "bars",
              rows: [
                { k: "0–7 days",   v: 21, max: 21 },
                { k: "8–14 days",  v: 3,  max: 21 },
                { k: "14+ days",   v: 14, max: 21 },
              ],
            },
          },
          {
            id: "r2",
            statement: "Recruiter-sourced roles respond faster than direct applications",
            evidence: [
              { k: "Recruiter — response", v: "2 days" },
              { k: "Direct  — response",   v: "6 days" },
              { k: "Sample size",          v: "23 roles" },
            ],
            stability: "Emerging pattern",
            window: "60d",
          },
        ],
      },
    ],
  },

  // ── heavy: more data, stronger signals, every section full ───────────────
  heavy: {
    context: {
      rolesAnalysed: 127,
      range: "Last 60 days",
      since: "Feb 19",
      enough: true,
    },
    sections: [
      {
        key: "works",
        title: "What tends to work",
        sub: "Roles where your behaviour and outcomes align",
        patterns: [
          {
            id: "w1",
            statement: "Roles aligned with your stated preferences are more likely to progress",
            evidence: [
              { k: "Matched preferences",    v: "41 roles" },
              { k: "Reached interview",      v: "22 roles" },
              { k: "Stalled at application", v: "4 roles"  },
            ],
            outcome: { from: "Applied — matched preferences", to: "Interview stage", rate: "54%" },
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "split",
              total: 41,
              parts: [
                { label: "Interview",   n: 22, tone: "pos" },
                { label: "Awaiting",    n: 15, tone: "mid" },
                { label: "Stalled",     n: 4,  tone: "neg" },
              ],
            },
          },
          {
            id: "w2",
            statement: "Roles introduced by a warm intro reach a recruiter screen almost every time",
            evidence: [
              { k: "Warm-intro roles",   v: "11 roles" },
              { k: "Reached recruiter",  v: "10 roles" },
              { k: "Median time to reply", v: "2 days" },
            ],
            outcome: { from: "Warm intro", to: "Recruiter screen", rate: "10 of 11" },
            stability: "Strong signal",
            window: "60d",
          },
          {
            id: "w3",
            statement: "Applications sent within 3 days of seeing the role respond 3× faster",
            evidence: [
              { k: "Applied within 3 days",    v: "54 roles" },
              { k: "Average response",         v: "3 days"   },
              { k: "Applied later — response", v: "12 days"  },
            ],
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "bars",
              rows: [
                { k: "Within 3 days", v: 3,  max: 14, unit: "days" },
                { k: "After 3 days",  v: 12, max: 14, unit: "days" },
              ],
            },
          },
          {
            id: "w4",
            statement: "Scaleup companies (Series C+) are the most common path to interview",
            evidence: [
              { k: "Applied — Scaleup",  v: "34 roles" },
              { k: "Reached interview",  v: "14 roles" },
              { k: "Applied — Startup",  v: "28 roles" },
            ],
            stability: "Consistent pattern",
            window: "60d",
          },
        ],
      },
      {
        key: "stalls",
        title: "What tends not to work",
        sub: "Patterns that reliably stall or get skipped",
        patterns: [
          {
            id: "s1",
            statement: "Roles with 3+ office days consistently stall or are skipped",
            evidence: [
              { k: "Roles identified",      v: "31 roles" },
              { k: "Skipped outright",      v: "22 roles" },
              { k: "Applied — no response", v: "9 roles"  },
            ],
            outcome: { from: "3+ office days", to: "No progression", rate: "31 of 31" },
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "split",
              total: 31,
              parts: [
                { label: "Skipped",    n: 22, tone: "neg" },
                { label: "No reply",   n: 9,  tone: "mid" },
              ],
            },
          },
          {
            id: "s2",
            statement: "Roles without a listed salary respond 3× more slowly",
            evidence: [
              { k: "No salary listed",         v: "58 roles" },
              { k: "Average response",         v: "12 days"  },
              { k: "Salary listed — response", v: "4 days"   },
            ],
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "bars",
              rows: [
                { k: "Salary listed",    v: 4,  max: 14, unit: "days" },
                { k: "No salary listed", v: 12, max: 14, unit: "days" },
              ],
            },
          },
          {
            id: "s3",
            statement: "Production-coding take-homes rarely advance past the task stage",
            evidence: [
              { k: "Take-homes received", v: "14 roles" },
              { k: "Advanced past task",  v: "2 roles"  },
              { k: "Time spent, median",  v: "6 hours"  },
            ],
            outcome: { from: "Production take-home", to: "Advanced past task", rate: "2 of 14" },
            stability: "Consistent pattern",
            window: "60d",
          },
          {
            id: "s4",
            statement: "Enterprise roles with unclear scope consistently stall at recruiter stage",
            evidence: [
              { k: "Unclear scope",      v: "17 roles" },
              { k: "Past recruiter",     v: "3 roles"  },
              { k: "Median time in stage", v: "21 days" },
            ],
            stability: "Emerging pattern",
            window: "60d",
          },
        ],
      },
      {
        key: "market",
        title: "Market patterns",
        sub: "What the roles you see tell you about the market you're in",
        patterns: [
          {
            id: "m1",
            statement: "Salary transparency strongly correlates with engagement",
            evidence: [
              { k: "Roles with salary",    v: "69 roles" },
              { k: "Applied",              v: "48 roles" },
              { k: "Reached interview",    v: "21 roles" },
            ],
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "split",
              total: 69,
              parts: [
                { label: "Applied",      n: 48, tone: "pos" },
                { label: "Saved only",   n: 14, tone: "mid" },
                { label: "Skipped",      n: 7,  tone: "neg" },
              ],
            },
          },
          {
            id: "m2",
            statement: "Hybrid roles have overtaken remote as your most common work model",
            evidence: [
              { k: "Hybrid — last 30 days",  v: "50%" },
              { k: "Hybrid — prior 30 days", v: "28%" },
              { k: "Remote — last 30 days",  v: "38%" },
            ],
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "trend",
              rows: [
                { k: "Prior 30 days", pct: 28 },
                { k: "Last 30 days",  pct: 50 },
              ],
            },
          },
          {
            id: "m3",
            statement: "AI & ML continues to be the largest single category",
            evidence: [
              { k: "AI & ML",         v: "38 roles" },
              { k: "Enterprise SaaS", v: "32 roles" },
              { k: "Developer tools", v: "24 roles" },
            ],
            stability: "Consistent pattern",
            window: "60d",
          },
        ],
      },
      {
        key: "decision",
        title: "Decision behaviour",
        sub: "How you tend to move — not what you say",
        patterns: [
          {
            id: "d1",
            statement: "You apply most often within 48 hours of first seeing a role",
            evidence: [
              { k: "Applied within 48h",   v: "84 of 127" },
              { k: "Applied after 48h",    v: "43 of 127" },
              { k: "Median time to apply", v: "16 hours"  },
            ],
            stability: "Strong signal",
            window: "60d",
          },
          {
            id: "d2",
            statement: "Roles saved for more than 7 days rarely get applied to",
            evidence: [
              { k: "Saved 7+ days",      v: "29 roles" },
              { k: "Later applied",      v: "4 roles"  },
              { k: "Eventually skipped", v: "25 roles" },
            ],
            outcome: { from: "Saved 7+ days", to: "Skipped or ignored", rate: "25 of 29" },
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "split",
              total: 29,
              parts: [
                { label: "Skipped",  n: 25, tone: "neg" },
                { label: "Applied",  n: 4,  tone: "pos" },
              ],
            },
          },
          {
            id: "d3",
            statement: "Thursdays are your most decisive day",
            evidence: [
              { k: "Decisions on Thursday", v: "34 roles" },
              { k: "Decisions on Monday",   v: "18 roles" },
              { k: "Weekend decisions",     v: "6 roles"  },
            ],
            stability: "Emerging pattern",
            window: "60d",
          },
        ],
      },
      {
        key: "response",
        title: "Response patterns",
        sub: "What happens after you apply",
        patterns: [
          {
            id: "r1",
            statement: "Most responses arrive within the first 7 days or not at all",
            evidence: [
              { k: "Replies 0–7 days",   v: "56 roles" },
              { k: "Replies 8–14 days",  v: "8 roles"  },
              { k: "No reply after 14d", v: "42 roles" },
            ],
            stability: "Strong signal",
            window: "60d",
            visual: {
              kind: "bars",
              rows: [
                { k: "0–7 days",   v: 56, max: 56 },
                { k: "8–14 days",  v: 8,  max: 56 },
                { k: "14+ days",   v: 42, max: 56 },
              ],
            },
          },
          {
            id: "r2",
            statement: "Recruiter-sourced roles respond 3× faster than direct applications",
            evidence: [
              { k: "Recruiter — response", v: "2 days" },
              { k: "Direct — response",    v: "7 days" },
              { k: "Sample size",          v: "63 roles" },
            ],
            stability: "Strong signal",
            window: "60d",
          },
        ],
      },
    ],
  },

  // ── early: not enough data; empty state ─────────────────────────────────
  early: {
    context: {
      rolesAnalysed: 8,
      range: "Last 60 days",
      since: "Apr 12",
      enough: false,
    },
    sections: [],
  },
};

Object.assign(window, { PATTERN_DATA });
