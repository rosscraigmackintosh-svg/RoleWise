// Rolewise — Decision History datasets
//
// Not a role list. A record of decisions over time: what was pursued,
// what was rejected, and — crucially — why.
//
// Each item is one (role × decision). Reasons are short plain-language
// bullets, max 2–3, surfaced from analysis + user input.

const DECISION_SUMMARY = {
  reviewed: 15,
  applied:  6,
  skipped:  7,
  revisited: 2,
  window:   'Past 6 weeks',
};

// Group-level reflections. Two or three short observations per group,
// derived from the individual decision reasons below.
const GROUP_PATTERNS = {
  applied: {
    headline: 'You tend to apply to roles that…',
    points: [
      'match your remote or hybrid preference',
      'are in AI SaaS or developer tools',
      'offer high ownership or a clear scope',
    ],
  },
  skipped: {
    headline: 'You tend to skip roles that…',
    points: [
      'do not list a salary range',
      'require three or more days on-site',
      'ask for production coding in the take-home',
    ],
  },
  revisited: {
    headline: "Roles you've come back to usually…",
    points: [
      'had updated their listing after you first looked',
      'aligned better once your preferences shifted',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────
// Individual decisions. Ordered newest → oldest inside each group.
// `when` is a compact human string; `whenAbs` is the tooltip-friendly date.
// `signals` are minimal context (location, salary, model) — keep thin.
// ─────────────────────────────────────────────────────────────────────
const DECISIONS = [
  // ── APPLIED ───────────────────────────────────────────────────────
  {
    id: 'd-1', outcome: 'applied',
    role: 'Senior Product Designer', company: 'Linear',
    when: 'Applied 12 April', whenAbs: '2026-04-12', days: 7,
    reasons: [
      'Strong fit with stated preferences',
      'AI-adjacent product, high ownership',
    ],
    signals: [
      { k: 'Remote (EU)' },
      { k: '£95k–£120k' },
    ],
  },
  {
    id: 'd-2', outcome: 'applied',
    role: 'Design Lead, Platform', company: 'Ramp',
    when: 'Applied 10 April', whenAbs: '2026-04-10', days: 9,
    reasons: [
      'Platform scope matches recent work',
      'Hybrid 2 days — within your threshold',
    ],
    signals: [
      { k: 'London · Hybrid' },
      { k: 'Salary not stated', tone: 'dim' },
    ],
    note: 'Made an exception on salary — strong recruiter signal.',
  },
  {
    id: 'd-3', outcome: 'applied',
    role: 'Staff Designer, AI', company: 'Figma',
    when: 'Applied 7 April', whenAbs: '2026-04-07', days: 12,
    reasons: [
      'AI SaaS, senior IC ladder',
      'Remote UK',
    ],
    signals: [
      { k: 'Remote (UK)' },
      { k: '$180k–$210k' },
    ],
  },
  {
    id: 'd-4', outcome: 'applied',
    role: 'Product Designer II', company: 'Arc',
    when: 'Applied 4 April', whenAbs: '2026-04-04', days: 15,
    reasons: [
      'Browser craft — creative scope',
      'Clear seniority and interview steps',
    ],
    signals: [
      { k: 'New York · Hybrid' },
      { k: '$170k–$195k' },
    ],
  },
  {
    id: 'd-5', outcome: 'applied',
    role: 'Product Designer', company: 'Stripe',
    when: 'Applied 29 March', whenAbs: '2026-03-29', days: 21,
    reasons: [
      'Matches fintech experience',
      'Hybrid 2 days — within threshold',
    ],
    signals: [
      { k: 'London · Hybrid' },
      { k: '£110k–£135k' },
    ],
  },
  {
    id: 'd-6', outcome: 'applied',
    role: 'Senior Designer, Apps', company: 'Airtable',
    when: 'Applied 24 March', whenAbs: '2026-03-24', days: 26,
    reasons: [
      'Small apps team — high ownership',
      'Remote US friendly to UK hours',
    ],
    signals: [
      { k: 'Remote (US)' },
      { k: 'Salary not stated', tone: 'dim' },
    ],
  },

  // ── SKIPPED ───────────────────────────────────────────────────────
  {
    id: 'd-7', outcome: 'skipped',
    role: 'Senior Designer', company: 'Vercel',
    when: 'Reviewed 11 April', whenAbs: '2026-04-11', days: 8,
    reasons: [
      'Salary not stated',
      'Listing light on scope detail',
    ],
    signals: [
      { k: 'Remote' },
      { k: 'Salary not stated', tone: 'dim' },
    ],
  },
  {
    id: 'd-8', outcome: 'skipped',
    role: 'Lead Designer, Docs', company: 'Notion',
    when: 'Reviewed 9 April', whenAbs: '2026-04-09', days: 10,
    reasons: [
      'SF on-site, no remote option',
      'Requires relocation',
    ],
    signals: [
      { k: 'San Francisco · On-site' },
      { k: '$210k base' },
    ],
  },
  {
    id: 'd-9', outcome: 'skipped',
    role: 'Senior Product Designer', company: 'Plaid',
    when: 'Reviewed 6 April', whenAbs: '2026-04-06', days: 13,
    reasons: [
      'Production coding requirement',
      '3 days on-site minimum',
    ],
    signals: [
      { k: 'London · Hybrid 3d' },
      { k: '£100k–£130k' },
    ],
  },
  {
    id: 'd-10', outcome: 'skipped',
    role: 'Product Designer', company: 'Asana',
    when: 'Reviewed 3 April', whenAbs: '2026-04-03', days: 16,
    reasons: [
      'Salary not stated',
      '3 days on-site',
    ],
    signals: [
      { k: 'Dublin · Hybrid 3d' },
      { k: 'Salary not stated', tone: 'dim' },
    ],
  },
  {
    id: 'd-11', outcome: 'skipped',
    role: 'Principal Designer', company: 'Segment',
    when: 'Reviewed 1 April', whenAbs: '2026-04-01', days: 18,
    reasons: [
      'Heavy people-management focus',
      'Scope unclear beyond hiring',
    ],
    signals: [
      { k: 'London · Hybrid' },
      { k: '£140k–£170k' },
    ],
  },
  {
    id: 'd-12', outcome: 'skipped',
    role: 'Senior Designer, Growth', company: 'MongoDB',
    when: 'Reviewed 27 March', whenAbs: '2026-03-27', days: 23,
    reasons: [
      'Growth team — not your focus',
      'Salary not stated',
    ],
    signals: [
      { k: 'Remote (US)' },
      { k: 'Salary not stated', tone: 'dim' },
    ],
  },
  {
    id: 'd-13', outcome: 'skipped',
    role: 'Staff Product Designer', company: 'Datadog',
    when: 'Reviewed 22 March', whenAbs: '2026-03-22', days: 28,
    reasons: [
      'Paid trial project required',
      '4 days on-site',
    ],
    signals: [
      { k: 'New York · Hybrid 4d' },
      { k: '$200k+' },
    ],
  },

  // ── REVISITED ─────────────────────────────────────────────────────
  {
    id: 'd-14', outcome: 'revisited',
    role: 'Senior Designer, Platform', company: 'Retool',
    when: 'Revisited 10 April', whenAbs: '2026-04-10', days: 9,
    reasons: [
      'Listing updated — salary now stated',
      'Re-opened after preference change',
    ],
    signals: [
      { k: 'Remote (EU)' },
      { k: '$160k–$195k' },
    ],
    note: 'Skipped on 2 April, revisited after Retool posted a range.',
  },
  {
    id: 'd-15', outcome: 'revisited',
    role: 'Design Lead', company: 'Supabase',
    when: 'Revisited 5 April', whenAbs: '2026-04-05', days: 14,
    reasons: [
      'Clarified scope after recruiter note',
      'Hybrid dropped to 1 day on-site',
    ],
    signals: [
      { k: 'Berlin · Hybrid 1d' },
      { k: '€110k–€130k' },
    ],
  },
];

Object.assign(window, { DECISION_SUMMARY, GROUP_PATTERNS, DECISIONS });
