// Roles list page — primary working screen.
// Grouped by "state of reality" (Needs attention → In progress → Applied → Saved → Closed).
// Each row is a small briefing, not a table row.

const { useState: useStateR, useEffect: useEffectR, useMemo: useMemoR } = React;

function cnR(...xs) { return xs.filter(Boolean).join(' '); }

function RoleLogo({ short, idx }) {
  const tone = LOGO_TONES[idx % LOGO_TONES.length];
  return (
    <div className="rl-logo" style={{ background: tone.bg, color: tone.fg }}>{short}</div>
  );
}

// --- Sidebar ---
function SidebarR({ current, counts }) {
  return renderSidebar({ current, counts });
}

// --- Header ---
function HeaderR({ total, onAdd }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">Roles</h1>
        <p className="page-sub">
          <span className="num">{total}</span> roles in your pipeline
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <a className="btn btn-primary" href="AddRole.html" style={{ textDecoration: 'none' }}>
          <span className="plus" /> Add role
        </a>
      </div>
    </header>
  );
}

// --- Lens (filter) bar ---
function LensBar({ lens, onChange, counts }) {
  return (
    <div className="lens-bar">
      {FILTER_LENSES.map(l => (
        <button
          key={l.key}
          className={cnR('lens', lens === l.key && 'on')}
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

// --- Role card ---
function RoleCard({ role, idx, onAction, hoverHint }) {
  const stageStyle =
    role.group === 'attention' ? 'stage-attention'
    : role.group === 'progress' ? 'stage-progress'
    : role.group === 'applied' ? 'stage-applied'
    : role.group === 'saved' ? 'stage-saved'
    : 'stage-closed';

  return (
    <article
      className={cnR('role-card', `group-${role.group}`)}
      tabIndex={0}
    >
      <div className="rl-col-logo">
        <RoleLogo short={role.short} idx={idx} />
      </div>

      <div className="rl-col-main">
        <div className="rl-title-row">
          <h3 className="rl-title">{role.title}</h3>
          <span className="rl-company">{role.company}</span>
        </div>
        <div className="rl-meta">
          <span>{role.location}</span>
          <span className="sep">·</span>
          <span>{role.workModel}</span>
          <span className="sep">·</span>
          <span className={cnR('rl-salary', role.salary === 'Not stated' && 'is-missing')}>{role.salary}</span>
        </div>
        {role.signals && role.signals.length > 0 && (
          <div className="rl-signals">
            {role.signals.slice(0, 2).map((s, i) => (
              <span key={i} className={cnR('rl-signal', role.group === 'attention' && i === 0 && 'rl-signal-warn')}>
                {role.group === 'attention' && i === 0 && <span className="rl-signal-dot" />}
                {s}
              </span>
            ))}
          </div>
        )}
        {role.note && (
          <div className="rl-note">“{role.note}”</div>
        )}
      </div>

      <div className="rl-col-stage">
        <div className={cnR('rl-stage', stageStyle)}>
          {role.group === 'progress' && <span className="live-dot-sm" />}
          {role.stage}
        </div>
        {role.subStage && (
          <div className="rl-substage">{role.subStage}</div>
        )}
        <div className="rl-updated">
          <span className="num">{role.updated}</span>
        </div>
      </div>

      <div className="rl-col-actions" aria-hidden>
        <button className="rl-act" onClick={(e) => { e.stopPropagation(); onAction(role, 'apply'); }} title="Mark applied">Apply</button>
        <button className="rl-act" onClick={(e) => { e.stopPropagation(); onAction(role, 'save'); }} title="Save">Save</button>
        <button className="rl-act rl-act-subtle" onClick={(e) => { e.stopPropagation(); onAction(role, 'skip'); }} title="Skip">Skip</button>
        <button className="rl-act rl-act-more" onClick={(e) => { e.stopPropagation(); onAction(role, 'move'); }} title="Move stage">···</button>
      </div>
    </article>
  );
}

// --- Group section ---
function GroupSection({ group, roles, startIdx, onAction }) {
  const cfg = ROLE_GROUPS.find(g => g.key === group);
  if (roles.length === 0) return null;
  return (
    <section className="rl-group">
      <div className="rl-group-head">
        <div className="rl-group-left">
          {group === 'attention' && <span className="rl-group-mark rl-group-mark-warn" />}
          {group === 'progress'  && <span className="live-dot-sm" style={{ marginRight: 0 }} />}
          <h2 className="rl-group-title">{cfg.label}</h2>
          <span className="rl-group-count num">{roles.length}</span>
        </div>
        <span className="rl-group-hint">{cfg.hint}</span>
      </div>
      <div className="rl-list">
        {roles.map((r, i) => (
          <RoleCard
            key={r.id}
            role={r}
            idx={startIdx + i}
            onAction={onAction}
          />
        ))}
      </div>
    </section>
  );
}

// --- Empty state ---
function EmptyRoles({ lens, onAdd }) {
  const lensLabel = FILTER_LENSES.find(l => l.key === lens)?.label.toLowerCase();
  return (
    <div className="rl-empty">
      <div className="rl-empty-dot" />
      <div className="rl-empty-title">
        {lens === 'all' ? 'No roles added yet' : `No roles in ${lensLabel}`}
      </div>
      <div className="rl-empty-sub">
        {lens === 'all'
          ? 'Add a role you’ve seen and you’ll start to see patterns.'
          : 'Try a different view, or add a new role.'}
      </div>
      {lens === 'all' && (
        <a className="btn btn-primary" href="AddRole.html" style={{ marginTop: 14, textDecoration: 'none', display: 'inline-flex' }}>
          <span className="plus" /> Add role
        </a>
      )}
    </div>
  );
}

// --- Add Role modal (same shape as overview) ---
function AddRoleModalR({ onClose }) {
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
function TweaksR({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Data state</span>
        <div className="tweak-btn-group">
          {['early', 'active', 'heavy'].map(k => (
            <button key={k} className={cnR(tweaks.dataState === k && 'on')} onClick={() => set('dataState', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Density</span>
        <div className="tweak-btn-group">
          {['comfortable', 'compact'].map(k => (
            <button key={k} className={cnR(tweaks.density === k && 'on')} onClick={() => set('density', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Grouping</span>
        <div className="tweak-btn-group">
          <button className={cnR(tweaks.grouped && 'on')} onClick={() => set('grouped', true)}>grouped</button>
          <button className={cnR(!tweaks.grouped && 'on')} onClick={() => set('grouped', false)}>flat</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Context signals</span>
        <div className="tweak-btn-group">
          <button className={cnR(tweaks.showSignals && 'on')} onClick={() => set('showSignals', true)}>show</button>
          <button className={cnR(!tweaks.showSignals && 'on')} onClick={() => set('showSignals', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button
              key={k}
              className={cnR('swatch', tweaks.accent === k && 'on')}
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

// --- Stub for non-roles pages ---
function StubPageR({ name }) {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="page-sub">Placeholder — this design focuses on Roles.</p>
        </div>
      </div>
      <div className="stub-page">
        <h2>{name}</h2>
        <p style={{ marginTop: 10 }}>Use the sidebar to return to Roles or Overview.</p>
      </div>
    </div>
  );
}

// --- Root ---
function AppR() {
  const [page, setPage] = useStateR('roles');
  const [tweaks, setTweaksRaw] = useStateR(window.__TWEAKS__);
  const [editMode, setEditMode] = useStateR(false);
  const [modal, setModal] = useStateR(false);
  const [lens, setLens] = useStateR('all');
  const [toast, setToast] = useStateR(null);

  // Edit-mode protocol
  useEffectR(() => {
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

  // Apply accent
  useEffectR(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  const allRoles = ROLES_DATA[tweaks.dataState] || ROLES_DATA.active;

  // Counts for lens bar
  const counts = useMemoR(() => {
    const c = { all: allRoles.length };
    for (const l of FILTER_LENSES) {
      if (l.key === 'all') continue;
      c[l.key] = allRoles.filter(r => r.group === l.key).length;
    }
    return c;
  }, [allRoles]);

  // Sidebar counts (reused pattern)
  const navCounts = useMemoR(() => ({
    roles: allRoles.length,
    applications: allRoles.filter(r => r.group === 'progress' || r.group === 'applied').length,
    recruiters: Math.max(1, Math.round(allRoles.filter(r => r.group === 'progress').length * 0.6)),
  }), [allRoles]);

  // Filtered set
  const filtered = useMemoR(() => {
    if (lens === 'all') return allRoles;
    return allRoles.filter(r => r.group === lens);
  }, [allRoles, lens]);

  // If not showing signals, strip them
  const displayRoles = useMemoR(() => {
    if (tweaks.showSignals) return filtered;
    return filtered.map(r => ({ ...r, signals: null, note: null }));
  }, [filtered, tweaks.showSignals]);

  const onAction = (role, action) => {
    const msg =
      action === 'apply' ? `Marked as applied · ${role.company}`
      : action === 'save' ? `Saved · ${role.company}`
      : action === 'skip' ? `Skipped · ${role.company}`
      : `Stage options · ${role.company}`;
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const densityCls = tweaks.density === 'compact' ? 'density-compact' : '';

  // Build sections
  let content;
  if (displayRoles.length === 0) {
    content = <EmptyRoles lens={lens} onAdd={() => setModal(true)} />;
  } else if (tweaks.grouped && lens === 'all') {
    let idx = 0;
    content = ROLE_GROUPS.map(g => {
      const subset = displayRoles.filter(r => r.group === g.key);
      const el = (
        <GroupSection
          key={g.key}
          group={g.key}
          roles={subset}
          startIdx={idx}
          onAction={onAction}
        />
      );
      idx += subset.length;
      return el;
    });
  } else {
    content = (
      <section className="rl-group">
        <div className="rl-list">
          {displayRoles.map((r, i) => (
            <RoleCard key={r.id} role={r} idx={i} onAction={onAction} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className={cnR('app', densityCls)}>
      <SidebarR current={page} onNav={setPage} counts={navCounts} />
      <main className="main" data-screen-label="Roles">
        {page === 'roles' ? (
          <div className="content">
            <HeaderR total={allRoles.length} onAdd={() => setModal(true)} />
            <LensBar lens={lens} onChange={setLens} counts={counts} />
            <div className="rl-sections">{content}</div>
          </div>
        ) : (
          <StubPageR name={NAV_PRIMARY.concat(NAV_SECONDARY).find(n => n.key === page)?.label || 'Page'} />
        )}
      </main>

      {modal && <AddRoleModalR onClose={() => setModal(false)} />}
      {editMode && <TweaksR tweaks={tweaks} setTweaks={setTweaks} />}
      {toast && <div className="rl-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppR />);
