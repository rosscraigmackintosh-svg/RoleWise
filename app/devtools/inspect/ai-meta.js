/**
 * ai-meta.js — RoleWise Dev Inspect Helper
 *
 * Attaches structured data attributes to inspectable UI nodes so the
 * RW Inspect system can identify, highlight, and capture them.
 *
 * DEV ONLY. In production (non-localhost), all calls return an empty string
 * or are no-ops, ensuring zero leakage into shipped HTML.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────
 *
 * 1. Inside template literals (innerHTML):
 *
 *    html += `<div class="rw-card" ${aiMeta({ nodeId: 'fit-assessment',
 *               component: 'FitAssessmentCard', slot: 'overview', label: 'Fit Assessment' })}>`;
 *
 *    In dev:   → data-node-id="fit-assessment" data-component="FitAssessmentCard" …
 *    In prod:  → (empty string, no attributes added)
 *
 * 2. On elements created with document.createElement():
 *
 *    const el = document.createElement('div');
 *    aiMeta(el, { nodeId: 'role-header', component: 'RoleHeader', slot: 'header', label: 'Role Header' });
 *
 *    In dev:   → sets el.dataset.nodeId, el.dataset.component, etc.
 *    In prod:  → no-op
 *
 * ─── Parameters ──────────────────────────────────────────────────────────
 *   nodeId    — stable semantic identifier (kebab-case); drives data-node-id
 *   component — logical component name (PascalCase); drives data-component
 *   slot      — sub-region within the component; drives data-slot
 *   label     — human-readable description shown in the inspect pill; drives data-ai-label
 */

(function () {
  'use strict';

  // ── Dev guard ────────────────────────────────────────────────────────────
  // Treat localhost, 127.0.0.1, and file:// (empty hostname) as dev.
  // Everything else (staging domains, production) is treated as non-dev.
  var _h = typeof window !== 'undefined' ? window.location.hostname : '';
  var _isDev = _h === 'localhost' || _h === '127.0.0.1' || _h === '';

  /**
   * aiMeta — dual-mode helper.
   *
   * Called with (options)         → returns attribute string for template literals.
   * Called with (element, options) → mutates element.dataset, returns undefined.
   *
   * In non-dev, always returns '' (string form) or undefined (element form).
   */
  function aiMeta(elementOrOptions, options) {
    // ── Element form: aiMeta(el, { ... }) ──────────────────────────────
    if (
      elementOrOptions &&
      typeof elementOrOptions === 'object' &&
      elementOrOptions.nodeType === 1
    ) {
      if (!_isDev) return;
      var el  = elementOrOptions;
      var opt = options || {};
      if (opt.nodeId)    el.dataset.nodeId    = opt.nodeId;
      if (opt.component) el.dataset.component = opt.component;
      if (opt.slot)      el.dataset.slot      = opt.slot;
      if (opt.label)     el.dataset.aiLabel   = opt.label;
      return;
    }

    // ── String form: aiMeta({ ... }) ────────────────────────────────────
    if (!_isDev) return '';
    var o = elementOrOptions || {};
    var parts = [];
    if (o.nodeId)    parts.push('data-node-id="'    + o.nodeId    + '"');
    if (o.component) parts.push('data-component="'  + o.component + '"');
    if (o.slot)      parts.push('data-slot="'       + o.slot      + '"');
    if (o.label)     parts.push('data-ai-label="'   + o.label     + '"');
    return parts.join(' ');
  }

  // Expose globally so app.js and any render function can call it.
  window.aiMeta = aiMeta;

  // Expose dev flag so inspect-mode.js can share the same check.
  window._RW_IS_DEV = _isDev;

})();
