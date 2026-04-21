// Rolewise — Weekly Review
//
// A calm reflective ritual. Single column, document-first. Not a dashboard.
// Sections guide the user from activity → context → pattern → one small next
// action. Every choice here optimises for reading, not for metrics.

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
// Header with week selector
// ─────────────────────────────────────────────────────────────────────────────
function Header({ week, canPrev, canNext, onPrev, onNext }) {
  return (
    <header className="wr-head">
      <div>
        <div className="wr-eyebrow">
          <span className="wr-eyebrow-tick" />
          weekly ritual
        </div>
        <h1 className="wr-title">Weekly review</h1>
        <p className="wr-sub">
          A quiet check-in with your job search — what happened, what you’re
          noticing, and one small thing to do differently next week.
        </p>
      </div>
      <div className="wr-weekpick" role="group" aria-label="Choose week">
        <button
          className="wr-weekpick-arrow"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous week"
        >←</button>
        <span className="wr-weekpick-label">{week.label}</span>
        <button
          className="wr-weekpick-arrow"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next week"
        >→</button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Context strip — anchors the review in the actual week
// ─────────────────────────────────────────────────────────────────────────────
function Context({ week }) {
  return (
    <div className="wr-context">
      <span className="wr-context-range">{week.range}</span>
      {week.basedOn && <>
        <span className="wr-context-dot" />
        <span className="wr-context-meta">based on {week.basedOn}</span>
      </>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A titled section — label on the left, body on the right.
// ─────────────────────────────────────────────────────────────────────────────
function Section({ num, label, dataKey, children }) {
  return (
    <section className="wr-section" data-sec={dataKey}>
      <div className="wr-sec-label">
        <span className="wr-sec-num">{num}</span>
        {label}
      </div>
      <div className="wr-sec-body">
        {children}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity — a row of big, calm numbers
// ─────────────────────────────────────────────────────────────────────────────
function Activity({ items }) {
  return (
    <div className="wr-activity">
      {items.map(it => (
        <div key={it.k} className="wr-act-item">
          <span className="wr-act-v num">{it.v}</span>
          <span className="wr-act-k">{it.k}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bullet list — used for market signals, friction, lessons
// ─────────────────────────────────────────────────────────────────────────────
function Bullets({ items, variant }) {
  return (
    <ul className={cn('wr-bullets', variant === 'friction' && 'is-friction')}>
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
}

function Lessons({ items }) {
  return (
    <ul className="wr-lessons">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline — simple rows, not a dashboard
// ─────────────────────────────────────────────────────────────────────────────
function Pipeline({ rows }) {
  return (
    <div className="wr-pipe">
      {rows.map((r, i) => (
        <div key={i} className={cn('wr-pipe-row', r.tone === 'quiet' && 'is-quiet')}>
          <span className="wr-pipe-k">{r.k}</span>
          <span className={cn('wr-pipe-v num', r.v === 0 && 'is-zero')}>
            {r.v === 0 ? '—' : r.v}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// One next action — the only thing that looks like a call-to-action.
// ─────────────────────────────────────────────────────────────────────────────
function NextAction({ action }) {
  return (
    <aside className="wr-next" aria-label="One next action">
      <div className="wr-next-eyebrow">
        <span className="wr-next-pill">Next week</span>
        one small thing
      </div>
      <p className="wr-next-text">
        <span className="wr-next-verb">{action.verb}</span> {action.text}
      </p>
      <p className="wr-next-note">{action.note}</p>
      <div className="wr-next-actions">
        <button className="wr-next-btn primary">Set as this week’s focus</button>
        <button className="wr-next-btn quiet">Not this one</button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state — when the week has no data yet.
// ─────────────────────────────────────────────────────────────────────────────
function Empty({ week }) {
  return (
    <div className="wr-empty">
      <div className="wr-empty-mark" />
      <div className="wr-empty-t">{week.emptyLine}</div>
      <p className="wr-empty-s">{week.emptyNote}</p>
      <div className="wr-empty-meta">{week.range.toLowerCase()}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tweaks panel
// ─────────────────────────────────────────────────────────────────────────────
function Tweaks({ tweaks, setTweaks, weeks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Week</span>
        <div className="tweak-btn-group">
          {weeks.map((w, i) => (
            <button key={w.id}
                    className={cn(tweaks.weekIndex === i && 'on')}
                    onClick={() => set('weekIndex', i)}
                    title={w.label}>
              {i === weeks.length - 1 ? 'empty' : w.short}
            </button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Density</span>
        <div className="tweak-btn-group">
          {['comfortable', 'compact'].map(k => (
            <button key={k}
                    className={cn(tweaks.density === k && 'on')}
                    onClick={() => set('density', k)}>
              {k}
            </button>
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
        <span className="tweak-k">Friction signals</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.showFriction && 'on')} onClick={() => set('showFriction', true)}>show</button>
          <button className={cn(!tweaks.showFriction && 'on')} onClick={() => set('showFriction', false)}>hide</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button key={k}
                    className={cn('swatch', tweaks.accent === k && 'on')}
                    style={{ background: v.accent }}
                    title={k}
                    onClick={() => set('accent', k)} />
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

  // Edit-mode protocol — register listener before announcing availability.
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

  // Accent → CSS vars
  useEffect(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  // Persist current week across reloads.
  const [weekIndex, setWeekIndex] = useState(() => {
    const stored = Number(localStorage.getItem('rw.review.weekIndex'));
    return Number.isFinite(stored) && stored >= 0 && stored < WEEKS.length
      ? stored
      : tweaks.weekIndex ?? 0;
  });

  // Tweaks → local state
  useEffect(() => {
    if (typeof tweaks.weekIndex === 'number' && tweaks.weekIndex !== weekIndex) {
      setWeekIndex(tweaks.weekIndex);
    }
  }, [tweaks.weekIndex]);

  useEffect(() => {
    localStorage.setItem('rw.review.weekIndex', String(weekIndex));
  }, [weekIndex]);

  const week = WEEKS[weekIndex] || WEEKS[0];

  // Arrow controls: weeks are ordered newest → oldest + empty last.
  // "Previous week" = older = higher index.
  // "Next week" = newer = lower index.
  const onPrev = () => setWeekIndex(i => Math.min(i + 1, WEEKS.length - 1));
  const onNext = () => setWeekIndex(i => Math.max(i - 1, 0));
  const canPrev = weekIndex < WEEKS.length - 1;
  const canNext = weekIndex > 0;

  return (
    <div className="app"
         data-density={tweaks.density}
         data-hide-market={String(!tweaks.showMarket)}
         data-hide-friction={String(!tweaks.showFriction)}>
      <Sidebar current="review" />
      <main className="main" data-screen-label="Weekly Review">
        <div className="content">
          <Header
            week={week}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={onPrev}
            onNext={onNext}
          />

          <Context week={week} />

          {week.state === 'empty' ? (
            <Empty week={week} />
          ) : (
            <div className="wr-sections">
              <Section num="01" label="this week" dataKey="activity">
                <Activity items={week.activity} />
              </Section>

              <Section num="02" label="market signals" dataKey="market">
                <Bullets items={week.market} />
              </Section>

              <Section num="03" label="friction" dataKey="friction">
                <Bullets items={week.friction} variant="friction" />
              </Section>

              <Section num="04" label="pipeline" dataKey="pipeline">
                <Pipeline rows={week.pipeline} />
              </Section>

              <Section num="05" label="noticing" dataKey="lessons">
                <Lessons items={week.lessons} />
              </Section>

              <NextAction action={week.nextAction} />

              <div className="wr-close">
                <div className="wr-close-l">
                  A small weekly habit. Reviews appear every Monday morning — read
                  them, then set aside.
                </div>
                <div className="wr-close-r">end of review</div>
              </div>
            </div>
          )}
        </div>
      </main>

      {editMode && <Tweaks tweaks={tweaks} setTweaks={setTweaks} weeks={WEEKS} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
