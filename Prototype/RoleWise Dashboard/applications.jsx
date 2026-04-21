// Applications list page — timeline-centric, not table-like.
// Each application card shows a real mini-timeline of events, grouped by current reality.

const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

function cnA(...xs) { return xs.filter(Boolean).join(' '); }

function AppLogo({ short, idx }) {
  const tone = LOGO_TONES[idx % LOGO_TONES.length];
  return (
    <div className="rl-logo" style={{ background: tone.bg, color: tone.fg }}>{short}</div>
  );
}

// --- Sidebar ---
function SidebarA({ current, counts }) {
  return renderSidebar({ current, counts });
}

// --- Header ---
function HeaderA({ activeCount, onAddManual }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">Applications</h1>
        <p className="page-sub">
          <span className="num">{activeCount}</span> active applications
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={onAddManual}>
          Add manually
        </button>
      </div>
    </header>
  );
}

// --- Light summary (inline, calm, not a dashboard) ---
function SummaryA({ summary }) {
  return (
    <div className="ap-summary">
      <div className="ap-sum-item">
        <span className="ap-sum-v num">{summary.total}</span>
        <span className="ap-sum-k">total applied</span>
      </div>
      <span className="ap-sum-sep" />
      <div className="ap-sum-item">
        <span className="ap-sum-v num">{summary.inProcess}</span>
        <span className="ap-sum-k">in process</span>
      </div>
      <span className="ap-sum-sep" />
      <div className="ap-sum-item">
        <span className="ap-sum-v num">{summary.awaiting}</span>
        <span className="ap-sum-k">awaiting response</span>
      </div>
      <span className="ap-sum-sep" />
      <div className="ap-sum-item">
        <span className="ap-sum-v num">{summary.closed}</span>
        <span className="ap-sum-k">closed</span>
      </div>
    </div>
  );
}

// --- Lens bar ---
function LensBarA({ lens, onChange, counts }) {
  return (
    <div className="lens-bar">
      {APP_LENSES.map(l => (
        <button
          key={l.key}
          className={cnA('lens', lens === l.key && 'on')}
          onClick={() => onChange(l.key)}
        >
          <span>{l.label}</span>
          <span className="lens-count num">{counts[l.key] ?? 0}</span>
        </button>
      ))}
      <div className="lens-sep" />
      <button className="lens lens-ghost">
        <span>Sorted by</span>
        <span style={{ color: 'var(--ink)' }}>most recently updated</span>
      </button>
    </div>
  );
}

// --- Timeline (the differentiator) ---
function Timeline({ items, dense }) {
  return (
    <ol className={cnA('ap-tl', dense && 'ap-tl-dense')}>
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        return (
          <li
            key={i}
            className={cnA(
              'ap-tl-item',
              it.pending && 'is-pending',
              it.warn && 'is-warn',
              it.upcoming && 'is-upcoming',
              it.live && 'is-live',
              it.closed && 'is-closed',
              it.subtle && 'is-subtle',
              isLast && 'is-last',
            )}
          >
            <span className="ap-tl-rail" aria-hidden />
            <span className="ap-tl-dot" aria-hidden />
            <span className="ap-tl-date num">{it.date}</span>
            <span className="ap-tl-label">
              {it.live && <span className="live-dot-sm" />}
              {it.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// --- Status pill (subtle, right side) ---
function StatusPill({ app }) {
  const kind =
    app.group === 'attention' ? 'attention'
    : app.group === 'progress' ? 'progress'
    : app.group === 'awaiting' ? 'awaiting'
    : 'closed';
  return (
    <div className={cnA('ap-status', `is-${kind}`)}>
      <div className="ap-status-stage">
        {kind === 'progress' && <span className="live-dot-sm" />}
        {app.stage}
      </div>
      {app.status && (
        <div className="ap-status-sub">{app.status}</div>
      )}
    </div>
  );
}

// --- Application card (core unit) ---
function ApplicationCard({ app, idx, onAction, showCV, timelineMode }) {
  const appliedEvent = app.timeline.find(t => /applied/i.test(t.label));
  return (
    <article
      className={cnA('ap-card', `group-${app.group}`)}
      tabIndex={0}
      onClick={() => onAction(app, 'open')}
    >
      <div className="ap-head">
        <div className="ap-head-logo">
          <AppLogo short={app.short} idx={idx} />
        </div>
        <div className="ap-head-main">
          <div className="ap-title-row">
            <h3 className="ap-title">{app.title}</h3>
            <span className="ap-company">{app.company}</span>
          </div>
          <div className="ap-meta">
            <span>{app.location}</span>
            <span className="sep">·</span>
            <span className={cnA('rl-salary', app.salary === 'Not stated' && 'is-missing')}>
              {app.salary}
            </span>
            {appliedEvent && (
              <>
                <span className="sep">·</span>
                <span>Applied <span className="num">{appliedEvent.date}</span></span>
              </>
            )}
          </div>
        </div>
        <StatusPill app={app} />
      </div>

      <div className="ap-body">
        <Timeline items={app.timeline} dense={timelineMode === 'compact'} />

        <div className="ap-side">
          {showCV && (
            <div className="ap-cv">
              <div className="ap-cv-k">CV used</div>
              <div className="ap-cv-v">{app.cv}</div>
            </div>
          )}
          <div className="ap-response">
            <div className="ap-resp-row">
              <span className="ap-resp-k">First response</span>
              <span className="ap-resp-v num">{app.firstResponse ?? '—'}</span>
            </div>
            <div className="ap-resp-row">
              <span className="ap-resp-k">Last activity</span>
              <span className="ap-resp-v num">{app.lastActivity}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ap-actions" aria-hidden>
        <button className="rl-act" onClick={(e) => { e.stopPropagation(); onAction(app, 'move'); }}>Move stage</button>
        <button className="rl-act rl-act-subtle" onClick={(e) => { e.stopPropagation(); onAction(app, 'note'); }}>Add note</button>
        <button className="rl-act rl-act-subtle rl-act-more" onClick={(e) => { e.stopPropagation(); onAction(app, 'close'); }}>Mark closed</button>
      </div>
    </article>
  );
}

// --- Group section ---
function GroupSectionA({ group, apps, startIdx, onAction, showCV, timelineMode, emptyAll }) {
  const cfg = APP_GROUPS.find(g => g.key === group);
  if (apps.length === 0) {
    // Only show per-group empty state when user isn't filtered down to zero overall
    if (emptyAll) return null;
    return (
      <section className="rl-group">
        <div className="rl-group-head">
          <div className="rl-group-left">
            <h2 className="rl-group-title">{cfg.label}</h2>
            <span className="rl-group-count num">0</span>
          </div>
          <span className="rl-group-hint">{cfg.hint}</span>
        </div>
        <div className="ap-group-empty">Nothing here right now</div>
      </section>
    );
  }
  return (
    <section className="rl-group">
      <div className="rl-group-head">
        <div className="rl-group-left">
          {group === 'attention' && <span className="rl-group-mark" />}
          {group === 'progress'  && <span className="live-dot-sm" style={{ marginRight: 0 }} />}
          <h2 className="rl-group-title">{cfg.label}</h2>
          <span className="rl-group-count num">{apps.length}</span>
        </div>
        <span className="rl-group-hint">{cfg.hint}</span>
      </div>
      <div className="ap-list">
        {apps.map((a, i) => (
          <ApplicationCard
            key={a.id}
            app={a}
            idx={startIdx + i}
            onAction={onAction}
            showCV={showCV}
            timelineMode={timelineMode}
          />
        ))}
      </div>
    </section>
  );
}

// --- Empty state ---
function EmptyApps({ lens }) {
  const lensLabel = APP_LENSES.find(l => l.key === lens)?.label.toLowerCase();
  return (
    <div className="rl-empty">
      <div className="rl-empty-dot" />
      <div className="rl-empty-title">
        {lens === 'all' ? 'No applications yet' : `Nothing in ${lensLabel}`}
      </div>
      <div className="rl-empty-sub">
        {lens === 'all'
          ? 'Apply to a role to start tracking your progress.'
          : 'Try a different view.'}
      </div>
    </div>
  );
}

// --- Add manual modal ---
function AddManualModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Log an application</h3>
        <p>Record something you applied to outside Rolewise.</p>
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
            <label>Date applied</label>
            <input type="date" />
          </div>
          <div className="field">
            <label>Current stage</label>
            <select defaultValue="applied">
              <option value="applied">Applied</option>
              <option>Recruiter Screen</option>
              <option>Hiring Manager</option>
              <option>Task</option>
              <option>Panel</option>
              <option>Final</option>
              <option>Closed</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>CV variant used</label>
          <select defaultValue="">
            <option value="">Choose…</option>
            <option>Founding Product Designer</option>
            <option>Senior Product Designer</option>
            <option>Platform / Growth Design</option>
            <option>Generalist Product Designer</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Log application</button>
        </div>
      </div>
    </div>
  );
}

// --- Tweaks ---
function TweaksA({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Data state</span>
        <div className="tweak-btn-group">
          {['early', 'active', 'heavy'].map(k => (
            <button key={k} className={cnA(tweaks.dataState === k && 'on')} onClick={() => set('dataState', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Timeline</span>
        <div className="tweak-btn-group">
          {['full', 'compact'].map(k => (
            <button key={k} className={cnA(tweaks.timelineMode === k && 'on')} onClick={() => set('timelineMode', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Grouping</span>
        <div className="tweak-btn-group">
          <button className={cnA(tweaks.grouped && 'on')} onClick={() => set('grouped', true)}>grouped</button>
          <button className={cnA(!tweaks.grouped && 'on')} onClick={() => set('grouped', false)}>flat</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Show CV used</span>
        <div className="tweak-btn-group">
          <button className={cnA(tweaks.showCV && 'on')} onClick={() => set('showCV', true)}>show</button>
          <button className={cnA(!tweaks.showCV && 'on')} onClick={() => set('showCV', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button
              key={k}
              className={cnA('swatch', tweaks.accent === k && 'on')}
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

// --- Stub ---
function StubPageA({ name }) {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="page-sub">Placeholder — this design focuses on Applications.</p>
        </div>
      </div>
      <div className="stub-page">
        <h2>{name}</h2>
        <p style={{ marginTop: 10 }}>Use the sidebar to return to Applications or Roles.</p>
      </div>
    </div>
  );
}

// --- Root ---
function AppA() {
  const [page, setPage] = useStateA('applications');
  const [tweaks, setTweaksRaw] = useStateA(window.__TWEAKS__);
  const [editMode, setEditMode] = useStateA(false);
  const [modal, setModal] = useStateA(false);
  const [lens, setLens] = useStateA('all');
  const [toast, setToast] = useStateA(null);

  // Edit-mode protocol
  useEffectA(() => {
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
  useEffectA(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  const allApps = APPLICATIONS_DATA[tweaks.dataState] || APPLICATIONS_DATA.active;

  // Summary
  const summary = useMemoA(() => ({
    total: allApps.length,
    inProcess: allApps.filter(a => a.group === 'progress').length,
    awaiting: allApps.filter(a => a.group === 'awaiting' || a.group === 'attention').length,
    closed: allApps.filter(a => a.group === 'closed').length,
  }), [allApps]);

  // Counts for lens bar
  const counts = useMemoA(() => {
    const c = { all: allApps.length };
    for (const l of APP_LENSES) {
      if (l.key === 'all') continue;
      c[l.key] = allApps.filter(a => a.group === l.key).length;
    }
    return c;
  }, [allApps]);

  // Sidebar counts
  const navCounts = useMemoA(() => ({
    roles: Math.max(allApps.length + 30, 48),
    applications: allApps.filter(a => a.group !== 'closed').length,
    recruiters: Math.max(1, Math.round(allApps.filter(a => a.group === 'progress').length * 0.8)),
  }), [allApps]);

  // Filtered
  const filtered = useMemoA(() => {
    if (lens === 'all') return allApps;
    return allApps.filter(a => a.group === lens);
  }, [allApps, lens]);

  const onAction = (app, action) => {
    const msg =
      action === 'open' ? `Opening ${app.company} · ${app.title}`
      : action === 'move' ? `Move stage · ${app.company}`
      : action === 'note' ? `Add note · ${app.company}`
      : action === 'close' ? `Mark closed · ${app.company}`
      : `Action · ${app.company}`;
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const activeCount = allApps.filter(a => a.group !== 'closed').length;

  // Build content
  let content;
  if (filtered.length === 0) {
    content = <EmptyApps lens={lens} />;
  } else if (tweaks.grouped && lens === 'all') {
    let idx = 0;
    content = APP_GROUPS.map(g => {
      const subset = filtered.filter(a => a.group === g.key);
      const el = (
        <GroupSectionA
          key={g.key}
          group={g.key}
          apps={subset}
          startIdx={idx}
          onAction={onAction}
          showCV={tweaks.showCV}
          timelineMode={tweaks.timelineMode}
          emptyAll={filtered.length === 0}
        />
      );
      idx += subset.length;
      return el;
    });
  } else {
    content = (
      <section className="rl-group">
        <div className="ap-list">
          {filtered.map((a, i) => (
            <ApplicationCard
              key={a.id}
              app={a}
              idx={i}
              onAction={onAction}
              showCV={tweaks.showCV}
              timelineMode={tweaks.timelineMode}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="app">
      <SidebarA current={page} onNav={setPage} counts={navCounts} />
      <main className="main" data-screen-label="Applications">
        {page === 'applications' ? (
          <div className="content">
            <HeaderA activeCount={activeCount} onAddManual={() => setModal(true)} />
            <SummaryA summary={summary} />
            <LensBarA lens={lens} onChange={setLens} counts={counts} />
            <div className="rl-sections">{content}</div>
          </div>
        ) : (
          <StubPageA name={NAV_PRIMARY.concat(NAV_SECONDARY).find(n => n.key === page)?.label || 'Page'} />
        )}
      </main>

      {modal && <AddManualModal onClose={() => setModal(false)} />}
      {editMode && <TweaksA tweaks={tweaks} setTweaks={setTweaks} />}
      {toast && <div className="rl-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppA />);
