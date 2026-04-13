// ═══════════════════════════════════════════════════════════════════════════
// analysis/signals.js — Unified signal classification for Applicant Mode
// ═══════════════════════════════════════════════════════════════════════════
// Loaded as a plain <script> before app.js. No bundler or ES modules required.
//
// classifySignals(output, narrative, viability, userPrefs)
//   → { positive: [{text, type}…], clarity: [{text, type}…], breaks: [{text, type}…] }
//
// Each signal is classified ONCE as POSITIVE, NEEDS_CLARITY, or BREAKS.
// No signal may appear in more than one group.

function classifySignals(output, narrative, viability, userPrefs) {
  var classified = [];
  var seen = new Set();

  function addSig(text, type) {
    var key = text.toLowerCase().slice(0, 30);
    if (seen.has(key)) return;
    seen.add(key);
    classified.push({ text: text, type: type });
  }

  // ── Unpack viability pre-computed values ─────────────────────────
  var isHardNo  = viability.isHardNo;
  var hasCoding = viability.hasCoding;
  var dbWm      = viability.dbWm;
  var dbPd      = viability.dbPd;

  // ── User preferences (for preference-aware classification) ───────
  var up = userPrefs || {};
  var upWMs = Array.isArray(up.work_models) && up.work_models.length > 0
    ? up.work_models.map(function(s) { return s.toLowerCase(); })
    : (up.work_model && up.work_model !== 'unsure' ? [up.work_model.toLowerCase()] : null);
  var upHybridMax = typeof up.hybrid_max_days === 'number' ? up.hybrid_max_days : null;
  var upSalaryMin = typeof up.salary_min === 'number' ? up.salary_min : null;
  var upEmpTypes = Array.isArray(up.employment_types) && up.employment_types.length > 0
    ? up.employment_types.map(function(s) { return s.toLowerCase(); })
    : null;
  var upCompanyStages = Array.isArray(up.company_stages) && up.company_stages.length > 0
    ? up.company_stages : null;
  var upProductMat = Array.isArray(up.product_maturity) && up.product_maturity.length > 0
    ? up.product_maturity : null;

  // ── Hard no ──────────────────────────────────────────────────────
  if (isHardNo) {
    addSig(output.hard_no_reason || 'Hard constraint detected', 'BREAKS');
  }

  // ── Production coding ────────────────────────────────────────────
  // When isHardNo and the reason text mentions coding, suppress the
  // "No coding" positive — the AI flagged coding as a hard constraint
  // even if friction_signals is empty.
  var _hardNoMentionsCoding = isHardNo && /coding|frontend|front-end|implement/i.test(
    output.hard_no_reason || '');
  if (hasCoding || _hardNoMentionsCoding) {
    addSig('Production coding required', 'BREAKS');
  } else {
    addSig('No production coding requirement', 'POSITIVE');
  }

  // ── Work model ───────────────────────────────────────────────────
  // Use includes() to catch variants: "fully remote", "remote-first",
  // "4 days on-site", "3 days onsite", etc.
  var _isRemote = dbWm.startsWith('remote') || dbWm.includes('remote');
  var _isHybrid = dbWm.startsWith('hybrid');
  var _isOnsite = !_isRemote && !_isHybrid && (
    dbWm.startsWith('onsite') || dbWm.startsWith('on-site') ||
    dbWm.includes('on-site') || dbWm.includes('onsite'));

  if (_isRemote && !_isHybrid && !_isOnsite) {
    addSig('Remote role', 'POSITIVE');
  } else if (_isHybrid) {
    var hybDaysMatch = dbWm.match(/(\d+)\s*day/);
    var hybDays = hybDaysMatch ? parseInt(hybDaysMatch[1], 10) : null;

    if (hybDays !== null && upHybridMax !== null && hybDays > upHybridMax) {
      addSig('Requires ' + hybDays + ' office days (your max is ' + upHybridMax + ')', 'BREAKS');
    } else if (hybDays !== null) {
      var wmLbl = dbPd.remote_model || ('Hybrid (' + hybDays + ' days)');
      addSig('Work model: ' + wmLbl, (upWMs && !upWMs.some(function(m) { return m === 'hybrid'; })) ? 'BREAKS' : 'POSITIVE');
    } else {
      addSig('Hybrid \u2014 confirm office days required', 'NEEDS_CLARITY');
    }
  } else if (_isOnsite) {
    if (upWMs && !upWMs.some(function(m) { return m === 'on-site' || m === 'onsite'; })) {
      addSig('On-site role (not in your accepted work models)', 'BREAKS');
    } else {
      addSig('On-site role \u2014 confirm location viability', 'NEEDS_CLARITY');
    }
  } else if (!dbWm || dbWm.startsWith('not stated')) {
    addSig('Work model not stated', 'NEEDS_CLARITY');
  }

  // ── Salary ───────────────────────────────────────────────────────
  var dbSalVal = (dbPd.salary_annual || '').toLowerCase();
  var salAbsent = !dbPd.salary_annual || dbSalVal === 'not stated' || dbSalVal === 'not disclosed'
    || dbSalVal.includes('not stated') || dbSalVal.includes('not disclosed')
    || dbSalVal === 'competitive' || dbSalVal === 'tbd' || dbSalVal === 'negotiable';
  var salMentionedOnly = !salAbsent && (dbSalVal.includes('salary mentioned') || dbSalVal.includes('mentioned but not specified'));

  if (salAbsent) {
    addSig('Salary not disclosed', 'NEEDS_CLARITY');
  } else if (salMentionedOnly) {
    addSig('Salary mentioned but not specified', 'NEEDS_CLARITY');
  } else {
    // Actual salary value — compare against user minimum using range logic.
    // Use parsed salary_min / salary_max from practical_details when available
    // (these are numeric, set by the salary parser). Fall back to regex extraction
    // from the salary_annual display string only when the parsed fields are absent.
    var jdSalMin = dbPd.salary_min != null ? Number(dbPd.salary_min) : null;
    var jdSalMax = dbPd.salary_max != null ? Number(dbPd.salary_max) : null;

    // Legacy fallback: extract first number from salary_annual string
    if (jdSalMin === null && jdSalMax === null) {
      var _salNums = dbPd.salary_annual.replace(/,/g, '').match(/[\u00a3$€]\s*([\d.]+)/g);
      if (_salNums) {
        var _parsedNums = _salNums.map(function(m) {
          var v = parseFloat(m.replace(/[^\d.]/g, ''));
          return v < 1000 ? v * 1000 : v;
        });
        jdSalMin = _parsedNums[0] || null;
        jdSalMax = _parsedNums.length > 1 ? _parsedNums[_parsedNums.length - 1] : null;
      }
    }

    // Also check output.salary for AI-extracted values
    if (jdSalMin === null && output.salary && output.salary.minAnnual) {
      jdSalMin = output.salary.minAnnual;
    }
    if (jdSalMax === null && output.salary && output.salary.maxAnnual) {
      jdSalMax = output.salary.maxAnnual;
    }

    // The ceiling is the best number to compare against the user's floor.
    // If only a single value exists (no range), treat it as both min and max.
    var _salCeiling = jdSalMax || jdSalMin;
    var _salFloor   = jdSalMin || jdSalMax;

    if (_salCeiling !== null && upSalaryMin !== null && _salCeiling < upSalaryMin) {
      // Case 1: entire range is below user minimum → true fail
      addSig('Salary \u00a3' + Math.round(_salCeiling / 1000) + 'k below your minimum (\u00a3' + Math.round(upSalaryMin / 1000) + 'k)', 'BREAKS');
    } else if (_salFloor !== null && upSalaryMin !== null && _salFloor < upSalaryMin && _salCeiling >= upSalaryMin) {
      // Case 2: range overlaps — lower band below, upper band meets minimum → caution
      addSig('Compensation: ' + dbPd.salary_annual + ' \u2014 lower band below your \u00a3' + Math.round(upSalaryMin / 1000) + 'k minimum, upper band meets it', 'NEEDS_CLARITY');
    } else {
      // Case 3: salary meets or exceeds minimum, or no user minimum set → positive
      addSig('Compensation: ' + dbPd.salary_annual, 'POSITIVE');
    }
  }

  // ── Employment type ───────────────────────────────────────────────
  // Missing = NEEDS_CLARITY (not a break). Mismatch = BREAKS. Match = no signal.
  var _engType = (viability.engagementType || '').toLowerCase();
  if (_engType && upEmpTypes) {
    // Normalise: "contract-to-perm" counts as contract for matching
    var _engNorm = _engType.replace('contract-to-perm', 'contract')
                           .replace('freelance', 'contract');
    if (!upEmpTypes.some(function(t) { return _engNorm.indexOf(t) >= 0; })) {
      var _engLabel = viability.engagementType; // preserve original casing
      addSig(_engLabel + ' role (you prefer ' + up.employment_types.join(' / ') + ')', 'BREAKS');
    }
  } else if (!_engType && upEmpTypes) {
    addSig('Role type not stated \u2014 worth confirming', 'NEEDS_CLARITY');
  }

  // ── Seniority ────────────────────────────────────────────────────
  var dbSenVal = (dbPd.seniority || '').toLowerCase();
  if (dbSenVal && dbSenVal !== 'not stated') {
    addSig('Seniority: ' + dbPd.seniority, 'POSITIVE');
  }

  // ── Product mode ─────────────────────────────────────────────────
  // Cross-reference with product_maturity preferences when set.
  // greenfield → 'building', iteration → 'scaling', mixed → either.
  // 'mature' preference matches iteration (optimisation ≈ existing product).
  // Mismatch → NEEDS_CLARITY (not BREAKS — product mode is rarely a dealbreaker).
  var rssC = output.role_shape_signals || {};
  if (rssC.product_mode === 'greenfield') {
    var _pmGfMatch = !upProductMat || upProductMat.indexOf('building') >= 0;
    addSig('Building new product', _pmGfMatch ? 'POSITIVE' : 'NEEDS_CLARITY');
  } else if (rssC.product_mode === 'iteration') {
    var _pmItMatch = !upProductMat || upProductMat.indexOf('scaling') >= 0 || upProductMat.indexOf('mature') >= 0;
    addSig('Iterating on existing product', _pmItMatch ? 'POSITIVE' : 'NEEDS_CLARITY');
  } else if (rssC.product_mode === 'mixed') {
    var _pmMxMatch = !upProductMat || upProductMat.indexOf('building') >= 0 || upProductMat.indexOf('scaling') >= 0;
    addSig('Mix of new and existing product work', _pmMxMatch ? 'POSITIVE' : 'NEEDS_CLARITY');
  }

  // ── Pattern match ────────────────────────────────────────────────
  if (output.pattern_type === 'pursue_pattern') {
    addSig('Matches roles you tend to pursue', 'POSITIVE');
  }

  // ── Company stage ────────────────────────────────────────────────
  // Cross-reference detected stage with user's company_stages preferences.
  // Preference strength: ideal → POSITIVE, open → POSITIVE, avoid → BREAKS.
  // No preference set → default POSITIVE (as before).
  var cs = output.company_stage || (rssC.company_stage_signal) || null;
  if (cs) {
    // Map AI stage labels → preference stage keys
    var _csKeyMap = { startup: 'early-startup', scaleup: 'scale-up', growth: 'growth',
                      enterprise: 'enterprise', agency: 'agency', nfp: 'nfp' };
    var _csLabelMap = { startup: 'Early-stage startup', scaleup: 'Scale-up stage company',
                        growth: 'Growth-stage company', enterprise: 'Enterprise / Corporate',
                        agency: 'Consultancy / Agency', nfp: 'Not-for-profit' };
    var _csPrefKey = _csKeyMap[cs] || null;
    var _csLabel   = _csLabelMap[cs] || null;

    if (_csLabel) {
      if (_csPrefKey && upCompanyStages) {
        var _csMatch = null;
        for (var _csi = 0; _csi < upCompanyStages.length; _csi++) {
          if (upCompanyStages[_csi].stage === _csPrefKey) { _csMatch = upCompanyStages[_csi]; break; }
        }
        if (_csMatch && _csMatch.strength === 'avoid') {
          addSig(_csLabel + ' (you prefer to avoid)', 'BREAKS');
        } else {
          addSig(_csLabel, 'POSITIVE');
        }
      } else {
        addSig(_csLabel, 'POSITIVE');
      }
    }
  }

  // ── Narrative fit lead-in ────────────────────────────────────────
  if (narrative && narrative.fit_reality && narrative.fit_reality.paragraphs) {
    var fp = narrative.fit_reality.paragraphs[0] || '';
    if (/^(Strong|Good|Close|Direct|Clear)\s/i.test(fp)) {
      addSig(fp, 'POSITIVE');
    }
  }

  // ── Narrative inferred risks → NEEDS_CLARITY (never BREAKS) ─────
  // Capped at 2 items. Each truncated to first sentence or ~80 chars
  // to keep clarity items calm, neutral, and scannable.
  if (narrative && narrative.risks_and_unknowns && narrative.risks_and_unknowns.inferred) {
    var inf = Array.isArray(narrative.risks_and_unknowns.inferred) ? narrative.risks_and_unknowns.inferred : [];
    var _narrClarityAdded = 0;
    for (var ri = 0; ri < inf.length && _narrClarityAdded < 2; ri++) {
      var rRaw = inf[ri].replace(/\s*\((Stated|Inferred)\)\s*$/i, '');
      // Truncate to first sentence or ~80 chars
      var rTrunc = rRaw;
      if (rTrunc.length > 80) {
        var _sEnd = rTrunc.search(/[.!?]\s/);
        if (_sEnd > 0 && _sEnd <= 80) {
          rTrunc = rTrunc.slice(0, _sEnd + 1);
        } else {
          var _wEnd = rTrunc.lastIndexOf(' ', 78);
          rTrunc = (_wEnd > 30 ? rTrunc.slice(0, _wEnd) : rTrunc.slice(0, 78)) + '\u2026';
        }
      }
      // Soften tone: replace definitive openings with neutral framing
      rTrunc = rTrunc
        .replace(/^Seniority mismatch\b/i, 'Seniority level may differ')
        .replace(/^Design strategy void\b/i, 'Design strategy role unclear')
        .replace(/^Solo or very small\b/i, 'Team size unclear \u2014 may be solo or small');
      addSig(rTrunc, 'NEEDS_CLARITY');
      _narrClarityAdded++;
    }
  }

  // ── Group by type ────────────────────────────────────────────────
  return {
    positive: classified.filter(function(s) { return s.type === 'POSITIVE'; }),
    clarity:  classified.filter(function(s) { return s.type === 'NEEDS_CLARITY'; }),
    breaks:   classified.filter(function(s) { return s.type === 'BREAKS'; }),
  };
}
