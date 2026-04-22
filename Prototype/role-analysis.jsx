// Role Analysis page — the core decision surface.
// Turns a structured role record into a calm, section-by-section briefing.
// Locked section order: Header → Fit Summary → Summary → Why Exists → What You Do →
//   Looking For → Practical Details → Risks → Questions → Suggested Actions

const { useState: useStateRA, useEffect: useEffectRA } = React;

function cnRA(...xs) { return xs.filter(Boolean).join(' '); }

// Company logo mark — reuses LOGO_TONES from data.jsx
function LogoRA({ short, idx, size = 36 }) {
  const tone = LOGO_TONES[idx % LOGO_TONES.length];
  return (
    <div
      className="rl-logo"
      style={{
        background: tone.bg,
        color: tone.fg,
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        fontSize: size > 36 ? 13 : 12,
        flexShrink: 0,
      }}
    >
      {short}
    </div>
  );
}

// ─── Sticky role header ───────────────────────────────────────────────────────
function StickyHeaderRA({ role, scrolled, onAction }) {
  const backLink = (
    <a href="Roles.html" className="ra-back" title="Back to Roles">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Roles
    </a>
  );

  const actions = (
    <div className="ra-header-actions">
      <button className="btn btn-ra-action btn-ra-skip" onClick={() => onAction('skip')}>Skip</button>
      <button className="btn btn-primary btn-ra-action btn-ra-apply" onClick={() => onAction('apply')}>Apply</button>
    </div>
  );

  return (
    <header className={cnRA('ra-sticky', scrolled && 'is-scrolled')}>
      {scrolled ? (
        // Compact sticky state
        <div className="ra-sticky-inner">
          <div className="ra-header-left">
            {backLink}
            <div className="ra-header-divider" aria-hidden />
            <LogoRA short={role.short} idx={role.logoIdx} size={26} />
            <div className="ra-header-identity">
              <span className="ra-header-title">{role.title}</span>
              <span className="ra-header-dot" aria-hidden>·</span>
              <span className="ra-header-company">{role.company}</span>
            </div>
          </div>
          {actions}
        </div>
      ) : (
        // Expanded identity block
        <div className="ra-header-expanded">
          <div className="ra-header-exp-crumb">{backLink}</div>
          <div className="ra-header-exp-main">
            <div className="ra-header-exp-identity">
              <LogoRA short={role.short} idx={role.logoIdx} size={40} />
              <div className="ra-header-exp-text">
                <span className="ra-header-exp-title">{role.title}</span>
                <div className="ra-header-exp-sub">
                  <span>{role.company}</span>
                  <span className="ra-meta-sep" aria-hidden>·</span>
                  <span>{role.location}</span>
                </div>
              </div>
            </div>
            {actions}
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function CardRA({ label, footer, children, className }) {
  return (
    <section className={cnRA('ra-card', className)}>
      {label && <div className="ra-card-label">{label}</div>}
      <div className="ra-card-body">{children}</div>
      {footer && <div className="ra-card-footer">{footer}</div>}
    </section>
  );
}

// ─── Section 2: Fit Reality Summary ──────────────────────────────────────────
function FitSummaryRA({ data }) {
  return (
    <CardRA
      label="What to know before deciding"
      className="ra-card-fit"
      footer={data.footer}
    >
      <ul className="ra-fit-list">
        {data.observations.map((obs, i) => (
          <li key={i} className={cnRA('ra-fit-item', `is-${obs.type}`)}>
            <span className="ra-fit-marker" aria-hidden />
            <span className="ra-fit-text">{obs.text}</span>
          </li>
        ))}
      </ul>
    </CardRA>
  );
}

// ─── Section 3: Role Summary ──────────────────────────────────────────────────
function RoleSummaryRA({ text }) {
  return (
    <CardRA label="Role summary">
      <p className="ra-prose">{text}</p>
    </CardRA>
  );
}

// ─── Section 4: Why This Role Exists ─────────────────────────────────────────
function WhyExistsRA({ data }) {
  return (
    <CardRA label="Why this role exists">
      <p className="ra-prose" style={{ marginBottom: 18 }}>{data.context}</p>
      <ul className="ra-signals-row">
        {data.signals.map((s, i) => (
          <li key={i} className="rl-signal">{s}</li>
        ))}
      </ul>
    </CardRA>
  );
}

// ─── Section 5: What You Would Actually Do ────────────────────────────────────
function WhatYouDoRA({ items }) {
  return (
    <CardRA label="What you would actually do">
      <ul className="ra-bullet-list">
        {items.map((item, i) => (
          <li key={i} className="ra-bullet-item">
            <span className="ra-bullet-marker" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CardRA>
  );
}

// ─── Section 6: What They're Really Looking For ───────────────────────────────
function LookingForRA({ data }) {
  return (
    <CardRA label="What they're really looking for">
      <div className="ra-req-block">
        <div className="ra-req-group-label">Essential</div>
        <ul className="ra-bullet-list">
          {data.essential.map((item, i) => (
            <li key={i} className="ra-bullet-item">
              <span className="ra-bullet-marker" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {data.preferred && data.preferred.length > 0 && (
        <div className="ra-req-block ra-req-block-soft">
          <div className="ra-req-group-label ra-req-label-soft">Preferred, not required</div>
          <ul className="ra-bullet-list ra-bullet-soft">
            {data.preferred.map((item, i) => (
              <li key={i} className="ra-bullet-item">
                <span className="ra-bullet-marker" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.notable && (
        <p className="ra-notable">
          <span className="ra-notable-label">Worth noting — </span>
          {data.notable}
        </p>
      )}
    </CardRA>
  );
}

// ─── Section 7: Practical Details ────────────────────────────────────────────
function PracticalDetailsRA({ data, onCompensation }) {
  const rows = [
    { k: 'Salary',              v: data.salary,             mono: false, trigger: true },
    { k: 'Monthly equivalent',  v: data.salaryMonthlyRange, mono: true },
    { k: 'Equity',              v: data.equity                          },
    { k: 'Contract',            v: data.contractType                    },
    { k: 'Location',            v: data.location                        },
    { k: 'Work model',          v: data.workModel                       },
    { k: 'Company stage',       v: data.companyStage                    },
    { k: 'Team',                v: data.teamContext                     },
    { k: 'Start date',          v: data.startDate                       },
    { k: 'Visa sponsorship',    v: data.visaSponsorship ?? 'Not stated'  },
  ];

  return (
    <CardRA label="Practical details">
      <div className="ra-details">
        {rows.filter(r => r.v).map((row, i) => (
          <div key={i} className="ra-detail-row">
            <span className="ra-detail-k">{row.k}</span>
            <span className={cnRA('ra-detail-v', row.mono && 'num', row.trigger && 'has-trigger')}>
              {row.v}
              {row.trigger && onCompensation && (
                <button
                  className="ra-comp-trigger"
                  onClick={e => { e.stopPropagation(); onCompensation(); }}
                >
                  breakdown
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      {data.benefits && data.benefits.length > 0 && (
        <div className="ra-benefits">
          <div className="ra-benefits-label">Benefits</div>
          <ul className="ra-benefit-chips">
            {data.benefits.map((b, i) => (
              <li key={i} className="ra-benefit-chip">{b}</li>
            ))}
          </ul>
        </div>
      )}
    </CardRA>
  );
}

// ─── Section 8: Risks & Unknowns ─────────────────────────────────────────────
function RisksRA({ items }) {
  return (
    <CardRA label="Risks and unknowns">
      <ul className="ra-risk-list">
        {items.map((risk, i) => (
          <li key={i} className={cnRA('ra-risk-item', `is-${risk.severity}`)}>
            <div className="ra-risk-head">
              {risk.severity === 'warn' && <span className="ra-risk-dot" aria-hidden />}
              <span className="ra-risk-label">{risk.label}</span>
            </div>
            {risk.detail && (
              <p className="ra-risk-detail">{risk.detail}</p>
            )}
          </li>
        ))}
      </ul>
    </CardRA>
  );
}

// ─── Section 9: Questions Worth Asking ───────────────────────────────────────
function QuestionsRA({ items }) {
  return (
    <CardRA label="Questions worth asking">
      <ol className="ra-question-list">
        {items.map((q, i) => (
          <li key={i} className="ra-question-item">
            <span className="ra-q-num num" aria-hidden>{i + 1}</span>
            <span className="ra-q-text">{q}</span>
          </li>
        ))}
      </ol>
    </CardRA>
  );
}

// ─── Section 10: Suggested Actions ───────────────────────────────────────────
function SuggestedActionsRA({ items }) {
  return (
    <CardRA label="Suggested actions" className="ra-card-actions-footer">
      <ul className="ra-action-list">
        {items.map((action, i) => (
          <li key={i} className="ra-action-item">
            <div className="ra-action-text">
              <span className="ra-action-label">{action.label}</span>
              <span className="ra-action-desc">{action.description}</span>
            </div>
          </li>
        ))}
      </ul>
    </CardRA>
  );
}

// ─── Compensation panel ───────────────────────────────────────────────────────
function CompensationPanel({ role, onClose }) {
  const det  = role.practicalDetails;
  const pref = role.userPreferences;
  const isPermanent = det.contractType?.toLowerCase().includes('permanent');
  const [pensionPct, setPensionPct] = useStateRA(5);

  useEffectRA(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, []);

  // Parse £90,000 – £115,000 / year → [90000, 115000]
  const parseSalaryRange = (str) => {
    const nums = (str || '').replace(/,/g, '').match(/\d+/g);
    return nums && nums.length >= 2 ? [parseInt(nums[0]), parseInt(nums[1])] : [90000, 115000];
  };

  // Simple indicative UK PAYE. Not precise — pension, NI, and basic/higher rate only.
  const calcTakeHome = (annualGross, pct) => {
    const pensionDeduction = annualGross * pct / 100;
    const taxable = annualGross - pensionDeduction;
    const PA = 12570, basicLimit = 50270;
    let tax = 0;
    if (taxable > PA) {
      tax += Math.min(taxable - PA, basicLimit - PA) * 0.20;
      if (taxable > basicLimit) tax += (taxable - basicLimit) * 0.40;
    }
    let ni = 0;
    if (taxable > PA) {
      ni += Math.min(taxable - PA, basicLimit - PA) * 0.08;
      if (taxable > basicLimit) ni += (taxable - basicLimit) * 0.02;
    }
    return Math.round((taxable - tax - ni) / 12 / 100) * 100;
  };

  const [salLow, salHigh] = parseSalaryRange(det.salary);
  const thLow  = calcTakeHome(salLow, pensionPct);
  const thHigh = calcTakeHome(salHigh, pensionPct);
  const fmt    = (n) => '£' + n.toLocaleString('en-GB');
  const thLabel = `~${fmt(thLow)} – ${fmt(thHigh)}`;

  const adjustPension = (delta) => setPensionPct(p => Math.max(0, Math.min(20, p + delta)));

  return (
    <>
      <div className="comp-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="comp-panel" role="dialog" aria-label="Compensation breakdown">

        {/* Header */}
        <div className="comp-header">
          <div>
            <div className="comp-header-title">Compensation</div>
            <div className="comp-header-sub">{role.title} · {role.company}</div>
          </div>
          <button className="comp-close" onClick={onClose} aria-label="Close panel">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="comp-body">

          {/* 1: Role salary */}
          <div className="comp-section">
            <div className="comp-section-label">Role salary</div>
            <div className="comp-rows">
              <div className="comp-row">
                <span className="comp-k">Annual</span>
                <span className="comp-v num">{det.salary}</span>
              </div>
              <div className="comp-row">
                <span className="comp-k">Monthly equivalent</span>
                <span className="comp-v num">{det.salaryMonthlyRange}</span>
              </div>
            </div>
          </div>

          {/* 2: Indicative take-home (permanent UK only) */}
          {isPermanent && (
            <div className="comp-section">
              <div className="comp-section-label">Indicative take-home</div>
              <div className="comp-rows">
                <div className="comp-row comp-row-control">
                  <span className="comp-k">Pension contribution</span>
                  <span className="comp-v">
                    <span className="comp-stepper">
                      <button className="comp-stepper-btn" onClick={() => adjustPension(-1)} aria-label="Decrease">–</button>
                      <span className="comp-stepper-val num">{pensionPct}%</span>
                      <button className="comp-stepper-btn" onClick={() => adjustPension(1)} aria-label="Increase">+</button>
                    </span>
                  </span>
                </div>
                <div className="comp-row">
                  <span className="comp-k">Net / month</span>
                  <span className="comp-v num">{thLabel}</span>
                </div>
              </div>
              <p className="comp-note">
                Approximate for standard UK PAYE. Varies with your tax code and any salary sacrifice arrangements.
              </p>
            </div>
          )}

          {/* 3: Your preferences comparison */}
          {pref && (
            <div className="comp-section">
              <div className="comp-section-label">Your preference</div>
              <div className="comp-rows">
                <div className="comp-row">
                  <span className="comp-k">Your target</span>
                  <span className="comp-v num">{pref.salaryLabel}</span>
                </div>
                <div className="comp-row">
                  <span className="comp-k">Monthly equivalent</span>
                  <span className="comp-v num">{pref.salaryMonthlyLabel}</span>
                </div>
              </div>
              <p className="comp-observation">{pref.observation}</p>
            </div>
          )}

          {/* 4: Work type */}
          <div className="comp-section">
            <div className="comp-section-label">Work type</div>
            <div className="comp-rows">
              <div className="comp-row">
                <span className="comp-k">Contract</span>
                <span className="comp-v">{det.contractType}</span>
              </div>
              <div className="comp-row">
                <span className="comp-k">IR35</span>
                <span className="comp-v">Not applicable</span>
              </div>
            </div>
          </div>

          {/* 5: Interpretation note */}
          <div className="comp-section comp-section-footer">
            <p className="comp-footer-note">
              Figures are gross annual salary. Monthly equivalents are before tax. Take-home estimate is approximate only.
            </p>
          </div>

        </div>
      </aside>
    </>
  );
}

// ─── Tweaks panel ─────────────────────────────────────────────────────────────
function TweaksRA({ tweaks, setTweaks }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-k">Accent</span>
        <div className="swatch-row">
          {Object.entries(ACCENT_MAP).map(([k, v]) => (
            <button
              key={k}
              className={cnRA('swatch', tweaks.accent === k && 'on')}
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

// ─── Root ─────────────────────────────────────────────────────────────────────
function AppRA() {
  const [tweaks, setTweaksRaw] = useStateRA(window.__TWEAKS__);
  const [scrolled, setScrolled] = useStateRA(false);
  const [toast, setToast] = useStateRA(null);
  const [editMode, setEditMode] = useStateRA(false);
  const [compOpen, setCompOpen] = useStateRA(false);

  // Sticky header scroll state
  useEffectRA(() => {
    const handle = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  // Edit mode protocol
  useEffectRA(() => {
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
  useEffectRA(() => {
    const a = ACCENT_MAP[tweaks.accent] || ACCENT_MAP['ink-blue'];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-bg', a.bg);
  }, [tweaks.accent]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const onAction = (action) => {
    const role = ROLE_ANALYSIS_DATA;
    if (action === 'apply') showToast(`Marked as applied · ${role.company}`);
    else if (action === 'save') showToast(`Saved · ${role.company}`);
    else if (action === 'skip') showToast(`Skipped · ${role.company}`);
  };

  const role = ROLE_ANALYSIS_DATA;
  const navCounts = { roles: 48, applications: 11, recruiters: 7 };

  return (
    <div className="app">
      {renderSidebar({ current: 'roles', counts: navCounts })}

      <main className="main ra-main">
        <StickyHeaderRA role={role} scrolled={scrolled} onAction={onAction} />

        <div className="content">
          <div className="ra-sections">
            <FitSummaryRA        data={role.fitSummary} />
            <RoleSummaryRA       text={role.summary} />
            <WhyExistsRA         data={role.whyExists} />
            <WhatYouDoRA         items={role.whatYouDo} />
            <LookingForRA        data={role.reallyLookingFor} />
            <PracticalDetailsRA  data={role.practicalDetails} onCompensation={() => setCompOpen(true)} />
            <RisksRA             items={role.risks} />
            <QuestionsRA         items={role.questions} />
            <SuggestedActionsRA  items={role.actions} onAction={onAction} />
          </div>
        </div>
      </main>

      {compOpen && <CompensationPanel role={role} onClose={() => setCompOpen(false)} />}
      {editMode && <TweaksRA tweaks={tweaks} setTweaks={setTweaks} />}
      {toast && <div className="rl-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppRA />);
