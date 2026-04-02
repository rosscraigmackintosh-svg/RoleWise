// ═══════════════════════════════════════════════════════════════════════════
// analysis/render.js — Decision block + Match/Break rendering
// ═══════════════════════════════════════════════════════════════════════════
// Loaded as a plain <script> before app.js. No bundler or ES modules required.
// Uses global esc() from app.js (loaded in the same page context).
//
// renderDecisionBlock(signals, viability, narrative, output)
//   → { html, hasBreaks, topSignals, cvPlaceholderHtml }
//
// renderMatchBreak(signals, hasBreaks, topSignals)
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
      oneLiner = 'This role requires production-level coding.';
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
  var title = hasBreaks ? 'Not viable for you' : 'Worth exploring';
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
        return text + ' \u2014 matches your preference';
      }
    }
    // Compensation within range
    if (l.startsWith('compensation:') && typeof up.salary_min === 'number') {
      var salMatch = text.replace(/,/g, '').match(/[\u00a3$\u20ac]\s*([\d.]+)/);
      if (salMatch) {
        var v = parseFloat(salMatch[1]);
        if (v < 1000) v *= 1000;
        if (v >= up.salary_min) return text + ' \u2014 within your range';
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
        if (_csPref && _csPref.strength === 'ideal') return text + ' \u2014 matches your preference';
        if (_csPref && _csPref.strength === 'open') return text + ' \u2014 you\u2019re open to this';
      }
    }
    // Employment type match
    if (Array.isArray(up.employment_types) && up.employment_types.length > 0) {
      var _etLower = up.employment_types.map(function(s) { return s.toLowerCase(); });
      if (l === 'permanent' || l === 'contract' || l === 'freelance') {
        if (_etLower.indexOf(l) >= 0) return text + ' \u2014 matches your preference';
      }
    }
    // Product maturity
    if (Array.isArray(up.product_maturity) && up.product_maturity.length > 0) {
      if (l === 'building new product') {
        if (up.product_maturity.indexOf('building') >= 0) return text + ' \u2014 matches your preference';
      }
      if (l.startsWith('iterating on existing')) {
        if (up.product_maturity.indexOf('scaling') >= 0) return text + ' \u2014 matches your preference';
        if (up.product_maturity.indexOf('mature') >= 0) return text + ' \u2014 aligns with your maturity preference';
      }
      if (l.startsWith('mix of new and existing')) {
        if (up.product_maturity.indexOf('building') >= 0 || up.product_maturity.indexOf('scaling') >= 0) {
          return text + ' \u2014 matches your preference';
        }
      }
    }
    return text;
  }

  // Actionable clarity: enrich known structural items with guidance.
  function _enrichClarity(text) {
    if (text === 'Salary not disclosed') return text + ' \u2014 worth clarifying early';
    if (text === 'Work model not stated') return text + ' \u2014 confirm before applying';
    if (text === 'Product scope unclear') return text + ' \u2014 worth clarifying ownership';
    // Product maturity mismatches (classified as NEEDS_CLARITY by signals.js)
    var _l = text.toLowerCase();
    if (_l === 'building new product' || _l.startsWith('iterating on existing') || _l.startsWith('mix of new and existing')) {
      return text + ' \u2014 outside your usual maturity preference';
    }
    return text;
  }

  var topSignals = hasBreaks
    ? _prioritiseBreaks(signals.breaks.map(function(s) { return _shortenBullet(s.text); })).slice(0, 4)
    : _prioritise(signals.positive.map(function(s) { return s.text; })).slice(0, 4)
        .map(_annotate);
  var topClarity = signals.clarity.map(function(s) { return s.text; }).slice(0, 2)
    .map(_enrichClarity);

  // ── Decision block HTML ───────────────────────────────────────────
  var html = '<div class="rw-decision-block ' + mod + '">' +
    '<div class="rw-decision-block-header">' +
      '<span class="rw-decision-block-icon">' + icon + '</span>' +
      '<span class="rw-decision-block-title">' + title + '</span>' +
    '</div>' +
    (topSignals.length ? '<ul class="rw-decision-block-reasons">' + topSignals.map(function(r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '') +
    (topClarity.length ? '<div class="rw-decision-block-clarity"><span class="rw-decision-block-clarity-label">Needs clarity</span><ul class="rw-decision-block-reasons rw-decision-block-reasons--clarity">' + topClarity.map(function(r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>' : '') +
    cvPlaceholderHtml +
    (oneLiner ? '<p class="rw-decision-block-summary">' + esc(oneLiner) + '</p>' : '') +
  '</div>';

  return {
    html: html,
    hasBreaks: hasBreaks,
    topSignals: topSignals,
    cvPlaceholderHtml: cvPlaceholderHtml,
  };
}


function renderMatchBreak(signals, hasBreaks, topSignals) {
  // Match: positives not already shown in top card (avoids duplication)
  // Break: ONLY when hasBreaks (never under "Worth exploring")
  var topSigSet = new Set(topSignals.map(function(s) { return s.toLowerCase().slice(0, 30); }));
  var matchItems = hasBreaks
    ? signals.positive.map(function(s) { return s.text; }).slice(0, 4)
    : signals.positive.filter(function(s) { return !topSigSet.has(s.text.toLowerCase().slice(0, 30)); })
                 .map(function(s) { return s.text; }).slice(0, 4);
  var breakItems = hasBreaks ? signals.breaks.map(function(s) { return s.text; }).slice(0, 4) : [];

  if (!matchItems.length && !breakItems.length) return '';

  return '<div class="rw-match-break" id="section-match-break">' +
    (matchItems.length ?
      '<div class="rw-mb-col rw-mb-col--match">' +
        '<h3 class="rw-mb-heading rw-mb-heading--match">Where this role matches</h3>' +
        '<ul class="rw-mb-list">' + matchItems.map(function(b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
      '</div>' : '') +
    (breakItems.length ?
      '<div class="rw-mb-col rw-mb-col--break">' +
        '<h3 class="rw-mb-heading rw-mb-heading--break">Why this breaks</h3>' +
        '<ul class="rw-mb-list">' + breakItems.map(function(b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
      '</div>' : '') +
  '</div>';
}
