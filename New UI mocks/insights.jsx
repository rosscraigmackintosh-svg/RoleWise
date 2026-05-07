// Rolewise — Insights
//
// The "learning layer". Observations derived from behaviour over time.
// Calm, interpretive, document-first — closer to a reflective intelligence
// briefing than analytics software. Every insight leads with an interpretation;
// numbers sit quietly in supporting prose. Each card carries an expandable
// "Why this appeared" trail so the reader can audit what the observation rests on.

const { useState, useEffect, useMemo } = React;

function cn(...xs) { return xs.filter(Boolean).join(' '); }

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────
function Sidebar({ current }) {
  const counts = { roles: 48, applications: 11, recruiters: 7 };
  return renderSidebar({ current, counts });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page header with time-range toggle
// ─────────────────────────────────────────────────────────────────────────────
function PageHeader({ range, onRange, ranges }) {
  return (
    <header className="page-header insights-header">
      <div>
        <h1 className="page-title">Insights</h1>
        <p className="page-sub">Patterns from your job search</p>
      </div>
      <div className="time-toggle" role="tablist" aria-label="Time range">
        {['14d', '30d', 'all'].map(k => (
          <button
            key={k}
            role="tab"
            aria-selected={range === k}
            className={cn('time-tab', range === k && 'on')}
            onClick={() => onRange(k)}
          >
            {ranges[k].label}
          </button>
        ))}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Framing line — sets expectations for what the page is and isn't.
// ─────────────────────────────────────────────────────────────────────────────
function FramingNote() {
  return (
    <p className="insights-framing">
      Insights appear when repeated patterns emerge across analysed roles,
      applications, and outcomes. They describe what has happened — not what will.
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Time context strip — grounds the insights in real numbers
// ─────────────────────────────────────────────────────────────────────────────
function TimeContext({ range, ranges }) {
  const r = ranges[range];
  return (
    <div className="time-context">
      <span className="tc-part">
        <span className="tc-v num">{r.rolesSeen}</span>
        <span className="tc-k">roles seen</span>
      </span>
      <span className="tc-dot" />
      <span className="tc-part">
        <span className="tc-v num">{r.applied}</span>
        <span className="tc-k">applied</span>
      </span>
      <span className="tc-dot" />
      <span className="tc-part">
        <span className="tc-v num">{r.responses}</span>
        <span className="tc-k">responses</span>
      </span>
      <span className="tc-flex" />
      <span className="tc-meta">observed over {ranges[range].label.toLowerCase()}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Strength tag — sets the confidence frame on each card
// ─────────────────────────────────────────────────────────────────────────────
function StrengthTag({ s }) {
  if (s === 'strong')   return <span className="tag tag-strong">Clear pattern</span>;
  if (s === 'emerging') return <span className="tag tag-emerging">Emerging pattern</span>;
  if (s === 'early')    return <span className="tag tag-early">Early signal</span>;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual — split bar OR small trend chart. (Bars/histograms intentionally
// removed; they lean too dashboard-like for this surface.)
// ─────────────────────────────────────────────────────────────────────────────
function Visual({ v }) {
  if (!v) return null;

  if (v.kind === 'split') {
    return (
      <div className="vis-split" aria-hidden="true">
        <div className="vis-split-row">
          <div className="vis-split-label">{v.left.label}</div>
          <div className="vis-split-bar">
            <div className="vis-split-fill" style={{ width: v.left.pct + '%' }} />
          </div>
          <div className="vis-split-val num">{v.left.pct}%</div>
        </div>
        <div className="vis-split-row">
          <div className="vis-split-label">{v.right.label}</div>
          <div className="vis-split-bar">
            <div className="vis-split-fill muted" style={{ width: Math.max(v.right.pct, 1.5) + '%' }} />
          </div>
          <div className="vis-split-val num">{v.right.pct}%</div>
        </div>
      </div>
    );
  }

  if (v.kind === 'trend') {
    const W = 520, H = 80, P = 8;
    const maxY = Math.max(...v.series.flatMap(s => s.points)) * 1.1;
    const n = v.series[0].points.length;
    const xStep = (W - P * 2) / (n - 1);

    const pathFor = (pts) => pts.map((y, i) => {
      const x = P + i * xStep;
      const yy = H - P - (y / maxY) * (H - P * 2);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yy.toFixed(1)}`;
    }).join(' ');

    return (
      <div className="vis-trend" aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
          <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="currentColor" strokeOpacity="0.08" />
          {v.series.map((s) => (
            <g key={s.label}>
              <path d={pathFor(s.points)}
                    fill="none"
                    stroke={`oklch(45% 0.06 ${s.hue})`}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round" />
              <circle cx={P + (n - 1) * xStep}
                      cy={H - P - (s.points[n - 1] / maxY) * (H - P * 2)}
                      r="3"
                      fill={`oklch(45% 0.06 ${s.hue})`} />
            </g>
          ))}
        </svg>
        <div className="vis-trend-legend">
          {v.series.map(s => (
            <span key={s.label} className="vtl-item">
              <span className="vtl-dot" style={{ background: `oklch(45% 0.06 ${s.hue})` }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Why this appeared — expandable trail on every card.
// Shows the count breakdown, related traits, and a few supporting roles so the
// observation is auditable rather than opinion.
// ─────────────────────────────────────────────────────────────────────────────
function WhyThisAppeared({ why }) {
  const [open, setOpen] = useState(false);
  if (!why) return null;
  const hasObserved = why.observedAcross && why.observedAcross.length > 0;
  const hasTraits   = why.relatedTraits && why.relatedTraits.length > 0;
  const hasRoles    = why.roles && why.roles.length > 0;
  if (!hasObserved && !hasTraits && !hasRoles) return null;

  return (
    <div className={cn('ic-why', open && 'is-open')}>
      <button
        type="button"
        className="ic-why-toggle"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span>Why this appeared</span>
        <span className="ic-why-arr" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="ic-why-body">
          {hasObserved && (
            <div className="icw-block">
              <div className="icw-label">Observed across</div>
              <ul className="icw-list">
                {why.observedAcross.map((row, i) => (
                  <li key={i} className="icw-row">
                    <span className="icw-row-k">{row.k}</span>
                    <span className="icw-row-v num">{row.v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasTraits && (
            <div className="icw-block">
              <div className="icw-label">Most common related traits</div>
              <div className="icw-traits">
                {why.relatedTraits.map((t, i) => (
                  <span key={i} className="icw-trait">{t}</span>
                ))}
              </div>
            </div>
          )}
          {hasRoles && (
            <div className="icw-block">
              <div className="icw-label">Supporting roles</div>
              <div className="icw-roles">
                {why.roles.map((r, i) => (
                  <span key={i} className="icw-role">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight card — interpretation first, evidence as quiet supporting prose,
// optional single visual, expandable "Why this appeared" trail.
// ─────────────────────────────────────────────────────────────────────────────
function InsightCard({ insight }) {
  const onEvidence = (e, link) => {
    if (!link) return;
    const [page] = link.split(':');
    const dest = page === 'applications' ? 'Applications.html' : 'Roles.html';
    e.preventDefault();
    window.location.href = dest;
  };

  const softened = insight.strength !== 'strong';

  return (
    <article className={cn('insight-card', softened && 'is-soft')}>
      <div className="ic-head">
        <StrengthTag s={insight.strength} />
      </div>

      <h3 className={cn('ic-statement', softened && 'soft')}>
        {insight.statement}
      </h3>

      {insight.visual && (
        <div className="ic-visual">
          <Visual v={insight.visual} />
        </div>
      )}

      <ul className="ic-evidence">
        {insight.evidence.map((ev, i) => (
          <li
            key={i}
            className={cn('ic-ev', ev.link && 'is-link')}
            onClick={(e) => onEvidence(e, ev.link)}
            role={ev.link ? 'link' : undefined}
            tabIndex={ev.link ? 0 : undefined}
          >
            <span className="ic-ev-text">{ev.text}</span>
            {ev.link && <span className="ic-ev-arr" aria-hidden="true">→</span>}
          </li>
        ))}
      </ul>

      <WhyThisAppeared why={insight.why} />
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────
function SectionEmpty({ rolesSeen }) {
  return (
    <div className="section-empty">
      <div className="se-line">No pattern yet in this area</div>
      <div className="se-note">
        Patterns surface here once around {CONFIDENCE_FLOOR}+ relevant
        observations have accumulated. So far: {rolesSeen}.
      </div>
    </div>
  );
}

function Section({ name, insights, rolesSeen, globallyLowData }) {
  const show = !globallyLowData && insights && insights.length > 0;

  return (
    <section className="insights-section">
      <div className="is-head">
        <h2 className="is-title">{name}</h2>
        {show && (
          <span className="is-count num">{insights.length}</span>
        )}
      </div>

      {show ? (
        <div className="is-cards">
          {insights.map(i => <InsightCard key={i.id} insight={i} />)}
        </div>
      ) : (
        <SectionEmpty rolesSeen={rolesSeen} />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Global empty state — shown when the whole account is too fresh.
// ─────────────────────────────────────────────────────────────────────────────
function GlobalEmpty({ rolesSeen }) {
  return (
    <div className="global-empty">
      <div className="ge-title">Not enough data yet</div>
      <p className="ge-body">
        Insights will appear as you review and apply to more roles. You’ve
        seen <span className="num">{rolesSeen}</span> so far — patterns usually
        start to emerge around <span className="num">{CONFIDENCE_FLOOR}</span>–<span className="num">15</span>.
      </p>
      <div className="ge-steps">
        <div className="ge-step">
          <div className="ge-step-n num">01</div>
          <div>
            <div className="ge-step-k">Keep reviewing roles</div>
            <div className="ge-step-v">Each decision adds to the pattern.</div>
          </div>
        </div>
        <div className="ge-step">
          <div className="ge-step-n num">02</div>
          <div>
            <div className="ge-step-k">Apply to the ones that fit</div>
            <div className="ge-step-v">Response times form the clearest signals.</div>
          </div>
        </div>
        <div className="ge-step">
          <div className="ge-step-n num">03</div>
          <div>
            <div className="ge-step-k">Come back in a week</div>
            <div className="ge-step-v">Most early patterns surface in 10–15 decisions.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tweaks
// ─────────────────────────────────────────────────────────────────────────────
function Tweaks({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Data state</span>
        <div className="tweak-btn-group">
          {['early', 'active', 'heavy'].map(k => (
            <button key={k} className={cn(tweaks.dataState === k && 'on')} onClick={() => set('dataState', k)}>{k}</button>
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
        <span className="tweak-k">Visuals</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.showVisuals && 'on')} onClick={() => set('showVisuals', true)}>show</button>
          <button className={cn(!tweaks.showVisuals && 'on')} onClick={() => set('showVisuals', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button
              key={k}
              className={cn('swatch', tweaks.accent === k && 'on')}
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

// ─────────────────────────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweaksRaw] = useState(window.__TWEAKS__);
  const [editMode, setEditMode] = useState(false);
  const [range, setRange] = useState(() => localStorage.getItem('rw.insights.range') || '14d');

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

  useEffect(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  useEffect(() => {
    localStorage.setItem('rw.insights.range', range);
  }, [range]);

  const dataset  = INSIGHTS_DATA[tweaks.dataState] || INSIGHTS_DATA.active;
  const ranges   = dataset.ranges;
  const sections = dataset.sections;

  const rolesSeen = ranges[range].rolesSeen;
  const globallyLowData = rolesSeen < CONFIDENCE_FLOOR;

  const totals = useMemo(() => {
    const all = SECTION_ORDER.flatMap(s => sections[s] || []);
    return {
      total:    all.length,
      strong:   all.filter(i => i.strength === 'strong').length,
      emerging: all.filter(i => i.strength === 'emerging').length,
      early:    all.filter(i => i.strength === 'early').length,
    };
  }, [sections]);

  const densityCls = tweaks.density === 'compact' ? 'density-compact' : '';
  const visualsCls = !tweaks.showVisuals ? 'hide-visuals' : '';

  return (
    <div className={cn('app', densityCls, visualsCls)}>
      <Sidebar current="insights" />
      <main className="main" data-screen-label="Insights">
        <div className="content">
          <PageHeader
            range={range}
            onRange={setRange}
            ranges={ranges}
          />

          <FramingNote />

          <TimeContext range={range} ranges={ranges} />

          {globallyLowData ? (
            <GlobalEmpty rolesSeen={rolesSeen} />
          ) : (
            <>
              <div className="insights-summary">
                <span>
                  <span className="num">{totals.total}</span> observations
                  {totals.strong > 0 && <>, of which <span className="num">{totals.strong}</span> show a clear pattern</>}
                  {totals.emerging > 0 && <>; <span className="num">{totals.emerging}</span> still emerging</>}
                  .
                </span>
              </div>

              {SECTION_ORDER.map(name => (
                <Section
                  key={name}
                  name={name}
                  insights={sections[name] || []}
                  rolesSeen={rolesSeen}
                  globallyLowData={false}
                />
              ))}

              <footer className="insights-foot">
                Observations are drawn from your own decisions. They describe what
                has happened — not what will.
              </footer>
            </>
          )}
        </div>
      </main>

      {editMode && <Tweaks tweaks={tweaks} setTweaks={setTweaks} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
