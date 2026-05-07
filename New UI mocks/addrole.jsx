// Rolewise — Add Role / ingestion screen
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const cn = (...xs) => xs.filter(Boolean).join(' ');

// ── Demo payloads ───────────────────────────────────────────────────
const SAMPLES = {
  'linear': {
    chip: 'Linear — Senior Product Designer',
    source: 'linkedin.com/jobs/3894120',
    kind: 'url',
    text: `https://linkedin.com/jobs/view/3894120\n\nSenior Product Designer — Linear\nRemote (EU hours, ±3 CET) · Full-time\n£95,000 – £120,000 + equity\n\nWe're looking for a product designer to lead work on our new issue-tracking surface. You'll own flows end-to-end, partner closely with a PM and 3 engineers, and work directly with the founders on shaping the product's visual language.\n\nRequirements\n- 5+ years designing product, ideally for technical users\n- Fluency in Figma, strong systems thinking\n- Experience shipping SaaS / dev tools is a plus\n\nWhat we offer\n- Competitive salary and equity\n- Remote-first, async by default\n- 25 days PTO + public holidays`,
    extracted: {
      title:    'Senior Product Designer',
      company:  'Linear',
      short:    'Ln',
      location: 'Remote (EU hours)',
      model:    'Remote',
      salary:   '£95k – £120k',
      type:     'Full-time',
      level:    'Senior · 5+ yrs',
      industry: 'Developer tools',
      source:   'LinkedIn',
    },
    ask: null,
  },
  'ramp': {
    chip: 'Ramp — Design Lead',
    source: 'ramp.com/careers/design-lead',
    kind: 'url',
    text: `Design Lead, Platform — Ramp\nLondon or New York · hybrid\n\nRamp is hiring a Design Lead to shape our platform surface: bills, approvals, and the engine that powers our products.\n\nResponsibilities\n- Lead a team of 4 designers\n- Set visual and interaction standards across platform work\n- Partner with PM leadership and engineering managers\n\nRequirements\n- 8+ years product design experience\n- 2+ years managing a team\n- Strong written communication — we're remote-async`,
    extracted: {
      title:    'Design Lead, Platform',
      company:  'Ramp',
      short:    'Rp',
      location: 'London or New York',
      model:    'Hybrid',
      salary:   'Not stated',
      type:     'Full-time',
      level:    'Lead · 8+ yrs',
      industry: 'Fintech',
      source:   'Company site',
    },
    ask: {
      key: 'salary',
      label: 'Salary not stated',
      question: 'No salary listed — track anyway?',
      choices: [
        { k: 'track',   label: 'Track anyway', primary: true },
        { k: 'note',    label: 'Add a note',   primary: false },
      ],
      skip: 'Skip',
    },
  },
  'recruiter': {
    chip: 'Recruiter message',
    source: 'pasted recruiter email',
    kind: 'recruiter',
    text: `Hi Sofia,\n\nI came across your portfolio and thought you'd be a great fit for a Staff Designer, AI role we're filling at a stealth-mode Series B. The team is small (3 designers) and they're shipping LLM-powered tooling for knowledge workers.\n\nThey're flexible on location — mostly remote, with occasional visits to their SF office (once a quarter). Comp range is around $200–240k base + meaningful equity.\n\nAny interest in hopping on a call next week?\n\nBest,\nMarcus`,
    extracted: {
      title:    'Staff Designer, AI',
      company:  'Stealth (Series B)',
      short:    'St',
      location: 'Remote · quarterly SF',
      model:    'Remote',
      salary:   '$200k – $240k',
      type:     'Full-time',
      level:    'Staff',
      industry: 'AI & ML',
      source:   'Recruiter',
    },
    ask: {
      key: 'work-model',
      label: 'Work model unclear',
      question: 'Mostly remote with quarterly office visits — how should we track this?',
      choices: [
        { k: 'remote',  label: 'Remote',  primary: true },
        { k: 'hybrid',  label: 'Hybrid',  primary: false },
      ],
      skip: 'Let Rolewise decide',
    },
  },
  'broken': {
    chip: 'Broken link (demo error)',
    source: 'https://example.com/jobs/...',
    kind: 'url',
    text: `https://example.com/careers/j/0x3f21\n\n[403] Could not read contents\n[403] Could not read contents`,
    extracted: null,
    error: true,
    ask: null,
  },
};

// Progressive feedback lines — shown as the system "reads" the paste.
function buildSteps(sample) {
  if (!sample || sample.error) {
    return [
      { t: 'Reading role…',                    tag: 'fetch' },
      { t: 'Trying to open link…',             tag: 'fetch' },
      { t: 'Couldn\'t reach the page',         tag: 'fail'  },
    ];
  }
  const e = sample.extracted;
  const base = [
    { t: 'Reading role…',                                   tag: 'read' },
    { t: `Recognised ${sample.kind === 'url' ? 'link source — ' + e.source : 'recruiter message'}`, tag: 'source' },
    { t: `Found title — ${e.title}`,                        tag: 'title' },
    { t: `Found company — ${e.company}`,                    tag: 'company' },
    { t: `Extracting location and salary…`,                 tag: 'extract' },
    { t: `${e.salary === 'Not stated' ? 'Salary not stated' : 'Salary — ' + e.salary} · ${e.location}`, tag: 'extract' },
    { t: 'Identifying key requirements…',                   tag: 'requirements' },
    { t: `Seniority reads as ${e.level}`,                   tag: 'requirements' },
    { t: `Industry — ${e.industry}`,                        tag: 'requirements' },
    { t: 'Understanding requirements…',                     tag: 'understand' },
  ];
  if (sample.ask) {
    base.push({ t: `Needs your input — ${sample.ask.label.toLowerCase()}`, tag: 'ask' });
  } else {
    base.push({ t: 'Ready — opening role overview',         tag: 'done' });
  }
  return base;
}

// Extracted-fields shape
const FIELD_ORDER = [
  { k: 'location', label: 'Location' },
  { k: 'model',    label: 'Work model' },
  { k: 'salary',   label: 'Salary' },
  { k: 'type',     label: 'Type' },
  { k: 'level',    label: 'Seniority' },
  { k: 'industry', label: 'Industry' },
  { k: 'source',   label: 'Source' },
];
// Field index (0-based) where each step tag starts unveiling a value.
// Smaller = unveils sooner.
const FIELD_STEP_TAG = {
  location: 'extract',
  model:    'extract',
  salary:   'extract',
  type:     'requirements',
  level:    'requirements',
  industry: 'requirements',
  source:   'source',
};

// ── Header ─────────────────────────────────────────────────────────
function ArHeader({ onCancel }) {
  return (
    <header className="ar-head">
      <div className="ar-title-wrap">
        <h1 className="ar-title">Add a role</h1>
        <span className="ar-title-sub">rolewise / ingest</span>
      </div>
      <button className="ar-cancel" onClick={onCancel}>
        Cancel
        <kbd>Esc</kbd>
      </button>
    </header>
  );
}

// ── Paste surface ──────────────────────────────────────────────────
function PasteSurface({ value, onChange, onFocus, onBlur, focused, reading, disabled }) {
  return (
    <div className={cn('ar-paste', focused && 'is-focus', reading && 'is-reading')}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Paste a job description or link"
        disabled={disabled}
        spellCheck={false}
      />
      <div className="ar-paste-foot">
        <span className="ar-paste-hint">
          <span className="mono">paste</span>
          <kbd>⌘V</kbd>
          <span style={{ color: 'var(--ink-subtle)' }}>— reading starts automatically</span>
        </span>
        <span className="ar-paste-count">
          {value.trim().length > 0 ? `${value.trim().length.toLocaleString()} chars` : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Demo chips (prototype-only) ─────────────────────────────────────
function DemoChips({ onPick }) {
  return (
    <div>
      <div className="ar-demo-row">
        <span className="ar-demo-lead">try with →</span>
        <button className="ar-demo-chip" onClick={() => onPick('linear')}>
          Linear · Senior PD <span className="tk">link</span>
        </button>
        <button className="ar-demo-chip" onClick={() => onPick('ramp')}>
          Ramp · Design Lead <span className="tk">jd</span>
        </button>
        <button className="ar-demo-chip" onClick={() => onPick('recruiter')}>
          Recruiter email <span className="tk">msg</span>
        </button>
        <button className="ar-demo-chip" onClick={() => onPick('broken')}>
          Broken link <span className="tk">err</span>
        </button>
      </div>
      <p className="ar-helper">
        You can paste from LinkedIn, job boards, or recruiter emails. Rolewise will read it and pull out what matters.
      </p>
    </div>
  );
}

// ── Feedback stream (left) ──────────────────────────────────────────
function Stream({ steps, shown, done }) {
  return (
    <div className="ar-stream">
      <div className="ar-stream-k">
        <span className={cn('ar-pulse', done && 'done')} />
        {done ? 'Read' : 'Reading'}
      </div>
      <ul className="ar-stream-list">
        {steps.slice(0, shown).map((s, i) => {
          const isCurrent = i === shown - 1 && !done;
          const isLast = i === shown - 1;
          return (
            <li
              key={i}
              className="ar-stream-li"
              style={{ animationDelay: `${i === shown - 1 ? 0 : 0}ms` }}
            >
              <span className="ar-stream-ix">{String(i + 1).padStart(2, '0')}</span>
              <span className={cn('ar-stream-t', isCurrent ? 'active' : 'past')}>
                {s.t}
              </span>
              <span className={cn('ar-stream-tk', isLast && !done && 'live')}>
                {isLast && !done ? '…' : s.tag}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Extracted fields (right) ────────────────────────────────────────
function Fields({ extracted, unveiledTags, showHead }) {
  if (!extracted) return (
    <div className="ar-fields">
      <div className="ar-fields-k">Extracted</div>
      <div style={{ color: 'var(--ink-subtle)', fontSize: 13 }}>Nothing yet.</div>
    </div>
  );

  return (
    <div className="ar-fields">
      <div className="ar-fields-k">Extracted</div>

      {showHead && (
        <div className="ar-head-fields">
          <div className="ar-head-field-v">{extracted.title}</div>
          <div className="ar-head-field-company">
            <span className="ar-head-field-logo">{extracted.short}</span>
            {extracted.company}
          </div>
        </div>
      )}

      {FIELD_ORDER.map(({ k, label }) => {
        const tag = FIELD_STEP_TAG[k];
        const unveiled = unveiledTags.has(tag);
        const v = extracted[k];
        const missing = v === 'Not stated';
        return (
          <div key={k} className="ar-field-row">
            <span className="ar-field-k">{label}</span>
            {unveiled ? (
              <span className={cn('ar-field-v', 'resolved', missing && 'missing')}>
                {v}
              </span>
            ) : (
              <span className={cn(
                'ar-field-v', 'pending',
                k === 'type' && 'pending-short',
                k === 'location' && 'pending-long'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Clarifying question ─────────────────────────────────────────────
function Ask({ ask, onChoose, onSkip }) {
  return (
    <div className="ar-ask">
      <div className="ar-ask-card">
        <span className="ar-ask-k">One thing</span>
        <span className="ar-ask-q">{ask.question}</span>
        <div className="ar-ask-choices">
          {ask.choices.map(c => (
            <button
              key={c.k}
              className={cn('ar-ask-choice', c.primary && 'is-primary')}
              onClick={() => onChoose(c.k)}
            >
              {c.label}
            </button>
          ))}
          <button className="ar-ask-skip" onClick={onSkip}>{ask.skip}</button>
        </div>
      </div>
    </div>
  );
}

// (Stage picker removed — staging happens on Role Overview, not here.)
const _STAGE_OPTIONS_REMOVED = [
  { key: 'seen',      label: 'Seen',             glyph: '·' },
  { key: 'saved',     label: 'Saved',            glyph: '○' },
  { key: 'applied',   label: 'Applied',          glyph: '→' },
  { key: 'recruiter', label: 'Recruiter screen', glyph: '··' },
  { key: 'hm',        label: 'Hiring manager',   glyph: '···' },
  { key: 'skipped',   label: 'Skipped',          glyph: '⊘' },
];

function _StagePickerRemoved({ value, onChange, open }) {
  if (!open) return null;
  const cur = STAGE_OPTIONS.find(s => s.key === value) || STAGE_OPTIONS[1];
  const hint = (
    cur.key === 'seen'      ? 'Just noticed it. No commitment yet.' :
    cur.key === 'saved'     ? 'Keeping it for consideration.' :
    cur.key === 'applied'   ? 'Application submitted — we’ll start the timer.' :
    cur.key === 'recruiter' ? 'A recruiter has already reached out.' :
    cur.key === 'hm'        ? 'Already in talks with the hiring manager.' :
                              'Decided this isn’t for you. We’ll log the reason later.'
  );
  return (
    <div className="ar-stage-picker">
      <div className="ar-stage-label">Move to</div>
      <div className="ar-stage-rail">
        {STAGE_OPTIONS.map(s => (
          <button
            key={s.key}
            className="ar-stage-chip"
            data-on={value === s.key || undefined}
            onClick={() => onChange(s.key)}
          >
            <span className="glyph">{s.glyph}</span>
            {s.label}
          </button>
        ))}
      </div>
      <div className="ar-stage-hint">{hint}</div>
    </div>
  );
}

// ── Continue bar ──────────────────────────────────────────────────────────────────────
function Continue({ titleCompany, onContinue }) {
  return (
    <div className="ar-continue">
      <div className="ar-continue-note">
        <span className="done">✓ read</span>
        {titleCompany} — ready to open.
      </div>
      <button className="ar-continue-cta" onClick={onContinue}>
        Open role overview <span className="arrow">→</span>
      </button>
    </div>
  );
}

// ── _OldContinue (kept for reference, unused) ────────────────────
function _ContinueOld({ titleCompany, onContinue }) {
  return (
    <div className="ar-continue">
      <div className="ar-continue-note">
        <span className="done">✓ read</span>
        {titleCompany} — ready to open.
      </div>
      <button className="ar-continue-cta" onClick={onContinue}>
        Open role overview <span className="arrow">→</span>
      </button>
    </div>
  );
}

// ── Error state ─────────────────────────────────────────────────────
function ErrorState({ source, onRetry, onPaste }) {
  return (
    <div className="ar-error" style={{ animation: 'ar-fadein 260ms var(--ease) forwards', opacity: 0, transform: 'translateY(6px)' }}>
      <span className="ar-error-k">Couldn't read</span>
      <div>
        <h3 className="ar-error-h">Couldn't read this role clearly</h3>
        <p className="ar-error-p">
          The link didn't open, or there wasn't enough detail. Try pasting the full description, or pull it from another source.
        </p>
        <div className="ar-error-acts">
          <button className="ar-error-act" onClick={onPaste}>Paste full description</button>
          <button className="ar-error-act" onClick={onRetry}>Try another source</button>
        </div>
      </div>
    </div>
  );
}

// ── Tweaks ──────────────────────────────────────────────────────────
function Tweaks({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Read speed</span>
        <div className="tweak-btn-group">
          {['instant', 'natural', 'slow'].map(k => (
            <button key={k} className={cn(tweaks.speed === k && 'on')} onClick={() => set('speed', k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Clarify on</span>
        <div className="tweak-btn-group">
          {[
            { k: 'work-model', l: 'model' },
            { k: 'salary',     l: 'salary' },
            { k: 'none',       l: 'none' },
          ].map(({ k, l }) => (
            <button key={k} className={cn(tweaks.askState === k && 'on')} onClick={() => set('askState', k)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-k">Auto-demo</span>
        <div className="tweak-btn-group">
          <button className={cn(tweaks.autoDemo && 'on')} onClick={() => set('autoDemo', true)}>on</button>
          <button className={cn(!tweaks.autoDemo && 'on')} onClick={() => set('autoDemo', false)}>off</button>
        </div>
      </div>
      <div className="tweak-row" style={{ borderBottom: 'none' }}>
        <span className="tweak-k" style={{ fontSize: 11.5, color: 'var(--ink-subtle)' }}>
          Tip: click a demo chip below the paste field, or paste any text to start.
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════
function App() {
  const [tweaks, setTweaksRaw] = useState(window.__TWEAKS__);
  const [editMode, setEditMode] = useState(false);

  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [sampleKey, setSampleKey] = useState(null); // which demo
  const [shown, setShown] = useState(0);             // # of steps shown
  const [askOpen, setAskOpen] = useState(false);
  const [askAnswered, setAskAnswered] = useState(null);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

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

  // Auto-demo: play Linear sample on mount (soft).
  useEffect(() => {
    if (tweaks.autoDemo && !sampleKey && value === '') {
      const t = setTimeout(() => pickSample('linear'), 900);
      return () => clearTimeout(t);
    }
  }, [tweaks.autoDemo]);

  // Go back to the previous page (or fall back to Overview)
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'Overview.html';
    }
  };

  // Esc handler
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (sampleKey) {
          reset();
        } else {
          goBack();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sampleKey]);

  const sample = sampleKey ? SAMPLES[sampleKey] : null;

  // Respect "Clarify on" tweak — override sample.ask
  const activeAsk = useMemo(() => {
    if (!sample || sample.error) return null;
    if (tweaks.askState === 'none') return null;
    if (tweaks.askState === 'salary') return {
      key: 'salary',
      label: 'Salary not stated',
      question: 'No salary listed — track anyway?',
      choices: [
        { k: 'track', label: 'Track anyway', primary: true },
        { k: 'note',  label: 'Add a note',   primary: false },
      ],
      skip: 'Skip',
    };
    if (tweaks.askState === 'work-model') return {
      key: 'work-model',
      label: 'Work model unclear',
      question: 'Remote or hybrid? The listing is a bit mixed.',
      choices: [
        { k: 'remote', label: 'Remote', primary: true },
        { k: 'hybrid', label: 'Hybrid', primary: false },
      ],
      skip: 'Let Rolewise decide',
    };
    return sample.ask; // sample default
  }, [sample, tweaks.askState]);

  const steps = useMemo(() => buildSteps(sample), [sample]);

  // Per-step interval based on speed tweak
  const stepMs = tweaks.speed === 'instant' ? 90 : tweaks.speed === 'slow' ? 700 : 380;

  // Orchestrator: once sample is set, progressively reveal steps.
  useEffect(() => {
    if (!sample) return;
    setShown(1);
    setAskOpen(false);
    setAskAnswered(null);

    let i = 1;
    const tick = () => {
      if (i >= steps.length) {
        // reached the end. If there's an ask, open it.
        if (activeAsk && !sample.error) {
          setTimeout(() => setAskOpen(true), 150);
        }
        return;
      }
      i += 1;
      setShown(i);
      timerRef.current = setTimeout(tick, stepMs);
    };
    timerRef.current = setTimeout(tick, stepMs);

    return () => clearTimeout(timerRef.current);
  }, [sampleKey, tweaks.speed, tweaks.askState]);

  // Which step-tags have been "unveiled" — unveils field values
  const unveiledTags = useMemo(() => {
    const set = new Set();
    steps.slice(0, shown).forEach(s => set.add(s.tag));
    return set;
  }, [steps, shown]);

  const showHead = unveiledTags.has('title') && unveiledTags.has('company');

  // Is the stream complete?
  const doneReading = shown >= steps.length;

  const pickSample = useCallback((k) => {
    setSampleKey(k);
    const s = SAMPLES[k];
    setValue(s.text);
  }, []);

  const reset = () => {
    clearTimeout(timerRef.current);
    setSampleKey(null);
    setValue('');
    setShown(0);
    setAskOpen(false);
    setAskAnswered(null);
  };

  // Manual paste detection
  const onPasteInput = (next) => {
    setValue(next);
    // If user pasted >80 chars, start a generic 'linear' read flow (pretends to recognise it).
    const wasEmpty = value.trim().length < 10;
    const nowFull  = next.trim().length > 80;
    if (wasEmpty && nowFull && !sampleKey) {
      // Pick based on content: link → linear-like, otherwise recruiter.
      const k = /https?:\/\//i.test(next) ? 'linear' : 'recruiter';
      setSampleKey(k);
      // keep the user's pasted text visible
    }
  };

  const onContinue = () => {
    setToast(`Opening ${sample.extracted.title}…`);
    setTimeout(() => {
      window.location.href = 'Analysis.html';
    }, 600);
  };

  const onChoose = (k) => {
    setAskAnswered(k);
    setAskOpen(false);
  };
  const onSkip = () => {
    setAskAnswered('skip');
    setAskOpen(false);
  };

  // Body composition
  const isEmpty    = !sampleKey && value.trim().length < 10;
  const isReading  = sample && !sample.error;
  const isError    = sample?.error;

  return (
    <div className="ar-overlay" data-screen-label="Add Role">
      <ArHeader onCancel={goBack} />

      <div className="ar-body">
        <div className="ar-stage">

          {/* Lede — empty state */}
          {isEmpty && (
            <div className="ar-lede">
              <div className="ar-lede-eyebrow">
                <span className="dot" />
                input → understanding → clarity
              </div>
              <h2 className="ar-lede-h">Drop in a role, we'll make it clear.</h2>
              <p className="ar-lede-p">
                Paste a job description, a link, or a recruiter message. Rolewise will read it, pull out what matters, and ask only if something's unclear.
              </p>
            </div>
          )}

          {/* Paste surface */}
          <PasteSurface
            value={value}
            onChange={onPasteInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            focused={focused}
            reading={!!sample}
            disabled={!!sample}
          />

          {/* Demo chips — empty state only */}
          {isEmpty && <DemoChips onPick={pickSample} />}

          {/* Reading / understanding */}
          {isReading && (
            <div className="ar-read">
              <Stream steps={steps} shown={shown} done={doneReading} />
              <Fields
                extracted={sample.extracted}
                unveiledTags={unveiledTags}
                showHead={showHead}
              />
            </div>
          )}

          {/* Clarifying question — shows only after stream completes */}
          {isReading && askOpen && activeAsk && (
            <Ask
              ask={activeAsk}
              onChoose={onChoose}
              onSkip={onSkip}
            />
          )}

          {/* Continue bar */}
          {isReading && doneReading && (!activeAsk || askAnswered) && (
            <Continue
              titleCompany={`${sample.extracted.title} · ${sample.extracted.company}`}
              onContinue={onContinue}
            />
          )}

          {/* Error state */}
          {isError && (
            <ErrorState
              source={sample.source}
              onRetry={reset}
              onPaste={reset}
            />
          )}

          {/* Footer reset (only when a sample is loaded) */}
          {sample && (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <button
                onClick={reset}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  color: 'var(--ink-subtle)',
                  letterSpacing: '0.04em',
                  textTransform: 'lowercase',
                  borderBottom: '1px dotted var(--border-strong)',
                  paddingBottom: 1,
                }}
              >
                ← paste something else
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 16px',
            background: 'var(--ink-heading)',
            color: 'var(--bg)',
            borderRadius: 8,
            fontSize: 12.5,
            boxShadow: '0 8px 30px oklch(20% 0.01 80 / 0.2)',
            zIndex: 60,
          }}
        >
          {toast}
        </div>
      )}

      {editMode && <Tweaks tweaks={tweaks} setTweaks={setTweaks} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
