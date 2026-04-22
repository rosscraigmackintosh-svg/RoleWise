// Settings — default state & option catalogs

const SETTINGS_DEFAULTS = {
  profile: {
    name: 'Sofia Karlsson',
    email: 'sofia@sk.co',
    location: 'London, UK',
    timezone: 'Europe/London (GMT+0)',
  },
  work: {
    models: ['Remote', 'Hybrid'],       // multi-select
    maxOfficeDays: 2,                    // only meaningful if Hybrid in models
    employment: ['Permanent'],           // multi-select: Permanent, Contract
    salaryMin: 110000,                   // annual, GBP (see currency)
    currency: '£',
    dayRate: 850,                        // optional
    seniority: ['Senior', 'Lead', 'Staff'],
    domains: ['AI SaaS', 'Developer Tools', 'Enterprise SaaS'],
    stage: ['0→1', 'Scaling'],
  },
  boundaries: [
    'No production coding',
    'Max 2 days in office per week',
    'No marketing roles',
    'No crypto / web3',
  ],
  notifications: {
    email: true,
    roleActivity: true,
    weeklySummary: false,
  },
  integrations: [
    { key: 'linkedin', label: 'LinkedIn', desc: 'Import roles you save', status: 'not-connected' },
    { key: 'email',    label: 'Email',    desc: 'Track recruiter threads', status: 'not-connected' },
  ],
  account: {
    plan: 'Rolewise Plus',
    nextRenewal: 'Jan 14, 2026',
  },
};

const WORK_MODEL_OPTIONS  = ['Remote', 'Hybrid', 'On-site'];
const EMPLOYMENT_OPTIONS  = ['Permanent', 'Contract'];
const SENIORITY_OPTIONS   = ['Senior', 'Lead', 'Principal', 'Staff', 'Head', 'Director'];
const DOMAIN_OPTIONS      = [
  'AI SaaS', 'Enterprise SaaS', 'Developer Tools', 'Fintech',
  'Consumer', 'Health', 'Climate', 'Infra & Security', 'Creator tools',
];
const STAGE_OPTIONS       = ['0→1', 'Scaling', 'Mature'];

Object.assign(window, {
  SETTINGS_DEFAULTS,
  WORK_MODEL_OPTIONS,
  EMPLOYMENT_OPTIONS,
  SENIORITY_OPTIONS,
  DOMAIN_OPTIONS,
  STAGE_OPTIONS,
});
