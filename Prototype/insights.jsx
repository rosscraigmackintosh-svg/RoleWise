// Rolewise — Insights
//
// The "learning layer". Observations derived from behaviour over time, not
// a dashboard. Calm, descriptive, document-first — matches Overview system.

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
function PageHeader({ range, onRange, ranges, subtitleVariant }) {
  const subtext = subtitleVariant === 'emerging'
    ? 'What’s emerging over time'
    : 'Patterns from your job search';

  return (
    <header className="page-header insights-header">
      <div>
        <h1 className="page-title">Insights</h1>
        <p className="page-sub">{subtext}</p>
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
// Insight card
// ─────────────────────────────────────────────────────────────────────────────
function StrengthTag({ s }) {
  if (s === 'strong')   return <span className="tag tag-strong">Clear pattern</span>;
  if (s === 'emerging') return <span className="tag tag-emerging">Emerging pattern</span>;
  if (s === 'early')    return <span className="tag tag-early">Early signal</span>;
  return null;
}

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

  if (v.kind === 'bars') {
    const max = Math.max(...v.bars.map(b => b.v), 1);
    return (
      <div className="vis-bars" aria-hidden="true">
        {v.bars.map(b => (
          <div key={b.k} className="vis-bars-col">
            <div className="vis-bars-track">
              <div
                className="vis-bars-fill"
                style={{ height: (b.v / max * 100) + '%' }}
              />
            </div>
            <div className="vis-bars-k">{b.k}</div>
            <div className="vis-bars-v num">{b.v}</div>
          </div>
        ))}
      </div>
    );
  }

  if (v.kind === 'trend') {
    // small multi-line chart.
    const W = 520, H = 90, P = 8;
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
          {/* baseline */}
          <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="currentColor" strokeOpacity="0.08" />
          {v.series.map((s, i) => (
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
              <span className="vtl-val num">{s.points[s.points.length - 1]}%</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function InsightCard({ insight }) {
  const onEvidence = (e, link) => {
    if (!link) return;
    // Map to Roles / Applications pages (prototype — pages stubbed elsewhere).
    const [page] = link.split(':');
    const dest = page === 'applications' ? 'Applications.html' : 'Roles.html';
    // Don't actually navigate on evidence rows in a prototype — just acknowledge.
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
          <li key={i}
              className={cn('ic-ev', ev.link && 'is-link')}
              onClick={(e) => onEvidence(e, ev.link)}
              role={ev.link ? 'link' : undefined}
              tabIndex={ev.link ? 0 : undefined}>
            <span className="ic-ev-k">{ev.k}</span>
            <span className="ic-ev-v num">{ev.v}</span>
            {ev.link && <span className="ic-ev-arr" aria-hidden="true">→</span>}
          </li>
        ))}
      </ul>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────
function SectionEmpty({ name, rolesSeen }) {
  const isCareer = name === 'Career direction';
  return (
    <div className="section-empty">
      <div className="se-line">Not enough data yet</div>
      <div className="se-note">
        {isCareer
          ? 'Career-direction insights appear after a longer decision history.'
          : `Insights appear once you have around ${CONFIDENCE_FLOOR}+ relevant roles. So far: ${rolesSeen}.`}
      </div>
    </div>
  );
}

function Section({ name, insights, rolesSeen, globallyLowData }) {
  // Gate sections by relevance count — if too little data, show empty state.
  const show = !globallyLowData && insights && insights.length > 0;

  return (
    <section className="insights-section">
      <div className="is-head">
        <h2 className="is-title">{name}</h2>
        {show && insights.length > 0 && (
          <span className="is-count num">{insights.length}</span>
        )}
      </div>

      {show ? (
        <div className="is-cards">
          {insights.map(i => <InsightCard key={i.id} insight={i} />)}
        </div>
      ) : (
        <SectionEmpty name={name} rolesSeen={rolesSeen} />
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
        <span className="tweak-k">Subtitle</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.subtitle === 'patterns' && 'on')} onClick={() => set('subtitle', 'patterns')}>patterns</button>
          <button className={cn(tweaks.subtitle === 'emerging' && 'on')} onClick={() => set('subtitle', 'emerging')}>emerging</button>
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

  // Edit-mode protocol (register listener FIRST, then announce).
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

  const dataset = INSIGHTS_DATA[tweaks.dataState] || INSIGHTS_DATA.active;
  const ranges = dataset.ranges;
  const sections = dataset.sections;

  const rolesSeen = ranges[range].rolesSeen;
  const globallyLowData = rolesSeen < CONFIDENCE_FLOOR;

  // Count insights across sections (strong only, for header meta).
  const totals = useMemo(() => {
    const all = SECTION_ORDER.flatMap(s => sections[s] || []);
    return {
      total: all.length,
      strong: all.filter(i => i.strength === 'strong').length,
      emerging: all.filter(i => i.strength === 'emerging').length,
      early: all.filter(i => i.strength === 'early').length,
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
            subtitleVariant={tweaks.subtitle}
          />

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
                Observations are drawn from your own decisions. They describe what has
                happened — not what will.
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
