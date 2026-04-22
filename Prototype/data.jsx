// Sample data for Rolewise Overview. Three scenarios.

const DATASETS = {
  active: {
    pipeline: [
      { key: 'seen',    label: 'Seen',       value: 312, delta: '+28 this wk' },
      { key: 'applied', label: 'Applied',    value: 48,  delta: '+9 this wk'  },
      { key: 'process', label: 'In process', value: 11,  delta: '3 moving'    },
      { key: 'closed',  label: 'Closed',     value: 24,  delta: '2 this wk'   },
    ],
    stages: [
      { name: 'Applied',          sub: 'awaiting response',    count: 6, pct: 100, lastMoved: 'last new 2d ago' },
      { name: 'Recruiter screen', sub: 'scheduled or done',    count: 2, pct: 34,  lastMoved: 'last moved today' },
      { name: 'Hiring manager',   sub: 'interview booked',     count: 1, pct: 18,  lastMoved: 'last moved yesterday' },
      { name: 'Task / take-home', sub: 'in progress',          count: 1, pct: 18,  lastMoved: 'last moved 4d ago' },
      { name: 'Panel',            sub: 'scheduled next week',  count: 1, pct: 18,  lastMoved: 'last moved 6d ago' },
      { name: 'Final',            sub: 'none yet',             count: 0, pct: 0,   lastMoved: '—' },
    ],
    response: { fastest: 1, average: 6, noReply: 14, waitingLongest: 'Airtable · 12 days', note: 'Most responses happen within 7 days' },
    market: {
      'Work model': [
        { k: 'Remote', v: 18, pct: 38 },
        { k: 'Hybrid', v: 22, pct: 46 },
        { k: 'On-site', v: 8, pct: 16 },
      ],
      'Industry': [
        { k: 'AI & ML',         v: 14, pct: 29 },
        { k: 'Enterprise SaaS', v: 12, pct: 25 },
        { k: 'Developer tools', v: 9,  pct: 19 },
        { k: 'Fintech',         v: 7,  pct: 15 },
        { k: 'Other',           v: 6,  pct: 12 },
      ],
      'Company stage': [
        { k: 'Startup (seed–B)',   v: 16, pct: 33 },
        { k: 'Scaleup (C+)',       v: 19, pct: 40 },
        { k: 'Enterprise',         v: 13, pct: 27 },
      ],
    },
    risks: [
      { k: 'Production coding requirement', v: 9 },
      { k: 'Salary missing from listing',   v: 22 },
      { k: 'Hybrid — 3 or more days on-site', v: 11 },
      { k: 'Unclear scope or seniority',    v: 6 },
    ],
    roles: [
      { id: 1, company: 'Linear', short: 'Ln', title: 'Senior Product Designer', stage: 'Recruiter screen', decision: 'Applied', location: 'Remote (EU)',    salary: '£95k–£120k', when: '2h ago',  event: 'Recruiter replied' },
      { id: 2, company: 'Ramp',   short: 'Rp', title: 'Design Lead, Platform',    stage: 'Hiring manager',   decision: 'Applied', location: 'London · Hybrid', salary: 'Not stated', when: 'Yesterday', event: 'Moved to HM round' },
      { id: 3, company: 'Figma',  short: 'Fg', title: 'Staff Designer, AI',       stage: 'Applied',          decision: 'Applied', location: 'Remote (UK)',    salary: '$180k–$210k', when: '2d ago', event: 'Applied' },
      { id: 4, company: 'Vercel', short: 'Vc', title: 'Senior Designer',          stage: 'Saved',            decision: 'Skipped', location: 'Remote',         salary: 'Not stated', when: '3d ago', event: 'Skipped — no salary' },
      { id: 5, company: 'Arc',    short: 'Ar', title: 'Product Designer II',      stage: 'Task',             decision: 'Applied', location: 'New York · Hybrid', salary: '$170k–$195k', when: '4d ago', event: 'Take-home received' },
      { id: 6, company: 'Notion', short: 'Nt', title: 'Lead Designer, Docs',      stage: 'Seen',             decision: 'Skipped', location: 'San Francisco', salary: '$210k base', when: '5d ago', event: 'Skipped — location' },
      { id: 7, company: 'Stripe', short: 'St', title: 'Product Designer',         stage: 'Panel',            decision: 'Applied', location: 'London · Hybrid', salary: '£110k–£135k', when: '6d ago', event: 'Panel scheduled' },
      { id: 8, company: 'Airtable', short: 'Ab', title: 'Senior Designer, Apps',  stage: 'Applied',          decision: 'Applied', location: 'Remote (US)',    salary: 'Not stated', when: '7d ago', event: 'Applied' },
    ],
    insight: 'Roles without a listed salary are slowest to respond — on average 11 days versus 4.',
  },

  heavy: {
    pipeline: [
      { key: 'seen',    label: 'Seen',       value: 1842, delta: '+142 this wk' },
      { key: 'applied', label: 'Applied',    value: 127,  delta: '+18 this wk' },
      { key: 'process', label: 'In process', value: 28,   delta: '7 moving'    },
      { key: 'closed',  label: 'Closed',     value: 76,   delta: '6 this wk'   },
    ],
    stages: [
      { name: 'Applied',          sub: 'awaiting response', count: 14, pct: 100, lastMoved: 'last new today' },
      { name: 'Recruiter screen', sub: 'scheduled or done', count: 6,  pct: 42,  lastMoved: 'last moved 1h ago' },
      { name: 'Hiring manager',   sub: '',                  count: 4,  pct: 28,  lastMoved: 'last moved yesterday' },
      { name: 'Task / take-home', sub: 'in progress',       count: 2,  pct: 14,  lastMoved: 'last moved 2d ago' },
      { name: 'Panel',            sub: '',                  count: 1,  pct: 7,   lastMoved: 'last moved 3d ago' },
      { name: 'Final',            sub: 'offer pending',     count: 1,  pct: 7,   lastMoved: 'last moved 5d ago' },
    ],
    response: { fastest: 1, average: 8, noReply: 42, waitingLongest: 'Datadog · 31 days', note: 'Response times have slowed this month' },
    market: {
      'Work model': [
        { k: 'Remote', v: 64, pct: 50 },
        { k: 'Hybrid', v: 48, pct: 38 },
        { k: 'On-site', v: 15, pct: 12 },
      ],
      'Industry': [
        { k: 'AI & ML',         v: 38, pct: 30 },
        { k: 'Enterprise SaaS', v: 32, pct: 25 },
        { k: 'Developer tools', v: 24, pct: 19 },
        { k: 'Fintech',         v: 18, pct: 14 },
        { k: 'Other',           v: 15, pct: 12 },
      ],
      'Company stage': [
        { k: 'Startup (seed–B)',   v: 42, pct: 33 },
        { k: 'Scaleup (C+)',       v: 51, pct: 40 },
        { k: 'Enterprise',         v: 34, pct: 27 },
      ],
    },
    risks: [
      { k: 'Production coding requirement', v: 24 },
      { k: 'Salary missing from listing',   v: 58 },
      { k: 'Hybrid — 3 or more days on-site', v: 31 },
      { k: 'Unclear scope or seniority',    v: 17 },
    ],
    roles: [
      { id: 1, company: 'Linear', short: 'Ln', title: 'Senior Product Designer', stage: 'Panel', decision: 'Applied', location: 'Remote (EU)', salary: '£95k–£120k', when: '1h ago', event: 'Panel confirmed' },
      { id: 2, company: 'Ramp',   short: 'Rp', title: 'Design Lead, Platform',    stage: 'Final', decision: 'Applied', location: 'London · Hybrid', salary: '$190k–$220k', when: '3h ago', event: 'Offer pending' },
      { id: 3, company: 'Figma',  short: 'Fg', title: 'Staff Designer, AI',       stage: 'Task', decision: 'Applied', location: 'Remote (UK)', salary: '$180k–$210k', when: 'Today', event: 'Take-home submitted' },
      { id: 4, company: 'Vercel', short: 'Vc', title: 'Senior Designer',          stage: 'Saved', decision: 'Skipped', location: 'Remote', salary: 'Not stated', when: 'Yesterday', event: 'Skipped — no salary' },
      { id: 5, company: 'Arc',    short: 'Ar', title: 'Product Designer II',      stage: 'Hiring manager', decision: 'Applied', location: 'New York · Hybrid', salary: '$170k–$195k', when: '2d ago', event: 'HM interview done' },
      { id: 6, company: 'Notion', short: 'Nt', title: 'Lead Designer, Docs',      stage: 'Seen', decision: 'Skipped', location: 'San Francisco', salary: '$210k base', when: '3d ago', event: 'Skipped — on-site' },
      { id: 7, company: 'Stripe', short: 'St', title: 'Product Designer',         stage: 'Recruiter screen', decision: 'Applied', location: 'London · Hybrid', salary: '£110k–£135k', when: '4d ago', event: 'Recruiter call' },
      { id: 8, company: 'Airtable', short: 'Ab', title: 'Senior Designer, Apps',  stage: 'Applied', decision: 'Applied', location: 'Remote (US)', salary: 'Not stated', when: '5d ago', event: 'Applied' },
    ],
    insight: 'Hybrid roles now make up nearly half of your pipeline — up from 28% last month.',
  },

  early: {
    pipeline: [
      { key: 'seen',    label: 'Seen',       value: 18, delta: '+18 this wk' },
      { key: 'applied', label: 'Applied',    value: 2,  delta: '+2 this wk'  },
      { key: 'process', label: 'In process', value: 1,  delta: '1 moving'    },
      { key: 'closed',  label: 'Closed',     value: 0,  delta: '—'           },
    ],
    stages: [
      { name: 'Applied',          sub: 'awaiting response', count: 1, pct: 100, lastMoved: 'last new yesterday' },
      { name: 'Recruiter screen', sub: 'scheduled Thu',     count: 1, pct: 100, lastMoved: 'last moved today' },
      { name: 'Hiring manager',   sub: 'none yet',          count: 0, pct: 0,   lastMoved: '—' },
      { name: 'Task / take-home', sub: 'none yet',          count: 0, pct: 0,   lastMoved: '—' },
      { name: 'Panel',            sub: 'none yet',          count: 0, pct: 0,   lastMoved: '—' },
      { name: 'Final',            sub: 'none yet',          count: 0, pct: 0,   lastMoved: '—' },
    ],
    response: { fastest: 2, average: 4, noReply: 0, waitingLongest: '—', note: 'Too few data points to see a pattern yet' },
    market: {
      'Work model': [
        { k: 'Remote', v: 3, pct: 60 },
        { k: 'Hybrid', v: 2, pct: 40 },
        { k: 'On-site', v: 0, pct: 0 },
      ],
      'Industry': [
        { k: 'AI & ML',         v: 2, pct: 40 },
        { k: 'Developer tools', v: 2, pct: 40 },
        { k: 'Other',           v: 1, pct: 20 },
      ],
      'Company stage': [
        { k: 'Startup (seed–B)',   v: 3, pct: 60 },
        { k: 'Scaleup (C+)',       v: 2, pct: 40 },
        { k: 'Enterprise',         v: 0, pct: 0  },
      ],
    },
    risks: [
      { k: 'Salary missing from listing',   v: 3 },
      { k: 'Unclear scope or seniority',    v: 1 },
    ],
    roles: [
      { id: 1, company: 'Linear', short: 'Ln', title: 'Senior Product Designer', stage: 'Recruiter screen', decision: 'Applied', location: 'Remote (EU)', salary: '£95k–£120k', when: 'Today', event: 'Recruiter replied' },
      { id: 2, company: 'Arc',    short: 'Ar', title: 'Product Designer',        stage: 'Applied',          decision: 'Applied', location: 'Remote', salary: 'Not stated', when: 'Yesterday', event: 'Applied' },
      { id: 3, company: 'Figma',  short: 'Fg', title: 'Staff Designer, AI',      stage: 'Saved',            decision: 'Skipped', location: 'Remote (UK)', salary: '$180k–$210k', when: '2d ago', event: 'Skipped' },
    ],
    insight: 'You’ve saved 5 roles — add a few more to start seeing patterns emerge.',
  },
};

// Muted warm tones for company logo squares.
const LOGO_TONES = [
  { bg: 'oklch(88% 0.02 60)',  fg: 'oklch(30% 0.02 60)'  },
  { bg: 'oklch(88% 0.02 140)', fg: 'oklch(30% 0.02 140)' },
  { bg: 'oklch(88% 0.02 210)', fg: 'oklch(30% 0.02 210)' },
  { bg: 'oklch(88% 0.02 280)', fg: 'oklch(30% 0.02 280)' },
  { bg: 'oklch(88% 0.02 30)',  fg: 'oklch(30% 0.02 30)'  },
  { bg: 'oklch(88% 0.02 100)', fg: 'oklch(30% 0.02 100)' },
  { bg: 'oklch(88% 0.02 250)', fg: 'oklch(30% 0.02 250)' },
  { bg: 'oklch(88% 0.02 180)', fg: 'oklch(30% 0.02 180)' },
];

const NAV_PRIMARY = [
  { key: 'overview',     label: 'Overview',     href: 'Overview.html' },
  { key: 'roles',        label: 'Roles',        href: 'Roles.html',        count: 48 },
  { key: 'applications', label: 'Applications', href: 'Applications.html', count: 11 },
  { key: 'recruiters',   label: 'Recruiters',   href: 'Recruiters.html',   count: 7  },
];
const NAV_SECONDARY = [
  { key: 'review',    label: 'Weekly review',    href: 'Review.html' },
  { key: 'decisions', label: 'Decision history', href: 'Decisions.html' },
  { key: 'insights',  label: 'Insights',         href: 'Insights.html' },
  { key: 'patterns',  label: 'Pattern history',  href: 'Patterns.html', plus: true },
  { key: 'documents', label: 'Documents',        href: 'Documents.html' },
  { key: 'profile',   label: 'Profile',          href: 'Profile.html' },
  { key: 'settings',  label: 'Settings',         href: 'Settings.html' },
];

// Shared helper: render the Rolewise sidebar. Every page uses this so the
// nav is identical everywhere — same order, same hrefs, same Plus badge.
function renderSidebar({ current, counts, plusActive }) {
  const e = React.createElement;
  const cn = (...xs) => xs.filter(Boolean).join(' ');

  const countFor = (k) => {
    if (!counts) return null;
    if (k === 'roles')        return counts.roles ?? null;
    if (k === 'applications') return counts.applications ?? null;
    if (k === 'recruiters')   return counts.recruiters ?? null;
    return null;
  };

  const navItem = (n, opts = {}) => {
    const count = countFor(n.key);
    const active = current === n.key;
    const cls = cn('nav-item', active && 'active');
    const label = e('span',
      { style: { display: 'inline-flex', alignItems: 'center', gap: 7 } },
      n.label,
      n.plus ? e('span', { className: 'nav-plus-dot', title: 'Rolewise Plus' }) : null
    );
    const countEl = count != null ? e('span', { className: 'nav-count' }, count) : null;
    return e('a', {
      key: n.key,
      href: n.href || '#',
      className: cls,
      style: { textDecoration: 'none' },
      'aria-current': active ? 'page' : undefined,
    }, label, countEl);
  };

  return e('aside', { className: 'sidebar' },
    e('div', { className: 'brand' },
      e('div', { className: 'brand-mark' },
        e('div', { className: 'brand-dot' }),
        'Rolewise'
      ),
      e('div', { className: 'brand-tag' }, 'Job search, made clearer')
    ),
    e('div', { className: 'nav-group' },
      NAV_PRIMARY.map(n => navItem(n))
    ),
    e('div', { className: 'nav-group' },
      e('div', { className: 'nav-label' }, 'More'),
      NAV_SECONDARY.map(n => navItem(n))
    ),
    e('div', { className: 'sidebar-footer' },
      e('a', {
        href: 'Patterns.html',
        className: cn('upgrade', plusActive && 'is-active'),
        style: { textDecoration: 'none', display: 'block' },
      },
        e('div', { className: 'upgrade-t' },
          'Rolewise Plus',
          plusActive ? e('span', { className: 'upgrade-on' }, 'On') : null
        ),
        e('div', { style: { marginTop: 2 } },
          plusActive ? 'Pattern history unlocked' : 'Unlock pattern history'
        )
      ),
      e('a', {
        href: 'Profile.html',
        className: 'profile',
        style: { marginTop: 10, textDecoration: 'none' },
        'aria-current': current === 'profile' ? 'page' : undefined,
      },
        e('div', { className: 'avatar' }, 'SK'),
        e('div', null,
          e('div', { className: 'profile-name' }, 'Sofia Karlsson'),
          e('div', { className: 'profile-mail' }, 'sofia@sk.co')
        )
      )
    )
  );
}

const ACCENT_MAP = {
  'ink-blue': { accent: 'oklch(45% 0.06 250)', bg: 'oklch(95% 0.015 250)', border: 'oklch(85% 0.03 250)' },
  'ink':      { accent: 'oklch(28% 0.01 80)',  bg: 'oklch(95% 0.005 80)',  border: 'oklch(82% 0.005 80)' },
  'olive':    { accent: 'oklch(45% 0.06 130)', bg: 'oklch(95% 0.015 130)', border: 'oklch(85% 0.03 130)' },
  'rust':     { accent: 'oklch(48% 0.08 40)',  bg: 'oklch(95% 0.015 40)',  border: 'oklch(85% 0.03 40)'  },
  'plum':     { accent: 'oklch(42% 0.07 320)', bg: 'oklch(95% 0.015 320)', border: 'oklch(85% 0.03 320)' },
};

Object.assign(window, { DATASETS, LOGO_TONES, NAV_PRIMARY, NAV_SECONDARY, ACCENT_MAP, renderSidebar });
