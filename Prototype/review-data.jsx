// Rolewise — Weekly Review datasets
//
// A calm weekly reflection. Each week is a self-contained snapshot.
// Shapes match the spec: header / context / activity / market / friction /
// pipeline / lessons / one-next-action. No scoring, no percentages.

const WEEKS = [
  // — Current week (index 0) ——————————————————————————————————————————
  {
    id: 'w-15',
    label: 'Week of 8–14 April',
    short: '8–14 Apr',
    range: 'Mon 8 April → Sun 14 April',
    state: 'active',
    basedOn: '12 roles reviewed',

    activity: [
      { k: 'Roles reviewed', v: 12 },
      { k: 'Roles applied',  v: 3  },
      { k: 'Roles skipped',  v: 5  },
    ],

    market: [
      'Most roles this week were hybrid — 2 to 3 days on-site.',
      'AI SaaS and developer-tools companies dominated the listings you saw.',
      'Only a third of roles listed a salary range.',
    ],

    friction: [
      'Many roles required 3 or more days on-site.',
      'Salary was often not stated.',
      'A handful of roles required production coding in the take-home.',
    ],

    pipeline: [
      { k: 'Applied, awaiting response', v: 6 },
      { k: 'In process',                  v: 4 },
      { k: 'Interviews scheduled',        v: 2 },
      { k: 'Offers',                      v: 0 },
      { k: 'No response after 14 days',   v: 3, tone: 'quiet' },
    ],

    lessons: [
      'Roles aligned with your stated preferences were more likely to be applied to.',
      'Roles without a listed salary were consistently skipped.',
      'You focused more on senior IC roles this week than on lead roles.',
    ],

    nextAction: {
      verb: 'Prioritise',
      text: 'roles with salary listed next week.',
      note: 'Based on the strongest pattern from this week.',
    },
  },

  // — Previous week (index 1) ——————————————————————————————————————————
  {
    id: 'w-14',
    label: 'Week of 1–7 April',
    short: '1–7 Apr',
    range: 'Mon 1 April → Sun 7 April',
    state: 'active',
    basedOn: '16 roles reviewed',

    activity: [
      { k: 'Roles reviewed', v: 16 },
      { k: 'Roles applied',  v: 5  },
      { k: 'Roles skipped',  v: 5  },
    ],

    market: [
      'Remote-first roles made up nearly half of what you saw.',
      'More Series B and C startups than usual.',
      'Design Lead postings picked up mid-week.',
    ],

    friction: [
      'Two roles required relocation.',
      'Several roles asked for 5+ years of management experience.',
      'A few listings closed within days of posting.',
    ],

    pipeline: [
      { k: 'Applied, awaiting response', v: 8 },
      { k: 'In process',                  v: 3 },
      { k: 'Interviews scheduled',        v: 1 },
      { k: 'Offers',                      v: 0 },
      { k: 'No response after 14 days',   v: 2, tone: 'quiet' },
    ],

    lessons: [
      'You were quicker to apply to remote roles than hybrid ones.',
      'Management-heavy roles were skipped more often than IC roles.',
      'Listings you acted on within 24 hours were more likely to move forward.',
    ],

    nextAction: {
      verb: 'Apply earlier',
      text: 'to remote roles — within 24 hours of seeing them.',
      note: 'These had the highest response rate last week.',
    },
  },

  // — Two weeks ago (index 2) ——————————————————————————————————————————
  {
    id: 'w-13',
    label: 'Week of 25–31 March',
    short: '25–31 Mar',
    range: 'Mon 25 March → Sun 31 March',
    state: 'active',
    basedOn: '9 roles reviewed',

    activity: [
      { k: 'Roles reviewed', v: 9 },
      { k: 'Roles applied',  v: 2 },
      { k: 'Roles skipped',  v: 4 },
    ],

    market: [
      'A quieter week — fewer new listings overall.',
      'Most roles were senior IC, not lead.',
      'London-based roles outnumbered remote ones this week.',
    ],

    friction: [
      'Two roles required in-person assessments.',
      'One role asked for a paid trial project.',
    ],

    pipeline: [
      { k: 'Applied, awaiting response', v: 5 },
      { k: 'In process',                  v: 2 },
      { k: 'Interviews scheduled',        v: 1 },
      { k: 'Offers',                      v: 0 },
      { k: 'No response after 14 days',   v: 1, tone: 'quiet' },
    ],

    lessons: [
      'You saved more than you applied to — a reflective, selective week.',
      'Roles in London were over-represented in your saves.',
      'Paid-trial roles were skipped without hesitation.',
    ],

    nextAction: {
      verb: 'Revisit',
      text: 'three saved roles from this week before they close.',
      note: 'Saved ≠ applied. A brief second look will help.',
    },
  },

  // — Empty / new week (index 3) ——————————————————————————————————————————
  {
    id: 'w-16',
    label: 'Week of 15–21 April',
    short: '15–21 Apr',
    range: 'Mon 15 April → Sun 21 April',
    state: 'empty',
    basedOn: null,
    emptyLine: 'No activity this week yet.',
    emptyNote: 'Your review will appear here as you engage with roles.',
  },
];

Object.assign(window, { WEEKS });
