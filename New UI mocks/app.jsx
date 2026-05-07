// Main app for Rolewise Overview
const { useState, useEffect, useMemo, useRef } = React;

// --- small helpers ---
function cn(...xs) { return xs.filter(Boolean).join(' '); }

function LogoSq({ short, idx }) {
  const tone = LOGO_TONES[idx % LOGO_TONES.length];
  return (
    <div className="role-logo" style={{ background: tone.bg, color: tone.fg }}>{short}</div>
  );
}

// --- Sidebar ---
function Sidebar({ current, counts }) {
  return renderSidebar({ current, counts });
}

// --- Header ---
function Header({ lastUpdated }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">Overview</h1>
        <p className="page-sub">
          <span className="live-dot" />
          Live · last updated {lastUpdated}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn">This week</button>
        <a className="btn btn-primary" href="AddRole.html" style={{ textDecoration: 'none' }}>
          <span className="plus" /> Add role
        </a>
      </div>
    </header>
  );
}

// --- Pipeline Overview ---
function PipelineOverview({ data, activeFilter, onFilter }) {
  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-title">Activity</h2>
        <span className="sec-sub">What you’ve been doing · click a number to filter</span>
      </div>
      <div className="pipeline-bare">
        {data.map(p => (
          <button
            key={p.key}
            className={cn('pipeline-item-bare', activeFilter === p.key && 'filter-active')}
            onClick={() => onFilter(p.key)}
          >
            <div className="pipeline-num">{p.value}</div>
            <div className="pipeline-label">{p.label}</div>
            <div className="pipeline-delta">{p.delta}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

// --- What's in motion ---
function ActivePipeline({ stages, onStage, activeStage }) {
  const totalMoving = stages.reduce((a, s) => a + s.count, 0);
  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-title">What’s in motion</h2>
        <span className="sec-sub">
          <span className="num">{totalMoving}</span> roles active right now
        </span>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="stages">
          {stages.map(s => (
            <div
              key={s.name}
              className="stage-row"
              onClick={() => s.count > 0 && onStage(s.name)}
              style={{ cursor: s.count > 0 ? 'pointer' : 'default', background: activeStage === s.name ? 'var(--accent-bg)' : undefined }}
            >
              <div>
                <div className="stage-name">
                  {s.count > 0 && <span className="live-dot-sm" />}
                  {s.name}
                </div>
                {s.sub && <div className="stage-meta">{s.sub}</div>}
              </div>
              <div className="stage-last">{s.lastMoved}</div>
              <div className={cn('stage-count', s.count === 0 && 'zero')}>{s.count}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- What's not moving ---
function Response({ r }) {
  return (
    <div className="card">
      <div className="sec-head" style={{ marginBottom: 16 }}>
        <h2 className="sec-title">What’s not moving</h2>
        <span className="sec-sub">Responsiveness</span>
      </div>
      <div className="resp-stack">
        <div className="resp-row">
          <span className="resp-k">Fastest response</span>
          <span className="resp-v"><span className="resp-num">{r.fastest}</span><span className="resp-unit">days</span></span>
        </div>
        <div className="resp-row">
          <span className="resp-k">Average response</span>
          <span className="resp-v"><span className="resp-num">{r.average}</span><span className="resp-unit">days</span></span>
        </div>
        <div className="resp-row">
          <span className="resp-k">No response after 14 days</span>
          <span className="resp-v"><span className="resp-num">{r.noReply}</span><span className="resp-unit">roles</span></span>
        </div>
        {r.waitingLongest && r.waitingLongest !== '—' && (
          <div className="resp-row">
            <span className="resp-k">Longest wait</span>
            <span className="resp-v resp-mono">{r.waitingLongest}</span>
          </div>
        )}
      </div>
      <div className="resp-note-line">{r.note}</div>
    </div>
  );
}

// --- Patterns in the market ---
function Market({ market }) {
  const groups = Object.entries(market);
  return (
    <div className="card">
      <div className="sec-head" style={{ marginBottom: 16 }}>
        <h2 className="sec-title">Patterns in the market</h2>
        <span className="sec-sub">Roles appearing</span>
      </div>
      {groups.map(([label, rows]) => (
        <div key={label} className="market-group">
          <div className="market-label">{label}</div>
          <div className="market-rows">
            {rows.map(row => (
              <div key={row.k}>
                <span className="k">{row.k}</span>
                <span className="v">{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Friction patterns ---
function Risk({ risks }) {
  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-title">Friction patterns</h2>
        <span className="sec-sub">Repeated reasons for skipping</span>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="risk-list">
          {risks.map(r => (
            <div key={r.k}>
              <div className="risk-k"><span className="risk-dot" />{r.k}</div>
              <div className="risk-v">{r.v} {r.v === 1 ? 'role' : 'roles'}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Recent activity ---
function RecentRoles({ roles, count, filter, onClear }) {
  const filterLabel = filter ? (
    filter.kind === 'pipeline'
      ? `Showing ${filter.value.toLowerCase()}`
      : `Showing ${filter.value}`
  ) : null;

  const shown = roles.slice(0, count);

  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-title">Recent activity</h2>
        <span className="sec-sub">Last {shown.length} events</span>
      </div>
      {filter && (
        <div className="filter-note">
          <span>{filterLabel}</span>
          <button onClick={onClear}>Clear filter</button>
        </div>
      )}
      <div className="card" style={{ padding: 0 }}>
        {shown.map((r, i) => (
          <div key={r.id} className="role-row">
            <div className="role-time">{r.when}</div>
            <LogoSq short={r.short} idx={i} />
            <div>
              <div className="role-title">{r.title} <span className="role-company">· {r.company}</span></div>
              <div className="role-meta">
                <span className="role-event">{r.event}</span>
                <span className="sep">·</span>
                <span>{r.location}</span>
                <span className="sep">·</span>
                <span>{r.salary}</span>
              </div>
            </div>
            <div className="role-stage">{r.stage}</div>
            <div className={cn('role-decision', r.decision.toLowerCase())}>{r.decision}</div>
          </div>
        ))}
        {shown.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
            No roles match this filter.
          </div>
        )}
      </div>
    </section>
  );
}

// --- Single observation ---
function Insight({ text }) {
  return (
    <section>
      <div className="insight-bare">
        <div className="insight-label">One thing to notice</div>
        <div className="insight-text">{text}</div>
      </div>
    </section>
  );
}

// --- Add Role modal ---
function AddRoleModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Add a role</h3>
        <p>Track a role you’ve seen. You can add more details later.</p>
        <div className="field">
          <label>Role title</label>
          <input autoFocus placeholder="e.g. Senior Product Designer" />
        </div>
        <div className="field">
          <label>Company</label>
          <input placeholder="e.g. Linear" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Source</label>
            <select defaultValue="">
              <option value="">Choose…</option>
              <option>LinkedIn</option>
              <option>Company site</option>
              <option>Recruiter</option>
              <option>Referral</option>
            </select>
          </div>
          <div className="field">
            <label>Initial decision</label>
            <select defaultValue="saved">
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Save role</button>
        </div>
      </div>
    </div>
  );
}

// --- Tweaks ---
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
      <div className="tweak-row">
        <span className="tweak-k">Market signals</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.showMarket && 'on')} onClick={() => set('showMarket', true)}>show</button>
          <button className={cn(!tweaks.showMarket && 'on')} onClick={() => set('showMarket', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Risk signals</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.showRisk && 'on')} onClick={() => set('showRisk', true)}>show</button>
          <button className={cn(!tweaks.showRisk && 'on')} onClick={() => set('showRisk', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Observation</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.showInsight && 'on')} onClick={() => set('showInsight', true)}>show</button>
          <button className={cn(!tweaks.showInsight && 'on')} onClick={() => set('showInsight', false)}>hide</button>
        </div>
      </div>
    </div>
  );
}

// --- Stub pages for nav ---
function StubPage({ name }) {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="page-sub">Placeholder — this design focuses on Overview.</p>
        </div>
      </div>
      <div className="stub-page">
        <h2>{name}</h2>
        <p style={{ marginTop: 10 }}>Go back to Overview to explore the design.</p>
      </div>
    </div>
  );
}

// --- Root App ---
function App() {
  const [page, setPage] = useState('overview');
  const [tweaks, setTweaksRaw] = useState(window.__TWEAKS__);
  const [editMode, setEditMode] = useState(false);
  const [modal, setModal] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState(null); // pipeline key
  const [stageFilter, setStageFilter] = useState(null);        // stage name

  // Edit-mode protocol
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

  // Apply accent to CSS vars
  useEffect(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  const data = DATASETS[tweaks.dataState] || DATASETS.active;

  const counts = useMemo(() => ({
    roles:        data.pipeline.find(p => p.key === 'applied')?.value || 0,
    applications: data.pipeline.find(p => p.key === 'process')?.value || 0,
    recruiters:   Math.max(1, Math.round((data.pipeline.find(p => p.key === 'process')?.value || 0) * 0.6)),
  }), [data]);

  // Filter recent roles
  const filteredRoles = useMemo(() => {
    let r = data.roles;
    if (pipelineFilter) {
      const map = {
        seen: ['Seen'],
        saved: ['Saved'],
        applied: ['Applied'],
        process: ['Recruiter screen', 'Hiring manager', 'Task', 'Panel', 'Final'],
        closed: ['Closed'],
      };
      const stages = map[pipelineFilter] || [];
      r = r.filter(x => stages.includes(x.stage));
    } else if (stageFilter) {
      r = r.filter(x => x.stage === stageFilter);
    }
    return r;
  }, [data.roles, pipelineFilter, stageFilter]);

  const lastUpdated = '2 min ago';

  const onFilter = (key) => {
    setStageFilter(null);
    setPipelineFilter(pipelineFilter === key ? null : key);
  };
  const onStage = (name) => {
    setPipelineFilter(null);
    setStageFilter(stageFilter === name ? null : name);
  };
  const clearFilter = () => { setPipelineFilter(null); setStageFilter(null); };

  const filterObj = pipelineFilter
    ? { kind: 'pipeline', value: data.pipeline.find(p => p.key === pipelineFilter)?.label || pipelineFilter }
    : stageFilter
    ? { kind: 'stage', value: stageFilter }
    : null;

  const densityCls = tweaks.density === 'compact' ? 'density-compact' : '';

  return (
    <div className={cn('app', densityCls)}>
      <Sidebar current={page} onNav={setPage} counts={counts} />
      <main className="main" data-screen-label="Overview">
        {page === 'overview' ? (
          <div className="content">
            <Header lastUpdated={lastUpdated} />

            <PipelineOverview
              data={data.pipeline}
              activeFilter={pipelineFilter}
              onFilter={onFilter}
            />

            <ActivePipeline
              stages={data.stages}
              onStage={onStage}
              activeStage={stageFilter}
            />

            <section>
              <div className="two-col">
                <Response r={data.response} />
                {tweaks.showMarket && <Market market={data.market} />}
                {!tweaks.showMarket && <div style={{ display: 'none' }} />}
              </div>
            </section>

            {tweaks.showRisk && <Risk risks={data.risks} />}

            <RecentRoles
              roles={filteredRoles}
              count={6}
              filter={filterObj}
              onClear={clearFilter}
            />

            {tweaks.showInsight && <Insight text={data.insight} />}
          </div>
        ) : (
          <StubPage name={NAV_PRIMARY.concat(NAV_SECONDARY).find(n => n.key === page)?.label || 'Page'} />
        )}
      </main>

      {modal && <AddRoleModal onClose={() => setModal(false)} />}
      {editMode && <Tweaks tweaks={tweaks} setTweaks={setTweaks} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
