/**
 * inspect-mode.js — RoleWise AI Inspect Mode
 *
 * DEV ONLY — exits immediately on any non-localhost host.
 * Safe to include unconditionally in index.html (dev comment marks it for removal).
 *
 * ─── What it does ────────────────────────────────────────────────────────
 *  • Hover  → outlines the nearest [data-node-id] ancestor
 *  • Click  → captures a structured payload and stores it in:
 *             - window.__RW_SELECTED_NODE__
 *             - console (pretty JSON)
 *  • Pill   → fixed bottom-left status indicator showing current selection
 *  • Toggle → Alt+Shift+I keyboard shortcut  |  Escape to exit
 *
 * ─── Public API ──────────────────────────────────────────────────────────
 *  window.RW_INSPECT.enable()   — turn on
 *  window.RW_INSPECT.disable()  — turn off
 *  window.RW_INSPECT.toggle()   — flip state
 *  window.RW_INSPECT.isActive() — returns boolean
 *
 * ─── Selection Payload ───────────────────────────────────────────────────
 *  {
 *    url        : '/app',
 *    tagName    : 'div',
 *    nodeId     : 'role-header',
 *    component  : 'RoleHeader',
 *    slot       : 'header',
 *    label      : 'Role Header',
 *    text       : 'ACME CORP Senior PM …',
 *    selector   : '#col-role-header',
 *    boundingBox: { top, left, width, height }
 *  }
 */

(function () {
  'use strict';

  // ── Dev guard ─────────────────────────────────────────────────────────
  // Re-use the flag set by ai-meta.js, or compute it directly.
  var _h     = typeof window !== 'undefined' ? window.location.hostname : '';
  var _isDev = (typeof window._RW_IS_DEV !== 'undefined')
    ? window._RW_IS_DEV
    : (_h === 'localhost' || _h === '127.0.0.1' || _h === '');

  if (!_isDev) return; // Zero cost in production — entire IIFE exits here.

  // ── Module state ──────────────────────────────────────────────────────
  var _active        = false;
  var _hoveredEl     = null;  // currently-highlighted DOM node
  var _highlightEl   = null;  // the floating outline overlay
  var _pillEl        = null;  // the status pill
  var _panelEl       = null;  // the selection detail panel
  var _bannerEl      = null;  // top-of-page mode banner
  var _selectedEl    = null;  // element carrying the locked red selection outline
  var _toggleBtnEl   = null;  // persistent bottom-right toggle button
  var _hoverLabelEl  = null;  // floating label badge that names the hovered node
  var _frameId       = null;  // rAF handle for highlight positioning

  // ── Overlay / Pill creation ───────────────────────────────────────────

  function _createHighlight() {
    var el = document.createElement('div');
    el.id = '__rw_inspect_highlight__';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    return el;
  }

  function _createPill() {
    var el = document.createElement('div');
    el.id = '__rw_inspect_pill__';
    el.innerHTML =
      '<span class="rw-ip-badge">INSPECT</span>' +
      '<span class="rw-ip-node">No selection</span>' +
      '<button class="rw-ip-close" title="Exit inspect mode (Esc)">&#x2715;</button>';
    document.body.appendChild(el);
    el.querySelector('.rw-ip-close').addEventListener('click', function () {
      disable();
    });
    return el;
  }

  /**
   * Build a Claude-ready prompt block from the selected node payload.
   * Includes route, all inspect metadata, and a blank "Requested change:" line.
   */
  function _buildClaudePrompt(payload) {
    if (!payload) return '';
    var col = 12; // label column width
    var pad = function (s) {
      s = String(s);
      while (s.length < col) s += ' ';
      return s;
    };
    return [
      'I\'m working on the RoleWise app. Here is the UI element I\'m inspecting:',
      '',
      pad('Route:')     + (payload.url       || '—'),
      pad('Node ID:')   + (payload.nodeId    || '—'),
      pad('Component:') + (payload.component || '—'),
      pad('Slot:')      + (payload.slot      || '—'),
      pad('Label:')     + (payload.label     || '—'),
      pad('Selector:')  + (payload.selector  || '—'),
      pad('Text:')      + (payload.text      || '—'),
      '',
      'Requested change: ',
    ].join('\n');
  }

  /**
   * Shared clipboard helper used by both copy buttons.
   * Writes `text`, then flashes `btn` with "Copied!" for 1.5 s.
   */
  function _doCopy(text, btn, resetLabel) {
    var _flash = function () {
      btn.textContent = 'Copied!';
      btn.classList.add('rw-isp-btn--copied');
      setTimeout(function () {
        btn.textContent = resetLabel;
        btn.classList.remove('rw-isp-btn--copied');
      }, 1500);
    };
    try {
      navigator.clipboard.writeText(text).then(_flash);
    } catch (err) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      _flash();
    }
  }

  function _createPanel() {
    var el = document.createElement('div');
    el.id = '__rw_inspect_panel__';
    el.setAttribute('data-rw-devtool', 'true');
    el.setAttribute('aria-label', 'RW Inspect — selected node');
    el.innerHTML =
      // ── Header: title + lightweight control buttons ──────────────────
      '<div class="rw-isp-header">' +
        '<span class="rw-isp-title">Selection</span>' +
        '<div class="rw-isp-actions">' +
          '<button class="rw-isp-btn rw-isp-btn--clear" title="Clear selection">Clear Selection</button>' +
          '<button class="rw-isp-btn rw-isp-btn--disable" title="Exit inspect mode">Exit Inspect</button>' +
        '</div>' +
      '</div>' +
      // ── Copy strip: full-width row of copy actions ───────────────────
      '<div class="rw-isp-copy-strip">' +
        '<button class="rw-isp-btn rw-isp-btn--copy" title="Copy selected node as pretty JSON">Copy JSON</button>' +
        '<button class="rw-isp-btn rw-isp-btn--prompt" title="Copy a Claude-ready prompt for this node">Copy Claude Prompt</button>' +
      '</div>' +
      // ── Fields: route + all inspect metadata ─────────────────────────
      '<dl class="rw-isp-fields">' +
        '<div class="rw-isp-row"><dt class="rw-isp-key">route</dt><dd class="rw-isp-val" data-field="url">—</dd></div>' +
        '<div class="rw-isp-row"><dt class="rw-isp-key">nodeId</dt><dd class="rw-isp-val" data-field="nodeId">—</dd></div>' +
        '<div class="rw-isp-row"><dt class="rw-isp-key">component</dt><dd class="rw-isp-val" data-field="component">—</dd></div>' +
        '<div class="rw-isp-row"><dt class="rw-isp-key">slot</dt><dd class="rw-isp-val" data-field="slot">—</dd></div>' +
        '<div class="rw-isp-row"><dt class="rw-isp-key">label</dt><dd class="rw-isp-val" data-field="label">—</dd></div>' +
        '<div class="rw-isp-row"><dt class="rw-isp-key">selector</dt><dd class="rw-isp-val" data-field="selector">—</dd></div>' +
        '<div class="rw-isp-row"><dt class="rw-isp-key">text</dt><dd class="rw-isp-val rw-isp-val--text" data-field="text">—</dd></div>' +
      '</dl>';

    document.body.appendChild(el);

    // ── Button handlers ──────────────────────────────────────────────

    el.querySelector('.rw-isp-btn--copy').addEventListener('click', function () {
      var payload = window.__RW_SELECTED_NODE__;
      if (!payload) return;
      _doCopy(JSON.stringify(payload, null, 2), this, 'Copy JSON');
    });

    el.querySelector('.rw-isp-btn--prompt').addEventListener('click', function () {
      var payload = window.__RW_SELECTED_NODE__;
      if (!payload) return;
      _doCopy(_buildClaudePrompt(payload), this, 'Copy Claude Prompt');
    });

    el.querySelector('.rw-isp-btn--clear').addEventListener('click', function () {
      _clearSelection();
    });

    el.querySelector('.rw-isp-btn--disable').addEventListener('click', function () {
      disable();
    });

    return el;
  }

  function _createBanner() {
    var el = document.createElement('div');
    el.id = '__rw_inspect_banner__';
    el.textContent = 'INSPECT MODE — Click an element';
    document.body.appendChild(el);
    return el;
  }

  /**
   * Hover label — small floating badge that names the inspectable node currently
   * under the cursor. Shows: data-ai-label > data-component > data-node-id.
   * pointer-events: none so it never interferes with clicks.
   * data-rw-devtool so it is invisible to the inspect targeting system.
   */
  function _createHoverLabel() {
    var el = document.createElement('div');
    el.id = '__rw_inspect_hover_label__';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('data-rw-devtool', 'true');
    document.body.appendChild(el);
    return el;
  }

  /** Position and show the hover label next to the given inspectable element. */
  function _updateHoverLabel(target) {
    if (!_hoverLabelEl || !target) return;

    // Resolve display text in priority order
    var text = (target.dataset.aiLabel) ||
               (target.dataset.component) ||
               (target.dataset.nodeId) || '';
    if (!text) { _hideHoverLabel(); return; }

    _hoverLabelEl.textContent = text;

    var rect = target.getBoundingClientRect();

    // Default: just above the top-left corner of the element
    var top  = rect.top - 26;
    var left = rect.left;

    // If too close to (or above) the viewport top, place inside the element
    if (top < 4) top = rect.top + 4;

    // Clamp left so the label doesn't bleed off the right edge
    // Assume max rendered label width of ~200px
    var maxLeft = window.innerWidth - 204;
    if (left > maxLeft) left = maxLeft;
    if (left < 2)       left = 2;

    _hoverLabelEl.style.top  = top  + 'px';
    _hoverLabelEl.style.left = left + 'px';
    _hoverLabelEl.classList.add('rw-ihl-visible');
  }

  /** Hide the hover label without destroying it. */
  function _hideHoverLabel() {
    if (_hoverLabelEl) _hoverLabelEl.classList.remove('rw-ihl-visible');
  }

  /**
   * Persistent toggle button — created once at boot, lives for the page lifetime.
   * Carries data-rw-devtool so it is excluded from all inspect hover/click logic.
   */
  function _createToggleButton() {
    var el = document.createElement('button');
    el.id = '__rw_inspect_toggle_btn__';
    el.setAttribute('data-rw-devtool', 'true'); // excluded from inspect targeting
    el.setAttribute('title', 'Toggle inspect mode (Alt+Shift+I) — Dev tool');
    el.textContent = 'Inspect';
    el.addEventListener('click', function () {
      toggle();
    });
    document.body.appendChild(el);
    return el;
  }

  /** Sync the toggle button's label and active class to the current _active state. */
  function _updateToggleButton() {
    if (!_toggleBtnEl) return;
    if (_active) {
      _toggleBtnEl.textContent = 'Exit Inspect';
      _toggleBtnEl.classList.add('rw-itb-active');
    } else {
      _toggleBtnEl.textContent = 'Inspect';
      _toggleBtnEl.classList.remove('rw-itb-active');
    }
  }

  // ── DOM helpers ───────────────────────────────────────────────────────

  /** Walk up from el to find the nearest [data-node-id] ancestor (or self). */
  function _findInspectable(el) {
    // Bail immediately if the event originated inside any of our own devtool UI.
    // This prevents the toggle button, pill, panel, and banner from ever being
    // treated as inspectable targets.
    if (el && el.closest && el.closest('[data-rw-devtool]')) return null;

    var cur = el;
    while (cur && cur !== document.body) {
      if (cur.dataset && cur.dataset.nodeId) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  /**
   * Build a stable semantic selector.
   * Prefers #id, falls back to tagName.class chain (top two classes only).
   */
  function _getSelector(el) {
    if (el.id) return '#' + el.id;
    var tag = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      var classes = el.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length) return tag + '.' + classes.join('.');
    }
    return tag;
  }

  /** Return a ≤80-char text snippet from an element's text content. */
  function _getTextSnippet(el) {
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > 80 ? text.slice(0, 77) + '…' : text;
  }

  /** Build the full selection payload from an inspectable element. */
  function _buildPayload(el) {
    var rect = el.getBoundingClientRect();
    return {
      url:       window.location.pathname,
      tagName:   el.tagName.toLowerCase(),
      nodeId:    el.dataset.nodeId     || null,
      component: el.dataset.component  || null,
      slot:      el.dataset.slot       || null,
      label:     el.dataset.aiLabel    || null,
      text:      _getTextSnippet(el),
      selector:  _getSelector(el),
      boundingBox: {
        top:    Math.round(rect.top),
        left:   Math.round(rect.left),
        width:  Math.round(rect.width),
        height: Math.round(rect.height),
      },
    };
  }

  // ── Panel helpers ─────────────────────────────────────────────────────

  /** Populate every data-field cell with values from payload. */
  function _updatePanel(payload) {
    if (!_panelEl) return;
    var fields = ['url', 'nodeId', 'component', 'slot', 'label', 'selector', 'text'];
    fields.forEach(function (key) {
      var cell = _panelEl.querySelector('[data-field="' + key + '"]');
      if (!cell) return;
      var val = payload && payload[key] != null ? String(payload[key]) : '—';
      cell.textContent = val;
      cell.title = val; // tooltip for truncated values
    });
  }

  /** Show the panel (only when active + selection exists). */
  function _showPanel() {
    if (!_panelEl) return;
    _panelEl.classList.add('rw-isp-visible');
  }

  /** Hide the panel without destroying it. */
  function _hidePanel() {
    if (!_panelEl) return;
    _panelEl.classList.remove('rw-isp-visible');
  }

  /**
   * Clear selection: wipe __RW_SELECTED_NODE__, reset pill text, reset panel
   * fields, remove the selected-state highlight tint, and hide the panel.
   */
  function _clearSelection() {
    window.__RW_SELECTED_NODE__ = null;

    // Remove the red locked outline + attribute from the selected element
    if (_selectedEl) {
      _selectedEl.style.outline = '';
      _selectedEl.removeAttribute('data-rw-selected');
      _selectedEl = null;
    }

    _updatePill(null);
    _updatePanel(null);
    _hidePanel();
    // Remove the green "selected" flash tint if it lingered
    if (_highlightEl) _highlightEl.classList.remove('rw-ih-selected');
  }

  // ── Highlight positioning ─────────────────────────────────────────────

  function _positionHighlight(el) {
    if (!_highlightEl || !el) return;
    var rect = el.getBoundingClientRect();
    _highlightEl.style.top    = rect.top    + 'px';
    _highlightEl.style.left   = rect.left   + 'px';
    _highlightEl.style.width  = rect.width  + 'px';
    _highlightEl.style.height = rect.height + 'px';
    _highlightEl.classList.add('rw-ih-visible');
  }

  function _hideHighlight() {
    if (_highlightEl) _highlightEl.classList.remove('rw-ih-visible');
  }

  // ── Pill update ───────────────────────────────────────────────────────

  function _updatePill(payload) {
    if (!_pillEl) return;
    var nodeEl = _pillEl.querySelector('.rw-ip-node');
    if (!nodeEl) return;
    if (!payload) {
      nodeEl.textContent = 'No selection';
      return;
    }
    // "Selected: ComponentName / slot" or just nodeId as fallback
    var label = payload.component || payload.nodeId || '?';
    var text  = 'Selected: ' + label + (payload.slot ? ' / ' + payload.slot : '');
    nodeEl.textContent = text;
  }

  // ── Event handlers ────────────────────────────────────────────────────

  function _onMouseMove(e) {
    if (!_active) return;

    // Throttle to rAF to avoid jank
    if (_frameId) cancelAnimationFrame(_frameId);
    _frameId = requestAnimationFrame(function () {
      var target = _findInspectable(e.target);
      if (target === _hoveredEl) return;

      // Remove blue hover outline from the element we're leaving.
      // Skip if it's the selected element — keep its red outline intact.
      if (_hoveredEl && _hoveredEl !== _selectedEl) {
        _hoveredEl.style.outline = '';
      }

      _hoveredEl = target;

      if (target) {
        // Apply blue hover outline only if this element isn't already selected.
        if (target !== _selectedEl) {
          target.style.outline = '2px solid #3b82f6';
        }
        _positionHighlight(target);
        _updateHoverLabel(target);
      } else {
        _hideHighlight();
        _hideHoverLabel();
      }
    });
  }

  function _onClick(e) {
    if (!_active) return;

    // Any element carrying data-rw-devtool (toggle button, panel, pill, banner)
    // must never be intercepted — let it handle its own events normally.
    if (e.target.closest && e.target.closest('[data-rw-devtool]')) return;
    // Panel buttons handle their own events — don't intercept them
    if (_panelEl && _panelEl.contains(e.target)) return;
    // Pill close button — let it bubble normally
    if (e.target.classList && e.target.classList.contains('rw-ip-close')) return;

    var target = _findInspectable(e.target);
    if (!target) return;

    // Prevent the app's own click handlers from firing
    e.preventDefault();
    e.stopPropagation();

    // Clear previous selection's visual markers
    if (_selectedEl && _selectedEl !== target) {
      _selectedEl.style.outline = '';
      _selectedEl.removeAttribute('data-rw-selected');
    }

    // Lock red outline + attribute on the newly selected element
    target.setAttribute('data-rw-selected', 'true');
    target.style.outline = '3px solid #ef4444';
    _selectedEl = target;

    var payload = _buildPayload(target);
    window.__RW_SELECTED_NODE__ = payload;
    _updatePill(payload);
    _updatePanel(payload);
    _showPanel();

    // Flash the highlight to confirm selection
    if (_highlightEl) {
      _highlightEl.classList.add('rw-ih-selected');
      setTimeout(function () {
        if (_highlightEl) _highlightEl.classList.remove('rw-ih-selected');
      }, 400);
    }

    // Log clean JSON to console
    console.group('%c[RW Inspect] Node selected', 'color:#7c3aed;font-weight:600;font-family:monospace;');
    console.log(JSON.stringify(payload, null, 2));
    console.groupEnd();
  }

  function _onKeyDown(e) {
    // Alt+Shift+I — toggle (avoids conflict with browser DevTools F12/Ctrl+Shift+I)
    if (e.altKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      // Ignore when the keypress comes from a text-entry field so that typing
      // in the chat input, search boxes, etc. is never accidentally intercepted.
      var t = e.target;
      var tag = t && t.tagName ? t.tagName.toUpperCase() : '';
      var isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
                       (t && t.isContentEditable);
      if (isEditable) return;

      e.preventDefault();
      toggle();
      return;
    }
    // Escape — always exits, regardless of where focus is
    if (_active && e.key === 'Escape') {
      disable();
    }
  }

  // ── Scroll / resize: keep highlight and hover label tracking the element ─
  function _onScroll() {
    if (!_active || !_hoveredEl) return;
    _positionHighlight(_hoveredEl);
    _updateHoverLabel(_hoveredEl);
  }

  // ── Public enable / disable / toggle ─────────────────────────────────

  function enable() {
    if (_active) return;
    _active = true;

    // Lazy-create overlay elements on first use
    if (!_highlightEl)  _highlightEl  = _createHighlight();
    if (!_pillEl)       _pillEl       = _createPill();
    if (!_panelEl)      _panelEl      = _createPanel();
    if (!_hoverLabelEl) _hoverLabelEl = _createHoverLabel();

    _pillEl.classList.add('rw-ip-active');
    document.body.classList.add('rw-inspect-cursor');

    // ── Visual mode indicators ──────────────────────────────────────────
    window.__RW_INSPECT_ACTIVE__ = true;
    document.body.style.cursor = 'crosshair';
    document.body.style.filter = 'brightness(0.95)';

    // Banner — remove any stale one before creating fresh
    if (_bannerEl) _bannerEl.remove();
    _bannerEl = _createBanner();

    _updateToggleButton();

    document.addEventListener('mousemove', _onMouseMove, true);
    document.addEventListener('click',     _onClick,     true);
    window.addEventListener('scroll',      _onScroll,    true);

    console.log(
      '%c[RW Inspect] Inspect mode ON%c — hover a tagged block, click to select. Esc or Alt+Shift+I to exit.',
      'color:#7c3aed;font-weight:700;font-family:monospace;',
      'color:#6b7280;font-family:monospace;'
    );
  }

  function disable() {
    if (!_active) return;
    _active = false;

    if (_frameId) { cancelAnimationFrame(_frameId); _frameId = null; }

    // ── Clear hover outline ─────────────────────────────────────────────
    if (_hoveredEl && _hoveredEl !== _selectedEl) {
      _hoveredEl.style.outline = '';
    }
    _hoveredEl = null;

    // ── Clear selection outline + attribute ─────────────────────────────
    if (_selectedEl) {
      _selectedEl.style.outline = '';
      _selectedEl.removeAttribute('data-rw-selected');
      _selectedEl = null;
    }
    // Belt-and-suspenders: catch any that slipped through
    document.querySelectorAll('[data-rw-selected]').forEach(function (el) {
      el.removeAttribute('data-rw-selected');
      el.style.outline = '';
    });

    // ── Reset body visual state ─────────────────────────────────────────
    document.body.style.cursor = '';
    document.body.style.filter = '';
    document.body.classList.remove('rw-inspect-cursor');

    // ── Remove banner ───────────────────────────────────────────────────
    if (_bannerEl) { _bannerEl.remove(); _bannerEl = null; }

    // ── Hide floating overlay + hover label + panel + pill ──────────────
    _hideHighlight();
    _hideHoverLabel();
    _hidePanel();
    if (_pillEl) _pillEl.classList.remove('rw-ip-active');

    // ── Remove event listeners ──────────────────────────────────────────
    document.removeEventListener('mousemove', _onMouseMove, true);
    document.removeEventListener('click',     _onClick,     true);
    window.removeEventListener('scroll',      _onScroll,    true);

    window.__RW_INSPECT_ACTIVE__ = false;
    _updateToggleButton();

    console.log('%c[RW Inspect] Inspect mode OFF', 'color:#6b7280;font-family:monospace;');
  }

  function toggle() {
    _active ? disable() : enable();
  }

  // ── Wire global keyboard shortcut (always-on, even when inactive) ─────
  document.addEventListener('keydown', _onKeyDown);

  // ── Public API ────────────────────────────────────────────────────────
  window.RW_INSPECT = {
    enable:   enable,
    disable:  disable,
    toggle:   toggle,
    isActive: function () { return _active; },
  };

  // ── Create persistent toggle button at boot ───────────────────────────
  // Runs once, stays in the DOM for the page lifetime regardless of mode state.
  // Wrapped in DOMContentLoaded in case the script loads before <body> exists.
  if (document.body) {
    _toggleBtnEl = _createToggleButton();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      _toggleBtnEl = _createToggleButton();
    });
  }

  // Boot message
  console.log(
    '%c[RW Inspect] Dev inspect mode loaded%c — press Alt+Shift+I to toggle.',
    'color:#7c3aed;font-style:italic;font-family:monospace;',
    'color:#6b7280;font-family:monospace;'
  );

})();
