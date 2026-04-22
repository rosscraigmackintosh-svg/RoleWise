// Rolewise — Decision History
//
// A record of decisions, not a role list. Grouped by outcome
// (Applied / Skipped / Revisited). Each item answers: why did I
// make this call?

const { useState, useEffect, useMemo } = React;

function cn(...xs) { return xs.filter(Boolean).join(' '); }

// ─────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────
function Sidebar({ current }) {
  const counts = { roles: 48, applications: 11, recruiters: 7 };
  return renderSidebar({ current, counts });
}

// ─────────────────────────────────────────────────────────────────────
// Header + filter
// ─────────────────────────────────────────────────────────────────────
function Header({ filter, setFilter, counts }) {
  const options = [
    { k: 'all',       label: 'All',       ct: counts.all       },
    { k: 'applied',   label: 'Applied',   ct: counts.applied   },
    { k: 'skipped',   label: 'Skipped',   ct: counts.skipped   },
    { k: 'revisited', label: 'Revisited', ct: counts.revisited },
  ];
  return (
    <header className="dh-head">
      <div>
        <div className="dh-eyebrow">
          <span className="dh-eyebrow-tick" />
          your decisions
        </div>
        <h1 className="dh-title">Decision history</h1>
        <p className="dh-sub">
          A record of what you chose to pursue, what you chose to reject, and
          why — so your judgement stays legible to you.
        </p>
      </div>
      <div className="dh-filter" role="group" aria-label="Filter decisions">
        {options.map(o => (
          <button
            key={o.k}
            className={cn('dh-filter-btn', filter === o.k && 'on')}
            onClick={() => setFilter(o.k)}
          >
            {o.label}
            <span className="dh-filter-ct num">{o.ct}</span>
          </button>
        ))}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Light summary — inline text, not a chart
// ─────────────────────────────────────────────────────────────────────
function Summary({ summary }) {
  return (
    <div className="dh-summary">
      <span className="dh-sum-frag">
        <span className="num">{summary.reviewed}</span> roles reviewed
      </span>
      <span className="dh-sum-dot" />
      <span className="dh-sum-frag">
        <span className="num">{summary.applied}</span> applied
      </span>
      <span className="dh-sum-dot" />
      <span className="dh-sum-frag">
        <span className="num">{summary.skipped}</span> skipped
      </span>
      <span className="dh-sum-meta">{summary.window.toLowerCase()}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Group-level pattern callout
// ─────────────────────────────────────────────────────────────────────
function Pattern({ pattern }) {
  if (!pattern) return null;
  return (
    <div className="dh-pattern">
      <div className="dh-pattern-t">{pattern.headline}</div>
      <ul className="dh-pattern-list">
        {pattern.points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// One decision
// ─────────────────────────────────────────────────────────────────────
function DecisionItem({ d }) {
  return (
    <a className="dh-item" href="#" onClick={e => e.preventDefault()}>
      <div className="dh-item-head">
        <div className="dh-item-role">
          {d.role}
          <span className="dh-item-company">{d.company}</span>
        </div>
      </div>

      <div className="dh-item-ts">
        {d.when}
        <span className="rel">{d.days === 1 ? '1 day ago' : `${d.days} days ago`}</span>
      </div>

      <div className="dh-item-body">
        <ul className="dh-reasons">
          {d.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
        {d.signals && d.signals.length > 0 && (
          <div className="dh-signals">
            {d.signals.map((s, i) => (
              <span key={i} className={cn('dh-signal', s.tone === 'dim' && 'dim')}>
                {s.k}
              </span>
            ))}
          </div>
        )}
        {d.note && <div className="dh-note">{d.note}</div>}
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Group of decisions (by outcome)
// ─────────────────────────────────────────────────────────────────────
function Group({ num, outcome, title, items, pattern }) {
  if (items.length === 0) return null;
  return (
    <section className="dh-group" data-outcome={outcome}>
      <div className="dh-group-label">
        <span className="dh-group-num">{num}</span>
        {outcome}
        <span className="dh-group-ct num">{items.length} {items.length === 1 ? 'decision' : 'decisions'}</span>
      </div>
      <div className="dh-group-body">
        <div className="dh-group-head">
          <h2 className="dh-group-t"><span className="dot" />{title}</h2>
        </div>
        <Pattern pattern={pattern} />
        <div className="dh-list">
          {items.map(d => <DecisionItem key={d.id} d={d} />)}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────
function Empty() {
  return (
    <div className="dh-empty">
      <div className="dh-empty-mark" />
      <div className="dh-empty-t">No decisions yet</div>
      <p className="dh-empty-s">
        Review roles to start building your decision history. Every choice — to
        apply or to skip — will be recorded here alongside its reasoning.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tweaks
// ─────────────────────────────────────────────────────────────────────
function Tweaks({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Filter</span>
        <div className="tweak-btn-group">
          {['all', 'applied', 'skipped'].map(k => (
            <button key={k} className={cn(tweaks.filter === k && 'on')} onClick={() => set('filter', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Density</span>
        <div className="tweak-btn-group">
          {['comfortable', 'compact'].map(k => (
            <button key={k} className={cn(tweaks.density === k && 'on')} onClick={() => set('density', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Group patterns</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.showPatterns && 'on')} onClick={() => set('showPatterns', true)}>show</button>
          <button className={cn(!tweaks.showPatterns && 'on')} onClick={() => set('showPatterns', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Revisited group</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.showRevisited && 'on')} onClick={() => set('showRevisited', true)}>show</button>
          <button className={cn(!tweaks.showRevisited && 'on')} onClick={() => set('showRevisited', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button key={k}
                    className={cn('swatch', tweaks.accent === k && 'on')}
                    style={{ background: v.accent }}
                    title={k}
                    onClick={() => set('accent', k)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweaksRaw] = useState(window.__TWEAKS__);
  const [editMode, setEditMode] = useState(false);

  // Edit-mode protocol — register listener before announcing availability.
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweaks = (next) => {
    setTweaksRaw(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
  };

  // Accent → CSS vars
  useEffect(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  // Filter
  const filter = tweaks.filter || 'all';
  const setFilter = (k) => setTweaks({ ...tweaks, filter: k });

  // Partition decisions by outcome, sorted newest-first (already ordered).
  const groups = useMemo(() => {
    const by = { applied: [], skipped: [], revisited: [] };
    for (const d of DECISIONS) {
      if (by[d.outcome]) by[d.outcome].push(d);
    }
    return by;
  }, []);

  const counts = {
    all:       DECISIONS.length,
    applied:   groups.applied.length,
    skipped:   groups.skipped.length,
    revisited: groups.revisited.length,
  };

  // Apply filter
  const visible = {
    applied:   (filter === 'all' || filter === 'applied')   ? groups.applied   : [],
    skipped:   (filter === 'all' || filter === 'skipped')   ? groups.skipped   : [],
    revisited: (filter === 'all' || filter === 'revisited') ? groups.revisited : [],
  };

  const anyVisible = visible.applied.length + visible.skipped.length + visible.revisited.length > 0;

  return (
    <div className="app"
         data-density={tweaks.density}
         data-show-patterns={String(!!tweaks.showPatterns)}
         data-show-revisited={String(!!tweaks.showRevisited)}>
      <Sidebar current="decisions" />
      <main className="main" data-screen-label="Decision History">
        <div className="content">
          <Header filter={filter} setFilter={setFilter} counts={counts} />
          <Summary summary={DECISION_SUMMARY} />

          {anyVisible ? (
            <div className="dh-groups">
              <Group
                num="01"
                outcome="applied"
                title="Applied — pursued"
                items={visible.applied}
                pattern={tweaks.showPatterns ? GROUP_PATTERNS.applied : null}
              />
              <Group
                num="02"
                outcome="skipped"
                title="Skipped — not pursued"
                items={visible.skipped}
                pattern={tweaks.showPatterns ? GROUP_PATTERNS.skipped : null}
              />
              {tweaks.showRevisited && (
                <Group
                  num="03"
                  outcome="revisited"
                  title="Revisited — reconsidered"
                  items={visible.revisited}
                  pattern={tweaks.showPatterns ? GROUP_PATTERNS.revisited : null}
                />
              )}
            </div>
          ) : (
            <Empty />
          )}

          <div className="dh-close">
            <div className="dh-close-l">
              Your decisions make sense. Come back here when you’re second-guessing
              a call — the reasoning is already written down.
            </div>
            <div className="dh-close-r">end of record</div>
          </div>
        </div>
      </main>

      {editMode && <Tweaks tweaks={tweaks} setTweaks={setTweaks} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
