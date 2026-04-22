// Role analysis page — sample data for the core decision surface.
// Represents a Senior Product Designer role that has been ingested and structured.

const ROLE_ANALYSIS_DATA = {
  id: 'meridian-spd-001',
  title: 'Senior Product Designer, Core Experience',
  company: 'Meridian',
  short: 'Me',
  logoIdx: 2,
  location: 'London · Hybrid',
  workModel: 'Hybrid',
  stage: 'Saved',
  group: 'saved',
  addedDate: '3 days ago',
  source: 'LinkedIn',

  // Section 2: Fit Reality Summary
  // Only items directly relevant to fit — visa/equity detail lives in Risks
  fitSummary: {
    observations: [
      { type: 'align',    text: 'Salary range matches your stated preference' },
      { type: 'align',    text: 'Hybrid 2 days/week is within your stated tolerance' },
      { type: 'align',    text: 'Data-heavy interface work is a strong match for your background' },
      { type: 'friction', text: 'Design system ownership is described but not scoped — no resource, time, or tooling allocation mentioned' },
      { type: 'friction', text: 'Equity terms are not disclosed in the listing' },
    ],
    footer: 'Based on role listing and your stated preferences · Added 3 days ago',
  },

  // Section 3: Role Summary — role only, no company intro
  summary: 'This role owns the query, exploration, and results surfaces — the most-used part of the product. The work is rebuilding from scratch, not iterating on what already exists.',

  // Section 4: Why This Role Exists
  whyExists: {
    context: 'Meridian recently moved from a legacy BI tool model to an AI-first interface. The previous design approach was inherited from the original product. They are rebuilding the core experience rather than iterating on it.',
    signals: [
      'Series B closed 6 months ago — team scaling from 80 to 140',
      'JD references "redesigning" and "rebuilding" — not incremental iteration',
      'Head of Design joined 8 months ago — likely setting a new direction',
      'They describe owning a design system that does not yet exist',
    ],
  },

  // Section 5: What You Would Actually Do
  whatYouDo: [
    'Own end-to-end design of the query and exploration interface — the most-used surface in the product',
    'Work in a small pod with 2 engineers and 1 PM',
    'Define and document component patterns for an emerging design system',
    'Conduct qualitative research with enterprise data analysts',
    'Help define how AI-generated results are presented and explained to users',
    'Present design decisions in weekly reviews with the exec team',
  ],

  // Section 6: What They're Really Looking For
  reallyLookingFor: {
    essential: [
      'Deep experience designing data-heavy interfaces — tables, queries, results views, filtering',
      'Demonstrated ability to set design direction, not just execute briefs',
      'Comfortable working at systems level — patterns and components, not just screens',
      'Experience at a SaaS company with a technical user base',
      'Confident presenting and defending design decisions independently',
    ],
    preferred: [
      'Familiarity with SQL or data query concepts',
      'Previous experience building a design system from scratch',
      'Experience in a product-led growth or developer-tools environment',
    ],
    notable: 'The brief mentions "strong visual design" but the product examples shown are functional UI.',
  },

  // User preferences — used by the compensation panel
  userPreferences: {
    salaryLabel: '£85,000 – £120,000 / year',
    salaryMonthlyLabel: '£7,083 – £10,000 / month',
    observation: 'This role sits within your stated range. The upper end is £5k below your maximum.',
  },

  // Section 7: Practical Details
  // Reports to removed — already captured in teamContext
  practicalDetails: {
    salary: '£90,000 – £115,000 / year',
    salaryMonthlyRange: '£7,500 – £9,583 / month',
    equity: 'EMI options — vesting terms not stated',
    contractType: 'Permanent, full-time',
    location: 'Bermondsey, London',
    workModel: 'Hybrid — 2 days/week in office',
    companyStage: 'Series B · ~120 people',
    teamContext: 'Design team of 6 · Head of Design',
    visaSponsorship: 'Not stated',
    startDate: 'ASAP preferred — willing to wait',
    benefits: [
      '25 days holiday + bank holidays',
      'Private medical (Bupa)',
      'Enhanced pension — 5% employer',
      'Home office budget — amount not stated',
    ],
  },

  // Section 8: Risks & Unknowns
  // Removed: Probation period (near-universal, no signal)
  // Tightened: Equity (removed "At Series B, these details are material")
  risks: [
    {
      severity: 'warn',
      label: 'Design system scope is not defined',
      detail: 'They describe owning the design system but there is currently no system. No mention of dedicated time, tooling budget, or engineering support alongside delivery.',
    },
    {
      severity: 'warn',
      label: 'Equity terms are not disclosed',
      detail: 'EMI options are mentioned but vesting schedule, cliff period, and strike price are not stated.',
    },
    {
      severity: 'note',
      label: 'Visa sponsorship is not confirmed',
      detail: 'Not mentioned in the listing. Worth clarifying early if relevant to you.',
    },
    {
      severity: 'note',
      label: 'No design manager layer',
      detail: 'Direct report to Head of Design in a team of 6. High autonomy — but less structured support during a rebuilding phase.',
    },
  ],

  // Section 9: Questions Worth Asking
  questions: [
    'What does success look like at 6 months — what should have been built or meaningfully changed?',
    'How is design system work scoped alongside product delivery? Is there dedicated time, or is it expected to happen in parallel?',
    'What happened to the designer or designers who previously owned this space?',
    'Can you walk me through how a recent design decision was made — from problem to shipped?',
    'What is the equity vesting schedule and what was the strike price set at for this round?',
    'Is visa sponsorship available for future hires, or is the current team entirely UK-based?',
  ],

  // Section 10: Suggested Actions
  // Apply button removed from inside card — sticky header already has it
  // Descriptions tightened
  actions: [
    {
      type: 'neutral',
      label: 'Apply',
      description: 'Salary, scope, and stage align well. The data interface work is a strong match.',
    },
    {
      type: 'neutral',
      label: 'Research Meridian first',
      description: 'Check recent product coverage and look at the product before writing your cover note.',
    },
    {
      type: 'neutral',
      label: 'Ask about equity during the process',
      description: 'Request vesting schedule and strike price before the offer stage — not after.',
    },
  ],
};

Object.assign(window, { ROLE_ANALYSIS_DATA });
