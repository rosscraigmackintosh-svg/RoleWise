// Insights data — observations derived from behaviour over time.
//
// Editorial direction: each insight reads as an interpretation first, with
// numbers placed quietly in supporting prose. Every insight carries a `why`
// trail so the reader can see what the observation is built on. We avoid
// trivia (weekday-of-application etc.), avoid framing things as personal
// failures, and keep at most one visual aid per card.
//
// Sections (in display order):
//   Current signals    — what's happening right now in the active pipeline
//   Process patterns   — how applications and responses move through the funnel
//   Role-shape patterns — which kinds of roles hold attention
//   Friction & blockers — what most often stops progress
//   Market direction   — external trends in the user's feed
//   Emerging themes    — observations forming but not yet confident
//
// Three scenarios cover: active pipeline (default), heavier use, and early use.

const INSIGHTS_DATA = {
  active: {
    ranges: {
      '14d': { label: 'Last 14 days', rolesSeen: 84,  applied: 19, responses: 7 },
      '30d': { label: 'Last 30 days', rolesSeen: 182, applied: 42, responses: 16 },
      'all': { label: 'All time',     rolesSeen: 312, applied: 48, responses: 22 },
    },
    sections: {
      'Current signals': [
        {
          id: 'cs-1',
          strength: 'strong',
          statement: 'Most responses arrive within the first week.',
          evidence: [
            { text: 'Of 7 responses received, 6 came back within 7 days; 1 arrived after 14.', link: 'applications:fast-response' },
            { text: 'Roles past 14 days without contact are unlikely to respond at all.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Applications with response data', v: '7' },
              { k: 'Applications still waiting',      v: '12' },
            ],
            relatedTraits: ['Recruiter-mediated', 'Salary disclosed'],
            roles: ['Monzo', 'Aptitude', 'Clio'],
          },
        },
      ],

      'Process patterns': [
        {
          id: 'pp-1',
          strength: 'strong',
          statement: 'Roles with listed salaries appear more likely to progress.',
          evidence: [
            { text: 'Across 8 applied roles without a listed salary, none reached recruiter screen.', link: 'roles:no-salary' },
            { text: 'Roles with disclosed salary reached screen in roughly two-thirds of cases.' },
          ],
          visual: { kind: 'split', left: { label: 'Salary disclosed', pct: 64 }, right: { label: 'No salary', pct: 0 } },
          why: {
            observedAcross: [
              { k: 'Applied roles',          v: '19' },
              { k: 'No salary disclosed',    v: '8'  },
              { k: 'Reached recruiter screen', v: '7' },
            ],
            relatedTraits: ['Hybrid ambiguity', 'Recruiter-mediated', 'Missing ownership detail'],
            roles: ['Monzo', 'Aptitude', 'Clio'],
          },
        },
        {
          id: 'pp-2',
          strength: 'strong',
          statement: 'Recruiter-led applications tend to respond faster than direct ones.',
          evidence: [
            { text: 'Recruiter-led roles respond in roughly 3 days; direct applications take around 9.', link: 'applications:via-recruiter' },
            { text: 'The pattern holds across the small response sample so far.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Recruiter-led applications', v: '5' },
              { k: 'Direct applications',         v: '14' },
            ],
            relatedTraits: ['Earlier-stage companies', 'Hybrid'],
            roles: ['Monzo', 'Beacon Tech'],
          },
        },
        {
          id: 'pp-3',
          strength: 'emerging',
          statement: 'Saved roles older than 5 days rarely move forward.',
          evidence: [
            { text: '19 roles have been saved for more than 5 days; 2 of them were eventually applied to.', link: 'roles:stale-saves' },
            { text: 'Most stale saves drop out of the pipeline without explicit decision.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Saved >5 days', v: '19' },
              { k: 'Eventually applied', v: '2' },
            ],
            relatedTraits: ['Salary missing', 'On-site frequency unclear'],
            roles: ['ZappHire', 'Healf', 'Arou'],
          },
        },
      ],

      'Role-shape patterns': [
        {
          id: 'rs-1',
          strength: 'early',
          statement: 'Platform and infra-adjacent roles keep your attention longest.',
          evidence: [
            { text: 'Platform and infra roles spend roughly 2.3 days under review before a decision.', link: 'roles:platform' },
            { text: 'Growth and marketing roles are decided in under half a day on average.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Platform/infra roles', v: '11' },
              { k: 'Growth/marketing roles', v: '7' },
            ],
            relatedTraits: ['Higher seniority bands', 'Domain depth'],
            roles: ['Linear', 'Mytos', 'Lumen Analytics'],
          },
        },
      ],

      'Friction & blockers': [
        {
          id: 'fb-1',
          strength: 'strong',
          statement: 'Missing salary is the most common reason for skipping a role.',
          evidence: [
            { text: '22 of 42 skipped roles had no salary listed.', link: 'roles:skipped-no-salary' },
            { text: 'Hybrid arrangements with 3+ days on-site account for the next-largest group, then production-coding requirements.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Skipped — salary missing',        v: '22' },
              { k: 'Skipped — hybrid 3+ days on-site', v: '11' },
              { k: 'Skipped — production coding',     v: '9'  },
            ],
            relatedTraits: ['Recruiter-mediated', 'Lower seniority bands'],
            roles: ['Healf', 'Arou', 'Rightmove'],
          },
        },
        {
          id: 'fb-2',
          strength: 'emerging',
          statement: 'Processes involving take-home tasks rarely continue.',
          evidence: [
            { text: 'Of 4 processes that included a take-home task, 1 advanced to the next stage.', link: 'applications:takehome' },
            { text: 'The pattern is forming, not yet conclusive.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Take-home requested', v: '4' },
              { k: 'Advanced past take-home', v: '1' },
            ],
            relatedTraits: ['Earlier-stage companies', 'Founding/principal scope'],
            roles: ['Bloom', 'Cogna'],
          },
        },
      ],

      'Market direction': [
        {
          id: 'md-1',
          strength: 'strong',
          statement: 'Hybrid listings are trending up — remote holding steady.',
          evidence: [
            { text: 'Hybrid roles made up 46% of new listings in the last 14 days, up from 31% the prior period.', link: 'roles:hybrid' },
            { text: 'On-site share has continued to drift down over the same window.' },
          ],
          visual: {
            kind: 'trend',
            series: [
              { label: 'Hybrid',  points: [28, 31, 34, 38, 42, 46], hue: 250 },
              { label: 'Remote',  points: [40, 41, 39, 38, 39, 38], hue: 150 },
              { label: 'On-site', points: [32, 28, 27, 24, 19, 16], hue: 40  },
            ],
          },
          why: {
            observedAcross: [
              { k: 'New listings, last 14 days', v: '48' },
              { k: 'New listings, prior 14 days', v: '52' },
            ],
            relatedTraits: ['London-anchored', 'Mid-stage companies'],
            roles: ['Monzo', 'Synthesia', 'Booksy'],
          },
        },
        {
          id: 'md-2',
          strength: 'strong',
          statement: 'AI & ML roles are appearing most often in your feed.',
          evidence: [
            { text: 'AI & ML roles led the feed over the last 30 days, ahead of Enterprise SaaS and Developer Tools.', link: 'roles:ai-ml' },
            { text: 'The mix has shifted gradually — AI overtook SaaS three weeks ago.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'AI & ML roles, last 30 days', v: '14' },
              { k: 'Enterprise SaaS',              v: '12' },
              { k: 'Developer tools',              v: '9'  },
            ],
            relatedTraits: ['Series A–C companies', 'Foundational design hires'],
            roles: ['Artificial Societies', 'Linear', 'Mytos'],
          },
        },
      ],

      'Emerging themes': [
        {
          id: 'et-1',
          strength: 'emerging',
          statement: 'Staff-level titles are appearing more often than Lead-level titles.',
          evidence: [
            { text: '11 Staff-titled roles and 6 Lead-titled roles surfaced in the last 14 days.', link: 'roles:staff' },
            { text: 'Too early to call a sustained shift; worth watching.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Staff titles, last 14 days', v: '11' },
              { k: 'Lead titles, same period',    v: '6'  },
            ],
            relatedTraits: ['B2B SaaS', 'Series B+ companies'],
            roles: ['Synthesia', 'Linear'],
          },
        },
      ],
    },
  },

  // Heavier use — more confident signals, larger sample sizes.
  heavy: {
    ranges: {
      '14d': { label: 'Last 14 days', rolesSeen: 342,  applied: 48, responses: 18 },
      '30d': { label: 'Last 30 days', rolesSeen: 780,  applied: 112, responses: 44 },
      'all': { label: 'All time',     rolesSeen: 1842, applied: 127, responses: 61 },
    },
    sections: {
      'Current signals': [
        {
          id: 'h-cs-1',
          strength: 'strong',
          statement: 'Response times have slowed by roughly two days this month.',
          evidence: [
            { text: 'Average response is 8 days this month, against 6 days the prior month.' },
            { text: 'The slowdown shows across both recruiter-led and direct routes.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Responses this month', v: '44' },
              { k: 'Responses prior month', v: '38' },
            ],
            relatedTraits: ['Pre-holiday cycle', 'Mid-stage hiring slowdown'],
            roles: [],
          },
        },
      ],
      'Process patterns': [
        {
          id: 'h-pp-1',
          strength: 'strong',
          statement: 'Roles with listed salaries are clearly more likely to progress.',
          evidence: [
            { text: 'Across 34 applied roles without a listed salary, only 2 reached recruiter screen.', link: 'roles:no-salary' },
            { text: 'Salary-disclosed roles reached screen in roughly 71% of cases.' },
          ],
          visual: { kind: 'split', left: { label: 'Salary disclosed', pct: 71 }, right: { label: 'No salary', pct: 6 } },
          why: {
            observedAcross: [
              { k: 'Applied — no salary', v: '34' },
              { k: 'Reached recruiter screen', v: '2' },
              { k: 'Salary-disclosed comparison', v: '78' },
            ],
            relatedTraits: ['Recruiter-mediated', 'Hybrid'],
            roles: [],
          },
        },
        {
          id: 'h-pp-2',
          strength: 'strong',
          statement: 'Referred applications move faster than cold ones.',
          evidence: [
            { text: 'Referred roles are applied to within hours; cold applications take around 2.8 days on average.', link: 'roles:referred' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Referred applications', v: '12' },
              { k: 'Cold applications',     v: '100' },
            ],
            relatedTraits: ['Existing network', 'Higher seniority bands'],
            roles: [],
          },
        },
      ],
      'Role-shape patterns': [
        {
          id: 'h-rs-1',
          strength: 'emerging',
          statement: 'Platform and design-systems roles hold attention longest.',
          evidence: [
            { text: 'Platform and DS roles average 3.1 days before a decision; growth and marketing roles average 0.6.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Platform/DS roles', v: '36' },
              { k: 'Growth/marketing roles', v: '24' },
            ],
            relatedTraits: ['Senior+ bands', 'B2B SaaS'],
            roles: [],
          },
        },
      ],
      'Friction & blockers': [
        {
          id: 'h-fb-1',
          strength: 'strong',
          statement: 'Missing salary is the single biggest reason a role gets skipped.',
          evidence: [
            { text: '58 of 113 skipped roles had no salary listed.' },
            { text: 'Hybrid 3+ days on-site is the next largest group, then production-coding requirements.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Skipped — salary missing', v: '58' },
              { k: 'Skipped — hybrid 3+ on-site', v: '31' },
              { k: 'Skipped — production coding', v: '24' },
            ],
            relatedTraits: ['Recruiter-mediated', 'Mid-tier companies'],
            roles: [],
          },
        },
      ],
      'Market direction': [
        {
          id: 'h-md-1',
          strength: 'strong',
          statement: 'Hybrid has overtaken remote in new listings.',
          evidence: [
            { text: '50% of new listings in the last 30 days are hybrid; remote share has plateaued.', link: 'roles:hybrid' },
          ],
          visual: {
            kind: 'trend',
            series: [
              { label: 'Hybrid',  points: [30, 32, 36, 40, 46, 50], hue: 250 },
              { label: 'Remote',  points: [52, 51, 50, 49, 51, 50], hue: 150 },
              { label: 'On-site', points: [18, 17, 14, 11, 12, 12], hue: 40  },
            ],
          },
          why: {
            observedAcross: [
              { k: 'Hybrid listings, 30 days', v: '48' },
              { k: 'Remote listings, 30 days', v: '64' },
            ],
            relatedTraits: ['London-anchored', 'B2B SaaS'],
            roles: [],
          },
        },
        {
          id: 'h-md-2',
          strength: 'strong',
          statement: 'AI & ML roles make up almost a third of your feed.',
          evidence: [
            { text: 'AI & ML accounts for 38 of the last 30 days’ roles, up 14 from the prior month.', link: 'roles:ai-ml' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'AI & ML, last 30 days', v: '38' },
              { k: 'AI & ML, prior 30 days', v: '24' },
            ],
            relatedTraits: ['Series A–C', 'Founding-level briefs'],
            roles: [],
          },
        },
      ],
      'Emerging themes': [],
    },
  },

  // Early use — not enough data for most sections.
  early: {
    ranges: {
      '14d': { label: 'Last 14 days', rolesSeen: 6, applied: 2, responses: 1 },
      '30d': { label: 'Last 30 days', rolesSeen: 9, applied: 2, responses: 1 },
      'all': { label: 'All time',     rolesSeen: 9, applied: 2, responses: 1 },
    },
    sections: {
      'Current signals': [],
      'Process patterns': [],
      'Role-shape patterns': [],
      'Friction & blockers': [],
      'Market direction': [
        {
          id: 'e-md-1',
          strength: 'early',
          statement: 'Remote roles are the most common in your feed so far.',
          evidence: [
            { text: '3 of the first 5 listings analysed are remote; 2 are hybrid.' },
            { text: 'Too few roles to identify a stable pattern yet.' },
          ],
          visual: null,
          why: {
            observedAcross: [
              { k: 'Remote', v: '3' },
              { k: 'Hybrid', v: '2' },
            ],
            relatedTraits: [],
            roles: [],
          },
        },
      ],
      'Emerging themes': [],
    },
  },
};

const SECTION_ORDER = [
  'Current signals',
  'Process patterns',
  'Role-shape patterns',
  'Friction & blockers',
  'Market direction',
  'Emerging themes',
];

// Minimum relevant roles for the page to show content (otherwise: empty state).
const CONFIDENCE_FLOOR = 10;

Object.assign(window, { INSIGHTS_DATA, SECTION_ORDER, CONFIDENCE_FLOOR });
