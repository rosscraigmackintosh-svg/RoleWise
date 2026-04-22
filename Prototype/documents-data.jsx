// CV variants tied to real outcomes. Three scenarios mirroring other pages.

const DOCUMENTS_DATA = {
  active: [
    {
      id: 1,
      name: 'Senior Product Designer',
      description: 'Used for strategic IC roles at established product-led companies.',
      group: 'active',
      updated: 'Updated 3 days ago',
      usage: { applications: 5, lastUsedRel: '2 days ago', reachedInterview: 2 },
      linkedApps: [
        { company: 'Linear', role: 'Senior Product Designer', stage: 'Recruiter screen' },
        { company: 'Stripe', role: 'Product Designer',         stage: 'Panel' },
        { company: 'Airtable', role: 'Senior Designer, Apps',  stage: 'Applied' },
      ],
      outcome: '2 reached interview · 1 awaiting reply',
    },
    {
      id: 2,
      name: 'Founding Product Designer',
      description: 'Used for early-stage and 0→1 roles at seed to Series B startups.',
      group: 'active',
      updated: 'Updated last week',
      usage: { applications: 3, lastUsedRel: '4 days ago', reachedInterview: 1 },
      linkedApps: [
        { company: 'Arc',    role: 'Product Designer II',   stage: 'Task' },
        { company: 'Ramp',   role: 'Design Lead, Platform', stage: 'Hiring manager' },
      ],
      outcome: '1 reached interview',
    },
    {
      id: 3,
      name: 'Staff Product Designer',
      description: 'Used for system design-heavy roles where depth matters more than breadth.',
      group: 'less',
      updated: 'Updated 3 weeks ago',
      usage: { applications: 2, lastUsedRel: '12 days ago', reachedInterview: 0 },
      linkedApps: [
        { company: 'Figma',    role: 'Staff Designer, AI',       stage: 'Applied' },
        { company: 'Notora',   role: 'Staff Product Designer',   stage: 'Applied' },
      ],
      outcome: 'No interviews yet',
    },
  ],

  heavy: [
    {
      id: 1,
      name: 'Senior Product Designer',
      description: 'Used for strategic IC roles at established product-led companies.',
      group: 'active',
      updated: 'Updated yesterday',
      usage: { applications: 42, lastUsedRel: 'today', reachedInterview: 11 },
      linkedApps: [
        { company: 'Linear',   role: 'Senior Product Designer', stage: 'Panel' },
        { company: 'Stripe',   role: 'Product Designer',        stage: 'Recruiter screen' },
        { company: 'Airtable', role: 'Senior Designer, Apps',   stage: 'Applied' },
      ],
      outcome: '11 reached interview · 3 in final stages',
    },
    {
      id: 2,
      name: 'Founding Product Designer',
      description: 'Used for early-stage and 0→1 roles at seed to Series B startups.',
      group: 'active',
      updated: 'Updated 4 days ago',
      usage: { applications: 28, lastUsedRel: '2 days ago', reachedInterview: 7 },
      linkedApps: [
        { company: 'Arc',   role: 'Product Designer II',    stage: 'Hiring manager' },
        { company: 'Ramp',  role: 'Design Lead, Platform',  stage: 'Final' },
      ],
      outcome: '7 reached interview · 1 offer pending',
    },
    {
      id: 3,
      name: 'Staff Product Designer',
      description: 'Used for system design-heavy roles where depth matters more than breadth.',
      group: 'active',
      updated: 'Updated last week',
      usage: { applications: 18, lastUsedRel: '3 days ago', reachedInterview: 2 },
      linkedApps: [
        { company: 'Figma',  role: 'Staff Designer, AI', stage: 'Task' },
        { company: 'Notora', role: 'Staff Designer',     stage: 'Applied' },
      ],
      outcome: '2 reached interview · response rate lower than other CVs',
    },
    {
      id: 4,
      name: 'Principal Product Designer',
      description: 'Used for roles that emphasise cross-org influence and design leadership.',
      group: 'less',
      updated: 'Updated 2 months ago',
      usage: { applications: 6, lastUsedRel: '3 weeks ago', reachedInterview: 1 },
      linkedApps: [
        { company: 'Datadog',  role: 'Principal Designer',  stage: 'Closed' },
        { company: 'Snowflake', role: 'Principal Designer', stage: 'Applied' },
      ],
      outcome: '1 reached interview',
    },
    {
      id: 5,
      name: 'Lead Product Designer — Platform',
      description: 'An earlier variant focused on platform and infra-adjacent roles.',
      group: 'archived',
      updated: 'Archived in February',
      usage: { applications: 9, lastUsedRel: '4 months ago', reachedInterview: 0 },
      linkedApps: [
        { company: 'Vercel',  role: 'Senior Designer',      stage: 'Closed' },
        { company: 'Netlify', role: 'Lead Platform Designer', stage: 'Closed' },
      ],
      outcome: 'No interviews · replaced by Staff variant',
    },
  ],

  early: [
    {
      id: 1,
      name: 'Senior Product Designer',
      description: 'Your main CV — used for most applications so far.',
      group: 'active',
      updated: 'Updated yesterday',
      usage: { applications: 2, lastUsedRel: 'yesterday', reachedInterview: 1 },
      linkedApps: [
        { company: 'Linear', role: 'Senior Product Designer', stage: 'Recruiter screen' },
        { company: 'Arc',    role: 'Product Designer',        stage: 'Applied' },
      ],
      outcome: '1 reached interview',
    },
  ],
};

const DOCUMENT_GROUPS = [
  { key: 'active',   label: 'Actively used', hint: 'Used recently or with live applications' },
  { key: 'less',     label: 'Less used',     hint: 'Kept around, used occasionally' },
  { key: 'archived', label: 'Archived',      hint: 'Retired variants, for reference' },
];

const DOCUMENT_SORTS = [
  { key: 'recent', label: 'Most recently used' },
  { key: 'most',   label: 'Most used' },
  { key: 'updated', label: 'Recently updated' },
];

Object.assign(window, { DOCUMENTS_DATA, DOCUMENT_GROUPS, DOCUMENT_SORTS });
