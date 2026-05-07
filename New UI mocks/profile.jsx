// Profile page — a reflection layer.
// Shows how Rolewise interprets the user based on behaviour + preferences.
// Not a CV, not settings. Every section is derived, inferred, or confirmed,
// and every section has a quiet "Adjust" entry point back to Settings.

const { useState: useStateP, useEffect: useEffectP, useMemo: useMemoP } = React;

function cnP(...xs) { return xs.filter(Boolean).join(' '); }

// --- Sidebar ---
function SidebarP({ current, counts }) {
  return renderSidebar({ current, counts });
}

// --- Small source tag ---
// "confirmed" · "inferred" · "tentative" — tiny monospace caption.
function SourceTag({ source }) {
  if (!source) return null;
  const cls = source === 'confirmed' ? 'src-confirmed'
            : source === 'tentative' ? 'src-tentative'
            : 'src-inferred';
  return <span className={cnP('pr-src', cls)}>{source}</span>;
}

// --- Section shell ---
function PSection({ eyebrow, title, lede, adjust, children, muted }) {
  return (
    <section className={cnP('pr-section', muted && 'is-muted')}>
      <div className="pr-sec-head">
        <div className="pr-sec-head-left">
          {eyebrow && <div className="pr-sec-eyebrow">{eyebrow}</div>}
          <h2 className="pr-sec-title">{title}</h2>
          {lede && <p className="pr-sec-lede">{lede}</p>}
        </div>
        {adjust && (
          <button className="pr-adjust" onClick={adjust.onClick}>
            {adjust.label}
            <span className="pr-adjust-arrow" aria-hidden>↗</span>
          </button>
        )}
      </div>
      <div className="pr-sec-body">{children}</div>
    </section>
  );
}

// --- Identity header ---
function IdentityHeader({ identity, onEdit }) {
  return (
    <header className="pr-identity">
      <div className="pr-id-left">
        <div className="pr-id-name-row">
          <h1 className="pr-id-name">{identity.name}</h1>
        </div>
        <div className="pr-id-title-row">
          <span className="pr-id-title">{identity.title}</span>
          <SourceTag source={identity.titleSource} />
        </div>
        <p className="pr-id-descriptor">{identity.descriptor}</p>
      </div>
      <div className="pr-id-right">
        <button className="pr-edit-profile" onClick={onEdit}>
          Edit profile
          <span className="pr-adjust-arrow" aria-hidden>↗</span>
        </button>
      </div>
    </header>
  );
}

// --- Core summary ---
function CoreSummary({ summary, onAdjust }) {
  const rows = [
    { k: 'Seniority',    v: summary.seniority.label, d: summary.seniority.detail, s: summary.seniority.source },
    { k: 'Role types',   v: summary.roleTypes.label, d: null,                      s: summary.roleTypes.source },
    { k: 'Domains',      v: summary.domains.label,   d: null,                      s: summary.domains.source },
    { k: 'Work model',   v: summary.workModel.label, d: summary.workModel.detail,  s: summary.workModel.source },
  ];
  return (
    <PSection
      eyebrow="01 — Summary"
      title="Core profile"
      lede="A synthesis of how you describe yourself and how you behave — not your raw settings."
      adjust={{ label: 'Adjust summary', onClick: onAdjust }}
    >
      <dl className="pr-summary">
        {rows.map((r, i) => (
          <div className="pr-sum-row" key={i}>
            <dt className="pr-sum-k">{r.k}</dt>
            <dd className="pr-sum-v">
              <span className="pr-sum-main">{r.v}</span>
              {r.d && <span className="pr-sum-detail"> · {r.d}</span>}
              <SourceTag source={r.s} />
            </dd>
          </div>
        ))}
      </dl>
    </PSection>
  );
}

// --- Preference signals ---
function PreferenceSignals({ preferences, onAdjust }) {
  const blocks = [
    { key: 'strong', label: 'Strong preferences', sub: 'Consistent across behaviour + settings', items: preferences.strong, mark: 'strong' },
    { key: 'open',   label: 'Open to',            sub: 'Context-dependent',                      items: preferences.open,   mark: 'open' },
    { key: 'avoids', label: 'Avoids',             sub: 'Frequently skipped or filtered out',     items: preferences.avoids, mark: 'avoid' },
  ];
  return (
    <PSection
      eyebrow="02 — Preferences"
      title="What you consistently prefer"
      lede={preferences.tentative
        ? "Early signal — a few roles is enough to begin, but these will sharpen with more data."
        : "Read across your saved, applied, and skipped roles."}
      adjust={{ label: 'Adjust preferences', onClick: onAdjust }}
    >
      <div className="pr-pref-grid">
        {blocks.map(b => (
          <div className={cnP('pr-pref-block', `is-${b.mark}`)} key={b.key}>
            <div className="pr-pref-head">
              <span className={cnP('pr-pref-mark', `is-${b.mark}`)} />
              <span className="pr-pref-label">{b.label}</span>
            </div>
            <div className="pr-pref-sub">{b.sub}</div>
            {b.items.length > 0 ? (
              <ul className="pr-pref-list">
                {b.items.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            ) : (
              <div className="pr-pref-empty">None yet</div>
            )}
          </div>
        ))}
      </div>
    </PSection>
  );
}

// --- Behaviour patterns ---
function BehaviourPatterns({ behaviour, onAdjust }) {
  return (
    <PSection
      eyebrow="03 — Behaviour"
      title="Patterns across your decisions"
      lede={<>Read from your last <span className="num">{behaviour.sampleSize}</span> role interactions.</>}
      adjust={{ label: 'See raw decisions', onClick: onAdjust }}
    >
      <div className="pr-behav">
        <div className="pr-behav-block">
          <div className="pr-behav-lead">
            You tend to <strong>apply</strong> to roles that:
          </div>
          <ul className="pr-behav-list is-apply">
            {behaviour.applies.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
        <div className="pr-behav-block">
          <div className="pr-behav-lead">
            You tend to <strong>skip</strong> roles that:
          </div>
          <ul className="pr-behav-list is-skip">
            {behaviour.skips.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      </div>
    </PSection>
  );
}

// --- Career context (adjacency) ---
function CareerContext({ adjacency, onAdjust }) {
  return (
    <PSection
      eyebrow="04 — Context"
      title="Where you sit relative to the roles you see"
      lede="Most engagement clusters around roles close to your current shape."
      adjust={{ label: 'Broaden or narrow', onClick: onAdjust }}
    >
      <div className="pr-adj">
        <div className="pr-adj-col">
          <div className="pr-adj-head">
            <span className="pr-adj-dot is-typical" />
            <span className="pr-adj-k">Most roles you engage with are</span>
          </div>
          <ul className="pr-adj-list">
            {adjacency.typical.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
        {adjacency.atypical.length > 0 && (
          <div className="pr-adj-col">
            <div className="pr-adj-head">
              <span className="pr-adj-dot is-atypical" />
              <span className="pr-adj-k">Less typical moves</span>
            </div>
            <ul className="pr-adj-list is-muted">
              {adjacency.atypical.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        )}
      </div>
    </PSection>
  );
}

// --- Outcome signals ---
function OutcomeSignals({ outcomes }) {
  if (!outcomes) return null;
  return (
    <PSection
      eyebrow="05 — Outcomes"
      title="How these patterns play out"
      lede="Descriptive, not predictive — a look at what's happened so far."
    >
      <div className="pr-outcomes">
        <div className="pr-out-row">
          <div className="pr-out-n num">{outcomes.matching.n}</div>
          <div className="pr-out-body">
            <div className="pr-out-note">{outcomes.matching.note}</div>
            <div className="pr-out-detail">{outcomes.matching.detail}</div>
          </div>
          <div className="pr-out-arrow" aria-hidden>→</div>
          <div className="pr-out-end pr-out-end-pos">reached interview</div>
        </div>
        <div className="pr-out-row is-muted">
          <div className="pr-out-n num">{outcomes.outside.n}</div>
          <div className="pr-out-body">
            <div className="pr-out-note">{outcomes.outside.note}</div>
            <div className="pr-out-detail">{outcomes.outside.detail}</div>
          </div>
          <div className="pr-out-arrow" aria-hidden>→</div>
          <div className="pr-out-end">no progression</div>
        </div>
      </div>
    </PSection>
  );
}

// --- Empty state (for early / not enough data) ---
function EmptyProfile() {
  return (
    <div className="pr-empty">
      <div className="pr-empty-mark" />
      <div className="pr-empty-title">Not enough data yet</div>
      <div className="pr-empty-sub">
        Your profile will become clearer as you review roles. A few dozen interactions is usually enough for patterns to surface.
      </div>
    </div>
  );
}

// --- Tweaks ---
function TweaksP({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Data state</span>
        <div className="tweak-btn-group">
          {['early', 'active', 'heavy'].map(k => (
            <button key={k} className={cnP(tweaks.dataState === k && 'on')} onClick={() => set('dataState', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Show outcomes</span>
        <div className="tweak-btn-group">
          <button className={cnP(tweaks.showOutcomes && 'on')} onClick={() => set('showOutcomes', true)}>show</button>
          <button className={cnP(!tweaks.showOutcomes && 'on')} onClick={() => set('showOutcomes', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Source tags</span>
        <div className="tweak-btn-group">
          <button className={cnP(tweaks.showSources && 'on')} onClick={() => set('showSources', true)}>show</button>
          <button className={cnP(!tweaks.showSources && 'on')} onClick={() => set('showSources', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button
              key={k}
              className={cnP('swatch', tweaks.accent === k && 'on')}
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
function StubPageP({ name }) {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="page-sub">Placeholder — this design focuses on Profile.</p>
        </div>
      </div>
      <div className="stub-page">
        <h2>{name}</h2>
        <p style={{ marginTop: 10 }}>Use the sidebar to return to Profile.</p>
      </div>
    </div>
  );
}

// --- Root ---
function AppP() {
  const [page, setPage] = useStateP('profile');
  const [tweaks, setTweaksRaw] = useStateP(window.__TWEAKS__);
  const [editMode, setEditMode] = useStateP(false);
  const [toast, setToast] = useStateP(null);

  useEffectP(() => {
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
  useEffectP(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  // Source-tag visibility
  useEffectP(() => {
    document.documentElement.dataset.sources = tweaks.showSources ? 'on' : 'off';
  }, [tweaks.showSources]);

  const profile = PROFILE_DATA[tweaks.dataState] || PROFILE_DATA.active;
  const isEarly = tweaks.dataState === 'early';

  const navCounts = useMemoP(() => ({
    roles: tweaks.dataState === 'heavy' ? 203 : tweaks.dataState === 'early' ? 5 : 48,
    applications: tweaks.dataState === 'heavy' ? 51 : tweaks.dataState === 'early' ? 2 : 11,
    recruiters: tweaks.dataState === 'heavy' ? 18 : tweaks.dataState === 'early' ? 1 : 7,
  }), [tweaks.dataState]);

  const ping = (m) => {
    setToast(m);
    setTimeout(() => setToast(null), 1600);
  };

  const goSettings = (what) => ping(`Settings → ${what}`);

  const profileContent = (
    <div className="content">
      <IdentityHeader identity={profile.identity} onEdit={() => goSettings('Edit profile')} />

      {isEarly ? (
        <>
          <CoreSummary summary={profile.summary} onAdjust={() => goSettings('Core profile')} />
          <EmptyProfile />
        </>
      ) : (
        <>
          <CoreSummary summary={profile.summary} onAdjust={() => goSettings('Core profile')} />
          <PreferenceSignals preferences={profile.preferences} onAdjust={() => goSettings('Role preferences')} />
          <BehaviourPatterns behaviour={profile.behaviour} onAdjust={() => goSettings('Decision history')} />
          <CareerContext adjacency={profile.adjacency} onAdjust={() => goSettings('Adjacency boundaries')} />
          {tweaks.showOutcomes && <OutcomeSignals outcomes={profile.outcomes} />}
        </>
      )}

      <footer className="pr-foot">
        <div className="pr-foot-lede">
          This is how your decisions describe you — not who you are.
        </div>
        <div className="pr-foot-sub">
          Adjust any section above, or <button className="pr-foot-link" onClick={() => goSettings('All preferences')}>review all preferences in Settings</button>.
        </div>
      </footer>
    </div>
  );

  return (
    <div className="app">
      <SidebarP current={page} onNav={setPage} counts={navCounts} />
      <main className="main" data-screen-label="Profile">
        {page === 'profile' ? profileContent : (
          <StubPageP name={
            [...NAV_PRIMARY, ...NAV_SECONDARY, { key: 'profile', label: 'Profile' }]
              .find(n => n.key === page)?.label || 'Page'
          } />
        )}
      </main>

      {editMode && <TweaksP tweaks={tweaks} setTweaks={setTweaks} />}
      {toast && <div className="rl-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppP />);
