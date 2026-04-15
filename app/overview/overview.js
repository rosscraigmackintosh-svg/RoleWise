/* ═══════════════════════════════════════════════════════════════════════════
 * RoleWise — Overview page v1
 * ───────────────────────────────────────────────────────────────────────────
 * A calm career home. Block order and thresholds follow the v1 data-wiring
 * spec. Rules:
 *   - No fabricated content. If data is missing or below threshold, the block
 *     is hidden (not stubbed, not placeholder-filled).
 *   - No scoring, ranking, confidence, or predictive logic.
 *   - Module is decoupled from app.js. It receives a context object
 *     containing state + helpers and never mutates either.
 *
 * Public entry point: window.RW_OverviewV1.render(ctx)
 *
 * ctx = {
 *   mount:       HTMLElement,
 *   allRoles:    Array,
 *   userProfile: Object | null   // preferences_json shape
 *   helpers: {
 *     esc, currentStageLabel, isArchivedRole, sanitiseCompanyName,
 *     daysSinceLastUpdate, appResponseStatus,
 *     switchNav, selectRole, setAppFilter, IN_PROGRESS_STAGES
 *   }
 * }
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── State reference (set per render) ─────────────────────────────────────
  let ctx = null;

  // ── Small local utils ────────────────────────────────────────────────────
  const has = v =>
    v !== null && v !== undefined &&
    !(typeof v === 'string' && v.trim() === '') &&
    !(Array.isArray(v) && v.length === 0);

  const titleCase = s =>
    (s || '').toString().replace(/\b\w/g, c => c.toUpperCase());

  const sortCounts = obj =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]);

  const joinList = arr =>
    arr.length <= 1 ? (arr[0] || '') :
    arr.length === 2 ? `${arr[0]} and ${arr[1]}` :
    `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;

  // Standardised source precedence for per-role analysis output.
  // latest_match_output (newer pipeline) > analysis.full_output (legacy).
  // Returns the whole object when no path given, or the value at a dotted path.
  // Never throws — returns undefined for missing branches.
  const getAnalysisField = (role, path) => {
    const fo = (role && (role.latest_match_output || (role.analysis && role.analysis.full_output))) || {};
    if (!path) return fo;
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), fo);
  };

  // ── Canonical preference field list (for populated-count threshold) ──────
  const MEANINGFUL_PREF_FIELDS = [
    'role_titles',        // array — derived from seniority+domains or explicit
    'location',           // string
    'work_models',        // array
    'employment_types',   // array
    'salary_min',         // numeric string
    'day_rate',           // numeric string
    'company_stages',     // array of {stage,strength}
    'seniority',          // array
    'domains',            // array
    'product_maturity',   // array
    'work_more',          // free text
    'work_less',          // free text
    'deal_breakers',      // array
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // 4.1 — getOverviewData
  // Assemble everything other helpers need. Pure read-only slicing.
  // ═══════════════════════════════════════════════════════════════════════
  function getOverviewData() {
    const { allRoles, userProfile, helpers } = ctx;
    const { isArchivedRole, currentStageLabel } = helpers;

    const roles = Array.isArray(allRoles) ? allRoles : [];
    const preferences = userProfile || {};

    const openRoles    = roles.filter(r => !isArchivedRole(r) && r.user_decision !== 'skip');
    const appliedRoles = roles.filter(r => r._appliedDate);
    const savedRoles   = roles.filter(r => r.user_decision === 'save' && !isArchivedRole(r));
    const skippedRoles = roles.filter(r => r.user_decision === 'skip');
    const analysedRoles = roles.filter(r => r.analysis || r.latest_match_output);

    const stats = {
      total:      roles.length,
      open:       openRoles.length,
      applied:    appliedRoles.length,
      saved:      savedRoles.length,
      skipped:    skippedRoles.length,
      analysed:   analysedRoles.length,
      responded:  appliedRoles.filter(r => r._firstResponseDate).length,
    };

    return {
      preferences,
      roles,
      openRoles,
      appliedRoles,
      savedRoles,
      skippedRoles,
      analysedRoles,
      recruiterRecords: [],  // recruiter records not yet exposed in stable form
      stats,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4.2 — getPreferenceSummary(preferences)
  // ═══════════════════════════════════════════════════════════════════════
  function getPreferenceSummary(preferences) {
    const p = preferences || {};

    // Derive role titles from seniority + domains when explicit list absent.
    const seniority = Array.isArray(p.seniority) ? p.seniority : [];
    const domains   = Array.isArray(p.domains)   ? p.domains   : [];

    const roleTitleParts = [];
    if (seniority.length) roleTitleParts.push(seniority.map(titleCase).join('/'));
    if (domains.length)   roleTitleParts.push(domains.map(titleCase).join('/'));
    const roleTitlePhrase =
      roleTitleParts.length
        ? roleTitleParts.join(' ') + ' roles'
        : '';

    // Count meaningful populated fields
    const populated = {};
    populated.role_titles      = has(roleTitlePhrase);
    populated.location         = has(p.location);
    populated.work_models      = has(p.work_models) || has(p.work_model && p.work_model !== 'unsure' ? p.work_model : null);
    populated.employment_types = has(p.employment_types) || has(p.contract_type);
    populated.salary_min       = has(p.salary_min) || has(p.day_rate);
    populated.company_stages   = Array.isArray(p.company_stages) && p.company_stages.length > 0;
    populated.seniority        = seniority.length > 0;
    populated.domains          = domains.length > 0;
    populated.product_maturity = Array.isArray(p.product_maturity) && p.product_maturity.length > 0;
    populated.work_more        = has(p.work_more);
    populated.work_less        = has(p.work_less);
    populated.deal_breakers    = Array.isArray(p.deal_breakers) && p.deal_breakers.length > 0;

    const populatedFieldCount = Object.values(populated).filter(Boolean).length;

    // Build summary text only if threshold met
    let summaryText = '';
    if (populatedFieldCount >= 3) {
      const parts = [];

      // Opening: role titles
      if (roleTitlePhrase) {
        parts.push(`You're targeting ${roleTitlePhrase}`);
      } else {
        parts.push(`You're targeting roles`);
      }

      // Company stage / type
      if (populated.company_stages) {
        const stageWords = p.company_stages
          .filter(s => s && s.stage)
          .map(s => String(s.stage).toLowerCase());
        if (stageWords.length) {
          parts.push(`in ${joinList(stageWords)} companies`);
        }
      } else if (populated.product_maturity) {
        parts.push(`in ${joinList(p.product_maturity.map(x => String(x).toLowerCase()))} products`);
      }

      // Work model
      if (populated.work_models) {
        const wmVals = Array.isArray(p.work_models)
          ? p.work_models
          : (p.work_model && p.work_model !== 'unsure' ? [p.work_model] : []);
        if (wmVals.length) {
          parts.push(`with a preference for ${joinList(wmVals.map(w => String(w).toLowerCase()))} work`);
        }
      }

      // Location
      if (populated.location) {
        parts.push(`based in ${p.location}`);
      }

      // Salary
      if (has(p.salary_min)) {
        const n = Number(p.salary_min);
        if (!Number.isNaN(n) && n > 0) {
          parts.push(`with a salary target of £${Math.round(n / 1000)}k+`);
        }
      } else if (has(p.day_rate)) {
        const n = Number(p.day_rate);
        if (!Number.isNaN(n) && n > 0) {
          parts.push(`with a day rate target of £${n}`);
        }
      }

      summaryText = parts.join(', ').replace(/,\s+with/g, ', with') + '.';
      // Tidy leading comma cases
      summaryText = summaryText.replace(/,\s+,/g, ',');
    }

    // Avoiding bullets — only explicit deal breakers
    const avoiding = (Array.isArray(p.deal_breakers) ? p.deal_breakers : [])
      .map(x => (typeof x === 'string' ? x : x?.label || x?.text || ''))
      .filter(Boolean);

    return {
      populatedFieldCount,
      summaryText,
      avoiding,
      canEdit: true,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4.3 — getNextActions(data)
  // ═══════════════════════════════════════════════════════════════════════
  function getNextActions(data) {
    const { helpers } = ctx;
    const { currentStageLabel, appResponseStatus } = helpers;
    const actions = [];

    // A. follow_up_stale — Applied with stale/ghosted/no-reply >=14d
    const stale = data.appliedRoles.filter(r => {
      if (r.outcome_state || r.archived) return false;
      if (r._firstResponseDate) return false;
      const days = Math.floor((Date.now() - new Date(r._appliedDate).getTime()) / 86400000);
      return days >= 14;
    });
    if (stale.length >= 1) {
      actions.push({
        type: 'follow_up_stale',
        label: stale.length === 1
          ? 'Follow up on 1 application past 14 days'
          : `Follow up on ${stale.length} applications past 14 days`,
        href: null,
        // Uses the transient `stale_followup` inbox filter added in app.js,
        // which matches this exact predicate (applied, no response, ≥14 days).
        // Guarantees the Applications list shows the same count shown here.
        navTarget: { view: 'applications', filter: 'stale_followup' },
        priority: 1,
      });
    }

    // B. review_high_fit — at least 2 roles already flagged Apply by analysis
    const highFit = data.openRoles.filter(r =>
      (r.analysis?.decision === 'Apply' || r.analysis?.decision === 'apply') &&
      currentStageLabel(r) === 'JD Review'
    );
    if (highFit.length >= 2) {
      actions.push({
        type: 'review_high_fit',
        label: `Review ${highFit.length} high-fit roles`,
        href: null,
        navTarget: { view: 'applications', filter: 'active' },
        priority: 2,
      });
    }

    // C. complete_preferences — fewer than 3 meaningful fields
    const prefSummary = getPreferenceSummary(data.preferences);
    if (prefSummary.populatedFieldCount < 3) {
      actions.push({
        type: 'complete_preferences',
        label: 'Add your preferences so we can tailor this page',
        href: null,
        navTarget: { view: 'profile' },
        priority: 3,
      });
    }

    // D. review_unreviewed — roles in JD Review, not yet analysed
    const unreviewed = data.openRoles.filter(r =>
      currentStageLabel(r) === 'JD Review' &&
      !r.analysis && !r.latest_match_output
    );
    if (unreviewed.length >= 1) {
      actions.push({
        type: 'review_unreviewed',
        label: unreviewed.length === 1
          ? 'Review 1 role you haven\u2019t analysed yet'
          : `Review ${unreviewed.length} roles you haven\u2019t analysed yet`,
        href: null,
        navTarget: { view: 'applications', filter: 'active' },
        priority: 4,
      });
    }

    // Sort + cap
    actions.sort((a, b) => a.priority - b.priority);
    return actions.slice(0, 5);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4.4 — getHighFitRoles(data)
  // ═══════════════════════════════════════════════════════════════════════
  function getHighFitRoles(data) {
    const { helpers } = ctx;
    const { sanitiseCompanyName, currentStageLabel } = helpers;

    const reasonFor = (role) => {
      const fo = getAnalysisField(role);
      // 1. existing fit explanation
      const fit = fo.fit_summary || fo.worth_exploring_reason || fo.why_fit;
      if (typeof fit === 'string' && fit.trim()) {
        return fit.trim().split(/\.\s/)[0].replace(/\.$/, '');
      }
      // 2. explicit preference overlap — concrete only
      const overlaps = [];
      const pd = fo.practical_details || {};
      const prefs = data.preferences || {};
      const wm = Array.isArray(prefs.work_models) ? prefs.work_models : (prefs.work_model ? [prefs.work_model] : []);
      if (pd.remote_model && wm.some(w => String(pd.remote_model).toLowerCase().includes(String(w).toLowerCase()))) {
        overlaps.push(`${pd.remote_model} matches your work model`);
      }
      if (pd.location && prefs.location && String(pd.location).toLowerCase().includes(String(prefs.location).toLowerCase())) {
        overlaps.push(`located in ${pd.location}`);
      }
      if (overlaps.length) return overlaps[0];
      return '';
    };

    // High-fit candidates: analysis decision = Apply AND still at JD Review
    // (not yet applied/skipped) AND has a usable reason.
    // Applied-stage roles are explicitly excluded — an applied role is no
    // longer something the user needs to "act on" from this block.
    const highFitCandidates = data.openRoles
      .filter(r => {
        if (currentStageLabel(r) !== 'JD Review') return false;
        const d = r.analysis?.decision;
        return d === 'Apply' || d === 'apply';
      })
      .map(r => ({ role: r, reason: reasonFor(r) }))
      .filter(x => x.reason);

    if (highFitCandidates.length >= 2) {
      return {
        mode: 'high_fit',
        roles: highFitCandidates.slice(0, 6).map(({ role, reason }) => ({
          id: role.id,
          title: role.role_title || 'Untitled role',
          company: sanitiseCompanyName(role.company_name) || 'Unknown company',
          reason,
          stage: currentStageLabel(role),
          href: null,
        })),
      };
    }

    // Fallback: recent JD-Review roles if we have ≥2 with stored analysis (so the reason line isn't empty)
    const recent = data.openRoles
      .filter(r => currentStageLabel(r) === 'JD Review' && (r.analysis || r.latest_match_output))
      .map(r => ({ role: r, reason: reasonFor(r) }))
      .filter(x => x.reason)
      .sort((a, b) =>
        new Date(b.role.role_updates?.[0]?.created_at || b.role.created_at).getTime() -
        new Date(a.role.role_updates?.[0]?.created_at || a.role.created_at).getTime()
      );

    if (recent.length >= 2) {
      return {
        mode: 'recent_review',
        roles: recent.slice(0, 6).map(({ role, reason }) => ({
          id: role.id,
          title: role.role_title || 'Untitled role',
          company: sanitiseCompanyName(role.company_name) || 'Unknown company',
          reason,
          stage: currentStageLabel(role),
          href: null,
        })),
      };
    }

    return { mode: 'recent_review', roles: [] };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4.5 — getSearchPatterns(data)
  // ═══════════════════════════════════════════════════════════════════════
  function getSearchPatterns(data) {
    const analysedCount = data.analysedRoles.length;
    const appliedCount  = data.appliedRoles.length;
    if (analysedCount < 10 && appliedCount < 5) {
      return { isValid: false, bullets: [] };
    }

    const bullets = [];

    // 1. Top industries across applied roles
    const indCounts = {};
    data.appliedRoles.forEach(r => {
      const ind = getAnalysisField(r, 'practical_details.industry');
      if (ind) indCounts[String(ind).toLowerCase()] = (indCounts[String(ind).toLowerCase()] || 0) + 1;
    });
    const topInd = sortCounts(indCounts).filter(([, c]) => c >= 2);
    if (topInd.length >= 1) {
      const [name, count] = topInd[0];
      bullets.push(`${count} of your ${data.appliedRoles.length} applications are in ${name}.`);
    }

    // 2. Skip reasons: hard_no pattern
    const hardNo = data.skippedRoles.filter(r => r.latest_match_output?.hard_no).length;
    if (hardNo >= 2) {
      bullets.push(`${hardNo} roles were skipped where the analysis flagged a hard mismatch.`);
    }

    // 3. Response trend
    if (appliedCount >= 5) {
      const responded = data.stats.responded;
      if (responded === 0) {
        bullets.push(`None of your ${appliedCount} applications have had a reply yet.`);
      } else {
        bullets.push(`${responded} of your ${appliedCount} applications have had a reply so far.`);
      }
    }

    // 4. Work model distribution across applied roles
    const wmCounts = {};
    data.appliedRoles.forEach(r => {
      const wm = r.work_model || getAnalysisField(r, 'practical_details.remote_model');
      if (wm) wmCounts[String(wm).toLowerCase()] = (wmCounts[String(wm).toLowerCase()] || 0) + 1;
    });
    const topWm = sortCounts(wmCounts).filter(([, c]) => c >= 2);
    if (topWm.length >= 1) {
      const [name, count] = topWm[0];
      bullets.push(`${count} of your applications are ${name} roles.`);
    }

    // 5. Salary disclosure across analysed roles
    const withSalary = data.analysedRoles.filter(r => {
      const sal = getAnalysisField(r, 'practical_details.salary_annual');
      return sal && sal !== 'Not stated';
    }).length;
    if (analysedCount >= 10) {
      const pct = Math.round((withSalary / analysedCount) * 100);
      bullets.push(`${withSalary} of ${analysedCount} analysed roles disclosed a salary (${pct}%).`);
    }

    return { isValid: bullets.length > 0, bullets: bullets.slice(0, 5) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4.6 — getExpandSearchModel(preferences)
  // ═══════════════════════════════════════════════════════════════════════
  function getExpandSearchModel(preferences) {
    const p = preferences || {};
    const seniority = Array.isArray(p.seniority) ? p.seniority : [];
    const domains   = Array.isArray(p.domains)   ? p.domains   : [];
    const wmVals    = Array.isArray(p.work_models) ? p.work_models : (p.work_model && p.work_model !== 'unsure' ? [p.work_model] : []);

    const hasTitle    = seniority.length > 0 || domains.length > 0;
    const hasLocation = has(p.location);
    const hasWm       = wmVals.length > 0;

    const personalised = hasTitle && (hasLocation || hasWm);

    // Build a suggested query from actually-present fields only.
    const queryTerms = [];
    if (seniority.length) queryTerms.push(seniority[0]);
    if (domains.length)   queryTerms.push(domains[0]);
    if (hasLocation)      queryTerms.push(p.location);
    else if (wmVals.includes('remote')) queryTerms.push('remote');
    const query = queryTerms.join(' ').trim();

    const makeHref = (tpl) => tpl.replace('{q}', encodeURIComponent(query));

    if (personalised) {
      const boards = [
        {
          name: 'LinkedIn Jobs',
          rationale: `Broad coverage for ${seniority[0] ? titleCase(seniority[0]) + ' ' : ''}${domains[0] ? titleCase(domains[0]) : 'your field'} roles.`,
          query,
          href: makeHref('https://www.linkedin.com/jobs/search/?keywords={q}'),
        },
        {
          name: 'Otta',
          rationale: 'Curated tech roles with structured filters for seniority and work model.',
          query,
          href: makeHref('https://app.otta.com/jobs?q={q}'),
        },
        {
          name: 'Wellfound',
          rationale: 'Startups and early-stage companies, aligned to direct outreach.',
          query,
          href: makeHref('https://wellfound.com/jobs?q={q}'),
        },
        {
          name: 'Google Jobs',
          rationale: 'Aggregator that surfaces listings other boards miss.',
          query,
          href: makeHref('https://www.google.com/search?q={q}+jobs'),
        },
      ];
      return { mode: 'personalised', boards };
    }

    // Generic fallback — no personalisation language
    return {
      mode: 'generic',
      boards: [
        { name: 'LinkedIn Jobs', rationale: '', query: '', href: 'https://www.linkedin.com/jobs/' },
        { name: 'Otta',          rationale: '', query: '', href: 'https://app.otta.com/' },
        { name: 'Wellfound',     rationale: '', query: '', href: 'https://wellfound.com/jobs' },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4.7 — getRecruiterPaths(data)
  // Directional suggestions based on observed patterns. Hidden without a
  // strong recurring signal.
  // ═══════════════════════════════════════════════════════════════════════
  function getRecruiterPaths(data) {
    const items = [];

    // Industry / domain signal — need ≥3 roles with the same industry
    const indCounts = {};
    data.analysedRoles.forEach(r => {
      const ind = getAnalysisField(r, 'practical_details.industry');
      if (ind) indCounts[String(ind).toLowerCase()] = (indCounts[String(ind).toLowerCase()] || 0) + 1;
    });
    const topInd = sortCounts(indCounts).filter(([, c]) => c >= 3);

    // Company stage / maturity signal — need ≥3 matching
    const stageCounts = {};
    data.analysedRoles.forEach(r => {
      const st = getAnalysisField(r, 'practical_details.company_stage');
      if (st) stageCounts[String(st).toLowerCase()] = (stageCounts[String(st).toLowerCase()] || 0) + 1;
    });
    const topStage = sortCounts(stageCounts).filter(([, c]) => c >= 3);

    if (topInd.length === 0 && topStage.length === 0) {
      return { isValid: false, items: [] };
    }

    if (topInd.length >= 1) {
      const [name] = topInd[0];
      items.push({
        type: 'boutique_recruiters',
        title: `Boutique recruiters in ${name}`,
        rationale: `You've reviewed multiple roles in ${name}. Specialist recruiters in that space may be worth contacting.`,
      });
    }

    if (topStage.length >= 1) {
      const [name] = topStage[0];
      if (/seed|series.?a|early/.test(name)) {
        items.push({
          type: 'vc_talent',
          title: 'VC talent partners',
          rationale: `Several of your roles sit in ${name} companies. VC talent partners can sometimes route intros at that stage.`,
        });
      } else {
        items.push({
          type: 'in_house_talent',
          title: 'In-house talent teams',
          rationale: `Several of your roles sit in ${name} companies. Reaching in-house talent teams directly is one path to consider.`,
        });
      }
    }

    return { isValid: items.length > 0, items: items.slice(0, 3) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4.8 — canGenerateIntro(preferences)
  // ═══════════════════════════════════════════════════════════════════════
  function canGenerateIntro(preferences) {
    const p = preferences || {};
    const seniority = Array.isArray(p.seniority) ? p.seniority : [];
    const domains   = Array.isArray(p.domains)   ? p.domains   : [];
    const maturity  = Array.isArray(p.product_maturity) ? p.product_maturity : [];
    const stages    = Array.isArray(p.company_stages) ? p.company_stages : [];

    const hasRoleTitle = seniority.length > 0 || domains.length > 0;
    const hasContext   = domains.length > 0 || maturity.length > 0 || stages.length > 0 || seniority.length > 0;

    if (hasRoleTitle && hasContext) return { enabled: true };
    return {
      enabled: false,
      reason: 'Add your preferences to generate a tailored intro',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4.9 — buildIntroDraft(preferences, targetType)
  // Restrained, editable template. Never auto-sent.
  // ═══════════════════════════════════════════════════════════════════════
  function buildIntroDraft(preferences, targetType) {
    const p = preferences || {};
    const seniority = Array.isArray(p.seniority) ? p.seniority : [];
    const domains   = Array.isArray(p.domains)   ? p.domains   : [];
    const wmVals    = Array.isArray(p.work_models) ? p.work_models : (p.work_model && p.work_model !== 'unsure' ? [p.work_model] : []);
    const loc       = p.location || '';
    const name      = p.display_name || '';

    const roleLabel = [seniority[0], domains[0]].filter(Boolean).map(titleCase).join(' ');
    const locLabel  = loc ? `based in ${loc}` : '';
    const wmLabel   = wmVals.length ? ` open to ${joinList(wmVals.map(w => String(w).toLowerCase()))}` : '';

    let subject = '';
    let body = '';

    if (targetType === 'recruiter') {
      subject = roleLabel ? `${roleLabel} search — open to a quick chat` : 'Open to a chat about my search';
      body =
`Hi,

I'm ${name || '[your name]'}, currently looking at ${roleLabel || 'new roles'}${locLabel ? `, ${locLabel}` : ''}${wmLabel}. If you're working on anything in that area, I'd welcome a short introduction.

Happy to share more on what I'm looking for.

Thanks,
${name || '[your name]'}`;
    } else if (targetType === 'company') {
      subject = roleLabel ? `${roleLabel} — interested in your team` : 'Interested in your team';
      body =
`Hi,

I'm ${name || '[your name]'}, a ${roleLabel || 'candidate'}${locLabel ? ` ${locLabel}` : ''}. I'm exploring roles${wmLabel} and wanted to reach out directly.

If there's a relevant opening, I'd be glad to share more about my background.

Best,
${name || '[your name]'}`;
    } else {
      // speculative
      subject = 'Speculative intro';
      body =
`Hi,

I'm ${name || '[your name]'}${roleLabel ? `, a ${roleLabel}` : ''}${locLabel ? ` ${locLabel}` : ''}. I'm exploring new roles${wmLabel} and thought it might be worth saying hello.

No immediate ask — happy to stay in touch if useful.

Thanks,
${name || '[your name]'}`;
    }

    return { subject, body };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER LAYER
  // Each block returns an HTML string or '' if below threshold.
  // The main render assembles only non-empty blocks.
  // ═══════════════════════════════════════════════════════════════════════
  const esc = s => ctx.helpers.esc(s ?? '');

  function renderSnapshotBlock(data) {
    const s = getPreferenceSummary(data.preferences);
    if (s.populatedFieldCount < 3) {
      // Compact fallback prompt
      return `
        <section class="ov1-block ov1-snapshot-empty">
          <p class="ov1-lede">Tell us what you're looking for to get started.</p>
          <button class="ov1-cta ov1-cta--primary" data-ov1-action="edit-prefs">Add your preferences</button>
        </section>`;
    }

    const avoidingHtml = s.avoiding.length
      ? `<div class="ov1-avoiding">
           <div class="ov1-avoiding-label">Avoiding</div>
           <ul class="ov1-avoiding-list">
             ${s.avoiding.slice(0, 5).map(a => `<li>${esc(a)}</li>`).join('')}
           </ul>
         </div>`
      : '';

    return `
      <section class="ov1-block ov1-snapshot">
        <div class="ov1-kicker">Role snapshot</div>
        <p class="ov1-lede">${esc(s.summaryText)}</p>
        ${avoidingHtml}
        <button class="ov1-link" data-ov1-action="edit-prefs">Edit preferences</button>
      </section>`;
  }

  function renderNextActionsBlock(data) {
    const actions = getNextActions(data);
    if (actions.length === 0) return '';

    return `
      <section class="ov1-block ov1-actions">
        <h2 class="ov1-h2">Best next actions</h2>
        <ul class="ov1-actions-list">
          ${actions.map((a, i) => `
            <li>
              <button class="ov1-action-row"
                      data-ov1-action="action"
                      data-ov1-idx="${i}">
                <span class="ov1-action-label">${esc(a.label)}</span>
                <span class="ov1-action-arrow" aria-hidden="true">&rsaquo;</span>
              </button>
            </li>
          `).join('')}
        </ul>
      </section>`;
  }

  function renderHighFitBlock(data) {
    const res = getHighFitRoles(data);
    if (res.roles.length < 2) return '';

    const title = res.mode === 'high_fit'
      ? 'High-fit roles for you'
      : 'Recent roles worth reviewing';

    return `
      <section class="ov1-block ov1-highfit">
        <h2 class="ov1-h2">${esc(title)}</h2>
        <ul class="ov1-role-list">
          ${res.roles.map(r => `
            <li>
              <button class="ov1-role-row" data-ov1-action="open-role" data-ov1-role-id="${esc(r.id)}">
                <span class="ov1-role-head">
                  <span class="ov1-role-company">${esc(r.company)}</span>
                  <span class="ov1-role-title">${esc(r.title)}</span>
                </span>
                <span class="ov1-role-reason">${esc(r.reason)}</span>
              </button>
            </li>
          `).join('')}
        </ul>
      </section>`;
  }

  function renderPatternsBlock(data) {
    const res = getSearchPatterns(data);
    // Threshold rule: if there is not enough information to produce real
    // patterns, hide the block entirely — no placeholder, no filler copy.
    // getSearchPatterns is the single source of truth for the threshold.
    if (!res.isValid) return '';

    return `
      <section class="ov1-block ov1-patterns">
        <h2 class="ov1-h2">Patterns so far</h2>
        <ul class="ov1-bullet-list">
          ${res.bullets.map(b => `<li>${esc(b)}</li>`).join('')}
        </ul>
      </section>`;
  }

  function renderExpandSearchBlock(data) {
    const res = getExpandSearchModel(data.preferences);
    if (res.mode === 'hidden') return '';

    const isPersonalised = res.mode === 'personalised';

    return `
      <section class="ov1-block ov1-expand">
        <h2 class="ov1-h2">Expand your search</h2>
        <ul class="ov1-board-list">
          ${res.boards.map(b => `
            <li class="ov1-board-row">
              <a class="ov1-board-link" href="${esc(b.href)}" target="_blank" rel="noopener noreferrer">
                <span class="ov1-board-name">${esc(b.name)}</span>
                ${isPersonalised && b.rationale ? `<span class="ov1-board-rationale">${esc(b.rationale)}</span>` : ''}
                ${isPersonalised && b.query ? `<span class="ov1-board-query">Search with my criteria: ${esc(b.query)}</span>` : ''}
              </a>
            </li>
          `).join('')}
        </ul>
      </section>`;
  }

  function renderRecruiterPathsBlock(data) {
    const res = getRecruiterPaths(data);
    if (!res.isValid || res.items.length === 0) return '';

    return `
      <section class="ov1-block ov1-recruiters">
        <h2 class="ov1-h2">Recruiter and company paths</h2>
        <ul class="ov1-path-list">
          ${res.items.map(it => `
            <li class="ov1-path-row">
              <div class="ov1-path-title">${esc(it.title)}</div>
              <div class="ov1-path-rationale">${esc(it.rationale)}</div>
            </li>
          `).join('')}
        </ul>
      </section>`;
  }

  function renderIntroGenBlock(data, showOtherContext) {
    const can = canGenerateIntro(data.preferences);

    // Only render the intro block at all if some downstream context exists
    // (recruiter paths OR expand-search personalised) — otherwise it would
    // be a floating shell.
    if (!showOtherContext) return '';

    const btnAttrs = can.enabled
      ? 'data-ov1-action="gen-intro"'
      : 'disabled aria-disabled="true"';

    const helper = can.enabled
      ? ''
      : `<p class="ov1-muted">${esc(can.reason || '')}</p>`;

    return `
      <section class="ov1-block ov1-intro">
        <h2 class="ov1-h2">Intro generator</h2>
        <p class="ov1-muted">Draft a short, editable outreach note. Nothing is sent automatically.</p>
        <div class="ov1-intro-targets">
          <button class="ov1-cta" ${btnAttrs} data-ov1-target="recruiter">For a recruiter</button>
          <button class="ov1-cta" ${btnAttrs} data-ov1-target="company">For a company</button>
          <button class="ov1-cta" ${btnAttrs} data-ov1-target="speculative">Speculative</button>
        </div>
        ${helper}
      </section>`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════
  function render(incomingCtx) {
    ctx = incomingCtx;
    const mount = ctx.mount;
    if (!mount) return;

    const data = getOverviewData();

    const snapshotHtml       = renderSnapshotBlock(data);
    const actionsHtml        = renderNextActionsBlock(data);
    const highFitHtml        = renderHighFitBlock(data);
    const patternsHtml       = renderPatternsBlock(data);
    const expandHtml         = renderExpandSearchBlock(data);
    const recruiterHtml      = renderRecruiterPathsBlock(data);

    const expandModel        = getExpandSearchModel(data.preferences);
    const recruiterModel     = getRecruiterPaths(data);
    const introContext       = (expandModel.mode === 'personalised') || recruiterModel.isValid;
    const introHtml          = renderIntroGenBlock(data, introContext);

    // Combine only the blocks that are non-empty — no hollow shells.
    const blocks = [snapshotHtml, actionsHtml, highFitHtml, patternsHtml, expandHtml, recruiterHtml, introHtml]
      .filter(Boolean);

    // If literally nothing renders, show a single calm starter line
    const body = blocks.length
      ? blocks.join('')
      : `<section class="ov1-block ov1-snapshot-empty">
           <p class="ov1-lede">Tell us what you're looking for to get started.</p>
           <button class="ov1-cta ov1-cta--primary" data-ov1-action="edit-prefs">Add your preferences</button>
         </section>`;

    // Enable page-level scroll on the container. `col-ov--legacy-doc` flips
    // #col-overview-cards from `overflow:hidden` to `overflow-y:auto` — this
    // is the same scroll mode Review uses for long-form pages.
    mount.classList.add('col-ov--legacy-doc');
    mount.innerHTML = `
      <div class="col-center-inner ov1-page">
        <header class="ov1-header">
          <h1 class="ov1-h1">Overview</h1>
        </header>
        ${body}
      </div>`;

    // ── Event wiring ──────────────────────────────────────────────────────
    const actions = getNextActions(data);

    mount.querySelectorAll('[data-ov1-action="edit-prefs"]').forEach(el => {
      el.addEventListener('click', () => ctx.helpers.switchNav('profile'));
    });

    mount.querySelectorAll('[data-ov1-action="open-role"]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.ov1RoleId;
        if (!id) return;
        ctx.helpers.setAppFilter('active');
        ctx.helpers.switchNav('applications');
        ctx.helpers.selectRole(id, { scrollIntoView: true });
      });
    });

    mount.querySelectorAll('[data-ov1-action="action"]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.ov1Idx, 10);
        const a = actions[idx];
        if (!a) return;
        if (a.navTarget?.filter) ctx.helpers.setAppFilter(a.navTarget.filter);
        if (a.navTarget?.view)   ctx.helpers.switchNav(a.navTarget.view);
      });
    });

    mount.querySelectorAll('[data-ov1-action="gen-intro"]').forEach(el => {
      el.addEventListener('click', () => {
        const target = el.dataset.ov1Target || 'recruiter';
        openIntroOverlay(data.preferences, target);
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Intro overlay — right-side slide-in panel, ~50% width desktop, full height.
  // Lives on document.body so it sits above the Overview page. Editor area only;
  // nothing is sent. Close via explicit button, backdrop click, or ESC.
  // ═══════════════════════════════════════════════════════════════════════
  function openIntroOverlay(preferences, initialTarget) {
    // Remove any existing overlay (idempotent — prevents stacking)
    const existing = document.getElementById('ov1-intro-overlay');
    if (existing) existing.remove();

    let currentTarget = initialTarget || 'recruiter';

    const overlay = document.createElement('div');
    overlay.id = 'ov1-intro-overlay';
    overlay.className = 'ov1-intro-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Intro generator');

    const renderPanel = (target) => {
      const draft = buildIntroDraft(preferences, target);
      const targets = [
        { id: 'recruiter',   label: 'For a recruiter' },
        { id: 'company',     label: 'For a company' },
        { id: 'speculative', label: 'Speculative' },
      ];
      return `
        <div class="ov1-intro-overlay__backdrop" data-ov1-overlay-close="true"></div>
        <aside class="ov1-intro-overlay__panel" aria-labelledby="ov1-intro-overlay-title">
          <header class="ov1-intro-overlay__head">
            <div>
              <h2 class="ov1-intro-overlay__title" id="ov1-intro-overlay-title">Intro generator</h2>
              <p class="ov1-intro-overlay__sub">Draft a short, editable outreach note. Nothing is sent automatically.</p>
            </div>
            <button class="ov1-intro-overlay__close" type="button" aria-label="Close" data-ov1-overlay-close="true">&times;</button>
          </header>
          <div class="ov1-intro-overlay__body">
            <div class="ov1-intro-overlay__tabs" role="tablist">
              ${targets.map(t => `
                <button type="button"
                        class="ov1-intro-overlay__tab${t.id === target ? ' is-active' : ''}"
                        role="tab"
                        aria-selected="${t.id === target ? 'true' : 'false'}"
                        data-ov1-overlay-target="${t.id}">
                  ${esc(t.label)}
                </button>
              `).join('')}
            </div>
            <label class="ov1-intro-overlay__field">
              <span class="ov1-intro-overlay__label">Subject</span>
              <input type="text" class="ov1-intro-overlay__input" id="ov1-intro-overlay-subject" value="${esc(draft.subject)}">
            </label>
            <label class="ov1-intro-overlay__field ov1-intro-overlay__field--grow">
              <span class="ov1-intro-overlay__label">Message</span>
              <textarea class="ov1-intro-overlay__textarea" id="ov1-intro-overlay-body">${esc(draft.body)}</textarea>
            </label>
            <p class="ov1-intro-overlay__footnote">Edit freely. Nothing is sent from this page.</p>
          </div>
          <footer class="ov1-intro-overlay__foot">
            <button type="button" class="ov1-cta" data-ov1-overlay-close="true">Close</button>
          </footer>
        </aside>`;
    };

    overlay.innerHTML = renderPanel(currentTarget);
    document.body.appendChild(overlay);
    // Force next-frame to trigger slide-in transition
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    // Focus management — move focus into the panel for keyboard users
    const firstInput = overlay.querySelector('#ov1-intro-overlay-subject');
    if (firstInput) firstInput.focus();

    // ── Close wiring ────────────────────────────────────────────────────
    const close = () => {
      overlay.classList.remove('is-open');
      document.removeEventListener('keydown', onKey);
      // allow transition to play before removal
      setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 200);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    };
    document.addEventListener('keydown', onKey);

    overlay.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.getAttribute && t.getAttribute('data-ov1-overlay-close') === 'true') {
        close();
      }
    });

    // ── Tab wiring (regenerate draft into the same overlay) ─────────────
    // Preserves edits the user has already made only if they switch *back*
    // to the same tab — switching target regenerates fresh canonical copy
    // because the draft for a different target is a different note.
    overlay.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('[data-ov1-overlay-target]');
      if (!btn) return;
      const nextTarget = btn.getAttribute('data-ov1-overlay-target');
      if (!nextTarget || nextTarget === currentTarget) return;
      currentTarget = nextTarget;
      overlay.innerHTML = renderPanel(currentTarget);
      // overlay stays open; re-focus subject for continuity
      const s = overlay.querySelector('#ov1-intro-overlay-subject');
      if (s) s.focus();
    });
  }

  // Public API
  window.RW_OverviewV1 = {
    render,
    // Expose helpers for potential reuse / testing
    getOverviewData,
    getPreferenceSummary,
    getNextActions,
    getHighFitRoles,
    getSearchPatterns,
    getExpandSearchModel,
    getRecruiterPaths,
    canGenerateIntro,
    buildIntroDraft,
  };
})();
