// Rolewise — Settings
const { useState, useEffect, useMemo, useRef } = React;

function cnS(...xs) { return xs.filter(Boolean).join(' '); }

/* ─────────────── Sidebar ─────────────── */
function SettingsSidebar({ current }) {
  const counts = { roles: 48, applications: 11, recruiters: 7 };
  return renderSidebar({ current, counts });
}

/* ─────────────── Primitives ─────────────── */

function SectionHead({ num, title, desc }) {
  return (
    <div className="settings-sec-head">
      <div className="settings-sec-title">
        <span className="settings-sec-num">{num}</span>
        <span>{title}</span>
      </div>
      {desc && <div className="settings-sec-desc">{desc}</div>}
    </div>
  );
}

/* label+control inline row, matches .resp-row/.market-rows vocabulary */
function Row({ label, help, children, align = 'baseline', first }) {
  return (
    <div className={cnS('s-row', first && 's-row-first')} style={{ alignItems: align }}>
      <div className="s-row-label">
        <div className="s-row-k">{label}</div>
        {help && <div className="s-row-help">{help}</div>}
      </div>
      <div className="s-row-control">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, mono, suffix, prefix, style }) {
  return (
    <div className={cnS('s-input-wrap', mono && 's-input-mono')} style={style}>
      {prefix && <span className="s-input-aff">{prefix}</span>}
      <input
        className="s-input"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {suffix && <span className="s-input-aff s-input-aff-right">{suffix}</span>}
    </div>
  );
}

function Chip({ on, onClick, children, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cnS('s-chip', on && 's-chip-on', tone && `s-chip-${tone}`)}
    >
      {children}
    </button>
  );
}

function ChipGroup({ options, value, onToggle, multi = true }) {
  const selected = multi ? value : [value].filter(Boolean);
  return (
    <div className="s-chips">
      {options.map(o => (
        <Chip key={o} on={selected.includes(o)} onClick={() => onToggle(o)}>{o}</Chip>
      ))}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={cnS('s-toggle', on && 's-toggle-on')}
      onClick={() => onChange(!on)}
    >
      <span className="s-toggle-knob" />
    </button>
  );
}

/* ─────────────── Header ─────────────── */
function Header({ savedNote, subStyle }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">
          {subStyle === 'system' ? 'How Rolewise works for you' : 'Your preferences and account'}
        </p>
      </div>
      <div className="saved-tag">
        <span className="saved-dot" />
        {savedNote}
      </div>
    </header>
  );
}

/* ─────────────── Section 1 — Profile ─────────────── */
function SectionProfile({ s, set, num }) {
  return (
    <section>
      <SectionHead
        num={num}
        title="Profile"
        desc="The basics. Location helps Rolewise match roles to where you are."
      />
      <div className="card card-rows">
        <Row label="Name" first>
          <TextInput value={s.name} onChange={v => set('name', v)} />
        </Row>
        <Row label="Email">
          <TextInput value={s.email} onChange={v => set('email', v)} mono />
        </Row>
        <Row label="Location" help="City, country">
          <TextInput value={s.location} onChange={v => set('location', v)} />
        </Row>
        <Row label="Timezone">
          <TextInput value={s.timezone} onChange={v => set('timezone', v)} mono />
        </Row>
      </div>
    </section>
  );
}

/* ─────────────── Section 2 — Role Preferences (core) ─────────────── */
function SectionRolePrefs({ s, set, num }) {
  const hasHybrid = s.models.includes('Hybrid');

  const toggle = (key, options) => (opt) => {
    const cur = s[key];
    const next = cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt];
    set(key, next);
  };

  // monthly equivalent
  const monthly = s.salaryMin
    ? Math.round(Number(s.salaryMin) / 12).toLocaleString()
    : null;

  return (
    <section>
      <SectionHead
        num={num}
        title="Role preferences"
        desc="This is how Rolewise decides what counts as a fit. Keep it honest — it’ll filter accordingly."
      />
      <div className="card card-rows">
        <Row
          label="Work model"
          help="Where you’ll work from"
          first
        >
          <ChipGroup
            options={WORK_MODEL_OPTIONS}
            value={s.models}
            onToggle={toggle('models')}
          />
        </Row>

        {hasHybrid && (
          <Row label="Office days" help="Maximum per week when hybrid">
            <div className="s-slider-row">
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={s.maxOfficeDays}
                onChange={e => set('maxOfficeDays', Number(e.target.value))}
                className="s-range"
              />
              <div className="s-slider-val">
                <span className="num">{s.maxOfficeDays}</span>
                <span className="s-unit">{s.maxOfficeDays === 1 ? 'day' : 'days'}</span>
              </div>
            </div>
          </Row>
        )}

        <Row label="Employment" help="Both is fine">
          <ChipGroup
            options={EMPLOYMENT_OPTIONS}
            value={s.employment}
            onToggle={toggle('employment')}
          />
        </Row>

        <Row label="Minimum salary" help="Annual, base only">
          <div className="s-comp-row">
            <TextInput
              value={s.salaryMin}
              onChange={v => set('salaryMin', v.replace(/[^0-9]/g, ''))}
              mono
              prefix={s.currency}
              placeholder="0"
              style={{ width: 160 }}
            />
            {monthly && (
              <span className="s-monthly">
                ≈ <span className="num">{s.currency}{monthly}</span>/month
              </span>
            )}
          </div>
        </Row>

        <Row label="Contract day rate" help="Optional">
          <TextInput
            value={s.dayRate}
            onChange={v => set('dayRate', v.replace(/[^0-9]/g, ''))}
            mono
            prefix={s.currency}
            suffix="/ day"
            placeholder="—"
            style={{ width: 180 }}
          />
        </Row>

        <Row label="Seniority">
          <ChipGroup
            options={SENIORITY_OPTIONS}
            value={s.seniority}
            onToggle={toggle('seniority')}
          />
        </Row>

        <Row label="Domains" help="Where you want to work">
          <ChipGroup
            options={DOMAIN_OPTIONS}
            value={s.domains}
            onToggle={toggle('domains')}
          />
        </Row>

        <Row label="Product stage" help="What phase the product is in">
          <ChipGroup
            options={STAGE_OPTIONS}
            value={s.stage}
            onToggle={toggle('stage')}
          />
        </Row>
      </div>
    </section>
  );
}

/* ─────────────── Section 3 — Boundaries ─────────────── */
function SectionBoundaries({ items, setItems, num }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    setItems([...items, v]);
    setDraft('');
    inputRef.current?.focus();
  };

  const remove = (i) => setItems(items.filter((_, idx) => idx !== i));

  return (
    <section>
      <SectionHead
        num={num}
        title="What you won’t compromise on"
        desc="Hard rules. Roles that break these get flagged before you waste time on them."
      />
      <div className="card" style={{ padding: 0 }}>
        <div className="b-list">
          {items.map((t, i) => (
            <div key={i} className="b-row">
              <span className="b-bullet" />
              <span className="b-text">{t}</span>
              <button className="b-remove" onClick={() => remove(i)} aria-label="Remove">×</button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="b-empty">Nothing yet. Add what you’d never agree to below.</div>
          )}
        </div>
        <div className="b-add">
          <span className="b-add-prompt">+</span>
          <input
            ref={inputRef}
            className="b-add-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="e.g. No roles requiring relocation"
          />
          {draft && (
            <button className="b-add-btn" onClick={add}>Add</button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Section 4 — Notifications ─────────────── */
function SectionNotifications({ n, set, num }) {
  return (
    <section>
      <SectionHead
        num={num}
        title="Notifications"
        desc="What Rolewise can send you, and when."
      />
      <div className="card card-rows">
        <Row label="Email" help="Master switch" first>
          <Toggle on={n.email} onChange={v => set('email', v)} />
        </Row>
        <Row label="Role activity" help="When something moves on a tracked role">
          <Toggle
            on={n.email && n.roleActivity}
            onChange={v => set('roleActivity', v)}
          />
        </Row>
        <Row label="Weekly summary" help="A short digest on Sunday evenings">
          <Toggle
            on={n.email && n.weeklySummary}
            onChange={v => set('weeklySummary', v)}
          />
        </Row>
      </div>
    </section>
  );
}

/* ─────────────── Section 5 — Integrations ─────────────── */
function SectionIntegrations({ items, setItems, num }) {
  const toggle = (key) => {
    setItems(items.map(i =>
      i.key === key
        ? { ...i, status: i.status === 'connected' ? 'not-connected' : 'connected' }
        : i
    ));
  };

  return (
    <section>
      <SectionHead
        num={num}
        title="Integrations"
        desc="Optional. Connect other tools so Rolewise has less to guess at."
      />
      <div className="card" style={{ padding: 0 }}>
        {items.map((it, i) => (
          <div key={it.key} className={cnS('intg-row', i === 0 && 'intg-row-first')}>
            <div className="intg-glyph" aria-hidden="true">
              <span>{it.label.slice(0, 2)}</span>
            </div>
            <div className="intg-body">
              <div className="intg-name">{it.label}</div>
              <div className="intg-desc">{it.desc}</div>
            </div>
            <div className="intg-status">
              {it.status === 'connected'
                ? <span className="intg-ok"><span className="intg-ok-dot" />Connected</span>
                : <span className="intg-off">Not connected</span>}
            </div>
            <button
              className={cnS('btn', it.status === 'connected' && 'btn-ghost')}
              onClick={() => toggle(it.key)}
            >
              {it.status === 'connected' ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── Section 6 — Account ─────────────── */
function SectionAccount({ a, num }) {
  return (
    <section>
      <SectionHead
        num={num}
        title="Account"
        desc="Plan, password, and the stuff you rarely need."
      />
      <div className="card card-rows">
        <Row label="Plan" help={`Renews ${a.nextRenewal}`} first>
          <div className="acc-plan">
            <span className="acc-plan-name">{a.plan}</span>
            <button className="btn btn-ghost">Manage billing</button>
          </div>
        </Row>
        <Row label="Password" help="Last changed 4 months ago">
          <button className="btn btn-ghost">Change password</button>
        </Row>
        <Row label="Session">
          <button className="btn btn-ghost">Log out</button>
        </Row>
        <Row label="Delete account" help="Permanent. Removes all your tracked roles and patterns.">
          <button className="btn btn-ghost btn-danger">Delete account</button>
        </Row>
      </div>
    </section>
  );
}

/* ─────────────── Tweaks panel ─────────────── */
function SettingsTweaks({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>

      <div className="tweak-row">
        <span className="tweak-k">Subtitle</span>
        <div className="tweak-btn-group">
          {['preferences', 'system'].map(k => (
            <button key={k} className={cnS(tweaks.subStyle === k && 'on')} onClick={() => set('subStyle', k)}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button key={k}
              className={cnS('swatch', tweaks.accent === k && 'on')}
              style={{ background: v.accent }}
              title={k}
              onClick={() => set('accent', k)}
            />
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <span className="tweak-k">Numbering</span>
        <div className="tweak-btn-group">
          <button className={cnS(tweaks.showNumbers && 'on')} onClick={() => set('showNumbers', true)}>show</button>
          <button className={cnS(!tweaks.showNumbers && 'on')} onClick={() => set('showNumbers', false)}>hide</button>
        </div>
      </div>

      <div className="tweak-row">
        <span className="tweak-k">Density</span>
        <div className="tweak-btn-group">
          {['comfortable', 'compact'].map(k => (
            <button key={k} className={cnS(tweaks.density === k && 'on')} onClick={() => set('density', k)}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <span className="tweak-k">Integrations</span>
        <div className="tweak-btn-group">
          <button className={cnS(tweaks.showIntegrations && 'on')} onClick={() => set('showIntegrations', true)}>show</button>
          <button className={cnS(!tweaks.showIntegrations && 'on')} onClick={() => set('showIntegrations', false)}>hide</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Root ─────────────── */
function App() {
  const [tweaks, setTweaksRaw] = useState(window.__TWEAKS__);
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfileRaw] = useState(SETTINGS_DEFAULTS.profile);
  const [work, setWorkRaw] = useState(SETTINGS_DEFAULTS.work);
  const [boundaries, setBoundaries] = useState(SETTINGS_DEFAULTS.boundaries);
  const [notifs, setNotifsRaw] = useState(SETTINGS_DEFAULTS.notifications);
  const [integrations, setIntegrations] = useState(SETTINGS_DEFAULTS.integrations);
  const account = SETTINGS_DEFAULTS.account;

  const [savedAt, setSavedAt] = useState(Date.now());
  const [savedLabel, setSavedLabel] = useState('All changes saved');

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

  // Apply accent
  useEffect(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  // "Saved" pulse on any change
  const markSaved = () => {
    setSavedLabel('Saving…');
    setSavedAt(Date.now());
    setTimeout(() => setSavedLabel('Saved · just now'), 280);
  };

  // Relative-time tick for saved tag
  useEffect(() => {
    const i = setInterval(() => {
      const secs = Math.round((Date.now() - savedAt) / 1000);
      if (secs < 5) setSavedLabel('Saved · just now');
      else if (secs < 60) setSavedLabel(`Saved · ${secs}s ago`);
      else setSavedLabel(`Saved · ${Math.floor(secs / 60)}m ago`);
    }, 5000);
    return () => clearInterval(i);
  }, [savedAt]);

  const setProfile = (k, v) => { setProfileRaw({ ...profile, [k]: v }); markSaved(); };
  const setWork    = (k, v) => { setWorkRaw({ ...work, [k]: v }); markSaved(); };
  const setNotifs  = (k, v) => {
    // if email turned off, everything collapses
    const next = { ...notifs, [k]: v };
    if (k === 'email' && v === false) {
      next.roleActivity = false; next.weeklySummary = false;
    }
    if (k !== 'email' && v === true) next.email = true;
    setNotifsRaw(next);
    markSaved();
  };
  const setBoundariesSaved = (next) => { setBoundaries(next); markSaved(); };
  const setIntegrationsSaved = (next) => { setIntegrations(next); markSaved(); };

  const densityCls = tweaks.density === 'compact' ? 'density-compact' : '';

  // Section numbering helper
  let secIdx = 0;
  const num = () => {
    secIdx += 1;
    return tweaks.showNumbers ? String(secIdx).padStart(2, '0') : null;
  };

  return (
    <div className={cnS('app', densityCls, !tweaks.showNumbers && 'no-numbers')}>
      <SettingsSidebar current="settings" />
      <main className="main" data-screen-label="Settings">
        <div className="content">
          <Header savedNote={savedLabel} subStyle={tweaks.subStyle} />

          <SectionProfile s={profile} set={setProfile} num={num()} />

          <SectionRolePrefs s={work} set={setWork} num={num()} />

          <SectionBoundaries items={boundaries} setItems={setBoundariesSaved} num={num()} />

          <SectionNotifications n={notifs} set={setNotifs} num={num()} />

          {tweaks.showIntegrations && (
            <SectionIntegrations items={integrations} setItems={setIntegrationsSaved} num={num()} />
          )}

          <SectionAccount a={account} num={num()} />

          <div className="settings-footer">
            <span className="num">v0.14.2</span> · Changes save automatically.
          </div>
        </div>
      </main>

      {editMode && <SettingsTweaks tweaks={tweaks} setTweaks={setTweaks} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
