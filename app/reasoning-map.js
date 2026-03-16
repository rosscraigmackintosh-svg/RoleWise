/* ═══════════════════════════════════════════════════════════════════════════════
   Rolewise — Reasoning Map  (reasoning-map.js)
   Advanced full-screen signal graph exploration workspace.

   ┌─────────────────────────────────────────────────────────────────────────┐
   │  HOW TO REMOVE THIS FEATURE COMPLETELY                                  │
   │  1. Delete this file (reasoning-map.js)                                 │
   │  2. Delete reasoning-map.css                                            │
   │  3. In app.js, remove the 3 lines under "── Reasoning Map bridge ──"   │
   │  4. In index.html, remove the 2 script/link tags for this module       │
   │  The rest of Rolewise is entirely unaffected.                           │
   └─────────────────────────────────────────────────────────────────────────┘

   Public API (written to window):
   - window.openReasoningMap(role)   — open overlay for a given role
   - window.closeReasoningMap()      — close overlay
   - window.ROLEWISE_REASONING_MAP   — feature flag (truthy = enabled)
   ═══════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Feature flag ──────────────────────────────────────────────────────────────
  const ENABLED = true;
  if (!ENABLED) return;
  window.ROLEWISE_REASONING_MAP = true;


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — Constants & type definitions
  // ═══════════════════════════════════════════════════════════════════════════

  const NODE_DEFS = {
    role:             { label: 'Role',            fill: '#7f56d9', ring: '#9e77ed', textFill: '#fff', radius: 30, tier: 0 },
    company:          { label: 'Company',         fill: '#3b82f6', ring: '#60a5fa', textFill: '#fff', radius: 19, tier: 2 },
    recruiter:        { label: 'Recruiter',       fill: '#0ea5e9', ring: '#38bdf8', textFill: '#fff', radius: 17, tier: 2 },
    jd_evidence:      { label: 'JD Evidence',     fill: '#64748b', ring: '#94a3b8', textFill: '#fff', radius: 13, tier: 1 },
    trait:            { label: 'Trait',           fill: '#10b981', ring: '#34d399', textFill: '#fff', radius: 16, tier: 1 },
    blocker:          { label: 'Blocker',         fill: '#ef4444', ring: '#f87171', textFill: '#fff', radius: 16, tier: 1 },
    preference:       { label: 'Preference',      fill: '#f59e0b', ring: '#fbbf24', textFill: '#fff', radius: 15, tier: 2 },
    cv:               { label: 'CV / Profile',    fill: '#8b5cf6', ring: '#a78bfa', textFill: '#fff', radius: 18, tier: 2 },
    similar_role:     { label: 'Similar Role',    fill: '#a78bfa', ring: '#c4b5fd', textFill: '#fff', radius: 15, tier: 3 },
    outcome:          { label: 'Outcome',         fill: '#22c55e', ring: '#4ade80', textFill: '#fff', radius: 15, tier: 3 },
    career_signal:    { label: 'Career Signal',   fill: '#06b6d4', ring: '#22d3ee', textFill: '#fff', radius: 17, tier: 3 },
    market_signal:    { label: 'Market Signal',   fill: '#6366f1', ring: '#818cf8', textFill: '#fff', radius: 14, tier: 3 },
    question:         { label: 'Open Question',   fill: '#f97316', ring: '#fb923c', textFill: '#fff', radius: 13, tier: 1 },
    missing_evidence: { label: 'Missing',         fill: '#f43f5e', ring: '#fb7185', textFill: '#fff', radius: 12, tier: 1 },
  };

  const EDGE_DEFS = {
    mentions:             { label: 'Mentions',              color: '#94a3b8', dash: '',        width: 1.3 },
    implies:              { label: 'Implies',               color: '#94a3b8', dash: '6 3',     width: 1.3 },
    supports:             { label: 'Supports',              color: '#10b981', dash: '',        width: 1.5 },
    conflicts_with:       { label: 'Conflicts with',        color: '#ef4444', dash: '5 3',     width: 1.5 },
    similar_to:           { label: 'Similar to',            color: '#a78bfa', dash: '8 4',     width: 1.3 },
    led_to:               { label: 'Led to',                color: '#22c55e', dash: '',        width: 1.5 },
    derived_from:         { label: 'Derived from',          color: '#94a3b8', dash: '3 3',     width: 1.2 },
    linked_to:            { label: 'Linked to',             color: '#94a3b8', dash: '',        width: 1.2 },
    recommends:           { label: 'Recommends',            color: '#7f56d9', dash: '',        width: 1.5 },
    weakens:              { label: 'Weakens',               color: '#f59e0b', dash: '4 3',     width: 1.3 },
    missing_evidence_for: { label: 'Missing evidence for',  color: '#f43f5e', dash: '3 4',     width: 1.2 },
  };

  /** Ring radii (px in graph-space) for each tier */
  const RING_RADII = [0, 220, 390, 560];

  /** Arc-based type clustering: clock-degrees (0°=top, 90°=right) */
  const TYPE_ARCS = {
    // Ring 1 (r=220)
    jd_evidence:      { ring: 1, start: 315, span: 110 },
    trait:            { ring: 1, start:  50, span:  85 },
    blocker:          { ring: 1, start: 145, span:  60 },
    question:         { ring: 1, start: 205, span:  45 },
    missing_evidence: { ring: 1, start: 255, span:  45 },
    // Ring 2 (r=390)
    company:          { ring: 2, start: 325, span:  35 },
    recruiter:        { ring: 2, start:   5, span:  30 },
    cv:               { ring: 2, start:  45, span:  60 },
    preference:       { ring: 2, start: 210, span:  85 },
    // Ring 3 (r=560)
    similar_role:     { ring: 3, start: 335, span:  70 },
    outcome:          { ring: 3, start:  55, span:  65 },
    career_signal:    { ring: 3, start: 130, span:  65 },
    market_signal:    { ring: 3, start: 205, span:  40 },
  };

  const SOURCE_LABELS = {
    direct:   'Directly stated in JD',
    inferred: 'Inferred from wording',
    learned:  'Learned from previous outcomes',
    missing:  'Weak / missing evidence',
  };

  /** Provenance taxonomy — enums for origin_type, evidence_mode, confidence_band, temporal_scope, scenario_state */
  const PROVENANCE = {
    origin_type: {
      jd:                 'Job description',
      user_preference:    'User preference',
      user_boundary:      'User boundary',
      recruiter_data:     'Recruiter data',
      company_data:       'Company data',
      analysis_inference: 'Rolewise inference',
      historical_outcome: 'Historical outcome',
      aggregate_pattern:  'Aggregate pattern',
      hypothetical:       'Hypothetical',
      unresolved:         'Unresolved',
    },
    evidence_mode: {
      direct:       'Direct',
      inferred:     'Inferred',
      learned:      'Learned',
      hypothetical: 'Hypothetical',
      missing:      'Missing',
    },
    confidence_band: {
      high:   'High',
      medium: 'Medium',
      low:    'Low',
    },
    temporal_scope: {
      current:    'Current',
      historical: 'Historical',
      aggregate:  'Aggregate',
      scenario:   'Scenario',
    },
    scenario_state: {
      live:         'Live',
      hypothetical: 'Hypothetical',
      guided:       'Guided',
      hidden:       'Hidden',
    },
  };

  /** Contextual explanation per node type — shown in inspector "What this is" */
  const NODE_CONTEXT = {
    role:             'The role under evaluation. All signals in this graph exist to assess fit with this role.',
    company:          'The organisation behind this role. Company stage, culture, and sector affect expectations.',
    recruiter:        'The person or agency who surfaced this role. Their incentives and info quality matter.',
    jd_evidence:      'A specific claim or requirement extracted directly from the job description.',
    trait:            'A characteristic inferred about this role\u2009—\u2009culture, pace, or working style.',
    blocker:          'A known conflict between this role and your saved preferences or boundaries.',
    preference:       'A saved boundary or preference that Rolewise uses to evaluate fit.',
    cv:               'A version of your CV or portfolio that could be used when applying.',
    similar_role:     'A role you\u2019ve previously explored that shares key characteristics with this one.',
    outcome:          'The result of a past application or process that Rolewise has learned from.',
    career_signal:    'A pattern derived from your outcomes\u2009—\u2009what types of roles suit you.',
    market_signal:    'Context about market conditions affecting this type of role right now.',
    question:         'An unresolved question that should be answered before progressing.',
    missing_evidence: 'A gap in available information that prevents a confident assessment.',
  };

  /** Guided tour steps */
  // Guided-mode step templates keyed by node type.
  // buildGuidedSteps() picks the first node of each type from the live graph.
  const GUIDED_TYPE_INFO = {
    role:             { title: 'The role',          description: 'This is the role you\u2019re evaluating. Every other node in this graph exists to help you understand whether this role is a good fit. Start here.' },
    company:          { title: 'The company',       description: 'Context about the company behind this role \u2014 stage, sector, and culture signals that shape the opportunity.' },
    trait:            { title: 'Key traits',        description: 'Traits are characteristics Rolewise has inferred from the JD and company context. They shape what the day-to-day would feel like.' },
    blocker:          { title: 'Active blockers',   description: 'Blockers are conflicts between what this role requires and your saved preferences. These need to be resolved or accepted before committing.' },
    career_signal:    { title: 'Career signals',    description: 'Career signals are patterns Rolewise has learned from your past outcomes. They help predict whether you\u2019d thrive in this kind of role.' },
    missing_evidence: { title: 'Missing evidence',  description: 'Missing evidence nodes represent gaps \u2014 things Rolewise can\u2019t assess yet because the information hasn\u2019t been provided or discovered.' },
    jd_evidence:      { title: 'JD evidence',       description: 'Evidence extracted directly from the job description. These are concrete facts that support or challenge the role\u2019s fit.' },
  };

  // Ordered list of types to walk through in guided mode
  const GUIDED_TYPE_ORDER = ['role', 'company', 'trait', 'blocker', 'career_signal', 'missing_evidence', 'jd_evidence'];

  let _guidedSteps = []; // populated dynamically from live graph

  function buildGuidedSteps() {
    if (!_graphData || !_graphData.nodes) return [];
    const steps = [];
    for (const type of GUIDED_TYPE_ORDER) {
      const node = _graphData.nodes.find(n => n.type === type);
      if (node && GUIDED_TYPE_INFO[type]) {
        steps.push({
          nodeId: node.id,
          title: GUIDED_TYPE_INFO[type].title,
          description: GUIDED_TYPE_INFO[type].description,
        });
      }
    }
    return steps;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — Build graph from real role data
  // (buildSampleGraph removed — dead code, 0 callers since KG-02)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Build a reasoning graph from a real role object.
   *
   * Data sources:
   *   role.latest_match_output  — output_json from jd_matches (AI analysis)
   *   role.analysis             — from analyses table (decision, reasons, etc.)
   *   role.*                    — role table columns (company, salary, work_model, etc.)
   *
   * Returns { nodes: [], edges: [] } or null if no analysis data exists.
   */
  function buildGraphFromRole(role) {
    const output = role.latest_match_output;
    if (!output || typeof output !== 'object') return null;

    const nodes = [];
    const edges = [];
    let edgeIdx = 0;
    const _eid = () => 'e' + (++edgeIdx);

    const title   = role.role_title   || output._roleTitle  || 'Untitled Role';
    const company = role.company_name || output._company    || 'Unknown Company';
    const roleId  = role.id           || 'live-role';

    // ── Helper: generate a slug-safe id from text ──
    const _slug = (prefix, text) => prefix + '_' + (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);

    // ── Helper: provenance shorthand builders ──
    const _prov = (origin, mode, confidence, temporal, scenario) => ({
      origin_type: origin || 'jd',
      evidence_mode: mode || 'direct',
      confidence_band: confidence || 'medium',
      temporal_scope: temporal || 'current',
      scenario_state: scenario || 'live',
    });

    // ── 1. Root role node ──────────────────────────────────────────────────
    nodes.push({
      id: 'role', type: 'role',
      label: title,
      description: output.role_summary || 'Role under evaluation.',
      evidenceStrength: 1.0, source: 'direct', importance: 'critical',
      provenance: _prov('jd', 'direct', 'high'),
      metadata: { roleId, company, status: role.status || 'active', stage: role.current_stage || 'Interested' },
      checks: [],
    });

    // ── 2. Company node ───────────────────────────────────────────────────
    const signals = output.role_shape_signals || {};
    const companyStage = signals.company_stage || signals.company_stage_signal || null;
    nodes.push({
      id: 'company', type: 'company',
      label: company,
      description: output.why_this_role_exists || 'Company behind this role.',
      evidenceStrength: 0.85, source: 'direct', importance: 'high',
      provenance: _prov('company_data', 'direct', 'high'),
      metadata: { stage: companyStage, sector: null },
      checks: [],
    });
    edges.push({
      id: _eid(), from: 'role', to: 'company', type: 'linked_to',
      label: 'at', strength: 1.0, explanation: 'This role is at this company.',
      provenance: _prov('jd', 'direct', 'high'),
    });

    // ── 3. Recruiter node (from role data) ────────────────────────────────
    const rec = role._recruiter;
    if (rec) {
      const recLabel = rec.name + (rec.company ? ' · ' + rec.company : '');
      nodes.push({
        id: 'recruiter', type: 'recruiter',
        label: recLabel,
        description: 'Recruiter linked to this role.',
        evidenceStrength: 0.7, source: 'direct', importance: 'medium',
        provenance: _prov('recruiter_data', 'direct', 'medium'),
        metadata: { agency: rec.company || null, channel: null },
        checks: [],
      });
      edges.push({
        id: _eid(), from: 'role', to: 'recruiter', type: 'linked_to',
        label: 'via', strength: 0.8, explanation: 'Role sourced via this recruiter.',
        provenance: _prov('recruiter_data', 'direct', 'high'),
      });
    }

    // ── 4. Practical details → traits / evidence ──────────────────────────
    const pd = output.practical_details || {};

    // Work model
    if (pd.remote_model || role.work_model) {
      const wmVal = pd.remote_model || role.work_model || 'Unknown';
      const wmId = _slug('trait', 'work_model');
      nodes.push({
        id: wmId, type: 'trait',
        label: 'Work model: ' + wmVal,
        description: pd.commute_reality || 'Work model for this role.',
        evidenceStrength: pd.remote_model ? 0.9 : 0.6, source: pd.remote_model ? 'direct' : 'inferred', importance: 'high',
        provenance: _prov('jd', pd.remote_model ? 'direct' : 'inferred', pd.remote_model ? 'high' : 'medium'),
        metadata: { category: 'Work model' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: wmId, to: 'role', type: 'supports',
        label: 'work model', strength: 0.85, explanation: 'Work model for this role.',
        provenance: _prov('jd', 'direct', 'high'),
      });
    }

    // Salary
    if (pd.salary_annual || pd.salary_min || pd.salary_max) {
      const salLabel = pd.salary_annual || ((pd.currency || '£') + (pd.salary_min || '?') + '–' + (pd.salary_max || '?'));
      const salId = _slug('trait', 'salary');
      nodes.push({
        id: salId, type: 'trait',
        label: 'Salary: ' + salLabel,
        description: 'Compensation stated in the job description.',
        evidenceStrength: 0.9, source: 'direct', importance: 'high',
        provenance: _prov('jd', 'direct', 'high'),
        metadata: { category: 'Compensation', min: pd.salary_min, max: pd.salary_max, currency: pd.currency },
        checks: [],
      });
      edges.push({
        id: _eid(), from: salId, to: 'role', type: 'supports',
        label: 'compensation', strength: 0.9, explanation: 'Salary stated in job description.',
        provenance: _prov('jd', 'direct', 'high'),
      });
    } else {
      // Missing salary → missing_evidence node
      const missSalId = 'miss_salary';
      nodes.push({
        id: missSalId, type: 'missing_evidence',
        label: 'Salary not disclosed',
        description: 'No salary or compensation range provided in the job description or by the recruiter.',
        evidenceStrength: 0.0, source: 'missing', importance: 'critical',
        provenance: _prov('unresolved', 'missing', 'low'),
        metadata: { category: 'Compensation' },
        checks: ['Request salary band before progressing'],
      });
      edges.push({
        id: _eid(), from: missSalId, to: 'role', type: 'missing_evidence_for',
        label: 'unknown for', strength: 0.9, explanation: 'Salary information is missing.',
        provenance: _prov('unresolved', 'missing', 'low'),
      });
    }

    // Employment type
    if (pd.employment_type) {
      const empId = _slug('trait', 'employment');
      nodes.push({
        id: empId, type: 'trait',
        label: pd.employment_type + ' role',
        description: 'Employment type: ' + pd.employment_type,
        evidenceStrength: 0.85, source: 'direct', importance: 'medium',
        provenance: _prov('jd', 'direct', 'high'),
        metadata: { category: 'Employment type' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: empId, to: 'role', type: 'supports',
        label: 'type', strength: 0.8, explanation: 'Employment type stated.',
        provenance: _prov('jd', 'direct', 'high'),
      });
    }

    // Seniority
    if (pd.role_seniority) {
      const senId = _slug('trait', 'seniority');
      nodes.push({
        id: senId, type: 'trait',
        label: 'Seniority: ' + pd.role_seniority,
        description: 'Role seniority level.',
        evidenceStrength: 0.8, source: 'direct', importance: 'medium',
        provenance: _prov('jd', 'direct', 'high'),
        metadata: { category: 'Seniority' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: senId, to: 'role', type: 'supports',
        label: 'seniority', strength: 0.8, explanation: 'Seniority stated in JD.',
        provenance: _prov('jd', 'direct', 'high'),
      });
    }

    // Location
    if (pd.location) {
      const locId = _slug('trait', 'location');
      nodes.push({
        id: locId, type: 'trait',
        label: 'Location: ' + pd.location,
        description: pd.commute_reality || 'Role location.',
        evidenceStrength: 0.9, source: 'direct', importance: 'high',
        provenance: _prov('jd', 'direct', 'high'),
        metadata: { category: 'Location' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: locId, to: 'role', type: 'supports',
        label: 'location', strength: 0.85, explanation: 'Location stated in JD.',
        provenance: _prov('jd', 'direct', 'high'),
      });
    }

    // Missing fields from practical_details
    const missingFields = pd._missing_fields || [];
    missingFields.forEach(field => {
      const mId = _slug('miss', field);
      // Avoid duplicates
      if (nodes.some(n => n.id === mId)) return;
      nodes.push({
        id: mId, type: 'missing_evidence',
        label: field.replace(/_/g, ' ') + ' not stated',
        description: 'This information was not provided in the job description.',
        evidenceStrength: 0.0, source: 'missing', importance: 'medium',
        provenance: _prov('unresolved', 'missing', 'low'),
        metadata: { category: field },
        checks: [],
      });
      edges.push({
        id: _eid(), from: mId, to: 'role', type: 'missing_evidence_for',
        label: 'unknown', strength: 0.5, explanation: field + ' is missing from JD.',
        provenance: _prov('unresolved', 'missing', 'low'),
      });
    });

    // ── 5. Role shape signals → trait nodes ───────────────────────────────
    if (signals.company_stage) {
      const csId = _slug('trait', 'company_stage');
      if (!nodes.some(n => n.id === csId)) {
        nodes.push({
          id: csId, type: 'trait',
          label: 'Company stage: ' + signals.company_stage,
          description: 'Company lifecycle stage.',
          evidenceStrength: 0.75, source: 'inferred', importance: 'medium',
          provenance: _prov('analysis_inference', 'inferred', 'medium'),
          metadata: { category: 'Company stage' },
          checks: [],
        });
        edges.push({
          id: _eid(), from: csId, to: 'company', type: 'supports',
          label: 'stage', strength: 0.75, explanation: 'Company stage signal.',
          provenance: _prov('analysis_inference', 'inferred', 'medium'),
        });
      }
    }

    if (signals.ai_tooling_signal) {
      const aiId = _slug('trait', 'ai_tooling');
      nodes.push({
        id: aiId, type: 'trait',
        label: 'AI tooling involvement',
        description: signals._evidence?.ai_tooling_signal || 'Role involves AI tooling or AI-native product work.',
        evidenceStrength: 0.7, source: 'inferred', importance: 'high',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
        metadata: { category: 'Product domain' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: aiId, to: 'role', type: 'supports',
        label: 'AI signal', strength: 0.7, explanation: 'AI tooling signal detected.',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
      });
    }

    if (signals.design_system_ownership) {
      const dsId = _slug('trait', 'design_system');
      nodes.push({
        id: dsId, type: 'trait',
        label: 'Design system ownership',
        description: signals._evidence?.design_system_ownership || 'Involves design system work.',
        evidenceStrength: 0.75, source: 'inferred', importance: 'medium',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
        metadata: { category: 'Scope' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: dsId, to: 'role', type: 'supports',
        label: 'design system', strength: 0.75, explanation: 'Design system ownership signal.',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
      });
    }

    // Craft-strategy balance
    if (signals.craft_strategy_balance && signals.craft_strategy_balance !== 'balanced') {
      const cbId = _slug('trait', 'craft_balance');
      nodes.push({
        id: cbId, type: 'trait',
        label: 'Craft/strategy: ' + signals.craft_strategy_balance,
        description: 'The role leans toward ' + signals.craft_strategy_balance + ' work.',
        evidenceStrength: 0.65, source: 'inferred', importance: 'medium',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
        metadata: { category: 'Role shape' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: cbId, to: 'role', type: 'supports',
        label: 'balance', strength: 0.65, explanation: 'Craft/strategy balance signal.',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
      });
    }

    // ── 6. Risks & unknowns → blocker / question nodes ────────────────────
    const risks = output.risks_and_unknowns || [];
    risks.forEach((risk, i) => {
      const riskId = _slug('risk', risk.marker || ('risk_' + i));
      // Avoid duplicates
      if (nodes.some(n => n.id === riskId)) return;
      const isInferred = (risk.tag || '').toLowerCase() === 'inferred';
      nodes.push({
        id: riskId, type: 'blocker',
        label: risk.marker || 'Risk ' + (i + 1),
        description: risk.text || 'Risk identified during analysis.',
        evidenceStrength: isInferred ? 0.6 : 0.8, source: isInferred ? 'inferred' : 'direct', importance: 'high',
        provenance: _prov('analysis_inference', isInferred ? 'inferred' : 'direct', isInferred ? 'medium' : 'high'),
        metadata: { tag: risk.tag, category: 'Risk' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: riskId, to: 'role', type: 'conflicts_with',
        label: 'risk', strength: 0.7, explanation: risk.text || 'Risk for this role.',
        provenance: _prov('analysis_inference', isInferred ? 'inferred' : 'direct', 'medium'),
      });
    });

    // Hard no flag
    if (output.hard_no && output.hard_no_reason) {
      const hnoId = 'blocker_hard_no';
      nodes.push({
        id: hnoId, type: 'blocker',
        label: 'Hard no: ' + (output.hard_no_reason || 'dealbreaker detected'),
        description: output.hard_no_reason || 'Rolewise has flagged this role as a hard no.',
        evidenceStrength: 1.0, source: 'direct', importance: 'critical',
        provenance: _prov('analysis_inference', 'direct', 'high'),
        metadata: { severity: 'Critical' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: hnoId, to: 'role', type: 'conflicts_with',
        label: 'hard no', strength: 1.0, explanation: 'Dealbreaker detected.',
        provenance: _prov('analysis_inference', 'direct', 'high'),
      });
    }

    // Friction signals
    const frictions = output.friction_signals || [];
    frictions.forEach((f, i) => {
      const fId = _slug('blocker', typeof f === 'string' ? f : ('friction_' + i));
      if (nodes.some(n => n.id === fId)) return;
      const fText = typeof f === 'string' ? f : (f.text || f.marker || 'Friction signal');
      nodes.push({
        id: fId, type: 'blocker',
        label: fText.length > 50 ? fText.slice(0, 47) + '…' : fText,
        description: fText,
        evidenceStrength: 0.7, source: 'inferred', importance: 'medium',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
        metadata: { category: 'Friction' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: fId, to: 'role', type: 'weakens',
        label: 'friction', strength: 0.6, explanation: fText,
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
      });
    });

    // ── 7. Questions worth asking → question nodes ────────────────────────
    const questions = output.questions_worth_asking || [];
    questions.forEach((q, i) => {
      const qId = _slug('q', 'question_' + i);
      const qText = typeof q === 'string' ? q : (q.text || q);
      nodes.push({
        id: qId, type: 'question',
        label: qText.length > 55 ? qText.slice(0, 52) + '…' : qText,
        description: qText,
        evidenceStrength: 0.4, source: 'missing', importance: 'medium',
        provenance: _prov('unresolved', 'missing', 'low'),
        metadata: { category: 'Open question', priority: 'Ask before interview' },
        checks: [qText],
      });
      edges.push({
        id: _eid(), from: qId, to: 'role', type: 'linked_to',
        label: 'question for', strength: 0.5, explanation: 'Unresolved question about this role.',
        provenance: _prov('unresolved', 'missing', 'low'),
      });
    });

    // ── 8. Fit reality summary → career_signal nodes ──────────────────────
    const fitSummary = output.fit_reality_summary || [];
    fitSummary.forEach((fit, i) => {
      const fitId = _slug('fit', fit.marker || ('fit_' + i));
      if (nodes.some(n => n.id === fitId)) return;
      nodes.push({
        id: fitId, type: 'career_signal',
        label: fit.marker || 'Fit signal ' + (i + 1),
        description: fit.text || 'Fit reality assessment.',
        evidenceStrength: 0.75, source: 'inferred', importance: 'high',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
        metadata: { category: 'Fit assessment' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: fitId, to: 'role', type: 'linked_to',
        label: 'fit signal', strength: 0.75, explanation: fit.text || 'Fit reality signal.',
        provenance: _prov('analysis_inference', 'inferred', 'medium'),
      });
    });

    // ── 9. What you would actually do → jd_evidence nodes ─────────────────
    const actualDo = output.what_you_would_actually_do || [];
    actualDo.forEach((task, i) => {
      const evId = _slug('ev', 'task_' + i);
      nodes.push({
        id: evId, type: 'jd_evidence',
        label: task.length > 55 ? task.slice(0, 52) + '…' : task,
        description: task,
        evidenceStrength: 0.8, source: 'inferred', importance: 'medium',
        provenance: _prov('jd', 'inferred', 'medium'),
        metadata: { section: 'What you would actually do' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: evId, to: 'role', type: 'mentions',
        label: 'actual work', strength: 0.8, explanation: 'What you would actually do in this role.',
        provenance: _prov('jd', 'inferred', 'medium'),
      });
    });

    // ── 10. What they are really looking for → jd_evidence nodes ───────────
    const lookingFor = output.what_they_are_really_looking_for || [];
    lookingFor.forEach((req, i) => {
      const evId = _slug('ev', 'req_' + i);
      nodes.push({
        id: evId, type: 'jd_evidence',
        label: req.length > 55 ? req.slice(0, 52) + '…' : req,
        description: req,
        evidenceStrength: 0.85, source: 'direct', importance: 'high',
        provenance: _prov('jd', 'direct', 'high'),
        metadata: { section: 'What they are really looking for' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: evId, to: 'role', type: 'mentions',
        label: 'requirement', strength: 0.85, explanation: 'What they are really looking for.',
        provenance: _prov('jd', 'direct', 'high'),
      });
    });

    // ── 11. Suggested CV → cv node ────────────────────────────────────────
    const actions = output.suggested_actions || {};
    if (actions.recommended_cv) {
      const cvId = _slug('cv', actions.recommended_cv);
      nodes.push({
        id: cvId, type: 'cv',
        label: actions.recommended_cv + ' CV',
        description: actions.cv_reasoning || 'Recommended CV positioning for this role.',
        evidenceStrength: 0.8, source: 'inferred', importance: 'medium',
        provenance: _prov('analysis_inference', 'inferred', 'high'),
        metadata: { category: 'CV selection' },
        checks: [],
      });
      edges.push({
        id: _eid(), from: cvId, to: 'role', type: 'recommends',
        label: 'recommended', strength: 0.8, explanation: actions.cv_reasoning || 'AI-recommended CV.',
        provenance: _prov('analysis_inference', 'inferred', 'high'),
      });
    }

    // ── 12. Analysis decision → outcome node ──────────────────────────────
    const analysis = role.analysis;
    if (analysis && analysis.decision) {
      const decId = 'outcome_verdict';
      nodes.push({
        id: decId, type: 'outcome',
        label: 'Verdict: ' + analysis.decision,
        description: analysis.confidence_note || 'AI analysis verdict for this role.',
        evidenceStrength: 0.9, source: 'inferred', importance: 'critical',
        provenance: _prov('analysis_inference', 'inferred', 'high'),
        metadata: { decision: analysis.decision },
        checks: [],
      });
      edges.push({
        id: _eid(), from: decId, to: 'role', type: 'linked_to',
        label: 'verdict', strength: 0.9, explanation: 'Analysis verdict: ' + analysis.decision,
        provenance: _prov('analysis_inference', 'inferred', 'high'),
      });
    }

    // ── 13. User preferences (from role-level data) ───────────────────────
    // Work model preference vs role work model
    if (role.work_model) {
      const prefWmId = 'pref_work_model';
      if (!nodes.some(n => n.id === prefWmId)) {
        const wmTrait = nodes.find(n => n.id === _slug('trait', 'work_model'));
        if (wmTrait) {
          nodes.push({
            id: prefWmId, type: 'preference',
            label: 'Work model preference',
            description: 'Your work model preference as set in your profile.',
            evidenceStrength: 1.0, source: 'direct', importance: 'high',
            provenance: _prov('user_preference', 'direct', 'high'),
            metadata: { category: 'Work model' },
            checks: [],
          });
          edges.push({
            id: _eid(), from: wmTrait.id, to: prefWmId, type: 'linked_to',
            label: 'vs preference', strength: 0.8, explanation: 'Role work model compared to your preference.',
            provenance: _prov('user_preference', 'direct', 'high'),
          });
        }
      }
    }

    // Fit assessment (user decision)
    if (role.fit_assessment) {
      const fitId = 'pref_fit';
      const fitLabel = role.fit_assessment === 'fits' ? 'You marked: Fits' : 'You marked: Doesn\'t fit';
      nodes.push({
        id: fitId, type: 'preference',
        label: fitLabel,
        description: 'Your fit assessment for this role.',
        evidenceStrength: 1.0, source: 'direct', importance: 'critical',
        provenance: _prov('user_preference', 'direct', 'high'),
        metadata: { assessment: role.fit_assessment },
        checks: [],
      });
      edges.push({
        id: _eid(), from: fitId, to: 'role', type: role.fit_assessment === 'fits' ? 'supports' : 'conflicts_with',
        label: role.fit_assessment === 'fits' ? 'fits' : 'doesn\'t fit', strength: 1.0,
        explanation: 'Your personal fit assessment.',
        provenance: _prov('user_preference', 'direct', 'high'),
      });
    }

    // Verdict state
    if (role.verdict_state && role.verdict_state !== 'undecided') {
      const vsId = 'pref_verdict';
      const vsLabel = role.verdict_state === 'fits' ? 'Verdict: For me' : 'Verdict: Not for me';
      if (!nodes.some(n => n.id === vsId)) {
        nodes.push({
          id: vsId, type: 'preference',
          label: vsLabel,
          description: 'Your final verdict on this role.',
          evidenceStrength: 1.0, source: 'direct', importance: 'critical',
          provenance: _prov('user_boundary', 'direct', 'high'),
          metadata: { verdict: role.verdict_state },
          checks: [],
        });
        edges.push({
          id: _eid(), from: vsId, to: 'role', type: role.verdict_state === 'fits' ? 'supports' : 'conflicts_with',
          label: 'verdict', strength: 1.0, explanation: 'Your verdict on this role.',
          provenance: _prov('user_boundary', 'direct', 'high'),
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Resolve the graph data for a role.
   * Returns the real graph if analysis data exists, or null if unavailable.
   */
  function resolveGraphData(role) {
    const realGraph = buildGraphFromRole(role);
    if (realGraph && realGraph.nodes.length > 1) return realGraph;
    return null;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — Layout engine (arc-based radial)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Place nodes within a clock-degree arc at a given radius.
   * clockDeg 0=top, 90=right, 180=bottom, 270=left.
   */
  function placeNodesInArc(nodes, startDeg, spanDeg, radius) {
    const count = nodes.length;
    if (!count) return;
    nodes.forEach((n, i) => {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const clockDeg = startDeg + t * spanDeg;
      const rad = (clockDeg - 90) * Math.PI / 180;
      n.x = Math.cos(rad) * radius;
      n.y = Math.sin(rad) * radius;
    });
  }

  /**
   * Pull jd_evidence nodes 30% toward the average angular position of
   * their connected trait/blocker nodes, keeping them on Ring 1 radius.
   */
  function pullEvidenceTowardsParents(nodes, edges) {
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });
    const r1 = RING_RADII[1];

    nodes.filter(n => n.type === 'jd_evidence').forEach(ev => {
      const parentIds = edges
        .filter(e => e.from === ev.id || e.to === ev.id)
        .map(e => e.from === ev.id ? e.to : e.from)
        .filter(pid => {
          const p = nodeMap[pid];
          return p && (p.type === 'trait' || p.type === 'blocker');
        });
      if (!parentIds.length) return;

      let sumX = 0, sumY = 0;
      parentIds.forEach(pid => { sumX += nodeMap[pid].x || 0; sumY += nodeMap[pid].y || 0; });
      const avgX = sumX / parentIds.length;
      const avgY = sumY / parentIds.length;
      const parentAngle = Math.atan2(avgY, avgX);
      const evAngle = Math.atan2(ev.y, ev.x);

      let diff = parentAngle - evAngle;
      while (diff > Math.PI)  diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;

      const newAngle = evAngle + diff * 0.3;
      ev.x = Math.cos(newAngle) * r1;
      ev.y = Math.sin(newAngle) * r1;
    });
  }

  /**
   * Assigns x/y coordinates to each node using arc-based radial layout.
   * 1. Place role node at centre
   * 2. Group nodes by type, place each type in its allocated arc
   * 3. Pull evidence nodes toward their parent traits/blockers
   * 4. Run collision avoidance
   */
  function computeLayout(nodes, edges) {
    // Place role at centre
    nodes.filter(n => n.type === 'role').forEach(n => { n.x = 0; n.y = 0; });

    // Group by type
    const byType = {};
    nodes.forEach(n => {
      if (n.type === 'role') return;
      if (!byType[n.type]) byType[n.type] = [];
      byType[n.type].push(n);
    });

    // Place each type in its arc
    Object.entries(TYPE_ARCS).forEach(([type, arc]) => {
      const group = byType[type];
      if (!group || !group.length) return;
      placeNodesInArc(group, arc.start, arc.span, RING_RADII[arc.ring]);
    });

    // Evidence pull pass
    if (edges) pullEvidenceTowardsParents(nodes, edges);

    // Collision avoidance (20 iterations)
    const allPositioned = nodes.filter(n => n.x !== undefined);
    for (let iter = 0; iter < 20; iter++) {
      for (let i = 0; i < allPositioned.length; i++) {
        for (let j = i + 1; j < allPositioned.length; j++) {
          const a = allPositioned[i];
          const b = allPositioned[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const minDist = (NODE_DEFS[a.type]?.radius || 14) + (NODE_DEFS[b.type]?.radius || 14) + 28;
          if (dist < minDist) {
            const push = (minDist - dist) / 2 / dist;
            if (a.type !== 'role') { a.x -= dx * push * 0.5; a.y -= dy * push * 0.5; }
            if (b.type !== 'role') { b.x += dx * push * 0.5; b.y += dy * push * 0.5; }
          }
        }
      }
    }

    return nodes;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — Graph state
  // ═══════════════════════════════════════════════════════════════════════════

  let _graphData    = null;
  let _state        = {
    selectedId:       null,
    selectedKind:     null,
    hoveredId:        null,
    transform:        { x: 0, y: 0, k: 1 },
    hiddenTypes:      new Set(),
    focusMode:        'all',
    strengthFilter:   'all',
    signalFilter:     new Set(['direct', 'inferred', 'learned', 'missing']),
    showEdgeLabels:   false,
    searchQuery:      '',
    reasoningPath:    null,   // { nodeIds: [], edgeIds: [] } | null
  };
  let _svgEl        = null;
  let _canvasG      = null;
  let _isPanning    = false;
  let _panStart     = null;
  let _focusedNodeIdx = -1;
  let _overlayEl    = null;
  let _currentRole  = null;
  let _animFrame    = null;
  let _guidedStep   = -1;   // -1 = not in guided mode


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — HTML overlay builder
  // ═══════════════════════════════════════════════════════════════════════════

  function buildOverlayHTML(role) {
    const title   = (role && role.role_title)   || 'Unknown Role';
    const company = (role && role.company_name) || '';

    const nodeTypeToggles = Object.entries(NODE_DEFS).map(([type, def]) => {
      const count = (_graphData?.nodes || []).filter(n => n.type === type).length;
      if (!count) return '';
      return `
        <label class="rm-node-toggle">
          <input type="checkbox" class="rm-type-check" data-type="${type}" checked>
          <span class="rm-node-toggle-dot" style="background:${def.fill}"></span>
          <span class="rm-node-toggle-label">${def.label}</span>
          <span class="rm-node-toggle-count">${count}</span>
        </label>`;
    }).join('');

    const stats = _graphData
      ? `${_graphData.nodes.length} nodes \u00b7 ${_graphData.edges.length} edges`
      : '';

    return `
<div id="rm-overlay" class="rm-overlay" role="dialog" aria-modal="true"
     aria-label="Reasoning Map \u2014 ${_esc(title)}">

  <!-- ── Top bar ────────────────────────────────────────────────────────── -->
  <header class="rm-topbar">
    <div class="rm-topbar-left">
      <button class="rm-back-btn" id="rm-btn-back" aria-label="Back to role overview">
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </button>
      <span class="rm-topbar-divider" aria-hidden="true"></span>
      <span class="rm-topbar-badge" aria-label="Reasoning Map feature">
        <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.4"/>
          <circle cx="6" cy="6" r="2" fill="currentColor"/>
        </svg>
        Reasoning Map
      </span>
      <span class="rm-topbar-divider" aria-hidden="true"></span>
      <div class="rm-topbar-role-context">
        <span class="rm-topbar-role-title" id="rm-topbar-role-title">${_esc(title)}</span>
        ${company ? `<span class="rm-topbar-role-sep" aria-hidden="true">\u00b7</span>
        <span class="rm-topbar-role-company">${_esc(company)}</span>` : ''}
      </div>
    </div>
    <div class="rm-topbar-center">
      <span class="rm-topbar-stats" id="rm-stats" aria-live="polite">${stats}</span>
    </div>
    <div class="rm-topbar-right">
      <button class="rm-topbar-ctrl rm-topbar-tour" id="rm-btn-tour" title="Start guided tour" aria-label="Start guided tour">
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M7 4.5v3.5M7 9.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        Tour
      </button>
      <button class="rm-topbar-ctrl" id="rm-btn-fit" title="Fit to view (F)" aria-label="Fit graph to view">
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 5V2h3M9 2h3v3M12 9v3H9M5 12H2V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Fit
      </button>
      <button class="rm-topbar-ctrl" id="rm-btn-reset" title="Reset graph (R)" aria-label="Reset all filters and view">
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 7a5 5 0 1 1 5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          <path d="M2 7V4m0 3H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        Reset
      </button>
      <button class="rm-topbar-ctrl" id="rm-btn-edge-labels" title="Toggle edge labels"
              aria-pressed="false">
        Labels
      </button>
    </div>
  </header>

  <!-- ── Main body ──────────────────────────────────────────────────────── -->
  <div class="rm-body">

    <!-- Left sidebar -->
    <aside class="rm-sidebar" aria-label="Graph controls and filters">

      <div class="rm-search-wrap">
        <div class="rm-search-inner" role="search">
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="5.75" cy="5.75" r="3.75" stroke="currentColor" stroke-width="1.3"/>
            <line x1="8.75" y1="8.75" x2="12" y2="12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input type="text" class="rm-search-input" id="rm-search"
                 placeholder="Search nodes\u2026"
                 aria-label="Search graph nodes"
                 autocomplete="off" spellcheck="false">
          <button class="rm-search-clear hidden" id="rm-search-clear"
                  aria-label="Clear search">\u00d7</button>
        </div>
      </div>

      <div class="rm-search-results hidden" id="rm-search-results"
           role="listbox" aria-label="Search results"></div>

      <div class="rm-sidebar-section">
        <div class="rm-sidebar-label" id="focus-mode-label">Focus mode</div>
        <div class="rm-focus-pills" role="group" aria-labelledby="focus-mode-label">
          <button class="rm-focus-pill rm-pill-active" data-focus="all">All</button>
          <button class="rm-focus-pill" data-focus="blockers">Blockers</button>
          <button class="rm-focus-pill" data-focus="outcomes">Outcomes</button>
          <button class="rm-focus-pill" data-focus="signals">My signals</button>
          <button class="rm-focus-pill" data-focus="strong-only">Strong only</button>
          <button class="rm-focus-pill" data-focus="selected-path">Selected path</button>
        </div>
      </div>

      <div class="rm-sidebar-section">
        <div class="rm-sidebar-label">Node types</div>
        <div class="rm-node-toggles" role="group" aria-label="Toggle node types">
          ${nodeTypeToggles}
        </div>
      </div>

      <div class="rm-sidebar-section">
        <div class="rm-sidebar-label" id="strength-label">Evidence strength</div>
        <div class="rm-strength-filter" role="group" aria-labelledby="strength-label">
          <button class="rm-strength-btn rm-strength-active" data-strength="all">All</button>
          <button class="rm-strength-btn" data-strength="strong">Strong</button>
          <button class="rm-strength-btn" data-strength="medium">Medium</button>
          <button class="rm-strength-btn" data-strength="weak">Weak / missing</button>
        </div>
      </div>

      <div class="rm-sidebar-section">
        <div class="rm-sidebar-label">Signal origin</div>
        <div class="rm-signal-filter" role="group" aria-label="Filter by signal origin">
          <label class="rm-signal-toggle">
            <input type="checkbox" class="rm-signal-check" data-signal="direct" checked>
            <span class="rm-signal-toggle-label">Direct evidence</span>
            <span class="rm-signal-badge direct">DIRECT</span>
          </label>
          <label class="rm-signal-toggle">
            <input type="checkbox" class="rm-signal-check" data-signal="inferred" checked>
            <span class="rm-signal-toggle-label">Inferred signal</span>
            <span class="rm-signal-badge inferred">INFERRED</span>
          </label>
          <label class="rm-signal-toggle">
            <input type="checkbox" class="rm-signal-check" data-signal="learned" checked>
            <span class="rm-signal-toggle-label">Learned pattern</span>
            <span class="rm-signal-badge learned">LEARNED</span>
          </label>
          <label class="rm-signal-toggle">
            <input type="checkbox" class="rm-signal-check" data-signal="missing" checked>
            <span class="rm-signal-toggle-label">Missing / weak</span>
            <span class="rm-signal-badge missing">MISSING</span>
          </label>
        </div>
      </div>

      <div class="rm-sidebar-section">
        <div class="rm-sidebar-label">View</div>
        <div class="rm-graph-actions">
          <button class="rm-action-btn" id="rm-btn-sidebar-fit">
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="4" height="4" stroke="currentColor" stroke-width="1.2"/>
              <rect x="7" y="1" width="4" height="4" stroke="currentColor" stroke-width="1.2"/>
              <rect x="1" y="7" width="4" height="4" stroke="currentColor" stroke-width="1.2"/>
              <rect x="7" y="7" width="4" height="4" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            Fit to screen
          </button>
          <button class="rm-action-btn" id="rm-btn-centre-selected">
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
              <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
            </svg>
            Centre selected
          </button>
          <button class="rm-action-btn" id="rm-btn-clear-selection">
            Clear selection
          </button>
        </div>
      </div>

      <div class="rm-sidebar-footer">
        <kbd class="rm-kbd">F</kbd> fit \u00b7 <kbd class="rm-kbd">R</kbd> reset \u00b7
        <kbd class="rm-kbd">Esc</kbd> close<br>
        <kbd class="rm-kbd">Tab</kbd> cycle \u00b7 <kbd class="rm-kbd">\u21b5</kbd> select \u00b7
        <kbd class="rm-kbd">/</kbd> search
      </div>

    </aside>

    <!-- Graph canvas -->
    <main class="rm-canvas-wrap" id="rm-canvas-wrap"
          aria-label="Role reasoning graph. Use Tab to navigate nodes.">

      <svg id="rm-svg" class="rm-svg" tabindex="0"
           role="img"
           aria-label="Interactive reasoning graph for ${_esc(title)}">
        <defs>
          <marker id="rm-arrow-default" markerWidth="10" markerHeight="7"
                  refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" opacity="0.7"/>
          </marker>
          <marker id="rm-arrow-green" markerWidth="10" markerHeight="7"
                  refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981"/>
          </marker>
          <marker id="rm-arrow-red" markerWidth="10" markerHeight="7"
                  refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444"/>
          </marker>
          <marker id="rm-arrow-purple" markerWidth="10" markerHeight="7"
                  refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3.5, 0 7" fill="#7f56d9"/>
          </marker>
          <marker id="rm-arrow-path" markerWidth="10" markerHeight="7"
                  refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981"/>
          </marker>
          <filter id="rm-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="rm-role-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="#7f56d9" flood-opacity="0.3"/>
          </filter>
        </defs>
        <rect class="rm-canvas-bg" x="-10000" y="-10000" width="20000" height="20000"/>
        <g id="rm-canvas-g" class="rm-canvas-g">
          <g id="rm-edges-g" class="rm-edges-g"></g>
          <g id="rm-nodes-g" class="rm-nodes-g"></g>
        </g>
      </svg>

      <!-- Zoom controls -->
      <div class="rm-zoom-controls" aria-label="Zoom controls">
        <button class="rm-zoom-btn" id="rm-btn-zoom-in"  aria-label="Zoom in">
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="rm-zoom-btn" id="rm-btn-zoom-out" aria-label="Zoom out">
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="rm-zoom-btn" id="rm-btn-zoom-fit-canvas" aria-label="Fit to view">
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 5V2h3M9 2h3v3M12 9v3H9M5 12H2V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Edge type legend -->
      <div class="rm-legend" aria-label="Edge type legend">
        <div class="rm-legend-item">
          <div class="rm-legend-line rm-legend-solid"></div>
          <span>Direct evidence</span>
        </div>
        <div class="rm-legend-item">
          <div class="rm-legend-line rm-legend-dashed"></div>
          <span>Inferred</span>
        </div>
        <div class="rm-legend-item">
          <div class="rm-legend-line rm-legend-conflict"></div>
          <span>Conflict</span>
        </div>
      </div>

      <!-- Guided tour panel (hidden by default) -->
      <div class="rm-guided-panel hidden" id="rm-guided-panel" role="region" aria-label="Guided tour">
        <div class="rm-guided-inner">
          <div class="rm-guided-header">
            <span class="rm-guided-step-count" id="rm-guided-count">Step 1 of 5</span>
            <button class="rm-guided-close" id="rm-guided-close" aria-label="Exit tour">\u00d7</button>
          </div>
          <div class="rm-guided-title" id="rm-guided-title">The role</div>
          <p class="rm-guided-desc" id="rm-guided-desc">Description here.</p>
          <div class="rm-guided-nav">
            <button class="rm-guided-btn" id="rm-guided-prev" disabled>\u2190 Previous</button>
            <button class="rm-guided-btn rm-guided-btn-primary" id="rm-guided-next">Next \u2192</button>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div class="rm-loading-overlay" id="rm-loading" aria-live="polite" aria-label="Loading graph">
        <div class="rm-spinner" role="status"><span class="visually-hidden">Loading\u2026</span></div>
      </div>

      <!-- Canvas empty state -->
      <div class="rm-canvas-state hidden" id="rm-canvas-empty">
        <div class="rm-canvas-state-inner">
          <svg class="rm-canvas-state-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
            <path d="M20 13v7m0 4v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <div class="rm-canvas-state-title" id="rm-empty-title">No graph data available</div>
          <p class="rm-canvas-state-desc" id="rm-empty-desc">
            This role doesn\u2019t yet have enough structured signals to render the reasoning map.
          </p>
        </div>
      </div>

      <!-- Canvas error state -->
      <div class="rm-canvas-state hidden" id="rm-canvas-error">
        <div class="rm-canvas-state-inner">
          <svg class="rm-canvas-state-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="18" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M20 13v9m0 4v1" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <div class="rm-canvas-state-title">Something went wrong</div>
          <p class="rm-canvas-state-desc" id="rm-error-desc">An error occurred while loading the reasoning map.</p>
          <button class="rm-canvas-state-btn" id="rm-btn-error-retry">Try again</button>
        </div>
      </div>
    </main>

    <!-- Right inspector panel -->
    <aside class="rm-inspector" id="rm-inspector" aria-label="Selected node or edge details">
      <div class="rm-inspector-empty" id="rm-inspector-empty">
        <svg class="rm-inspector-empty-icon" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="1.3"/>
          <circle cx="12" cy="15" r="3" fill="currentColor" opacity="0.3"/>
          <circle cx="24" cy="15" r="3" fill="currentColor" opacity="0.3"/>
          <circle cx="18" cy="24" r="3" fill="currentColor" opacity="0.3"/>
          <line x1="15" y1="15" x2="21" y2="15" stroke="currentColor" stroke-width="1.2" opacity="0.3"/>
          <line x1="14" y1="17" x2="17" y2="22" stroke="currentColor" stroke-width="1.2" opacity="0.3"/>
          <line x1="22" y1="17" x2="19" y2="22" stroke="currentColor" stroke-width="1.2" opacity="0.3"/>
        </svg>
        <div class="rm-inspector-empty-title">Select a node</div>
        <p class="rm-inspector-empty-hint">Click any node or edge to inspect its signals, evidence, and connections.</p>
      </div>
      <div class="rm-inspector-content hidden" id="rm-inspector-content"></div>
    </aside>
  </div>
</div>`;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — SVG renderer
  // ═══════════════════════════════════════════════════════════════════════════

  function renderGraph() {
    if (!_graphData || !_canvasG) return;

    const edgesG = document.getElementById('rm-edges-g');
    const nodesG = document.getElementById('rm-nodes-g');
    if (!edgesG || !nodesG) return;

    edgesG.innerHTML = '';
    nodesG.innerHTML = '';

    const nodeMap = {};
    _graphData.nodes.forEach(n => { nodeMap[n.id] = n; });

    // ── Render edges ────────────────────────────────────────────────────
    _graphData.edges.forEach(edge => {
      const fromNode = nodeMap[edge.from];
      const toNode   = nodeMap[edge.to];
      if (!fromNode || !toNode) return;

      const def = EDGE_DEFS[edge.type] || EDGE_DEFS.linked_to;
      const fromR = (NODE_DEFS[fromNode.type]?.radius || 14) + 3;
      const toR   = (NODE_DEFS[toNode.type]?.radius   || 14) + 10;

      const dx   = toNode.x - fromNode.x;
      const dy   = toNode.y - fromNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux   = dx / dist;
      const uy   = dy / dist;

      const x1 = fromNode.x + ux * fromR;
      const y1 = fromNode.y + uy * fromR;
      const x2 = toNode.x   - ux * toR;
      const y2 = toNode.y   - uy * toR;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      let marker = 'url(#rm-arrow-default)';
      if (edge.type === 'supports' || edge.type === 'led_to')   marker = 'url(#rm-arrow-green)';
      if (edge.type === 'conflicts_with')                        marker = 'url(#rm-arrow-red)';
      if (edge.type === 'recommends')                            marker = 'url(#rm-arrow-purple)';

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('rm-edge');
      g.dataset.id   = edge.id;
      g.dataset.from = edge.from;
      g.dataset.to   = edge.to;
      g.setAttribute('aria-label', `${def.label} \u2014 from ${fromNode.label} to ${toNode.label}`);

      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hit.classList.add('rm-edge-hit');
      hit.setAttribute('x1', x1); hit.setAttribute('y1', y1);
      hit.setAttribute('x2', x2); hit.setAttribute('y2', y2);
      g.appendChild(hit);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.classList.add('rm-edge-line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', def.color);
      line.setAttribute('stroke-width', def.width);
      if (def.dash) line.setAttribute('stroke-dasharray', def.dash);
      line.setAttribute('marker-end', marker);
      line.style.opacity = 0.45 + (edge.strength || 0.5) * 0.4;
      g.appendChild(line);

      const labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelEl.classList.add('rm-edge-label');
      labelEl.setAttribute('x', mx);
      labelEl.setAttribute('y', my - 4);
      labelEl.setAttribute('text-anchor', 'middle');
      labelEl.textContent = edge.label || def.label;
      g.appendChild(labelEl);

      edgesG.appendChild(g);
    });

    // ── Render nodes ────────────────────────────────────────────────────
    _graphData.nodes.forEach((node, idx) => {
      const def = NODE_DEFS[node.type] || NODE_DEFS.jd_evidence;
      const r   = def.radius;
      const ringR = r + 7;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('rm-node');
      if (node.type === 'missing_evidence') g.classList.add('rm-node--missing');
      g.dataset.id   = node.id;
      g.dataset.type = node.type;
      g.dataset.idx  = idx;
      g.setAttribute('transform', `translate(${node.x || 0},${node.y || 0})`);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `${def.label}: ${node.label}`);
      g.setAttribute('aria-pressed', 'false');
      g.setAttribute('focusable', 'true');

      // Selection / focus ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.classList.add('rm-node-ring');
      ring.setAttribute('r', ringR);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', def.ring);
      ring.setAttribute('stroke-width', '2');
      g.appendChild(ring);

      // Main body circle
      const body = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      body.classList.add('rm-node-body');
      body.setAttribute('r', r);
      if (node.type === 'missing_evidence') {
        // Dashed circle for missing evidence
        body.setAttribute('fill', def.fill + '18');
        body.setAttribute('stroke', def.fill);
        body.setAttribute('stroke-width', '1.5');
        body.setAttribute('stroke-dasharray', '4 3');
      } else {
        body.setAttribute('fill', def.fill);
      }
      // Role node gets a subtle shadow
      if (node.type === 'role') {
        body.setAttribute('filter', 'url(#rm-role-shadow)');
      }
      g.appendChild(body);

      // Icon glyph
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.classList.add('rm-node-icon');
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('dominant-baseline', 'central');
      icon.setAttribute('fill', node.type === 'missing_evidence' ? def.fill : def.textFill);
      icon.setAttribute('font-size', Math.max(9, r * 0.55));
      icon.setAttribute('font-weight', '700');
      icon.setAttribute('font-family', "Inter, system-ui, sans-serif");
      icon.setAttribute('pointer-events', 'none');

      const GLYPHS = {
        role: 'R', company: 'Co', recruiter: 'Rc', jd_evidence: 'JD',
        trait: 'T', blocker: '!', preference: 'P', cv: 'CV',
        similar_role: 'Sr', outcome: 'O', career_signal: 'S',
        market_signal: 'M', question: '?', missing_evidence: '\u2715',
      };
      icon.textContent = GLYPHS[node.type] || node.type[0].toUpperCase();
      g.appendChild(icon);

      // Label below
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.classList.add('rm-node-label');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('y', r + 14);
      label.setAttribute('font-size', node.type === 'role' ? '12' : '10.5');
      label.setAttribute('font-weight', node.type === 'role' ? '600' : '400');
      label.setAttribute('font-family', "Inter, system-ui, sans-serif");
      label.setAttribute('pointer-events', 'none');
      label.textContent = _truncLabel(node.label, node.type === 'role' ? 30 : 22);
      g.appendChild(label);

      nodesG.appendChild(g);
    });

    applyFilters();
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — Pan / zoom
  // ═══════════════════════════════════════════════════════════════════════════

  function _applyTransform(animate) {
    if (!_canvasG) return;
    const t = _state.transform;
    const val = `translate(${t.x},${t.y}) scale(${t.k})`;
    if (animate && !_prefersReducedMotion()) {
      _canvasG.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1)';
      _canvasG.setAttribute('transform', val);
      setTimeout(() => { if (_canvasG) _canvasG.style.transition = ''; }, 400);
    } else {
      _canvasG.style.transition = '';
      _canvasG.setAttribute('transform', val);
    }
  }

  function fitToView(animate) {
    if (!_svgEl || !_graphData?.nodes?.length) return;
    const rect = _svgEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const xs = _graphData.nodes.map(n => n.x || 0);
    const ys = _graphData.nodes.map(n => n.y || 0);
    const pad = 80;
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    const cw = maxX - minX;
    const ch = maxY - minY;

    const k = Math.min(rect.width / cw, rect.height / ch, 1.4) * 0.88;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    _state.transform = {
      x: rect.width  / 2 - cx * k,
      y: rect.height / 2 - cy * k,
      k,
    };
    _applyTransform(animate);
  }

  function centreOnNode(nodeId) {
    if (!_svgEl || !_graphData) return;
    const node = _graphData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const rect = _svgEl.getBoundingClientRect();
    const k = _state.transform.k;
    _state.transform.x = rect.width  / 2 - (node.x || 0) * k;
    _state.transform.y = rect.height / 2 - (node.y || 0) * k;
    _applyTransform(true);
  }

  function zoomBy(factor) {
    if (!_svgEl) return;
    const rect = _svgEl.getBoundingClientRect();
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    const newK = Math.max(0.15, Math.min(3.5, _state.transform.k * factor));
    _state.transform.x = cx - (cx - _state.transform.x) * (newK / _state.transform.k);
    _state.transform.y = cy - (cy - _state.transform.y) * (newK / _state.transform.k);
    _state.transform.k = newK;
    _applyTransform(false);
  }

  function initPanZoom(svgEl) {
    let lastX, lastY;

    svgEl.addEventListener('mousedown', e => {
      const isCanvas = e.target === svgEl ||
                       e.target.classList.contains('rm-canvas-bg') ||
                       e.target === _canvasG;
      if (!isCanvas) return;
      _isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      svgEl.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', e => {
      if (!_isPanning) return;
      _state.transform.x += e.clientX - lastX;
      _state.transform.y += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      _applyTransform(false);
    });

    window.addEventListener('mouseup', () => {
      if (!_isPanning) return;
      _isPanning = false;
      svgEl.style.cursor = 'grab';
    });

    svgEl.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = svgEl.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.87 : 1.15;
      const newK = Math.max(0.15, Math.min(3.5, _state.transform.k * factor));
      _state.transform.x = mx - (mx - _state.transform.x) * (newK / _state.transform.k);
      _state.transform.y = my - (my - _state.transform.y) * (newK / _state.transform.k);
      _state.transform.k = newK;
      _applyTransform(false);
    }, { passive: false });

    let lastTouchDist = null;
    svgEl.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    svgEl.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && lastTouchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        zoomBy(dist / lastTouchDist);
        lastTouchDist = dist;
        e.preventDefault();
      }
    }, { passive: false });

    svgEl.addEventListener('touchend', () => { lastTouchDist = null; });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — Selection & highlight system
  // ═══════════════════════════════════════════════════════════════════════════

  function selectNode(nodeId) {
    if (!_graphData) return;
    clearReasoningPath();
    _state.selectedId   = nodeId;
    _state.selectedKind = 'node';

    const connEdges = _graphData.edges.filter(e => e.from === nodeId || e.to === nodeId);
    const connIds   = new Set([nodeId, ...connEdges.map(e => e.from), ...connEdges.map(e => e.to)]);

    document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
      g.classList.remove('rm-node--selected', 'rm-node--connected', 'rm-node--dimmed', 'rm-node--path');
      const isSelected  = g.dataset.id === nodeId;
      const isConnected = connIds.has(g.dataset.id);
      if (isSelected)       g.classList.add('rm-node--selected');
      else if (isConnected) g.classList.add('rm-node--connected');
      else                  g.classList.add('rm-node--dimmed');
      g.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    document.querySelectorAll('#rm-edges-g .rm-edge').forEach(g => {
      g.classList.remove('rm-edge--active', 'rm-edge--dimmed', 'rm-edge--path');
      const active = connEdges.some(e => e.id === g.dataset.id);
      g.classList.add(active ? 'rm-edge--active' : 'rm-edge--dimmed');
      const labelEl = g.querySelector('.rm-edge-label');
      if (labelEl) labelEl.style.opacity = active ? '1' : '';
    });

    renderInspector(nodeId);

    // Auto-centre on selected node
    centreOnNode(nodeId);

    const nodeEl = document.querySelector(`#rm-nodes-g .rm-node[data-id="${CSS.escape(nodeId)}"]`);
    if (nodeEl) nodeEl.focus();
  }

  function selectEdge(edgeId) {
    if (!_graphData) return;
    clearReasoningPath();
    _state.selectedId   = edgeId;
    _state.selectedKind = 'edge';

    const edge = _graphData.edges.find(e => e.id === edgeId);
    if (!edge) return;

    const connIds = new Set([edge.from, edge.to]);

    document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
      g.classList.remove('rm-node--selected', 'rm-node--connected', 'rm-node--dimmed', 'rm-node--path');
      if (connIds.has(g.dataset.id)) g.classList.add('rm-node--connected');
      else                           g.classList.add('rm-node--dimmed');
    });

    document.querySelectorAll('#rm-edges-g .rm-edge').forEach(g => {
      g.classList.remove('rm-edge--active', 'rm-edge--dimmed', 'rm-edge--path');
      g.classList.add(g.dataset.id === edgeId ? 'rm-edge--active' : 'rm-edge--dimmed');
    });

    renderEdgeInspector(edgeId);
  }

  function clearSelection() {
    _state.selectedId   = null;
    _state.selectedKind = null;
    clearReasoningPath();

    document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
      g.classList.remove('rm-node--selected', 'rm-node--connected', 'rm-node--dimmed', 'rm-node--path');
      g.setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('#rm-edges-g .rm-edge').forEach(g => {
      g.classList.remove('rm-edge--active', 'rm-edge--dimmed', 'rm-edge--path');
    });

    document.querySelectorAll('.rm-edge-label').forEach(el => {
      el.style.opacity = _state.showEdgeLabels ? '1' : '';
    });

    showInspectorEmpty();
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8b — Reasoning path (BFS)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * BFS from `fromId` to the 'role' node, traversing edges bidirectionally.
   * Returns { nodeIds: [...], edgeIds: [...] } or null.
   */
  function findReasoningPath(fromId) {
    if (!_graphData || fromId === 'role') return null;

    const adj = {};
    _graphData.nodes.forEach(n => { adj[n.id] = []; });
    _graphData.edges.forEach(e => {
      if (!adj[e.from]) adj[e.from] = [];
      if (!adj[e.to])   adj[e.to]   = [];
      adj[e.from].push({ nodeId: e.to,   edgeId: e.id });
      adj[e.to].push({   nodeId: e.from, edgeId: e.id });
    });

    const visited = new Set([fromId]);
    const queue = [{ nodeId: fromId, path: [fromId], edgePath: [] }];

    while (queue.length) {
      const { nodeId, path, edgePath } = queue.shift();
      for (const { nodeId: nextId, edgeId } of (adj[nodeId] || [])) {
        if (visited.has(nextId)) continue;
        visited.add(nextId);
        const newPath     = [...path, nextId];
        const newEdgePath = [...edgePath, edgeId];
        if (nextId === 'role') {
          return { nodeIds: newPath, edgeIds: newEdgePath };
        }
        queue.push({ nodeId: nextId, path: newPath, edgePath: newEdgePath });
      }
    }
    return null;
  }

  function activateReasoningPath(result) {
    if (!result) return;
    _state.reasoningPath = result;

    const pathNodeSet = new Set(result.nodeIds);
    const pathEdgeSet = new Set(result.edgeIds);

    document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
      g.classList.remove('rm-node--selected', 'rm-node--connected', 'rm-node--dimmed', 'rm-node--path');
      if (pathNodeSet.has(g.dataset.id)) g.classList.add('rm-node--path');
      else                               g.classList.add('rm-node--dimmed');
    });

    document.querySelectorAll('#rm-edges-g .rm-edge').forEach(g => {
      g.classList.remove('rm-edge--active', 'rm-edge--dimmed', 'rm-edge--path');
      if (pathEdgeSet.has(g.dataset.id)) {
        g.classList.add('rm-edge--path');
        const line = g.querySelector('.rm-edge-line');
        if (line) line.setAttribute('marker-end', 'url(#rm-arrow-path)');
      } else {
        g.classList.add('rm-edge--dimmed');
      }
      const labelEl = g.querySelector('.rm-edge-label');
      if (labelEl) labelEl.style.opacity = pathEdgeSet.has(g.dataset.id) ? '1' : '';
    });

    // Show path chain in inspector
    renderPathInspector(result);
  }

  function clearReasoningPath() {
    if (!_state.reasoningPath) return;
    _state.reasoningPath = null;
    document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
      g.classList.remove('rm-node--path');
    });
    document.querySelectorAll('#rm-edges-g .rm-edge').forEach(g => {
      g.classList.remove('rm-edge--path');
      // Restore original markers
      const edgeData = _graphData?.edges.find(e => e.id === g.dataset.id);
      if (edgeData) {
        const line = g.querySelector('.rm-edge-line');
        if (line) {
          let marker = 'url(#rm-arrow-default)';
          if (edgeData.type === 'supports' || edgeData.type === 'led_to') marker = 'url(#rm-arrow-green)';
          if (edgeData.type === 'conflicts_with')                          marker = 'url(#rm-arrow-red)';
          if (edgeData.type === 'recommends')                              marker = 'url(#rm-arrow-purple)';
          line.setAttribute('marker-end', marker);
        }
      }
    });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9 — Inspector panel renderer
  // ═══════════════════════════════════════════════════════════════════════════

  function showInspectorEmpty() {
    const empty   = document.getElementById('rm-inspector-empty');
    const content = document.getElementById('rm-inspector-content');
    if (!empty || !content) return;
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    content.innerHTML = '';
  }

  /** Build HTML for provenance metadata (used by node and edge inspectors) */
  function _renderProvenance(prov) {
    if (!prov) return '';
    const rows = [];
    if (prov.origin_type)     rows.push({ k: 'Origin', v: PROVENANCE.origin_type[prov.origin_type]     || prov.origin_type });
    if (prov.evidence_mode)   rows.push({ k: 'Evidence', v: PROVENANCE.evidence_mode[prov.evidence_mode] || prov.evidence_mode });
    if (prov.confidence_band) rows.push({ k: 'Confidence', v: PROVENANCE.confidence_band[prov.confidence_band] || prov.confidence_band });
    if (prov.temporal_scope)  rows.push({ k: 'Scope', v: PROVENANCE.temporal_scope[prov.temporal_scope]   || prov.temporal_scope });
    if (prov.scenario_state && prov.scenario_state !== 'live') rows.push({ k: 'State', v: PROVENANCE.scenario_state[prov.scenario_state] || prov.scenario_state });
    if (!rows.length) return '';
    return `
      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Evidence origin</div>
        <div class="rm-insp-meta">
          ${rows.map(r => `<div class="rm-insp-meta-row">
            <span class="rm-insp-meta-key">${_esc(r.k)}</span>
            <span class="rm-insp-meta-val">${_esc(r.v)}</span>
          </div>`).join('')}
        </div>
      </div>`;
  }

  function renderInspector(nodeId) {
    const node = _graphData?.nodes.find(n => n.id === nodeId);
    if (!node) { showInspectorEmpty(); return; }

    const def = NODE_DEFS[node.type] || { label: 'Node', fill: '#94a3b8' };
    const connEdges = (_graphData?.edges || []).filter(e => e.from === nodeId || e.to === nodeId);
    const connNodes = connEdges.map(e => {
      const otherId = e.from === nodeId ? e.to : e.from;
      const other   = _graphData.nodes.find(n => n.id === otherId);
      const dir     = e.from === nodeId ? '\u2192' : '\u2190';
      const edgeDef = EDGE_DEFS[e.type] || EDGE_DEFS.linked_to;
      return { node: other, edge: e, dir, edgeDef };
    }).filter(c => c.node);

    const strength = node.evidenceStrength || 0;
    const barColor = strength >= 0.75 ? '#10b981'
                   : strength >= 0.4  ? '#f59e0b'
                   : '#ef4444';

    const sourceKey  = node.source || 'inferred';
    const sourceText = SOURCE_LABELS[sourceKey] || sourceKey;
    const context    = NODE_CONTEXT[node.type] || '';

    const connHTML = connNodes.map(c => {
      const cDef = NODE_DEFS[c.node.type] || { fill: '#94a3b8', label: c.node.type };
      return `
        <div class="rm-insp-connection" role="button" tabindex="0"
             data-node-id="${_esc(c.node.id)}"
             aria-label="Go to ${_esc(c.node.label)}">
          <span class="rm-insp-conn-dot" style="background:${cDef.fill}"></span>
          <span class="rm-insp-conn-label">${_esc(_truncLabel(c.node.label, 22))}</span>
          <span class="rm-insp-conn-rel">${_esc(c.edgeDef.label)}</span>
          <span class="rm-insp-conn-arrow">${c.dir}</span>
        </div>`;
    }).join('');

    const metaHTML = Object.entries(node.metadata || {}).map(([k, v]) =>
      `<div class="rm-insp-meta-row">
         <span class="rm-insp-meta-key">${_esc(_camelToLabel(k))}</span>
         <span class="rm-insp-meta-val">${_esc(String(v))}</span>
       </div>`
    ).join('');

    const checksHTML = (node.checks || []).map(c =>
      `<div class="rm-insp-check">
         <span class="rm-insp-check-dot" aria-hidden="true"></span>
         <span>${_esc(c)}</span>
       </div>`
    ).join('');

    const empty   = document.getElementById('rm-inspector-empty');
    const content = document.getElementById('rm-inspector-content');
    if (!empty || !content) return;

    empty.classList.add('hidden');
    content.classList.remove('hidden');
    const inspPanel = document.getElementById('rm-inspector');
    if (inspPanel) inspPanel.scrollTop = 0;

    content.innerHTML = `
      <!-- Header -->
      <div class="rm-insp-header">
        <div class="rm-insp-header-top">
          <div class="rm-insp-type-badge"
               style="background:${def.fill}22; color:${def.fill}; border: 1px solid ${def.fill}44;">
            ${_esc(def.label)}
          </div>
          <span class="rm-source-badge ${sourceKey}">${_esc(sourceKey.toUpperCase())}</span>
        </div>
        <div class="rm-insp-title">${_esc(node.label)}</div>
      </div>

      <!-- What this is -->
      ${context ? `
      <div class="rm-insp-section rm-insp-context-section">
        <div class="rm-insp-context-text">${_esc(context)}</div>
      </div>` : ''}

      <!-- What Rolewise sees -->
      ${node.description ? `
      <div class="rm-insp-section">
        <div class="rm-insp-section-title">What Rolewise sees</div>
        <div class="rm-insp-why">${_esc(node.description)}</div>
      </div>` : ''}

      <!-- Evidence confidence -->
      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Evidence confidence</div>
        <div class="rm-evidence-bar-wrap">
          <div class="rm-evidence-bar-track" role="progressbar"
               aria-valuenow="${Math.round(strength * 100)}"
               aria-valuemin="0" aria-valuemax="100"
               aria-label="Evidence strength: ${Math.round(strength * 100)}%">
            <div class="rm-evidence-bar-fill"
                 style="width:${Math.round(strength * 100)}%; background:${barColor}"></div>
          </div>
          <span class="rm-evidence-bar-val">${Math.round(strength * 100)}%</span>
        </div>
        <div class="rm-insp-source" style="margin-top:6px;">
          <span class="rm-source-text">${_esc(sourceText)}</span>
        </div>
      </div>

      ${_renderProvenance(node.provenance)}

      ${connNodes.length ? `
      <!-- Connected -->
      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Connected (${connNodes.length})</div>
        <div class="rm-insp-connections" role="list">${connHTML}</div>
      </div>` : ''}

      ${metaHTML ? `
      <!-- Metadata -->
      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Details</div>
        <div class="rm-insp-meta">${metaHTML}</div>
      </div>` : ''}

      ${checksHTML ? `
      <!-- Next checks -->
      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Next checks</div>
        <div class="rm-insp-checks">${checksHTML}</div>
      </div>` : ''}

      ${node.type !== 'role' ? `
      <!-- Actions -->
      <div class="rm-insp-actions">
        <button class="rm-insp-action-btn" id="rm-btn-show-path">
          Show reasoning path \u2192
        </button>
      </div>` : ''}
    `;

    // Wire connection clicks
    content.querySelectorAll('.rm-insp-connection').forEach(el => {
      const handler = () => { selectNode(el.dataset.nodeId); };
      el.addEventListener('click', handler);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
    });

    // Wire reasoning path button
    const pathBtn = content.querySelector('#rm-btn-show-path');
    if (pathBtn) {
      pathBtn.addEventListener('click', () => {
        const result = findReasoningPath(nodeId);
        if (result) {
          activateReasoningPath(result);
        } else {
          const orig = pathBtn.textContent;
          pathBtn.textContent = 'No path found';
          pathBtn.disabled = true;
          setTimeout(() => { pathBtn.textContent = orig; pathBtn.disabled = false; }, 1500);
        }
      });
    }
  }

  function renderEdgeInspector(edgeId) {
    const edge = _graphData?.edges.find(e => e.id === edgeId);
    if (!edge) { showInspectorEmpty(); return; }

    const def       = EDGE_DEFS[edge.type] || EDGE_DEFS.linked_to;
    const fromNode  = _graphData.nodes.find(n => n.id === edge.from);
    const toNode    = _graphData.nodes.find(n => n.id === edge.to);
    const fromDef   = NODE_DEFS[fromNode?.type] || { fill: '#94a3b8', label: 'Node' };
    const toDef     = NODE_DEFS[toNode?.type]   || { fill: '#94a3b8', label: 'Node' };
    const strength  = edge.strength || 0.5;
    const barColor  = strength >= 0.75 ? '#10b981' : strength >= 0.4 ? '#f59e0b' : '#ef4444';

    const empty   = document.getElementById('rm-inspector-empty');
    const content = document.getElementById('rm-inspector-content');
    if (!empty || !content) return;
    empty.classList.add('hidden');
    content.classList.remove('hidden');

    content.innerHTML = `
      <div class="rm-insp-header">
        <div class="rm-insp-type-badge"
             style="background:${def.color}22; color:${def.color}; border:1px solid ${def.color}44;">
          Relationship
        </div>
        <div class="rm-insp-title">${_esc(def.label)}</div>
        <div class="rm-insp-subtitle" style="display:flex; align-items:center; gap:8px; margin-top:8px;">
          <span class="rm-insp-conn-dot" style="background:${fromDef.fill}"></span>
          <span>${_esc(_truncLabel(fromNode?.label || '?', 20))}</span>
          <span style="color:#94a3b8; font-size:11px;">\u2192</span>
          <span class="rm-insp-conn-dot" style="background:${toDef.fill}"></span>
          <span>${_esc(_truncLabel(toNode?.label  || '?', 20))}</span>
        </div>
      </div>

      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Evidence confidence</div>
        <div class="rm-evidence-bar-wrap">
          <div class="rm-evidence-bar-track" role="progressbar"
               aria-valuenow="${Math.round(strength * 100)}" aria-valuemin="0" aria-valuemax="100">
            <div class="rm-evidence-bar-fill"
                 style="width:${Math.round(strength * 100)}%; background:${barColor}"></div>
          </div>
          <span class="rm-evidence-bar-val">${Math.round(strength * 100)}%</span>
        </div>
      </div>

      ${edge.explanation ? `
      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Why this relationship exists</div>
        <div class="rm-insp-why">${_esc(edge.explanation)}</div>
      </div>` : ''}

      ${_renderProvenance(edge.provenance)}

      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Connected nodes</div>
        <div class="rm-insp-connections">
          ${fromNode ? `
          <div class="rm-insp-connection" role="button" tabindex="0"
               data-node-id="${_esc(fromNode.id)}">
            <span class="rm-insp-conn-dot" style="background:${fromDef.fill}"></span>
            <span class="rm-insp-conn-label">${_esc(_truncLabel(fromNode.label, 22))}</span>
            <span class="rm-insp-conn-rel">${_esc(fromDef.label)}</span>
            <span class="rm-insp-conn-arrow">source</span>
          </div>` : ''}
          ${toNode ? `
          <div class="rm-insp-connection" role="button" tabindex="0"
               data-node-id="${_esc(toNode.id)}">
            <span class="rm-insp-conn-dot" style="background:${toDef.fill}"></span>
            <span class="rm-insp-conn-label">${_esc(_truncLabel(toNode.label, 22))}</span>
            <span class="rm-insp-conn-rel">${_esc(toDef.label)}</span>
            <span class="rm-insp-conn-arrow">target</span>
          </div>` : ''}
        </div>
      </div>
    `;

    content.querySelectorAll('.rm-insp-connection').forEach(el => {
      const handler = () => { selectNode(el.dataset.nodeId); };
      el.addEventListener('click', handler);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
    });
  }

  /** Renders the reasoning path chain in the inspector */
  function renderPathInspector(result) {
    if (!result || !_graphData) return;

    const content = document.getElementById('rm-inspector-content');
    const empty   = document.getElementById('rm-inspector-empty');
    if (!content || !empty) return;
    empty.classList.add('hidden');
    content.classList.remove('hidden');

    const chainHTML = result.nodeIds.map((nid, i) => {
      const node = _graphData.nodes.find(n => n.id === nid);
      if (!node) return '';
      const def = NODE_DEFS[node.type] || { fill: '#94a3b8', label: node.type };
      const isLast = i === result.nodeIds.length - 1;
      return `
        <div class="rm-path-step">
          <div class="rm-insp-connection" role="button" tabindex="0" data-node-id="${_esc(nid)}">
            <span class="rm-insp-conn-dot" style="background:${def.fill}"></span>
            <span class="rm-insp-conn-label">${_esc(_truncLabel(node.label, 24))}</span>
            <span class="rm-insp-conn-rel">${_esc(def.label)}</span>
          </div>
          ${!isLast ? '<div class="rm-path-arrow" aria-hidden="true">\u2193</div>' : ''}
        </div>`;
    }).join('');

    content.innerHTML = `
      <div class="rm-insp-header">
        <div class="rm-insp-type-badge" style="background:#10b98122; color:#10b981; border:1px solid #10b98144;">
          Reasoning Path
        </div>
        <div class="rm-insp-title">Path to role</div>
        <div class="rm-insp-subtitle" style="margin-top:4px; color:var(--text-muted, #535862);">
          ${result.nodeIds.length} nodes \u00b7 ${result.edgeIds.length} edges
        </div>
      </div>

      <div class="rm-insp-section">
        <div class="rm-insp-section-title">Chain</div>
        <div class="rm-path-chain">${chainHTML}</div>
      </div>

      <div class="rm-insp-actions">
        <button class="rm-insp-action-btn" id="rm-btn-clear-path">Clear path</button>
      </div>
    `;

    content.querySelectorAll('.rm-insp-connection').forEach(el => {
      const handler = () => { selectNode(el.dataset.nodeId); };
      el.addEventListener('click', handler);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
    });

    content.querySelector('#rm-btn-clear-path')?.addEventListener('click', () => {
      clearReasoningPath();
      if (_state.selectedId) selectNode(_state.selectedId);
      else clearSelection();
    });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 10 — Search
  // ═══════════════════════════════════════════════════════════════════════════

  function performSearch(query) {
    _state.searchQuery = query.trim().toLowerCase();
    const resultsEl = document.getElementById('rm-search-results');
    const clearBtn  = document.getElementById('rm-search-clear');
    if (!resultsEl) return;

    if (!_state.searchQuery) {
      resultsEl.classList.add('hidden');
      if (clearBtn) clearBtn.classList.add('hidden');
      applyFilters();
      return;
    }

    if (clearBtn) clearBtn.classList.remove('hidden');

    const matches = (_graphData?.nodes || []).filter(n => {
      const q = _state.searchQuery;
      return (n.label       || '').toLowerCase().includes(q) ||
             (n.description || '').toLowerCase().includes(q) ||
             (n.type        || '').toLowerCase().includes(q) ||
             Object.values(n.metadata || {}).some(v =>
               String(v).toLowerCase().includes(q)
             );
    });

    resultsEl.innerHTML = '';
    resultsEl.classList.toggle('hidden', matches.length === 0 && _state.searchQuery !== '');

    if (matches.length === 0) {
      resultsEl.innerHTML = `<div class="rm-search-empty">No nodes match \u201c${_esc(query)}\u201d</div>`;
      resultsEl.classList.remove('hidden');
      return;
    }

    matches.slice(0, 12).forEach(n => {
      const def = NODE_DEFS[n.type] || { fill: '#94a3b8', label: n.type };
      const item = document.createElement('div');
      item.className  = 'rm-search-result-item';
      item.dataset.id = n.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-label', `${def.label}: ${n.label}`);
      item.innerHTML  = `
        <span class="rm-search-result-dot" style="background:${def.fill}"></span>
        <span class="rm-search-result-label">${_esc(_truncLabel(n.label, 24))}</span>
        <span class="rm-search-result-type">${_esc(def.label)}</span>`;
      item.addEventListener('click', () => {
        selectNode(n.id);
        resultsEl.classList.add('hidden');
        const input = document.getElementById('rm-search');
        if (input) { input.value = n.label; }
      });
      resultsEl.appendChild(item);
    });

    if (matches.length > 12) {
      const more = document.createElement('div');
      more.className = 'rm-search-empty';
      more.textContent = `+${matches.length - 12} more results`;
      resultsEl.appendChild(more);
    }

    resultsEl.classList.remove('hidden');

    const matchIds = new Set(matches.map(n => n.id));
    document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
      g.classList.remove('rm-node--dimmed', 'rm-node--connected', 'rm-node--selected');
      if (!matchIds.has(g.dataset.id)) g.classList.add('rm-node--dimmed');
    });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 11 — Filters & focus modes
  // ═══════════════════════════════════════════════════════════════════════════

  function applyFilters() {
    if (!_graphData) return;
    const { hiddenTypes, focusMode, strengthFilter, signalFilter } = _state;
    const visibleNodeIds = new Set();

    _graphData.nodes.forEach(n => {
      if (hiddenTypes.has(n.type)) return;
      const src = n.source || 'inferred';
      if (!signalFilter.has(src)) return;
      const s = n.evidenceStrength || 0;
      if (strengthFilter === 'strong'  && s < 0.7) return;
      if (strengthFilter === 'medium'  && (s < 0.35 || s >= 0.7)) return;
      if (strengthFilter === 'weak'    && s >= 0.35) return;
      if (focusMode === 'strong-only' && s < 0.7) return;
      if (focusMode === 'blockers'  && n.type !== 'blocker'  && n.type !== 'role') return;
      if (focusMode === 'outcomes'  && n.type !== 'outcome'  && n.type !== 'role' && n.type !== 'similar_role') return;
      if (focusMode === 'signals'   && n.type !== 'career_signal' && n.type !== 'market_signal' && n.type !== 'role') return;
      if (focusMode === 'selected-path' && _state.selectedId) {
        const connEdges = _graphData.edges.filter(e => e.from === _state.selectedId || e.to === _state.selectedId);
        const connIds   = new Set([_state.selectedId, ...connEdges.flatMap(e => [e.from, e.to])]);
        if (!connIds.has(n.id)) return;
      }
      visibleNodeIds.add(n.id);
    });

    document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
      g.classList.toggle('rm-node--hidden', !visibleNodeIds.has(g.dataset.id));
    });
    document.querySelectorAll('#rm-edges-g .rm-edge').forEach(g => {
      const visible = visibleNodeIds.has(g.dataset.from) && visibleNodeIds.has(g.dataset.to);
      g.classList.toggle('rm-edge--hidden', !visible);
    });

    const statsEl = document.getElementById('rm-stats');
    if (statsEl) {
      const vCount = visibleNodeIds.size;
      const eCount = document.querySelectorAll('#rm-edges-g .rm-edge:not(.rm-edge--hidden)').length;
      statsEl.textContent = `${vCount} nodes \u00b7 ${eCount} edges` +
        (vCount < _graphData.nodes.length ? ` (${_graphData.nodes.length - vCount} filtered)` : '');
    }
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 12 — Keyboard navigation
  // ═══════════════════════════════════════════════════════════════════════════

  function initKeyboardNav(overlayEl) {
    overlayEl.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') { e.target.blur(); return; }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          if (_guidedStep >= 0) { exitGuidedMode(); return; }
          closeReasoningMap();
          break;

        case 'f': case 'F':
          e.preventDefault();
          fitToView(true);
          break;

        case 'r': case 'R':
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); resetGraph(); }
          break;

        case '/':
          e.preventDefault();
          document.getElementById('rm-search')?.focus();
          break;

        case 'Tab': {
          const visibleNodes = Array.from(
            document.querySelectorAll('#rm-nodes-g .rm-node:not(.rm-node--hidden)')
          );
          if (!visibleNodes.length) return;
          e.preventDefault();
          _focusedNodeIdx = e.shiftKey
            ? (_focusedNodeIdx - 1 + visibleNodes.length) % visibleNodes.length
            : (_focusedNodeIdx + 1) % visibleNodes.length;
          const target = visibleNodes[_focusedNodeIdx];
          if (target) {
            target.focus();
            centreOnNode(target.dataset.id);
          }
          break;
        }

        case 'Enter': case ' ': {
          const focused = document.activeElement;
          if (focused?.classList.contains('rm-node')) {
            e.preventDefault();
            selectNode(focused.dataset.id);
          }
          break;
        }

        case '+': case '=':
          e.preventDefault(); zoomBy(1.2); break;
        case '-': case '_':
          e.preventDefault(); zoomBy(0.83); break;

        case 'ArrowRight': case 'ArrowLeft': case 'ArrowUp': case 'ArrowDown': {
          if (!_state.selectedId || !_graphData) return;
          e.preventDefault();
          const connEdges = _graphData.edges.filter(
            ed => ed.from === _state.selectedId || ed.to === _state.selectedId
          );
          if (!connEdges.length) return;
          const connIds = connEdges.map(ed =>
            ed.from === _state.selectedId ? ed.to : ed.from
          );
          const nextId = connIds[(connIds.indexOf(_state.selectedId) + 1) % connIds.length];
          selectNode(nextId);
          break;
        }
      }
    });

    document.getElementById('rm-nodes-g')?.addEventListener('keydown', e => {
      const nodeG = e.target.closest('.rm-node');
      if (!nodeG) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectNode(nodeG.dataset.id);
      }
    });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 12b — Guided mode
  // ═══════════════════════════════════════════════════════════════════════════

  function startGuidedMode() {
    _guidedSteps = buildGuidedSteps();
    if (!_guidedSteps.length) return;          // nothing to walk
    _guidedStep = 0;
    renderGuidedStep();
    const panel = document.getElementById('rm-guided-panel');
    if (panel) panel.classList.remove('hidden');
  }

  function stepGuided(dir) {
    _guidedStep += dir;
    if (_guidedStep < 0) _guidedStep = 0;
    if (_guidedStep >= _guidedSteps.length) {
      exitGuidedMode();
      return;
    }
    renderGuidedStep();
  }

  function renderGuidedStep() {
    const step = _guidedSteps[_guidedStep];
    if (!step) return;

    const countEl = document.getElementById('rm-guided-count');
    const titleEl = document.getElementById('rm-guided-title');
    const descEl  = document.getElementById('rm-guided-desc');
    const prevBtn = document.getElementById('rm-guided-prev');
    const nextBtn = document.getElementById('rm-guided-next');

    if (countEl) countEl.textContent = `Step ${_guidedStep + 1} of ${_guidedSteps.length}`;
    if (titleEl) titleEl.textContent = step.title;
    if (descEl)  descEl.textContent  = step.description;
    if (prevBtn) prevBtn.disabled    = _guidedStep === 0;
    if (nextBtn) nextBtn.textContent = _guidedStep === _guidedSteps.length - 1 ? 'Finish' : 'Next \u2192';

    // Select + centre the guided node
    selectNode(step.nodeId);
  }

  function exitGuidedMode() {
    _guidedStep = -1;
    const panel = document.getElementById('rm-guided-panel');
    if (panel) panel.classList.add('hidden');
    clearSelection();
    fitToView(true);
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 13 — Event wiring
  // ═══════════════════════════════════════════════════════════════════════════

  function wireEvents(overlayEl) {
    // Back / close
    overlayEl.querySelector('#rm-btn-back')?.addEventListener('click', closeReasoningMap);

    // Top bar controls
    overlayEl.querySelector('#rm-btn-fit')?.addEventListener('click', () => fitToView(true));
    overlayEl.querySelector('#rm-btn-reset')?.addEventListener('click', resetGraph);

    // Tour button
    overlayEl.querySelector('#rm-btn-tour')?.addEventListener('click', startGuidedMode);

    // Edge labels toggle
    overlayEl.querySelector('#rm-btn-edge-labels')?.addEventListener('click', function () {
      _state.showEdgeLabels = !_state.showEdgeLabels;
      this.classList.toggle('rm-ctrl-active', _state.showEdgeLabels);
      this.setAttribute('aria-pressed', _state.showEdgeLabels);
      document.querySelectorAll('.rm-edge-label').forEach(el => {
        el.style.opacity = _state.showEdgeLabels ? '1' : '';
      });
    });

    // Sidebar controls
    overlayEl.querySelector('#rm-btn-sidebar-fit')?.addEventListener('click', () => fitToView(true));
    overlayEl.querySelector('#rm-btn-centre-selected')?.addEventListener('click', () => {
      if (_state.selectedId) centreOnNode(_state.selectedId);
    });
    overlayEl.querySelector('#rm-btn-clear-selection')?.addEventListener('click', clearSelection);

    // Zoom buttons
    overlayEl.querySelector('#rm-btn-zoom-in')?.addEventListener('click', () => zoomBy(1.25));
    overlayEl.querySelector('#rm-btn-zoom-out')?.addEventListener('click', () => zoomBy(0.8));
    overlayEl.querySelector('#rm-btn-zoom-fit-canvas')?.addEventListener('click', () => fitToView(true));

    // Search
    const searchInput = overlayEl.querySelector('#rm-search');
    searchInput?.addEventListener('input', () => performSearch(searchInput.value));
    searchInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        performSearch('');
        searchInput.blur();
      }
    });
    overlayEl.querySelector('#rm-search-clear')?.addEventListener('click', () => {
      if (searchInput) { searchInput.value = ''; performSearch(''); }
    });

    // Focus mode pills
    overlayEl.querySelectorAll('.rm-focus-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        overlayEl.querySelectorAll('.rm-focus-pill').forEach(b => {
          b.classList.remove('rm-pill-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('rm-pill-active');
        btn.setAttribute('aria-pressed', 'true');
        _state.focusMode = btn.dataset.focus;
        applyFilters();
      });
    });

    // Node type toggles
    overlayEl.querySelectorAll('.rm-type-check').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) _state.hiddenTypes.delete(cb.dataset.type);
        else            _state.hiddenTypes.add(cb.dataset.type);
        applyFilters();
      });
    });

    // Strength filter
    overlayEl.querySelectorAll('.rm-strength-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlayEl.querySelectorAll('.rm-strength-btn').forEach(b => b.classList.remove('rm-strength-active'));
        btn.classList.add('rm-strength-active');
        _state.strengthFilter = btn.dataset.strength;
        applyFilters();
      });
    });

    // Signal origin filter
    overlayEl.querySelectorAll('.rm-signal-check').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) _state.signalFilter.add(cb.dataset.signal);
        else            _state.signalFilter.delete(cb.dataset.signal);
        applyFilters();
      });
    });

    // Canvas click delegation
    const svg = overlayEl.querySelector('#rm-svg');
    svg?.addEventListener('click', e => {
      const nodeG = e.target.closest('.rm-node');
      const edgeG = e.target.closest('.rm-edge');
      if (nodeG && !nodeG.classList.contains('rm-node--hidden')) {
        selectNode(nodeG.dataset.id);
        return;
      }
      if (edgeG && !edgeG.classList.contains('rm-edge--hidden')) {
        selectEdge(edgeG.dataset.id);
        return;
      }
      if (e.target === svg || e.target.classList.contains('rm-canvas-bg')) {
        clearSelection();
      }
    });

    // Node hover
    const nodesG = overlayEl.querySelector('#rm-nodes-g');
    nodesG?.addEventListener('mouseover', e => {
      const nodeG = e.target.closest('.rm-node');
      if (!nodeG || _state.selectedId) return;
      const id = nodeG.dataset.id;
      const connEdges = (_graphData?.edges || []).filter(ed => ed.from === id || ed.to === id);
      const connIds   = new Set([id, ...connEdges.flatMap(ed => [ed.from, ed.to])]);
      document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
        g.classList.toggle('rm-node--dimmed', !connIds.has(g.dataset.id));
      });
    });
    nodesG?.addEventListener('mouseout', e => {
      const nodeG = e.target.closest('.rm-node');
      if (!nodeG || _state.selectedId) return;
      document.querySelectorAll('#rm-nodes-g .rm-node').forEach(g => {
        g.classList.remove('rm-node--dimmed');
      });
    });

    // Double-click centre
    svg?.addEventListener('dblclick', e => {
      const nodeG = e.target.closest('.rm-node');
      if (nodeG) centreOnNode(nodeG.dataset.id);
    });

    // Error state retry button
    overlayEl.querySelector('#rm-btn-error-retry')?.addEventListener('click', () => initGraph(_currentRole));

    // Guided mode buttons
    overlayEl.querySelector('#rm-guided-next')?.addEventListener('click', () => stepGuided(1));
    overlayEl.querySelector('#rm-guided-prev')?.addEventListener('click', () => stepGuided(-1));
    overlayEl.querySelector('#rm-guided-close')?.addEventListener('click', exitGuidedMode);

    // Keyboard
    initKeyboardNav(overlayEl);
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 14 — Graph init & lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  function showLoading()  { document.getElementById('rm-loading')?.classList.remove('hidden'); }
  function hideLoading()  { document.getElementById('rm-loading')?.classList.add('hidden'); }
  function showEmpty(title, desc) {
    const el = document.getElementById('rm-canvas-empty');
    if (el) {
      el.classList.remove('hidden');
      const t = document.getElementById('rm-empty-title');
      const d = document.getElementById('rm-empty-desc');
      if (t && title) t.textContent = title;
      if (d && desc)  d.textContent = desc;
    }
    hideLoading();
  }
  function showError(msg) {
    const el = document.getElementById('rm-canvas-error');
    if (el) {
      el.classList.remove('hidden');
      const d = document.getElementById('rm-error-desc');
      if (d && msg) d.textContent = msg;
    }
    hideLoading();
  }
  function hideStates() {
    document.getElementById('rm-canvas-empty')?.classList.add('hidden');
    document.getElementById('rm-canvas-error')?.classList.add('hidden');
  }

  // (Removed: loadSampleData — dead code, was duplicate of initGraph with misleading name)

  function initGraph(role) {
    hideStates();
    showLoading();
    _graphData = null;

    setTimeout(() => {
      try {
        _graphData = resolveGraphData(role);
        if (!_graphData) {
          hideLoading();
          showEmpty('Reasoning Map unavailable', 'Reasoning Map unavailable for this role. No analysis data found.');
          return;
        }
        computeLayout(_graphData.nodes, _graphData.edges);
        renderGraph();
        hideLoading();
        setTimeout(() => fitToView(true), 60);
        setTimeout(() => selectNode('role'), 120);
        const statsEl = document.getElementById('rm-stats');
        if (statsEl) statsEl.textContent = `${_graphData.nodes.length} nodes \u00b7 ${_graphData.edges.length} edges`;
      } catch (err) {
        console.error('[ReasoningMap] Error initialising graph:', err);
        hideLoading();
        showError('Something went wrong building the reasoning graph.');
      }
    }, 300);
  }

  function resetGraph() {
    clearSelection();
    exitGuidedMode();
    _state.focusMode      = 'all';
    _state.hiddenTypes    = new Set();
    _state.strengthFilter = 'all';
    _state.signalFilter   = new Set(['direct', 'inferred', 'learned', 'missing']);
    _state.showEdgeLabels = false;

    const overlay = document.getElementById('rm-overlay');
    if (overlay) {
      overlay.querySelectorAll('.rm-type-check').forEach(cb => { cb.checked = true; });
      overlay.querySelectorAll('.rm-signal-check').forEach(cb => { cb.checked = true; });
      overlay.querySelectorAll('.rm-strength-btn').forEach(b => {
        b.classList.toggle('rm-strength-active', b.dataset.strength === 'all');
      });
      overlay.querySelectorAll('.rm-focus-pill').forEach(p => {
        p.classList.toggle('rm-pill-active', p.dataset.focus === 'all');
      });
      const edgeLabelsCtrl = document.getElementById('rm-btn-edge-labels');
      if (edgeLabelsCtrl) { edgeLabelsCtrl.classList.remove('rm-ctrl-active'); edgeLabelsCtrl.setAttribute('aria-pressed', 'false'); }
      document.querySelectorAll('.rm-edge-label').forEach(el => { el.style.opacity = ''; });
      const searchInput = document.getElementById('rm-search');
      if (searchInput) { searchInput.value = ''; }
      const resultsEl = document.getElementById('rm-search-results');
      if (resultsEl) resultsEl.classList.add('hidden');
    }

    applyFilters();
    fitToView(true);
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 15 — Entry & exit (public API)
  // ═══════════════════════════════════════════════════════════════════════════

  function openReasoningMap(role) {
    if (document.getElementById('rm-overlay')) return;

    if (!role || !role.id) {
      console.warn('[ReasoningMap] openReasoningMap called without a valid role object.');
      return;
    }

    _currentRole = role;

    _state = {
      selectedId:       null,
      selectedKind:     null,
      hoveredId:        null,
      transform:        { x: 0, y: 0, k: 1 },
      hiddenTypes:      new Set(),
      focusMode:        'all',
      strengthFilter:   'all',
      signalFilter:     new Set(['direct', 'inferred', 'learned', 'missing']),
      showEdgeLabels:   false,
      searchQuery:      '',
      reasoningPath:    null,
    };
    _focusedNodeIdx = -1;
    _isPanning      = false;
    _guidedStep     = -1;

    _graphData = resolveGraphData(role);

    if (!_graphData) {
      console.warn('[ReasoningMap] No analysis data available for role:', role.id);
      // Still build the overlay so user sees the empty state
      const wrapper = document.createElement('div');
      wrapper.innerHTML = buildOverlayHTML(role).trim();
      _overlayEl = wrapper.firstElementChild;
      document.body.appendChild(_overlayEl);
      trapFocus(_overlayEl);
      wireEvents(_overlayEl);
      requestAnimationFrame(() => {
        hideLoading();
        showEmpty('Reasoning Map unavailable', 'Reasoning Map unavailable for this role. No analysis data found.');
        const tourBtn = document.getElementById('rm-btn-tour');
        if (tourBtn) tourBtn.disabled = true;
      });
      setTimeout(() => { document.getElementById('rm-btn-back')?.focus(); }, 80);
      return;
    }

    computeLayout(_graphData.nodes, _graphData.edges);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildOverlayHTML(role).trim();
    _overlayEl = wrapper.firstElementChild;
    document.body.appendChild(_overlayEl);

    trapFocus(_overlayEl);

    _svgEl   = document.getElementById('rm-svg');
    _canvasG = document.getElementById('rm-canvas-g');

    wireEvents(_overlayEl);
    initPanZoom(_svgEl);

    requestAnimationFrame(() => {
      hideLoading();
      renderGraph();
      const tourBtn = document.getElementById('rm-btn-tour');
      if (tourBtn) tourBtn.disabled = false;
      setTimeout(() => {
        fitToView(false);
        selectNode('role');
        const statsEl = document.getElementById('rm-stats');
        if (statsEl) {
          statsEl.textContent = `${_graphData.nodes.length} nodes \u00b7 ${_graphData.edges.length} edges`;
        }
      }, 60);
    });

    setTimeout(() => {
      document.getElementById('rm-btn-back')?.focus();
    }, 80);
  }

  function closeReasoningMap() {
    const overlay = document.getElementById('rm-overlay');
    if (!overlay) return;

    exitGuidedMode();

    if (!_prefersReducedMotion()) {
      overlay.style.transition = 'opacity 0.14s ease';
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); _cleanupTrapFocus(); }, 160);
    } else {
      overlay.remove();
      _cleanupTrapFocus();
    }

    setTimeout(() => {
      const btn = document.getElementById('rh-btn-reasoning-map');
      if (btn) btn.focus();
    }, 200);

    _overlayEl  = null;
    _svgEl      = null;
    _canvasG    = null;
    _graphData  = null;
    _isPanning  = false;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 16 — Accessibility helpers
  // ═══════════════════════════════════════════════════════════════════════════

  let _focusTrapCleanup = null;

  function trapFocus(el) {
    const focusableSelectors = [
      'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
      'textarea:not([disabled])', 'a[href]', '[tabindex]:not([tabindex="-1"])',
      '.rm-node[tabindex="0"]',
    ].join(', ');

    const handler = e => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(el.querySelectorAll(focusableSelectors))
        .filter(f => !f.closest('.rm-node--hidden') && !f.closest('.rm-edge--hidden'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };

    el.addEventListener('keydown', handler);
    _focusTrapCleanup = () => el.removeEventListener('keydown', handler);
  }

  function _cleanupTrapFocus() {
    if (_focusTrapCleanup) { _focusTrapCleanup(); _focusTrapCleanup = null; }
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 17 — Utilities
  // ═══════════════════════════════════════════════════════════════════════════

  function _esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  function _truncLabel(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
  }

  function _camelToLabel(str) {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }

  function _prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 18 — Public export
  // ═══════════════════════════════════════════════════════════════════════════

  window.openReasoningMap  = openReasoningMap;
  window.closeReasoningMap = closeReasoningMap;

})();
