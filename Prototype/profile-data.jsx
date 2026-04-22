// Profile page data — a reflection derived from behaviour and settings.
// Three data states mirror the rest of the system (early / active / heavy).

const PROFILE_DATA = {
  active: {
    identity: {
      name: 'Sofia Karlsson',
      title: 'Principal / Founding Product Designer',
      titleSource: 'inferred',
      descriptor: 'Focused on complex SaaS, AI-driven products, and high-ownership roles',
    },
    summary: {
      seniority: { label: 'Senior IC', detail: 'Principal / Staff', source: 'confirmed' },
      roleTypes: { label: 'Founding Designer · Principal IC', source: 'inferred' },
      domains:   { label: 'AI SaaS · Enterprise SaaS', source: 'confirmed' },
      workModel: { label: 'Remote / Hybrid', detail: 'max 2 days on-site', source: 'confirmed' },
    },
    preferences: {
      strong: [
        'Remote or hybrid roles',
        'High-ownership roles (founding, principal, staff)',
        'Complex product environments',
        'Teams with existing design partners',
      ],
      open: [
        'Contract or fractional engagements',
        'Developer tools · infrastructure',
        'Series B–C companies',
      ],
      avoids: [
        'Production coding requirement',
        '3+ days on-site per week',
        'Marketing-heavy or growth-only roles',
      ],
    },
    behaviour: {
      applies: [
        'Are AI SaaS or enterprise SaaS platforms',
        'Involve complex workflows or data-heavy surfaces',
        'Offer high ownership — founding, principal, staff',
      ],
      skips: [
        'Require production coding',
        'Do not list a salary range',
        'Require 3+ days on-site',
      ],
      sampleSize: 48,
    },
    adjacency: {
      typical: [
        'Adjacent to your current level (Principal / Staff IC)',
        'In similar domains (AI, SaaS, developer tools)',
        'At Series B–D stage companies',
      ],
      atypical: [
        'Head of Design roles',
        'Pure management tracks without IC scope',
        'Early-stage (pre-seed / seed) founding roles',
      ],
    },
    outcomes: {
      matching: {
        note: 'Roles matching your preferences',
        detail: 'More often reach recruiter screen or later',
        n: 32,
      },
      outside: {
        note: 'Roles outside your preferences',
        detail: 'More often skipped or do not progress',
        n: 16,
      },
    },
  },

  heavy: {
    identity: {
      name: 'Sofia Karlsson',
      title: 'Principal / Founding Product Designer',
      titleSource: 'confirmed',
      descriptor: 'Focused on complex SaaS, AI-driven products, and high-ownership roles',
    },
    summary: {
      seniority: { label: 'Senior IC', detail: 'Principal / Staff', source: 'confirmed' },
      roleTypes: { label: 'Founding · Principal · Staff IC', source: 'confirmed' },
      domains:   { label: 'AI SaaS · Enterprise SaaS · Dev tools', source: 'confirmed' },
      workModel: { label: 'Remote / Hybrid', detail: 'max 2 days on-site', source: 'confirmed' },
    },
    preferences: {
      strong: [
        'Remote or hybrid roles',
        'High-ownership roles (founding, principal, staff)',
        'Complex product environments',
        'Listed salary range',
        'Teams with existing design partners',
      ],
      open: [
        'Contract or fractional engagements',
        'Developer tools · infrastructure',
        'Fintech (enterprise-facing)',
      ],
      avoids: [
        'Production coding requirement',
        '3+ days on-site per week',
        'Marketing-heavy or growth-only roles',
        'Pure management without IC scope',
      ],
    },
    behaviour: {
      applies: [
        'Are AI SaaS or enterprise SaaS platforms',
        'Involve complex workflows or data-heavy surfaces',
        'Offer founding, principal, or staff ownership',
        'List a salary range up-front',
      ],
      skips: [
        'Require production coding',
        'Do not list a salary range',
        'Require 3+ days on-site',
        'Are marketing-heavy or growth-only',
      ],
      sampleSize: 203,
    },
    adjacency: {
      typical: [
        'Adjacent to your current level (Principal / Staff IC)',
        'In similar domains (AI, SaaS, developer tools)',
        'At Series B–D stage companies',
      ],
      atypical: [
        'Head of Design roles',
        'Pure management tracks',
        'Public-company senior roles',
      ],
    },
    outcomes: {
      matching: {
        note: 'Roles matching your preferences',
        detail: 'Reach recruiter screen ~2.3× more often',
        n: 141,
      },
      outside: {
        note: 'Roles outside your preferences',
        detail: 'Usually skipped or no response',
        n: 62,
      },
    },
  },

  early: {
    identity: {
      name: 'Sofia Karlsson',
      title: 'Senior / Principal Product Designer',
      titleSource: 'tentative',
      descriptor: 'Early signals — profile will firm up as you review more roles',
    },
    summary: {
      seniority: { label: 'Senior IC', detail: 'level still forming', source: 'tentative' },
      roleTypes: { label: 'Senior / Principal Designer', source: 'tentative' },
      domains:   { label: 'AI · SaaS', source: 'tentative' },
      workModel: { label: 'Remote preferred', detail: 'open to hybrid', source: 'confirmed' },
    },
    preferences: {
      strong: [
        'Remote roles',
      ],
      open: [
        'Hybrid arrangements',
        'Various domains — still exploring',
      ],
      avoids: [
        'Full-time on-site',
      ],
      tentative: true,
    },
    behaviour: {
      applies: [
        'Are fully remote',
        'Involve product design for digital platforms',
      ],
      skips: [
        'Require relocation',
      ],
      sampleSize: 5,
      tentative: true,
    },
    adjacency: {
      typical: [
        'Similar to your current level',
      ],
      atypical: [],
      tentative: true,
    },
    outcomes: null, // not enough data
  },
};

Object.assign(window, { PROFILE_DATA });
