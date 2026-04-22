// Documents page — CV variants with usage + linked applications.
// Designed as a thin layer on the shared Rolewise system. Focus is on
// giving each CV variant context: how it's been used, where it's in play.

const { useState: useStateD, useEffect: useEffectD, useMemo: useMemoD } = React;

function cnD(...xs) { return xs.filter(Boolean).join(' '); }

// --- Sidebar ---
function SidebarD({ current, counts }) {
  return renderSidebar({ current, counts });
}

// --- Header ---
function HeaderD({ cvCount, onAdd }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">Documents</h1>
        <p className="page-sub">
          <span className="num">{cvCount}</span> CV variants — tuned per role shape.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={onAdd}>
          New variant
        </button>
      </div>
    </header>
  );
}

// --- Overview row ---
function OverviewD({ overview }) {
  return (
    <div className="dc-overview">
      <div className="dc-ov-item">
        <span className="dc-ov-v num">{overview.total}</span>
        <span className="dc-ov-k">variants</span>
      </div>
      <span className="dc-ov-sep" />
      <div className="dc-ov-item">
        <span className="dc-ov-v num">{overview.inUse}</span>
        <span className="dc-ov-k">currently in use</span>
      </div>
      <span className="dc-ov-sep" />
      <div className="dc-ov-item">
        <span className="dc-ov-v num">{overview.applications}</span>
        <span className="dc-ov-k">applications sent</span>
      </div>
      <span className="dc-ov-sep" />
      <div className="dc-ov-item">
        <span className="dc-ov-v num">{overview.interviews}</span>
        <span className="dc-ov-k">reached interview</span>
      </div>
    </div>
  );
}

// --- Sort bar ---
function SortRow({ sort, onChange, total }) {
  const current = DOCUMENT_SORTS.find(s => s.key === sort) || DOCUMENT_SORTS[0];
  const [open, setOpen] = useStateD(false);
  return (
    <div className="dc-sort-row">
      <div className="dc-sort-left">
        <span className="num">{total}</span> shown
      </div>
      <div style={{ position: 'relative' }}>
        <button className="dc-sort" onClick={() => setOpen(o => !o)}>
          <span>Sorted by</span>
          <span className="dc-sort-v">{current.label}</span>
          <span className="dc-sort-caret" />
        </button>
        {open && (
          <div
            style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4,
              background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
              borderRadius: 8, padding: 4, minWidth: 200, zIndex: 10,
              boxShadow: '0 8px 24px oklch(20% 0.01 80 / 0.08)',
            }}
          >
            {DOCUMENT_SORTS.map(s => (
              <button
                key={s.key}
                onClick={() => { onChange(s.key); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', border: 'none', borderRadius: 5,
                  background: s.key === sort ? 'var(--bg-hover)' : 'transparent',
                  color: s.key === sort ? 'var(--ink-heading)' : 'var(--ink-muted)',
                  fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: s.key === sort ? 500 : 400,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Linked app row ---
function LinkedApp({ app, idx }) {
  const tone = LOGO_TONES[idx % LOGO_TONES.length];
  const short = app.company.slice(0, 2);
  return (
    <div className="dc-linked-item">
      <div className="dc-linked-dot" style={{ background: tone.bg, color: tone.fg }}>{short}</div>
      <div className="dc-linked-main">
        <span className="dc-linked-co">{app.company}</span>
        <span className="dc-linked-sep">·</span>
        {app.role}
      </div>
      <div className="dc-linked-stage">{app.stage}</div>
    </div>
  );
}

// --- CV card ---
function DocumentCard({ doc, onAction, showOutcome, compact }) {
  const hasInterview = doc.usage.reachedInterview > 0;
  return (
    <article
      className={cnD('dc-card', `group-${doc.group}`, compact && 'is-compact')}
      tabIndex={0}
      onClick={() => onAction(doc, 'open')}
    >
      <div className="dc-card-head">
        <div className="dc-identity">
          <div className="dc-title-row">
            <h3 className="dc-title">{doc.name}</h3>
            <span className="dc-title-meta">{doc.updated}</span>
          </div>
          <p className="dc-desc">{doc.description}</p>
        </div>
        <button
          className="dc-primary"
          onClick={(e) => { e.stopPropagation(); onAction(doc, 'edit'); }}
        >
          Open & edit
        </button>
      </div>

      <div className="dc-card-body">
        <div className="dc-usage">
          <div className="dc-usage-row">
            <span className="dc-usage-k">Used in</span>
            <span className="dc-usage-v">
              <span className="num">{doc.usage.applications}</span> {doc.usage.applications === 1 ? 'application' : 'applications'}
              <span style={{ color: 'var(--ink-subtle)' }}> · last sent {doc.usage.lastUsedRel}</span>
            </span>
          </div>
          <div className="dc-usage-row">
            <span className="dc-usage-k">Interviews</span>
            <span className="dc-usage-v">
              <span className="num">{doc.usage.reachedInterview}</span> reached interview
            </span>
          </div>
          {showOutcome && (
            <div className="dc-usage-row">
              <span className="dc-usage-k">Outcome</span>
              <span className={cnD('dc-outcome', !hasInterview && 'is-neutral')}>
                {doc.outcome}
              </span>
            </div>
          )}
        </div>

        <div className="dc-linked">
          <div className="dc-linked-k">Linked applications</div>
          <div className="dc-linked-list">
            {doc.linkedApps.slice(0, 3).map((a, i) => (
              <LinkedApp key={i} app={a} idx={doc.id + i} />
            ))}
            {doc.linkedApps.length > 3 && (
              <div className="dc-linked-more">
                + {doc.linkedApps.length - 3} more
              </div>
            )}
            {doc.linkedApps.length === 0 && (
              <div className="dc-linked-more" style={{ paddingLeft: 0, fontStyle: 'italic' }}>
                Not linked to any applications yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dc-actions" aria-hidden>
        <button className="rl-act" onClick={(e) => { e.stopPropagation(); onAction(doc, 'duplicate'); }}>Duplicate</button>
        <button className="rl-act rl-act-subtle" onClick={(e) => { e.stopPropagation(); onAction(doc, 'download'); }}>Download PDF</button>
        <button className="rl-act rl-act-subtle rl-act-more" onClick={(e) => { e.stopPropagation(); onAction(doc, 'archive'); }}>
          {doc.group === 'archived' ? 'Restore' : 'Archive'}
        </button>
      </div>
    </article>
  );
}

// --- Group section ---
function GroupSectionD({ group, docs, onAction, showOutcome, compact }) {
  const cfg = DOCUMENT_GROUPS.find(g => g.key === group);
  if (docs.length === 0) return null;
  return (
    <section className="rl-group">
      <div className="rl-group-head">
        <div className="rl-group-left">
          {group === 'active' && <span className="live-dot-sm" style={{ marginRight: 0 }} />}
          <h2 className="rl-group-title">{cfg.label}</h2>
          <span className="rl-group-count num">{docs.length}</span>
        </div>
        <span className="rl-group-hint">{cfg.hint}</span>
      </div>
      <div className="dc-list">
        {docs.map(d => (
          <DocumentCard
            key={d.id}
            doc={d}
            onAction={onAction}
            showOutcome={showOutcome}
            compact={compact}
          />
        ))}
      </div>
    </section>
  );
}

// --- New variant modal ---
function NewVariantModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>New CV variant</h3>
        <p>Duplicate an existing variant or start from scratch.</p>
        <div className="field">
          <label>Variant name</label>
          <input autoFocus placeholder="e.g. Principal Product Designer" />
        </div>
        <div className="field">
          <label>Short description</label>
          <input placeholder="What role shape is this for?" />
        </div>
        <div className="field">
          <label>Start from</label>
          <select defaultValue="blank">
            <option value="blank">Blank variant</option>
            <option>Senior Product Designer</option>
            <option>Founding Product Designer</option>
            <option>Staff Product Designer</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Create variant</button>
        </div>
      </div>
    </div>
  );
}

// --- Tweaks ---
function TweaksD({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Data state</span>
        <div className="tweak-btn-group">
          {['early', 'active', 'heavy'].map(k => (
            <button key={k} className={cnD(tweaks.dataState === k && 'on')} onClick={() => set('dataState', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Density</span>
        <div className="tweak-btn-group">
          {['comfortable', 'compact'].map(k => (
            <button key={k} className={cnD(tweaks.density === k && 'on')} onClick={() => set('density', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Grouping</span>
        <div className="tweak-btn-group">
          <button className={cnD(tweaks.grouped && 'on')} onClick={() => set('grouped', true)}>grouped</button>
          <button className={cnD(!tweaks.grouped && 'on')} onClick={() => set('grouped', false)}>flat</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Show outcome</span>
        <div className="tweak-btn-group">
          <button className={cnD(tweaks.showOutcome && 'on')} onClick={() => set('showOutcome', true)}>show</button>
          <button className={cnD(!tweaks.showOutcome && 'on')} onClick={() => set('showOutcome', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button
              key={k}
              className={cnD('swatch', tweaks.accent === k && 'on')}
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
function StubPageD({ name }) {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="page-sub">Placeholder — this design focuses on Documents.</p>
        </div>
      </div>
      <div className="stub-page">
        <h2>{name}</h2>
        <p style={{ marginTop: 10 }}>Use the sidebar to return to Documents.</p>
      </div>
    </div>
  );
}

// --- Root ---
function AppD() {
  const [page, setPage] = useStateD('documents');
  const [tweaks, setTweaksRaw] = useStateD(window.__TWEAKS__);
  const [editMode, setEditMode] = useStateD(false);
  const [modal, setModal] = useStateD(false);
  const [sort, setSort] = useStateD('recent');
  const [toast, setToast] = useStateD(null);

  // Edit-mode protocol — listener FIRST
  useEffectD(() => {
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
  useEffectD(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  const allDocs = DOCUMENTS_DATA[tweaks.dataState] || DOCUMENTS_DATA.active;

  // Sort
  const sorted = useMemoD(() => {
    const copy = [...allDocs];
    if (sort === 'most') {
      copy.sort((a, b) => b.usage.applications - a.usage.applications);
    } else if (sort === 'updated') {
      // Heuristic: "Updated yesterday" < "Updated 3 days ago" < weeks < months
      const rank = (s) => {
        if (/yesterday|today/i.test(s)) return 0;
        const m = s.match(/(\d+)\s*(day|week|month)/i);
        if (!m) return 999;
        const n = parseInt(m[1], 10);
        const unit = m[2].toLowerCase();
        return unit === 'day' ? n : unit === 'week' ? n * 7 : n * 30;
      };
      copy.sort((a, b) => rank(a.updated) - rank(b.updated));
    } else {
      // recent
      const rank = (s) => {
        if (/today/i.test(s)) return 0;
        if (/yesterday/i.test(s)) return 1;
        const m = s.match(/(\d+)\s*(day|week|month)/i);
        if (!m) return 999;
        const n = parseInt(m[1], 10);
        const unit = m[2].toLowerCase();
        return unit === 'day' ? n : unit === 'week' ? n * 7 : n * 30;
      };
      copy.sort((a, b) => rank(a.usage.lastUsedRel) - rank(b.usage.lastUsedRel));
    }
    return copy;
  }, [allDocs, sort]);

  // Overview totals (uses Applications + Roles sample data for cross-page coherence)
  const overview = useMemoD(() => {
    const total = allDocs.length;
    const inUse = allDocs.filter(d => d.group === 'active').length;
    const applications = allDocs.reduce((s, d) => s + d.usage.applications, 0);
    const interviews = allDocs.reduce((s, d) => s + d.usage.reachedInterview, 0);
    return { total, inUse, applications, interviews };
  }, [allDocs]);

  // Sidebar counts — use Applications data when available so sidebar stays coherent
  const navCounts = useMemoD(() => {
    const ds = (window.APPLICATIONS_DATA && window.APPLICATIONS_DATA[tweaks.dataState]) || [];
    return {
      roles: tweaks.dataState === 'heavy' ? 203 : tweaks.dataState === 'early' ? 5 : 48,
      applications: ds.filter(a => a.group !== 'closed').length || (tweaks.dataState === 'heavy' ? 51 : tweaks.dataState === 'early' ? 2 : 11),
      recruiters: tweaks.dataState === 'heavy' ? 18 : tweaks.dataState === 'early' ? 1 : 7,
    };
  }, [tweaks.dataState]);

  const onAction = (doc, action) => {
    const msg =
      action === 'open'      ? `Opening ${doc.name}`
      : action === 'edit'    ? `Opening ${doc.name} for edit`
      : action === 'duplicate' ? `Duplicated ${doc.name}`
      : action === 'download'  ? `Downloading ${doc.name}.pdf`
      : action === 'archive'   ? `${doc.group === 'archived' ? 'Restored' : 'Archived'} · ${doc.name}`
      : `Action · ${doc.name}`;
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const compact = tweaks.density === 'compact';

  // Build content
  let content;
  if (sorted.length === 0) {
    content = (
      <div className="rl-empty">
        <div className="rl-empty-dot" />
        <div className="rl-empty-title">No CV variants yet</div>
        <div className="rl-empty-sub">Create a variant to tailor your CV for different role shapes.</div>
      </div>
    );
  } else if (tweaks.grouped) {
    content = DOCUMENT_GROUPS.map(g => {
      const subset = sorted.filter(d => d.group === g.key);
      return (
        <GroupSectionD
          key={g.key}
          group={g.key}
          docs={subset}
          onAction={onAction}
          showOutcome={tweaks.showOutcome}
          compact={compact}
        />
      );
    });
  } else {
    content = (
      <section className="rl-group">
        <div className="dc-list">
          {sorted.map(d => (
            <DocumentCard
              key={d.id}
              doc={d}
              onAction={onAction}
              showOutcome={tweaks.showOutcome}
              compact={compact}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="app">
      <SidebarD current={page} onNav={setPage} counts={navCounts} />
      <main className="main" data-screen-label="Documents">
        {page === 'documents' ? (
          <div className="content">
            <HeaderD cvCount={allDocs.length} onAdd={() => setModal(true)} />
            <OverviewD overview={overview} />
            <SortRow sort={sort} onChange={setSort} total={sorted.length} />
            <div className="rl-sections">{content}</div>
          </div>
        ) : (
          <StubPageD name={NAV_PRIMARY.concat(NAV_SECONDARY).find(n => n.key === page)?.label || 'Page'} />
        )}
      </main>

      {modal && <NewVariantModal onClose={() => setModal(false)} />}
      {editMode && <TweaksD tweaks={tweaks} setTweaks={setTweaks} />}
      {toast && <div className="rl-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppD />);
