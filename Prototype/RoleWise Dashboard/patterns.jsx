// Pattern History — the long-term understanding layer (Rolewise Plus).
// Reuses the Profile system: eyebrows, sections, source tags, calm tone.
// Every pattern is gated by data quantity and earned by repetition.

const { useState: useStateH, useEffect: useEffectH, useMemo: useMemoH } = React;

function cnH(...xs) { return xs.filter(Boolean).join(' '); }

// ════════════════════════════════════════════════════════════════════════
// Sidebar (Patterns = active; Plus active)
// ════════════════════════════════════════════════════════════════════════
function SidebarH({ current, counts }) {
  return renderSidebar({ current, counts, plusActive: true });
}

// ════════════════════════════════════════════════════════════════════════
// Header
// ════════════════════════════════════════════════════════════════════════
function PageHeader({ context }) {
  return (
    <header className="ph-head">
      <div>
        <div className="ph-eyebrow">
          <span className="ph-plus-mark">Plus</span>
          Long-term understanding
        </div>
        <h1 className="ph-title">Pattern history</h1>
        <p className="ph-sub">What your decisions show over time — signals that have repeated enough to be worth naming.</p>
      </div>
      <div className="ph-meta">
        <div className="ph-meta-row">
          <span className="ph-meta-k">Based on</span>
          <span className="ph-meta-v num">{context.rolesAnalysed}</span>
          <span className="ph-meta-u">roles</span>
        </div>
        <div className="ph-meta-row">
          <span className="ph-meta-k">Range</span>
          <span className="ph-meta-v">{context.range}</span>
        </div>
        <div className="ph-meta-row">
          <span className="ph-meta-k">Since</span>
          <span className="ph-meta-v num">{context.since}</span>
        </div>
      </div>
    </header>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Time range toggle
// ════════════════════════════════════════════════════════════════════════
function RangeToggle({ range, onChange }) {
  const opts = [
    { k: '30d', label: '30 days'  },
    { k: '60d', label: '60 days'  },
    { k: 'all', label: 'All time' },
  ];
  return (
    <div className="ph-range">
      <div className="ph-range-label">Time range</div>
      <div className="ph-range-group">
        {opts.map(o => (
          <button
            key={o.k}
            className={cnH('ph-range-btn', range === o.k && 'is-on')}
            onClick={() => onChange(o.k)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Stability tag — subtle, no colour emphasis
// ════════════════════════════════════════════════════════════════════════
function Stability({ label }) {
  if (!label) return null;
  return <span className="ph-stab">{label}</span>;
}

// ════════════════════════════════════════════════════════════════════════
// Outcome link — behaviour → outcome
// ════════════════════════════════════════════════════════════════════════
function OutcomeLink({ outcome }) {
  if (!outcome) return null;
  return (
    <div className="ph-outcome">
      <span className="ph-out-from">{outcome.from}</span>
      <span className="ph-out-arrow" aria-hidden>→</span>
      <span className="ph-out-to">{outcome.to}</span>
      {outcome.rate && <span className="ph-out-rate num">{outcome.rate}</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Visuals — always text first, bars are supporting only
// ════════════════════════════════════════════════════════════════════════
function VisualBars({ visual }) {
  return (
    <div className="ph-bars">
      {visual.rows.map((r, i) => {
        const w = Math.max(4, Math.round((r.v / r.max) * 100));
        return (
          <div key={i} className="ph-bar-row">
            <div className="ph-bar-k">{r.k}</div>
            <div className="ph-bar-track"><div className="ph-bar-fill" style={{ width: w + '%' }} /></div>
            <div className="ph-bar-v num">{r.v}{r.unit ? <span className="ph-bar-u"> {r.unit}</span> : null}</div>
          </div>
        );
      })}
    </div>
  );
}

function VisualSplit({ visual }) {
  const total = visual.total;
  return (
    <div className="ph-split">
      <div className="ph-split-bar">
        {visual.parts.map((p, i) => {
          const w = (p.n / total) * 100;
          return <div key={i} className={cnH('ph-split-seg', `is-${p.tone}`)} style={{ width: w + '%' }} title={`${p.label} · ${p.n}`} />;
        })}
      </div>
      <div className="ph-split-legend">
        {visual.parts.map((p, i) => (
          <span key={i} className="ph-split-lg">
            <span className={cnH('ph-split-dot', `is-${p.tone}`)} />
            <span className="ph-split-lg-k">{p.label}</span>
            <span className="ph-split-lg-v num">{p.n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function VisualTrend({ visual }) {
  return (
    <div className="ph-trend">
      {visual.rows.map((r, i) => (
        <div key={i} className="ph-trend-row">
          <div className="ph-trend-k">{r.k}</div>
          <div className="ph-trend-track">
            <div className="ph-trend-fill" style={{ width: r.pct + '%' }} />
          </div>
          <div className="ph-trend-v num">{r.pct}%</div>
        </div>
      ))}
    </div>
  );
}

function Visual({ visual }) {
  if (!visual) return null;
  if (visual.kind === 'bars')  return <VisualBars visual={visual} />;
  if (visual.kind === 'split') return <VisualSplit visual={visual} />;
  if (visual.kind === 'trend') return <VisualTrend visual={visual} />;
  return null;
}

// ════════════════════════════════════════════════════════════════════════
// Pattern Card
// ════════════════════════════════════════════════════════════════════════
function PatternCard({ pattern, onOpen, showVisuals }) {
  return (
    <article className="ph-card" onClick={() => onOpen(pattern)}>
      <header className="ph-card-head">
        <h3 className="ph-card-statement">{pattern.statement}</h3>
        <Stability label={pattern.stability} />
      </header>

      <dl className="ph-evidence">
        {pattern.evidence.map((e, i) => (
          <div key={i} className="ph-ev-row">
            <dt className="ph-ev-k">{e.k}</dt>
            <dd className="ph-ev-v num">{e.v}</dd>
          </div>
        ))}
      </dl>

      {showVisuals && pattern.visual && (
        <div className="ph-card-visual">
          <Visual visual={pattern.visual} />
        </div>
      )}

      {pattern.outcome && <OutcomeLink outcome={pattern.outcome} />}

      <footer className="ph-card-foot">
        <span className="ph-card-open">Open matching roles <span aria-hidden>↗</span></span>
      </footer>
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Section
// ════════════════════════════════════════════════════════════════════════
function PatternSection({ section, onOpen, showVisuals }) {
  if (!section.patterns.length) return null;
  return (
    <section className="ph-section">
      <div className="ph-sec-head">
        <div className="ph-sec-eyebrow">{section.key}</div>
        <div>
          <h2 className="ph-sec-title">{section.title}</h2>
          <p className="ph-sec-sub">{section.sub}</p>
        </div>
        <span className="ph-sec-count num">{section.patterns.length}</span>
      </div>
      <div className="ph-sec-body">
        {section.patterns.map(p => (
          <PatternCard key={p.id} pattern={p} onOpen={onOpen} showVisuals={showVisuals} />
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Empty state
// ════════════════════════════════════════════════════════════════════════
function EmptyPatterns({ context }) {
  return (
    <div className="ph-empty">
      <div className="ph-empty-mark" />
      <div className="ph-empty-title">Not enough data yet</div>
      <div className="ph-empty-sub">
        Pattern history builds as you review and apply to more roles. You've reviewed <span className="num">{context.rolesAnalysed}</span> so far — patterns will start to appear once there are enough repetitions to be worth naming.
      </div>

      <div className="ph-empty-progress">
        <div className="ph-empty-prog-row">
          <span className="ph-empty-prog-k">Roles reviewed</span>
          <span className="ph-empty-prog-v num">{context.rolesAnalysed} / 15</span>
        </div>
        <div className="ph-empty-track">
          <div className="ph-empty-fill" style={{ width: Math.min(100, (context.rolesAnalysed / 15) * 100) + '%' }} />
        </div>
        <div className="ph-empty-hint">Threshold for early patterns is around 15 reviewed roles. Stronger signals emerge around 40.</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Detail drawer — opens when a pattern is clicked
// ════════════════════════════════════════════════════════════════════════
function PatternDrawer({ pattern, onClose }) {
  useEffectH(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!pattern) return null;
  return (
    <div className="ph-drawer-wrap" onClick={onClose}>
      <aside className="ph-drawer" onClick={e => e.stopPropagation()}>
        <header className="ph-drawer-head">
          <div className="ph-drawer-eyebrow">Pattern detail</div>
          <button className="ph-drawer-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="ph-drawer-body">
          <h3 className="ph-drawer-statement">{pattern.statement}</h3>
          <div className="ph-drawer-stab"><Stability label={pattern.stability} /></div>

          <div className="ph-drawer-sec">
            <div className="ph-drawer-sec-k">Evidence</div>
            <dl className="ph-evidence ph-evidence-wide">
              {pattern.evidence.map((e, i) => (
                <div key={i} className="ph-ev-row">
                  <dt className="ph-ev-k">{e.k}</dt>
                  <dd className="ph-ev-v num">{e.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {pattern.visual && (
            <div className="ph-drawer-sec">
              <div className="ph-drawer-sec-k">Distribution</div>
              <Visual visual={pattern.visual} />
            </div>
          )}

          {pattern.outcome && (
            <div className="ph-drawer-sec">
              <div className="ph-drawer-sec-k">Outcome link</div>
              <OutcomeLink outcome={pattern.outcome} />
            </div>
          )}

          <div className="ph-drawer-sec">
            <div className="ph-drawer-sec-k">Matching roles</div>
            <div className="ph-drawer-matching">
              A filtered view of the roles supporting this pattern would open here — grouped by stage and decision.
            </div>
          </div>
        </div>
        <footer className="ph-drawer-foot">
          <button className="ph-drawer-cta">Open roles view</button>
          <button className="ph-drawer-mute">Mute this pattern</button>
        </footer>
      </aside>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Tweaks
// ════════════════════════════════════════════════════════════════════════
function TweaksH({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Data state</span>
        <div className="tweak-btn-group">
          {['early','active','heavy'].map(k => (
            <button key={k} className={cnH(tweaks.dataState === k && 'on')} onClick={() => set('dataState', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Visuals</span>
        <div className="tweak-btn-group">
          <button className={cnH(tweaks.showVisuals && 'on')} onClick={() => set('showVisuals', true)}>show</button>
          <button className={cnH(!tweaks.showVisuals && 'on')} onClick={() => set('showVisuals', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Density</span>
        <div className="tweak-btn-group">
          {['comfortable','compact'].map(k => (
            <button key={k} className={cnH(tweaks.density === k && 'on')} onClick={() => set('density', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button
              key={k}
              className={cnH('swatch', tweaks.accent === k && 'on')}
              style={{ background: v.accent }}
              title={k}
              onClick={() => set('accent', k)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StubH({ name }) {
  return (
    <div className="content">
      <div className="stub-page">
        <h2>{name}</h2>
        <p style={{ marginTop: 10 }}>Placeholder — this design focuses on Pattern history.</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Root
// ════════════════════════════════════════════════════════════════════════
function AppH() {
  const [page, setPage] = useStateH('patterns');
  const [range, setRange] = useStateH('60d');
  const [tweaks, setTweaksRaw] = useStateH(window.__TWEAKS__);
  const [editMode, setEditMode] = useStateH(false);
  const [openPattern, setOpenPattern] = useStateH(null);
  const [toast, setToast] = useStateH(null);

  useEffectH(() => {
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

  // Accent
  useEffectH(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  // Density
  useEffectH(() => {
    document.documentElement.dataset.density = tweaks.density || 'comfortable';
  }, [tweaks.density]);

  const state = PATTERN_DATA[tweaks.dataState] || PATTERN_DATA.active;

  // Range scales context numbers subtly for flavour
  const context = useMemoH(() => {
    const base = state.context;
    if (range === '30d') return { ...base, rolesAnalysed: Math.round(base.rolesAnalysed * 0.55), range: 'Last 30 days' };
    if (range === 'all') return { ...base, rolesAnalysed: Math.round(base.rolesAnalysed * 1.8),  range: 'All time' };
    return { ...base, range: 'Last 60 days' };
  }, [state.context, range]);

  const navCounts = useMemoH(() => ({
    roles: tweaks.dataState === 'heavy' ? 203 : tweaks.dataState === 'early' ? 5 : 48,
    applications: tweaks.dataState === 'heavy' ? 51 : tweaks.dataState === 'early' ? 2 : 11,
    recruiters: tweaks.dataState === 'heavy' ? 18 : tweaks.dataState === 'early' ? 1 : 7,
  }), [tweaks.dataState]);

  const ping = (m) => { setToast(m); setTimeout(() => setToast(null), 1600); };

  const openPatternHandler = (p) => setOpenPattern(p);
  const closeDrawer = () => setOpenPattern(null);

  const patternsContent = (
    <div className="content">
      <PageHeader context={context} />

      <RangeToggle range={range} onChange={setRange} />

      {!context.enough || state.sections.length === 0 ? (
        <EmptyPatterns context={context} />
      ) : (
        <div className="ph-sections">
          {state.sections.map(s => (
            <PatternSection key={s.key} section={s} onOpen={openPatternHandler} showVisuals={tweaks.showVisuals} />
          ))}
        </div>
      )}

      <footer className="ph-foot">
        <div className="ph-foot-lede">
          These patterns are what keeps repeating — not predictions, not advice.
        </div>
        <div className="ph-foot-sub">
          A pattern only appears here when it has shown up enough times to be worth naming. <button className="ph-foot-link" onClick={() => ping('How patterns are built')}>How this is built</button>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="app">
      <SidebarH current={page} onNav={setPage} counts={navCounts} />
      <main className="main" data-screen-label="Pattern History">
        {page === 'patterns' ? patternsContent : (
          <StubH name={
            [...NAV_PRIMARY, ...NAV_SECONDARY, { key: 'patterns', label: 'Pattern history' }]
              .find(n => n.key === page)?.label || 'Page'
          } />
        )}
      </main>

      <PatternDrawer pattern={openPattern} onClose={closeDrawer} />

      {editMode && <TweaksH tweaks={tweaks} setTweaks={setTweaks} />}
      {toast && <div className="rl-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppH />);
