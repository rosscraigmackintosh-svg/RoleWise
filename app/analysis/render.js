// ═══════════════════════════════════════════════════════════════════════════
// analysis/render.js — Decision block + Match/Break rendering
// ═══════════════════════════════════════════════════════════════════════════
// Loaded as a plain <script> before app.js. No bundler or ES modules required.
// Uses global esc() from app.js (loaded in the same page context).
//
// renderDecisionBlock(signals, viability, narrative, output)
//   → { html, hasBreaks, topSignals, rawTopSignals, rawPositiveInCard, claritySignals, cvPlaceholderHtml }
//
// renderMatchBreak(signals, hasBreaks, rawTopSignals, rawPositiveInCard)
//   → string (HTML or empty)

function renderDecisionBlock(signals, viability, narrative, output) {
  var hasBreaks = signals.breaks.length > 0;

  // ── One-line summary ──────────────────────────────────────────────
  // Short, confident sentence summarising the verdict. Max ~100 chars.
  // Must not contradict the card title or repeat the first signal.

  // Helper: trim to first sentence, cap at ~100 chars.
  function _trimOneLiner(text) {
    if (!text) return '';
    // Strip personal name references → "your"
    var t = text.replace(/\b[A-Z][a-z]+'s\s+(stated\s+)?(hard\s+)?(limit|preference|blocker|max)/gi, 'your $3');
    if (t.length <= 100) return t;
    var sentEnd = t.search(/[.!?]\s/);
    if (sentEnd > 0 && sentEnd <= 100) return t.slice(0, sentEnd + 1);
    var cut = t.lastIndexOf(' ', 98);
    return (cut > 30 ? t.slice(0, cut) : t.slice(0, 98)).replace(/[,;]\s*$/, '') + '.';
  }

  var oneLiner = '';
  if (hasBreaks) {
    // Breaks: the signals already explain what's wrong. The one-liner
    // should add complementary context, not repeat the lead signal.
    if (viability.hasCoding) {
      oneLiner = 'This role requires production coding.';
    } else if (signals.breaks.length >= 2) {
      oneLiner = 'Multiple conflicts with your saved preferences.';
    } else if (viability.isHardNo && output.hard_no_reason) {
      // Use a trimmed version of the AI reason as complementary detail
      oneLiner = _trimOneLiner(output.hard_no_reason);
    } else {
      // Single structural break — signals are clear, skip one-liner
      oneLiner = '';
    }
  } else {
    // Worth exploring: use narrative summary if it doesn't contradict.
    if (narrative && narrative.decision && narrative.decision.summary) {
      var raw = narrative.decision.summary;
      // Filter contradictory narrative (AI says "skip"/"not aligned" but classification says no breaks)
      if (!/^(Skip|Pass|Not aligned|Not viable|No,)/i.test(raw)) {
        oneLiner = _trimOneLiner(raw);
      }
    }
    // Fallback: generate from top signals when no usable narrative
    if (!oneLiner) {
      var _pos = signals.positive;
      var _clar = signals.clarity;
      var _hasRemote = _pos.some(function(s) { return s.text.toLowerCase() === 'remote role'; });
      var _hasSalary = _pos.some(function(s) { return s.text.toLowerCase().startsWith('compensation'); });
      var _hasSeniority = _pos.some(function(s) { return s.text.toLowerCase().startsWith('seniority'); });
      // Count preference-aligned positives from the raw signals (topSignals not yet computed)
      var _prefTexts = _pos.map(function(s) { return _annotate(s.text); });
      var _prefMatches = _prefTexts.filter(function(s) { return s.indexOf('matches your preference') >= 0 || s.indexOf('within your range') >= 0; }).length;
      if (_prefMatches >= 3) {
        oneLiner = 'Strong alignment with your saved preferences.';
      } else if (_hasRemote && _hasSalary) {
        oneLiner = 'Remote role with stated compensation.';
      } else if (_hasRemote && _pos.length >= 3) {
        oneLiner = 'Remote role with multiple alignment signals.';
      } else if (_hasRemote) {
        oneLiner = 'Remote role. Check details before committing time.';
      } else if (_hasSalary && _hasSeniority) {
        oneLiner = 'Compensation and seniority align with your profile.';
      } else if (_prefMatches >= 2) {
        oneLiner = 'Key preferences align. Review details to confirm.';
      } else if (_pos.length >= 3) {
        oneLiner = 'Several signals align with your preferences.';
      } else if (_clar.length > 0) {
        oneLiner = 'Some signals align, but key details need clarifying.';
      } else {
        oneLiner = 'Limited information available. Worth a quick review.';
      }
    }
  }
  // Clean up hedging constructs
  if (oneLiner && /\b(however|but)\b/i.test(oneLiner)) {
    var cutIdx = oneLiner.search(/[,;]\s*(however|but)\b/i);
    if (cutIdx > 20) oneLiner = oneLiner.slice(0, cutIdx).trim();
  }

  // ── Card state ────────────────────────────────────────────────────
  var icon  = hasBreaks ? '\u2715' : '\u2713';
  var title = 'Fit reality';
  var mod   = hasBreaks ? 'rw-decision-block--not-viable' : 'rw-decision-block--worth';
  var cvPlaceholderHtml = hasBreaks ? '' :
    '<div class="rw-decision-block-cv" id="rw-fa-cv-placeholder">Loading recommendation\u2026</div>';

  // ── Top card signals ──────────────────────────────────────────────
  // Break bullets in the top card should be short and scannable (~80 chars).
  // Long AI-generated hard_no_reason text is truncated to its first sentence;
  // the full explanation lives in the one-liner summary below.
  function _shortenBullet(text) {
    if (text.length <= 80) return text;
    var sentEnd = text.search(/[.!?]\s/);
    if (sentEnd > 0 && sentEnd <= 80) return text.slice(0, sentEnd + 1);
    var cut = text.lastIndexOf(' ', 78);
    return (cut > 30 ? text.slice(0, cut) : text.slice(0, 78)) + '\u2026';
  }

  // Priority sort: core decision signals first, secondary after.
  // "No production coding" is deprioritised — it's a defensive check,
  // not a decision-driver. Only shown when there aren't enough stronger signals.
  function _prioritise(items) {
    function _rank(t) {
      var l = t.toLowerCase();
      if (l.startsWith('remote') || l.startsWith('work model') || l.startsWith('hybrid') || l.startsWith('on-site')) return 0;
      if (l.startsWith('compensation') || l.startsWith('salary')) return 1;
      if (l.startsWith('seniority')) return 2;
      if (l.startsWith('no production coding')) return 5;
      return 3;
    }
    return items.slice().sort(function(a, b) { return _rank(a) - _rank(b); });
  }

  // Break priority: structural breaks → preference-driven breaks → AI prose.
  function _prioritiseBreaks(items) {
    function _rank(t) {
      var l = t.toLowerCase();
      if (l.startsWith('production coding') || l.startsWith('requires ') || l.startsWith('salary ')) return 0;
      if (l.startsWith('on-site role')) return 1;
      if (l.includes('you prefer')) return 2; // preference-driven breaks (employment type, company stage)
      return 3; // AI-generated hard_no_reason prose
    }
    return items.slice().sort(function(a, b) { return _rank(a) - _rank(b); });
  }

  // Light user-awareness: annotate positive signals that match saved preferences.
  // Reads from global userProfile (available since render.js loads in the same page).
  function _annotate(text) {
    var up = (typeof userProfile !== 'undefined' && userProfile) ? userProfile : null;
    if (!up) return text;
    var l = text.toLowerCase();

    // Remote role
    if (l === 'remote role') {
      var wms = Array.isArray(up.work_models) ? up.work_models : [];
      if (wms.some(function(m) { return m.toLowerCase() === 'remote'; })) {
        return text + '. Matches your preference';
      }
    }
    // Compensation within range
    if (l.startsWith('compensation:') && typeof up.salary_min === 'number') {
      var salMatch = text.replace(/,/g, '').match(/[\u00a3$\u20ac]\s*([\d.]+)/);
      if (salMatch) {
        var v = parseFloat(salMatch[1]);
        if (v < 1000) v *= 1000;
        if (v >= up.salary_min) return text + '. Within your range';
      }
    }
    // Company stage — all 6 types, annotate ideal or open-to
    if (Array.isArray(up.company_stages) && up.company_stages.length > 0) {
      var _csAnnotMap = {
        'early-stage startup': 'early-startup',
        'scale-up stage company': 'scale-up',
        'growth-stage company': 'growth',
        'enterprise / corporate': 'enterprise',
        'consultancy / agency': 'agency',
        'not-for-profit': 'nfp'
      };
      var _csKey = _csAnnotMap[l] || null;
      if (_csKey) {
        var _csPref = null;
        for (var _ai = 0; _ai < up.company_stages.length; _ai++) {
          if (up.company_stages[_ai].stage === _csKey) { _csPref = up.company_stages[_ai]; break; }
        }
        if (_csPref && _csPref.strength === 'ideal') return text + '. Matches your preference';
        if (_csPref && _csPref.strength === 'open') return text + '. You\u2019re open to this';
      }
    }
    // Employment type match
    if (Array.isArray(up.employment_types) && up.employment_types.length > 0) {
      var _etLower = up.employment_types.map(function(s) { return s.toLowerCase(); });
      if (l === 'permanent' || l === 'contract' || l === 'freelance') {
        if (_etLower.indexOf(l) >= 0) return text + '. Matches your preference';
      }
    }
    // Product maturity
    if (Array.isArray(up.product_maturity) && up.product_maturity.length > 0) {
      if (l === 'building new product') {
        if (up.product_maturity.indexOf('building') >= 0) return text + '. Matches your preference';
      }
      if (l.startsWith('iterating on existing')) {
        if (up.product_maturity.indexOf('scaling') >= 0) return text + '. Matches your preference';
        if (up.product_maturity.indexOf('mature') >= 0) return text + '. Aligns with your maturity preference';
      }
      if (l.startsWith('mix of new and existing')) {
        if (up.product_maturity.indexOf('building') >= 0 || up.product_maturity.indexOf('scaling') >= 0) {
          return text + '. Matches your preference';
        }
      }
    }
    return text;
  }

  // Actionable clarity: enrich known structural items with guidance.
  function _enrichClarity(text) {
    if (text === 'Salary not disclosed') return text + '. Worth clarifying early';
    if (text === 'Work model not stated') return text + '. Confirm before applying';
    if (text === 'Product scope unclear') return text + '. Worth clarifying ownership';
    // Product maturity mismatches (classified as NEEDS_CLARITY by signals.js)
    var _l = text.toLowerCase();
    if (_l === 'building new product' || _l.startsWith('iterating on existing') || _l.startsWith('mix of new and existing')) {
      return text + '. Outside your usual maturity preference';
    }
    return text;
  }

  var _rawTopSignals = hasBreaks
    ? _prioritiseBreaks(signals.breaks.map(function(s) { return _shortenBullet(s.text); })).slice(0, 4)
    : _prioritise(signals.positive.map(function(s) { return s.text; })).slice(0, 4);
  var topSignals = hasBreaks ? _rawTopSignals : _rawTopSignals.map(_annotate);

  // When there are breaks, also gather positive signals for the card's
  // "Worth exploring" sub-section so all decision signals live in one place.
  var _positiveInCard = hasBreaks
    ? _prioritise(signals.positive.map(function(s) { return s.text; })).slice(0, 4).map(_annotate)
    : [];

  // ── Merge clarity + narrative risks into unified "Risks & unknowns" ─
  // "Needs clarity" is removed as a standalone section. Its items are
  // merged with narrative-sourced risks into one block inside the card.
  var _clarityItems = signals.clarity.map(function(s) { return s.text; }).slice(0, 4)
    .map(_enrichClarity);

  // Pull in narrative stated/inferred risks (deduped against clarity)
  var _narrRiskItems = [];
  if (narrative && narrative.risks_and_unknowns) {
    var _stated = Array.isArray(narrative.risks_and_unknowns.stated)
      ? narrative.risks_and_unknowns.stated : [];
    var _inferred = Array.isArray(narrative.risks_and_unknowns.inferred)
      ? narrative.risks_and_unknowns.inferred : [];
    var _allNarrRisks = _stated.concat(_inferred);
    var _clarityLower = new Set(_clarityItems.map(function(c) { return c.toLowerCase().slice(0, 30); }));
    for (var _nri = 0; _nri < _allNarrRisks.length && _narrRiskItems.length < 3; _nri++) {
      var _nr = _allNarrRisks[_nri];
      if (typeof _nr !== 'string') continue;
      _nr = _nr.replace(/\s*\((Stated|Inferred)\)\s*$/i, '');
      if (_clarityLower.has(_nr.toLowerCase().slice(0, 30))) continue;
      _narrRiskItems.push(_nr);
    }
  }
  var allClarity = _clarityItems.concat(_narrRiskItems).slice(0, 5);

  // ── Decision block HTML ───────────────────────────────────────────
  var html = '<div class="rw-decision-block ' + mod + '">' +
    '<div class="rw-decision-block-header">' +
      '<span class="rw-decision-block-icon">' + icon + '</span>' +
      '<span class="rw-decision-block-title">' + title + '</span>' +
    '</div>' +
    (oneLiner ? '<p class="rw-decision-block-summary">' + esc(_sanitizeUiText(oneLiner)) + '</p>' : '') +
    (topSignals.length && !hasBreaks ? '<div class="rw-decision-block-section"><span class="rw-decision-block-section-label">Worth exploring</span><ul class="rw-decision-block-reasons">' + topSignals.map(function(r) { return '<li>' + esc(_sanitizeUiText(r)) + '</li>'; }).join('') + '</ul></div>' : '') +
    (topSignals.length && hasBreaks ? '<div class="rw-decision-block-section"><span class="rw-decision-block-section-label">Concerns</span><ul class="rw-decision-block-reasons">' + topSignals.map(function(r) { return '<li>' + esc(_sanitizeUiText(r)) + '</li>'; }).join('') + '</ul></div>' : '') +
    (_positiveInCard.length ? '<div class="rw-decision-block-section"><span class="rw-decision-block-section-label">Worth exploring</span><ul class="rw-decision-block-reasons">' + _positiveInCard.map(function(r) { return '<li>' + esc(_sanitizeUiText(r)) + '</li>'; }).join('') + '</ul></div>' : '') +
    (allClarity.length ? '<div class="rw-decision-block-section"><span class="rw-decision-block-section-label">Risks &amp; unknowns</span><ul class="rw-decision-block-reasons rw-decision-block-reasons--clarity">' + allClarity.map(function(r) { return '<li>' + esc(_sanitizeUiText(r)) + '</li>'; }).join('') + '</ul></div>' : '') +
    cvPlaceholderHtml +
  '</div>';

  return {
    html: html,
    hasBreaks: hasBreaks,
    topSignals: topSignals,
    rawTopSignals: _rawTopSignals,
    rawPositiveInCard: hasBreaks ? _prioritise(signals.positive.map(function(s) { return s.text; })).slice(0, 4) : [],
    claritySignals: allClarity,
    cvPlaceholderHtml: cvPlaceholderHtml,
  };
}


function renderMatchBreak(signals, hasBreaks, rawTopSignals, rawPositiveInCard) {
  // All primary decision signals (breaks, positives, clarity) now live inside
  // the decision card. This section only renders OVERFLOW positive signals that
  // didn't fit inside the card.
  //
  // Build de-dup set from all signals already shown in the card:
  // - rawTopSignals: break signals (when hasBreaks) or positive signals (when !hasBreaks)
  // - rawPositiveInCard: positive signals shown in the card's "Worth exploring" sub-section (when hasBreaks)
  var _allCardSigs = rawTopSignals.concat(rawPositiveInCard || []);
  var cardSigSet = new Set(_allCardSigs.map(function(s) { return s.toLowerCase().slice(0, 30); }));
  var overflowItems = signals.positive
    .filter(function(s) { return !cardSigSet.has(s.text.toLowerCase().slice(0, 30)); })
    .map(function(s) { return s.text; })
    .slice(0, 4);

  if (!overflowItems.length) return '';

  return '<div class="rw-match-break" id="section-match-break">' +
    '<div class="rw-mb-col rw-mb-col--match">' +
      '<h3 class="rw-mb-heading rw-mb-heading--match">Also worth noting</h3>' +
      '<ul class="rw-mb-list">' + overflowItems.map(function(b) { return '<li>' + esc(_sanitizeUiText(b)) + '</li>'; }).join('') + '</ul>' +
    '</div>' +
  '</div>';
}
