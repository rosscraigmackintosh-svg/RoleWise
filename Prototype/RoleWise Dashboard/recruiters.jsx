// Recruiters — a record of interactions over time.
// Each card is a relationship summary + light timeline, not a contact row.

const { useState: useStateC, useEffect: useEffectC, useMemo: useMemoC } = React;

function cnC(...xs) { return xs.filter(Boolean).join(' '); }

function RecLogo({ short, idx }) {
  const tone = LOGO_TONES[idx % LOGO_TONES.length];
  return (
    <div className="rc-avatar" style={{ background: tone.bg, color: tone.fg }}>{short}</div>
  );
}

// --- Sidebar ---
function SidebarC({ current, counts }) {
  return renderSidebar({ current, counts });
}

// --- Header ---
function HeaderC({ total, onAdd }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">Recruiters</h1>
        <p className="page-sub">People you’ve interacted with</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={onAdd}>
          <span className="plus" /> Add recruiter
        </button>
      </div>
    </header>
  );
}

// --- Light summary row ---
function SummaryRow({ total, active, introduced, interviews }) {
  return (
    <div className="rc-summary">
      <span className="rc-sum-item"><span className="num">{total}</span> recruiters tracked</span>
      <span className="rc-sum-dot" />
      <span className="rc-sum-item"><span className="num">{active}</span> active conversations</span>
      <span className="rc-sum-dot" />
      <span className="rc-sum-item"><span className="num">{introduced}</span> roles introduced</span>
      <span className="rc-sum-dot" />
      <span className="rc-sum-item"><span className="num">{interviews}</span> interviews from recruiters</span>
    </div>
  );
}

// --- Lens (filter) bar ---
function LensBarC({ lens, onChange, counts }) {
  return (
    <div className="lens-bar">
      {RECRUITER_LENSES.map(l => (
        <button
          key={l.key}
          className={cnC('lens', lens === l.key && 'on')}
          onClick={() => onChange(l.key)}
        >
          <span>{l.label}</span>
          <span className="lens-count num">{counts[l.key] ?? 0}</span>
        </button>
      ))}
      <div className="lens-sep" />
      <button className="lens lens-ghost">
        <span>Sorted by</span>
        <span style={{ color: 'var(--ink)' }}>most recently active</span>
      </button>
    </div>
  );
}

// --- Recruiter card ---
function RecCard({ rec, idx, onAction, showTimeline }) {
  const statusStyle =
    rec.group === 'active'  ? 'status-active'
    : rec.group === 'quiet' ? 'status-quiet'
    : rec.group === 'noise' ? 'status-noise'
    : 'status-closed';

  return (
    <article className={cnC('rc-card', `rc-group-${rec.group}`)} tabIndex={0}>
      <div className="rc-col-avatar">
        <RecLogo short={rec.short} idx={idx} />
      </div>

      <div className="rc-col-main">
        <div className="rc-title-row">
          <h3 className="rc-name">{rec.name}</h3>
          <span className="rc-company">
            {rec.company}
            <span className="rc-company-tag"> · {rec.companyNote}</span>
          </span>
        </div>

        <div className="rc-meta">
          <span>via {rec.source}</span>
          <span className="sep">·</span>
          <span>{rec.type}</span>
          <span className="sep">·</span>
          <span>Last contact <span className="num">{rec.lastContact}</span></span>
        </div>

        {/* Summary lines — short, scannable */}
        <ul className="rc-summary-lines">
          {rec.summary.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>

        {/* Role references */}
        {rec.roles && rec.roles.length > 0 && (
          <div className="rc-roles">
            <span className="rc-roles-label">Roles</span>
            <div className="rc-roles-chips">
              {rec.roles.slice(0, 2).map((r, i) => (
                <span key={i} className="rc-role-chip">
                  <span className="rc-role-title">{r.title}</span>
                  <span className="rc-role-sep">·</span>
                  <span className="rc-role-company">{r.company}</span>
                </span>
              ))}
              {rec.rolesMore > 0 && (
                <span className="rc-role-chip rc-role-more">+{rec.rolesMore} more</span>
              )}
            </div>
          </div>
        )}

        {/* Outcome signals */}
        {rec.outcomes && rec.outcomes.length > 0 && (
          <div className="rc-outcomes">
            {rec.outcomes.map((o, i) => (
              <span key={i} className={cnC('rc-outcome', outcomeClass(o))}>
                {o}
              </span>
            ))}
          </div>
        )}

        {/* Light timeline */}
        {showTimeline && rec.timeline && rec.timeline.length > 0 && (
          <div className="rc-timeline">
            {rec.timeline.map((t, i) => (
              <div key={i} className="rc-tl-row">
                <span className="rc-tl-label">{t.label}</span>
                <span className="rc-tl-dot" />
                <span className="rc-tl-when num">{t.when}</span>
              </div>
            ))}
          </div>
        )}

        {rec.note && (
          <div className="rc-note">“{rec.note}”</div>
        )}
      </div>

      <div className="rc-col-status">
        <div className={cnC('rc-status', statusStyle)}>
          {rec.group === 'active' && <span className="live-dot-sm" />}
          {rec.status}
        </div>
      </div>

      <div className="rc-col-actions" aria-hidden>
        <button className="rl-act" onClick={(e) => { e.stopPropagation(); onAction(rec, 'note'); }}>Add note</button>
        <button className="rl-act" onClick={(e) => { e.stopPropagation(); onAction(rec, 'link'); }}>Link role</button>
        <button className="rl-act rl-act-more" onClick={(e) => { e.stopPropagation(); onAction(rec, 'more'); }}>···</button>
      </div>
    </article>
  );
}

function outcomeClass(o) {
  const s = o.toLowerCase();
  if (s.includes('interview') || s.includes('offer') || s.includes('panel') || s.includes('screen book')) return 'rc-outcome-pos';
  if (s.includes('no response') || s.includes('not relevant') || s.includes('withdrew')) return 'rc-outcome-neg';
  return 'rc-outcome-neutral';
}

// --- Group section ---
function RecGroupSection({ group, recs, startIdx, onAction, showTimeline }) {
  const cfg = RECRUITER_GROUPS.find(g => g.key === group);
  return (
    <section className="rl-group">
      <div className="rl-group-head">
        <div className="rl-group-left">
          {group === 'active' && <span className="live-dot-sm" style={{ marginRight: 0 }} />}
          {group === 'noise'  && <span className="rl-group-mark" style={{ background: 'oklch(72% 0.01 80)' }} />}
          <h2 className="rl-group-title">{cfg.label}</h2>
          <span className="rl-group-count num">{recs.length}</span>
        </div>
        <span className="rl-group-hint">{cfg.hint}</span>
      </div>
      {recs.length === 0 ? (
        <div className="rc-group-empty">Nothing here right now</div>
      ) : (
        <div className="rl-list">
          {recs.map((r, i) => (
            <RecCard
              key={r.id}
              rec={r}
              idx={startIdx + i}
              onAction={onAction}
              showTimeline={showTimeline}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// --- Empty state ---
function EmptyRecruiters({ onAdd }) {
  return (
    <div className="rl-empty">
      <div className="rl-empty-dot" />
      <div className="rl-empty-title">No recruiters yet</div>
      <div className="rl-empty-sub">Recruiter interactions will appear here as they happen.</div>
      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={onAdd}>
        <span className="plus" /> Add recruiter
      </button>
    </div>
  );
}

// --- Add recruiter modal ---
function AddRecruiterModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Add a recruiter</h3>
        <p>Track a recruiter you’ve spoken with. You can add context later.</p>
        <div className="field">
          <label>Name</label>
          <input autoFocus placeholder="e.g. Amara Okafor" />
        </div>
        <div className="field">
          <label>Company</label>
          <input placeholder="e.g. Linear, or an agency" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Type</label>
            <select defaultValue="Internal">
              <option>Internal</option>
              <option>Agency</option>
            </select>
          </div>
          <div className="field">
            <label>Source</label>
            <select defaultValue="">
              <option value="">Choose…</option>
              <option>LinkedIn</option>
              <option>Email</option>
              <option>Referral</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>
  );
}

// --- Tweaks ---
function TweaksC({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Data state</span>
        <div className="tweak-btn-group">
          {['early', 'active', 'heavy'].map(k => (
            <button key={k} className={cnC(tweaks.dataState === k && 'on')} onClick={() => set('dataState', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Density</span>
        <div className="tweak-btn-group">
          {['comfortable', 'compact'].map(k => (
            <button key={k} className={cnC(tweaks.density === k && 'on')} onClick={() => set('density', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Timeline</span>
        <div className="tweak-btn-group">
          <button className={cnC(tweaks.showTimeline && 'on')} onClick={() => set('showTimeline', true)}>show</button>
          <button className={cnC(!tweaks.showTimeline && 'on')} onClick={() => set('showTimeline', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Grouping</span>
        <div className="tweak-btn-group">
          <button className={cnC(tweaks.grouped && 'on')} onClick={() => set('grouped', true)}>grouped</button>
          <button className={cnC(!tweaks.grouped && 'on')} onClick={() => set('grouped', false)}>flat</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button
              key={k}
              className={cnC('swatch', tweaks.accent === k && 'on')}
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
function StubPageC({ name }) {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="page-sub">Placeholder — this design focuses on Recruiters.</p>
        </div>
      </div>
      <div className="stub-page">
        <h2>{name}</h2>
        <p style={{ marginTop: 10 }}>Use the sidebar to return to Recruiters.</p>
      </div>
    </div>
  );
}

// --- Root ---
function AppC() {
  const [page, setPage] = useStateC('recruiters');
  const [tweaks, setTweaksRaw] = useStateC(window.__TWEAKS__);
  const [editMode, setEditMode] = useStateC(false);
  const [modal, setModal] = useStateC(false);
  const [lens, setLens] = useStateC('all');
  const [toast, setToast] = useStateC(null);

  useEffectC(() => {
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

  useEffectC(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  const all = RECRUITERS_DATA[tweaks.dataState] || RECRUITERS_DATA.active;

  const counts = useMemoC(() => {
    const c = { all: all.length };
    for (const l of RECRUITER_LENSES) {
      if (l.key === 'all') continue;
      c[l.key] = all.filter(r => r.group === l.key).length;
    }
    return c;
  }, [all]);

  const summaryStats = useMemoC(() => {
    const introduced = all.reduce((n, r) => n + (r.introduced || 0), 0);
    const interviews = all.reduce((n, r) => n + (r.reachedInterview || 0), 0);
    const active = all.filter(r => r.group === 'active').length;
    return { total: all.length, active, introduced, interviews };
  }, [all]);

  const navCounts = useMemoC(() => ({
    roles: tweaks.dataState === 'heavy' ? 127 : tweaks.dataState === 'early' ? 3 : 48,
    applications: tweaks.dataState === 'heavy' ? 28 : tweaks.dataState === 'early' ? 1 : 11,
    recruiters: all.length,
  }), [all, tweaks.dataState]);

  const filtered = useMemoC(() => {
    if (lens === 'all') return all;
    return all.filter(r => r.group === lens);
  }, [all, lens]);

  const onAction = (rec, action) => {
    const msg =
      action === 'note' ? `Note added · ${rec.name}`
      : action === 'link' ? `Linked to role · ${rec.name}`
      : `More options · ${rec.name}`;
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const densityCls = tweaks.density === 'compact' ? 'density-compact' : '';

  let content;
  if (all.length === 0) {
    content = <EmptyRecruiters onAdd={() => setModal(true)} />;
  } else if (tweaks.grouped && lens === 'all') {
    let idx = 0;
    content = RECRUITER_GROUPS.map(g => {
      const subset = all.filter(r => r.group === g.key);
      const el = (
        <RecGroupSection
          key={g.key}
          group={g.key}
          recs={subset}
          startIdx={idx}
          onAction={onAction}
          showTimeline={tweaks.showTimeline}
        />
      );
      idx += subset.length;
      return el;
    });
  } else if (filtered.length === 0) {
    content = (
      <section className="rl-group">
        <div className="rc-group-empty rc-group-empty-lone">Nothing here right now</div>
      </section>
    );
  } else {
    content = (
      <section className="rl-group">
        <div className="rl-list">
          {filtered.map((r, i) => (
            <RecCard
              key={r.id}
              rec={r}
              idx={i}
              onAction={onAction}
              showTimeline={tweaks.showTimeline}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className={cnC('app', densityCls)}>
      <SidebarC current={page} onNav={setPage} counts={navCounts} />
      <main className="main" data-screen-label="Recruiters">
        {page === 'recruiters' ? (
          <div className="content">
            <HeaderC total={all.length} onAdd={() => setModal(true)} />
            <SummaryRow {...summaryStats} />
            <LensBarC lens={lens} onChange={setLens} counts={counts} />
            <div className="rl-sections">{content}</div>
          </div>
        ) : (
          <StubPageC name={NAV_PRIMARY.concat(NAV_SECONDARY).find(n => n.key === page)?.label || 'Page'} />
        )}
      </main>

      {modal && <AddRecruiterModal onClose={() => setModal(false)} />}
      {editMode && <TweaksC tweaks={tweaks} setTweaks={setTweaks} />}
      {toast && <div className="rl-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppC />);
