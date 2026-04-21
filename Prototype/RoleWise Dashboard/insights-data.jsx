// Insights data — observations derived from behaviour over time.
//
// Model: each insight has a statement, 2-3 pieces of supporting evidence,
// a strength ("strong" | "emerging" | "early"), a category, and an optional
// tiny visual (bar/split/dots). Evidence rows are clickable filters into
// Roles / Applications.
//
// Three scenarios cover: active pipeline (default), heavier use (more
// patterns), and early use (confidence-gated empty state).

const INSIGHTS_DATA = {
  active: {
    ranges: {
      '14d': { label: 'Last 14 days', rolesSeen: 84,  applied: 19, responses: 7 },
      '30d': { label: 'Last 30 days', rolesSeen: 182, applied: 42, responses: 16 },
      'all': { label: 'All time',     rolesSeen: 312, applied: 48, responses: 22 },
    },
    // Sections keyed by spec categories.
    sections: {
      'Application patterns': [
        {
          id: 'ap-1',
          strength: 'strong',
          statement: 'Roles without a listed salary rarely progress.',
          evidence: [
            { k: 'Applied to roles without salary',       v: '8 roles',   link: 'roles:no-salary' },
            { k: 'Reached recruiter screen or beyond',    v: '0',         link: 'applications:no-salary-progress' },
            { k: 'Compared with salary-disclosed roles',  v: '64% reach screen', link: null },
          ],
          visual: { kind: 'split', left: { label: 'With salary', pct: 64 }, right: { label: 'Without', pct: 0 } },
        },
        {
          id: 'ap-2',
          strength: 'strong',
          statement: 'You apply more often on Tuesdays and Wednesdays.',
          evidence: [
            { k: 'Applications mid-week (Tue–Wed)',       v: '26 of 48',  link: 'applications:midweek' },
            { k: 'Applications Thu–Mon',                   v: '22 of 48',  link: 'applications:rest' },
          ],
          visual: {
            kind: 'bars',
            bars: [
              { k: 'Mon', v: 4 }, { k: 'Tue', v: 14 }, { k: 'Wed', v: 12 },
              { k: 'Thu', v: 7 }, { k: 'Fri', v: 6 }, { k: 'Sat', v: 3 }, { k: 'Sun', v: 2 },
            ],
          },
        },
        {
          id: 'ap-3',
          strength: 'emerging',
          statement: 'Roles you save for more than 5 days are rarely applied to.',
          evidence: [
            { k: 'Saved >5 days ago',                     v: '19 roles',  link: 'roles:stale-saves' },
            { k: 'Eventually applied',                    v: '2 of 19',   link: null },
          ],
          visual: null,
        },
      ],

      'Market signals': [
        {
          id: 'ms-1',
          strength: 'strong',
          statement: 'Hybrid listings are trending up — remote holding steady.',
          evidence: [
            { k: 'Hybrid roles, last 14 days',            v: '22 roles',  link: 'roles:hybrid' },
            { k: 'Share of new listings',                  v: '46%, up from 31%', link: null },
          ],
          visual: {
            kind: 'trend',
            series: [
              { label: 'Hybrid',  points: [28, 31, 34, 38, 42, 46], hue: 250 },
              { label: 'Remote',  points: [40, 41, 39, 38, 39, 38], hue: 150 },
              { label: 'On-site', points: [32, 28, 27, 24, 19, 16], hue: 40  },
            ],
          },
        },
        {
          id: 'ms-2',
          strength: 'strong',
          statement: 'AI & ML roles now appear most often in your feed.',
          evidence: [
            { k: 'AI & ML roles, last 30 days',            v: '14 roles',  link: 'roles:ai-ml' },
            { k: 'Enterprise SaaS',                        v: '12 roles',  link: 'roles:saas' },
            { k: 'Developer tools',                        v: '9 roles',   link: 'roles:devtools' },
          ],
          visual: null,
        },
        {
          id: 'ms-3',
          strength: 'emerging',
          statement: 'Staff-level titles are appearing more than Lead titles.',
          evidence: [
            { k: 'Staff titles, last 14 days',             v: '11 roles',  link: 'roles:staff' },
            { k: 'Lead titles, same period',               v: '6 roles',   link: 'roles:lead' },
          ],
          visual: null,
        },
      ],

      'Response behaviour': [
        {
          id: 'rb-1',
          strength: 'strong',
          statement: 'Most responses happen within 7 days.',
          evidence: [
            { k: 'Responses within 7 days',                v: '6 of 7',    link: 'applications:fast-response' },
            { k: 'Responses after 14 days',                v: '1 of 7',    link: null },
          ],
          visual: {
            kind: 'bars',
            bars: [
              { k: '0–3d',  v: 4 },
              { k: '4–7d',  v: 2 },
              { k: '8–14d', v: 0 },
              { k: '15d+',  v: 1 },
            ],
          },
        },
        {
          id: 'rb-2',
          strength: 'strong',
          statement: 'Recruiter-sourced applications respond faster than direct ones.',
          evidence: [
            { k: 'Via recruiter — avg response',           v: '3 days',    link: 'applications:via-recruiter' },
            { k: 'Direct application — avg response',      v: '9 days',    link: 'applications:direct' },
          ],
          visual: null,
        },
      ],

      'Friction patterns': [
        {
          id: 'fp-1',
          strength: 'strong',
          statement: 'You skip most often when salary is missing.',
          evidence: [
            { k: 'Skipped — salary missing',               v: '22 roles',  link: 'roles:skipped-no-salary' },
            { k: 'Skipped — hybrid 3+ days on-site',       v: '11 roles',  link: 'roles:skipped-hybrid' },
            { k: 'Skipped — production coding required',   v: '9 roles',   link: 'roles:skipped-coding' },
          ],
          visual: null,
        },
        {
          id: 'fp-2',
          strength: 'emerging',
          statement: 'You rarely progress past take-home tasks.',
          evidence: [
            { k: 'Take-home received',                     v: '4 roles',   link: 'applications:takehome' },
            { k: 'Advanced past take-home',                v: '1 role',    link: null },
          ],
          visual: null,
        },
      ],

      'Career direction': [
        {
          id: 'cd-1',
          strength: 'early',
          statement: 'Platform and infra-adjacent roles keep your attention longest.',
          evidence: [
            { k: 'Platform/infra roles — avg time saved',  v: '2.3 days',  link: 'roles:platform' },
            { k: 'Growth/marketing roles — avg time saved', v: '0.4 days', link: 'roles:growth' },
          ],
          visual: null,
        },
      ],
    },
  },

  // Heavier use — more confident signals.
  heavy: {
    ranges: {
      '14d': { label: 'Last 14 days', rolesSeen: 342,  applied: 48, responses: 18 },
      '30d': { label: 'Last 30 days', rolesSeen: 780,  applied: 112, responses: 44 },
      'all': { label: 'All time',     rolesSeen: 1842, applied: 127, responses: 61 },
    },
    sections: {
      'Application patterns': [
        {
          id: 'h-ap-1',
          strength: 'strong',
          statement: 'Roles without a listed salary rarely progress.',
          evidence: [
            { k: 'Applied to roles without salary',       v: '34 roles',  link: 'roles:no-salary' },
            { k: 'Reached recruiter screen or beyond',    v: '2',         link: null },
            { k: 'Compared with salary-disclosed roles',  v: '71% reach screen', link: null },
          ],
          visual: { kind: 'split', left: { label: 'With salary', pct: 71 }, right: { label: 'Without', pct: 6 } },
        },
        {
          id: 'h-ap-2',
          strength: 'strong',
          statement: 'You apply faster to roles referred by someone you know.',
          evidence: [
            { k: 'Referred roles — avg time to apply',     v: '4 hours',   link: 'roles:referred' },
            { k: 'Cold applications — avg time to apply',  v: '2.8 days',  link: 'roles:cold' },
          ],
          visual: null,
        },
      ],
      'Market signals': [
        {
          id: 'h-ms-1',
          strength: 'strong',
          statement: 'Hybrid has overtaken remote in new listings.',
          evidence: [
            { k: 'Hybrid, last 30 days',                   v: '48 roles',  link: 'roles:hybrid' },
            { k: 'Remote, same period',                    v: '64 roles, flat', link: null },
          ],
          visual: {
            kind: 'trend',
            series: [
              { label: 'Hybrid',  points: [30, 32, 36, 40, 46, 50], hue: 250 },
              { label: 'Remote',  points: [52, 51, 50, 49, 51, 50], hue: 150 },
              { label: 'On-site', points: [18, 17, 14, 11, 12, 12], hue: 40  },
            ],
          },
        },
        {
          id: 'h-ms-2',
          strength: 'strong',
          statement: 'AI & ML roles make up almost a third of your feed.',
          evidence: [
            { k: 'AI & ML, last 30 days',                  v: '38 roles',  link: 'roles:ai-ml' },
            { k: 'Up from last month',                     v: '+14 roles', link: null },
          ],
          visual: null,
        },
      ],
      'Response behaviour': [
        {
          id: 'h-rb-1',
          strength: 'strong',
          statement: 'Response times have slowed by roughly 2 days this month.',
          evidence: [
            { k: 'Average response, this month',           v: '8 days',    link: null },
            { k: 'Average response, prior month',          v: '6 days',    link: null },
          ],
          visual: null,
        },
        {
          id: 'h-rb-2',
          strength: 'strong',
          statement: 'Most responses happen within 7 days.',
          evidence: [
            { k: 'Within 7 days',                          v: '48 of 61',  link: null },
            { k: 'After 14 days',                          v: '7 of 61',   link: null },
          ],
          visual: {
            kind: 'bars',
            bars: [
              { k: '0–3d',  v: 24 },
              { k: '4–7d',  v: 24 },
              { k: '8–14d', v: 6 },
              { k: '15d+',  v: 7 },
            ],
          },
        },
      ],
      'Friction patterns': [
        {
          id: 'h-fp-1',
          strength: 'strong',
          statement: 'Missing salary is the single biggest reason you skip a role.',
          evidence: [
            { k: 'Skipped — salary missing',               v: '58 roles',  link: null },
            { k: 'Skipped — hybrid 3+ days on-site',       v: '31 roles',  link: null },
            { k: 'Skipped — production coding required',   v: '24 roles',  link: null },
          ],
          visual: null,
        },
      ],
      'Career direction': [
        {
          id: 'h-cd-1',
          strength: 'emerging',
          statement: 'You engage longer with platform and design-systems roles.',
          evidence: [
            { k: 'Platform/DS — avg time before decision', v: '3.1 days',  link: null },
            { k: 'Growth/marketing — avg time',            v: '0.6 days',  link: null },
          ],
          visual: null,
        },
      ],
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
      'Application patterns': [],
      'Market signals': [
        {
          id: 'e-ms-1',
          strength: 'early',
          statement: 'Remote roles are most common so far.',
          evidence: [
            { k: 'Remote',  v: '3 of 5', link: null },
            { k: 'Hybrid',  v: '2 of 5', link: null },
          ],
          visual: null,
        },
      ],
      'Response behaviour': [],
      'Friction patterns': [],
      'Career direction': [],
    },
  },
};

const SECTION_ORDER = [
  'Application patterns',
  'Market signals',
  'Response behaviour',
  'Friction patterns',
  'Career direction',
];

// Minimum relevant roles for a section to show content (not empty state).
const CONFIDENCE_FLOOR = 10;

Object.assign(window, { INSIGHTS_DATA, SECTION_ORDER, CONFIDENCE_FLOOR });
