/* eslint-disable */
// Modal screens: Voice listening, Quick-Add draft, AI Coach (entry + summary),
// Carry-Over Triage ritual (recap + per-task triage + pull from backlog).

// ─────────── Voice listening (overlay over This Week) ───────────
function VoiceListening() {
  return (
    <div className="page">
      <StatusBar />
      {/* Faded This Week underneath */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ filter: 'blur(2px)', opacity: 0.5, padding: '0 20px' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 30, margin: '8px 0 24px', color: 'var(--text)' }}>This week</h1>
          <div className="milestone" style={{ marginBottom: 14 }}>
            <div className="eyebrow"><Icon name="target" size={12}/> Primary milestone</div>
            <h2>Land first paid DJ gig by September</h2>
          </div>
          <div className="habit">
            <div className="ring"><Ring value={3} target={4} /></div>
            <div className="body"><div className="title">Gym</div></div>
          </div>
        </div>
        <div className="voice-overlay">
          <div className="voice-orb">
            <Icon name="mic" size={42} stroke={1.6} color="#1a1816" />
          </div>
          <div style={{ marginTop: 36, fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: 'var(--text)', textAlign: 'center', letterSpacing: '-0.01em' }}>
            Listening…
          </div>
          <div style={{ marginTop: 10, fontSize: 14, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.5 }}>
            "Email Pulse Bar tomorrow about<br/>that opening slot…"
          </div>
          <div style={{ marginTop: 40, display: 'flex', gap: 22, alignItems: 'center' }}>
            <button className="icon-btn" style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface)', color: 'var(--text-2)' }}>
              <Icon name="x" size={20} stroke={2}/>
            </button>
            <button className="icon-btn" style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface)', color: 'var(--text-2)' }}>
              <Icon name="check" size={22} stroke={2}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── Quick-Add Draft Card ───────────
function QuickAddDraft() {
  return (
    <div className="page">
      <div className="modal-head">
        <button className="icon-btn"><Icon name="x" size={20}/></button>
        <div className="title">New from voice</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', fontFeatureSettings: "'tnum'" }}>1 of 2</div>
      </div>

      {/* AI-listened preview */}
      <div style={{ padding: '0 20px 6px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 12 }}>
        <Icon name="sparkles" size={12} stroke={2}/>
        <span>Heard: "Email Pulse Bar tomorrow about that opening slot, low effort, links to the DJ gig goal"</span>
      </div>

      <div style={{ padding: '14px 20px', flex: 1, overflowY: 'auto' }}>
        {/* Type pill */}
        <div style={{ display: 'inline-flex', background: 'var(--surface)', borderRadius: 10, padding: 3, gap: 2, marginBottom: 18 }}>
          <button style={{ background: 'var(--accent)', color: '#1a1816', border: 'none', padding: '7px 16px', borderRadius: 7, fontWeight: 600, fontSize: 12.5 }}>Task</button>
          <button style={{ background: 'transparent', color: 'var(--text-2)', border: 'none', padding: '7px 16px', borderRadius: 7, fontWeight: 500, fontSize: 12.5 }}>Habit</button>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Title</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.01em', borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
            Email Pulse Bar about opening slot
          </div>
        </div>

        <div style={{ marginBottom: 14, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Details</div>
        <div className="qa-chips">
          <div className="qa-chip"><span className="key">Theme</span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: THEMES.dj.color }}/>{THEMES.dj.name}</div>
          <div className="qa-chip"><span className="key">Effort</span>low</div>
          <div className="qa-chip low-conf"><span className="key">Return</span>med?</div>
          <div className="qa-chip"><span className="key">Week</span>this week</div>
          <div className="qa-chip"><span className="key">Goal</span><Icon name="link" size={10} stroke={2}/>First paid gig</div>
          <div className="qa-chip low-conf"><span className="key">Reminder</span>tomorrow 9am?</div>
        </div>

        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          <Icon name="sparkles" size={11} stroke={2}/> Italic chips are AI's best guess — tap to confirm.
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '12px 20px 22px', display: 'flex', gap: 10, borderTop: '1px solid var(--hairline)' }}>
        <button className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1.4 }}>Save · next</button>
      </div>
    </div>
  );
}

// ─────────── Quick-Add Draft (variant: inline expanded picker) ───────────
// Tapping a field chip expands it inline into a selectable list — no separate
// sheet, no nested form. The other chips reflow below the expanded picker.
function QuickAddDraftInline() {
  const [open, setOpen] = React.useState('theme'); // 'theme' | 'effort' | 'return' | 'week' | null
  const [theme, setTheme]   = React.useState('dj');
  const [effort, setEffort] = React.useState('low');
  const [ret, setRet]       = React.useState('med');
  const [week, setWeek]     = React.useState('this');

  const toggle = (k) => setOpen(o => o === k ? null : k);

  const FIELD_ORDER = ['theme', 'effort', 'return', 'week', 'goal', 'reminder'];

  // ── Chip rendering ───────────────────────────────────────────────
  const Chip = ({ k, label, value, lowConf, locked }) => {
    const isOpen = open === k;
    return (
      <div
        className={`qa-chip ${lowConf ? 'low-conf' : ''}`}
        onClick={() => !locked && toggle(k)}
        style={{
          background: isOpen ? 'var(--accent-dim)' : undefined,
          boxShadow: isOpen ? 'inset 0 0 0 1px var(--accent)' : undefined,
          color: isOpen ? 'var(--text)' : undefined,
        }}
      >
        <span className="key" style={{ color: isOpen ? 'var(--accent-strong)' : undefined }}>{label}</span>
        {value}
        <Icon
          name={isOpen ? 'chevDown' : 'chevRight'}
          size={11} stroke={2}
          style={{ marginLeft: 4, opacity: 0.6 }}
        />
      </div>
    );
  };

  // ── Inline picker (shared layout) ────────────────────────────────
  const Picker = ({ title, hint, children }) => (
    <div className="card" style={{
      padding: '14px 14px 12px',
      marginTop: 10,
      boxShadow: 'inset 0 0 0 1px var(--accent-dim), 0 4px 14px rgba(0,0,0,0.12)',
      background: 'color-mix(in oklab, var(--accent-dim) 18%, var(--surface))',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--accent-strong)', fontWeight: 600 }}>{title}</span>
        {hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );

  const Option = ({ on, onClick, leading, label, sub }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 6px',
        borderTop: '1px solid var(--hairline)',
        cursor: 'pointer',
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        border: on ? 'none' : '1.5px solid var(--text-3)',
        background: on ? 'var(--accent)' : 'transparent',
        flex: '0 0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <Icon name="check" size={11} stroke={2.8} color="#1a1816"/>}
      </span>
      {leading}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: on ? 500 : 450 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );

  // ── Pickers ──────────────────────────────────────────────────────
  const ThemePicker = () => (
    <Picker title="Theme" hint="Tap to change">
      {Object.entries(THEMES).map(([k, t]) => (
        <Option
          key={k}
          on={theme === k}
          onClick={() => { setTheme(k); setOpen(null); }}
          leading={<span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flex: '0 0 auto' }}/>}
          label={t.name}
          sub={k === 'dj' ? 'Suggested · matches "Pulse Bar"' : null}
        />
      ))}
    </Picker>
  );

  const EffortPicker = () => (
    <Picker title="Effort · how heavy is this lift?">
      {[
        { v: 'low',  l: 'Low',    s: 'Under ~30 min, no setup' },
        { v: 'med',  l: 'Medium', s: 'A focused hour or so' },
        { v: 'high', l: 'High',   s: 'Half-day or more, real activation cost' },
      ].map(o => (
        <Option
          key={o.v}
          on={effort === o.v}
          onClick={() => { setEffort(o.v); setOpen(null); }}
          label={o.l}
          sub={o.s}
        />
      ))}
    </Picker>
  );

  const ReturnPicker = () => (
    <Picker title="Return · how much will this move the goal?">
      {[
        { v: 'low',  l: 'Low',    s: 'Nice-to-have' },
        { v: 'med',  l: 'Medium', s: 'Useful, not pivotal' },
        { v: 'high', l: 'High',   s: 'Unlocks something material' },
      ].map(o => (
        <Option
          key={o.v}
          on={ret === o.v}
          onClick={() => { setRet(o.v); setOpen(null); }}
          label={o.l}
          sub={o.s}
        />
      ))}
    </Picker>
  );

  const WeekPicker = () => (
    <Picker title="Where does this live?">
      {[
        { v: 'this',    l: 'This week',  s: "Show on This Week — you're committing now" },
        { v: 'backlog', l: 'Backlog',    s: 'For later — surfaces in Sunday set-up' },
      ].map(o => (
        <Option
          key={o.v}
          on={week === o.v}
          onClick={() => { setWeek(o.v); setOpen(null); }}
          label={o.l}
          sub={o.s}
        />
      ))}
    </Picker>
  );

  const renderPicker = () => {
    if (open === 'theme')  return <ThemePicker />;
    if (open === 'effort') return <EffortPicker />;
    if (open === 'return') return <ReturnPicker />;
    if (open === 'week')   return <WeekPicker />;
    return null;
  };

  // Values for chip display
  const themeVal = (
    <>
      <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: THEMES[theme].color }}/>
      {THEMES[theme].name}
    </>
  );
  const weekLabel = week === 'this' ? 'this week' : 'backlog';

  // ── Render chips with the active picker injected after its chip ──
  // We split FIELD_ORDER into "above the picker" and "below the picker".
  const openIdx = open ? FIELD_ORDER.indexOf(open) : -1;

  const chipFor = (k) => {
    if (k === 'theme')   return <Chip key="theme"   k="theme"   label="Theme"  value={themeVal} />;
    if (k === 'effort')  return <Chip key="effort"  k="effort"  label="Effort" value={effort} />;
    if (k === 'return')  return <Chip key="return"  k="return"  label="Return" value={ret} lowConf={ret === 'med'} />;
    if (k === 'week')    return <Chip key="week"    k="week"    label="Week"   value={weekLabel} />;
    if (k === 'goal')    return <Chip key="goal"    k="goal"    label="Goal"   value={<><Icon name="link" size={10} stroke={2}/>First paid gig</>} locked />;
    if (k === 'reminder')return <Chip key="reminder" k="reminder" label="Reminder" value="tomorrow 9am?" lowConf locked />;
    return null;
  };

  const above = openIdx === -1 ? FIELD_ORDER : FIELD_ORDER.slice(0, openIdx + 1);
  const below = openIdx === -1 ? []           : FIELD_ORDER.slice(openIdx + 1);

  return (
    <div className="page">
      <div className="modal-head">
        <button className="icon-btn"><Icon name="x" size={20}/></button>
        <div className="title">New from voice</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', fontFeatureSettings: "'tnum'" }}>1 of 2</div>
      </div>

      {/* AI-listened preview */}
      <div style={{ padding: '0 20px 6px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 12 }}>
        <Icon name="sparkles" size={12} stroke={2}/>
        <span>Heard: "Email Pulse Bar tomorrow about that opening slot, low effort…"</span>
      </div>

      <div style={{ padding: '14px 20px', flex: 1, overflowY: 'auto' }}>
        {/* Type pill */}
        <div style={{ display: 'inline-flex', background: 'var(--surface)', borderRadius: 10, padding: 3, gap: 2, marginBottom: 18 }}>
          <button style={{ background: 'var(--accent)', color: '#1a1816', border: 'none', padding: '7px 16px', borderRadius: 7, fontWeight: 600, fontSize: 12.5 }}>Task</button>
          <button style={{ background: 'transparent', color: 'var(--text-2)', border: 'none', padding: '7px 16px', borderRadius: 7, fontWeight: 500, fontSize: 12.5 }}>Habit</button>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Title</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.01em', borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
            Email Pulse Bar about opening slot
          </div>
        </div>

        <div style={{ marginBottom: 14, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Details</div>

        {/* Chips above the open picker */}
        <div className="qa-chips">
          {above.map(chipFor)}
        </div>

        {/* Inline picker, injected right after the open chip */}
        {renderPicker()}

        {/* Chips below the open picker (only when something's open) */}
        {below.length > 0 && (
          <div className="qa-chips" style={{ marginTop: 12 }}>
            {below.map(chipFor)}
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          <Icon name="sparkles" size={11} stroke={2}/> Tap any chip to swap its value inline — no separate sheet.
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '12px 20px 22px', display: 'flex', gap: 10, borderTop: '1px solid var(--hairline)' }}>
        <button className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1.4 }}>Save · next</button>
      </div>
    </div>
  );
}

// ─────────── Quick-Add Draft (habit variant, inline picker) ───────────
// Same inline-picker pattern as the task variant, but the field vocabulary
// is habit-specific: Theme / Weekly count / Goal link. No effort/return/week.
function QuickAddHabitInline() {
  const [open, setOpen]   = React.useState('count'); // open the differentiator by default
  const [theme, setTheme] = React.useState('dj');
  const [count, setCount] = React.useState(3);

  const toggle = (k) => setOpen(o => o === k ? null : k);

  const Chip = ({ k, label, value, locked }) => {
    const isOpen = open === k;
    return (
      <div
        className="qa-chip"
        onClick={() => !locked && toggle(k)}
        style={{
          background: isOpen ? 'var(--accent-dim)' : undefined,
          boxShadow: isOpen ? 'inset 0 0 0 1px var(--accent)' : undefined,
          color: isOpen ? 'var(--text)' : undefined,
        }}
      >
        <span className="key" style={{ color: isOpen ? 'var(--accent-strong)' : undefined }}>{label}</span>
        {value}
        <Icon name={isOpen ? 'chevDown' : 'chevRight'} size={11} stroke={2} style={{ marginLeft: 4, opacity: 0.6 }}/>
      </div>
    );
  };

  const Picker = ({ title, hint, children }) => (
    <div className="card" style={{
      padding: '14px 14px 12px',
      marginTop: 10,
      boxShadow: 'inset 0 0 0 1px var(--accent-dim), 0 4px 14px rgba(0,0,0,0.12)',
      background: 'color-mix(in oklab, var(--accent-dim) 18%, var(--surface))',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--accent-strong)', fontWeight: 600 }}>{title}</span>
        {hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );

  // ── Weekly-count picker: pip dots, tap a number to commit ──
  const CountPicker = () => (
    <Picker title="How often per week?" hint="Hit this = on-target for the week">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        margin: '6px 0 4px',
      }}>
        {[1,2,3,4,5,6,7].map(n => {
          const on = count === n;
          return (
            <button
              key={n}
              onClick={() => { setCount(n); setOpen(null); }}
              style={{
                aspectRatio: '1 / 1',
                border: 'none', cursor: 'pointer',
                borderRadius: 10,
                background: on ? 'var(--accent)' : 'var(--surface-2)',
                color: on ? '#1a1816' : 'var(--text)',
                fontFamily: 'var(--serif)', fontWeight: 500,
                fontSize: 17, fontFeatureSettings: "'tnum'",
                boxShadow: on ? '0 4px 10px rgba(200,120,86,0.30)' : 'none',
                transition: 'all .12s',
              }}
            >
              {n}×
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
        e.g. <strong style={{ color: 'var(--text-2)', fontWeight: 500 }}>{count}×</strong> means {count} sessions any time during the week — order doesn't matter, day of week doesn't matter.
      </div>
    </Picker>
  );

  // ── Theme picker (reused pattern) ──
  const Option = ({ on, onClick, leading, label, sub }) => (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 6px',
      borderTop: '1px solid var(--hairline)',
      cursor: 'pointer',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        border: on ? 'none' : '1.5px solid var(--text-3)',
        background: on ? 'var(--accent)' : 'transparent',
        flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <Icon name="check" size={11} stroke={2.8} color="#1a1816"/>}
      </span>
      {leading}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: on ? 500 : 450 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );

  const ThemePicker = () => (
    <Picker title="Theme">
      {Object.entries(THEMES).map(([k, t]) => (
        <Option
          key={k}
          on={theme === k}
          onClick={() => { setTheme(k); setOpen(null); }}
          leading={<span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flex: '0 0 auto' }}/>}
          label={t.name}
          sub={k === 'dj' ? 'Suggested · matches "CDJs"' : null}
        />
      ))}
    </Picker>
  );

  const renderPicker = () => {
    if (open === 'count')  return <CountPicker />;
    if (open === 'theme')  return <ThemePicker />;
    return null;
  };

  const FIELD_ORDER = ['theme', 'count', 'goal'];
  const openIdx = open ? FIELD_ORDER.indexOf(open) : -1;
  const chipFor = (k) => {
    if (k === 'theme') return (
      <Chip key="theme" k="theme" label="Theme"
        value={<><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: THEMES[theme].color }}/>{THEMES[theme].name}</>}
      />
    );
    if (k === 'count') return (
      <Chip key="count" k="count" label="Weekly"
        value={<><span style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontFeatureSettings: "'tnum'" }}>{count}×</span> per week</>}
      />
    );
    if (k === 'goal') return (
      <Chip key="goal" k="goal" label="Goal"
        value={<><Icon name="link" size={10} stroke={2}/>First paid gig</>}
        locked
      />
    );
    return null;
  };
  const above = openIdx === -1 ? FIELD_ORDER : FIELD_ORDER.slice(0, openIdx + 1);
  const below = openIdx === -1 ? []           : FIELD_ORDER.slice(openIdx + 1);

  return (
    <div className="page">
      <div className="modal-head">
        <button className="icon-btn"><Icon name="x" size={20}/></button>
        <div className="title">New from voice</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', fontFeatureSettings: "'tnum'" }}>2 of 2</div>
      </div>

      <div style={{ padding: '0 20px 6px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 12 }}>
        <Icon name="sparkles" size={12} stroke={2}/>
        <span>Heard: "Practice on the CDJs three times a week"</span>
      </div>

      <div style={{ padding: '14px 20px', flex: 1, overflowY: 'auto' }}>
        {/* Type pill — Habit selected */}
        <div style={{ display: 'inline-flex', background: 'var(--surface)', borderRadius: 10, padding: 3, gap: 2, marginBottom: 18 }}>
          <button style={{ background: 'transparent', color: 'var(--text-2)', border: 'none', padding: '7px 16px', borderRadius: 7, fontWeight: 500, fontSize: 12.5 }}>Task</button>
          <button style={{ background: 'var(--accent)', color: '#1a1816', border: 'none', padding: '7px 16px', borderRadius: 7, fontWeight: 600, fontSize: 12.5 }}>Habit</button>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Title</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.01em', borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
            Practice on CDJs
          </div>
        </div>

        <div style={{ marginBottom: 14, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Details</div>

        <div className="qa-chips">{above.map(chipFor)}</div>
        {renderPicker()}
        {below.length > 0 && (
          <div className="qa-chips" style={{ marginTop: 12 }}>{below.map(chipFor)}</div>
        )}

        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          <Icon name="sparkles" size={11} stroke={2}/> No effort/return/week — habits run continuously, weekly count is what matters.
        </div>
      </div>

      <div style={{ padding: '12px 20px 22px', display: 'flex', gap: 10, borderTop: '1px solid var(--hairline)' }}>
        <button className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1.4 }}>Save habit</button>
      </div>
    </div>
  );
}

// ─────────── Add Goal Form (full-screen modal) ───────────
// Reached two ways: direct from Goals tab (empty), or from Coach's
// "Create this goal" button (every field pre-filled). Single enforcement
// point for the 1+2 goal cap — the cap-exceeded modal triggers here on save.
function AddGoalForm({ prefilled = false }) {
  const [title, setTitle]   = React.useState(prefilled ? 'Land first paid DJ gig' : '');
  const [why, setWhy]       = React.useState(prefilled ? "Stop describing myself as 'getting into' DJing. One paid set on a real lineup before September." : '');
  const [type, setType]     = React.useState('primary');
  const [theme, setTheme]   = React.useState(prefilled ? 'dj' : '');
  const [datePick, setDatePick] = React.useState(prefilled ? '6mo' : null);
  const [themeOpen, setThemeOpen] = React.useState(false);

  const canSave = title.trim().length > 0 && datePick !== null;

  // Pretty target date for each quick chip
  const dateLabel = {
    '3mo':    'Aug 15, 2026',
    '6mo':    'Nov 15, 2026',
    '1y':     'May 15, 2027',
    'custom': 'pick a date…',
  }[datePick];

  return (
    <div className="page">
      <div className="modal-head">
        <button className="icon-btn"><Icon name="x" size={20}/></button>
        <div className="title">New goal</div>
        <button
          disabled={!canSave}
          style={{
            background: 'transparent', border: 'none',
            color: canSave ? 'var(--accent-strong)' : 'var(--text-3)',
            fontSize: 14, fontWeight: 600, padding: '0 6px', cursor: canSave ? 'pointer' : 'default',
            letterSpacing: '0.005em',
          }}
        >Save</button>
      </div>

      {prefilled && (
        <div style={{ margin: '0 16px 4px', padding: '8px 12px', background: 'var(--accent-dim)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-strong)', fontSize: 12 }}>
          <Icon name="sparkles" size={13} stroke={2}/>
          From your conversation with Coach — review and save.
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 24px' }}>
        {/* Title */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>Goal</div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What are you working toward?"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontFamily: 'var(--serif)',
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
              padding: '0 0 10px',
              borderBottom: '1px solid var(--hairline)',
            }}
          />
        </div>

        {/* Target date */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Target date</span>
            <span style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: datePick ? 'var(--text-3)' : 'var(--accent-strong)', fontWeight: 600 }}>{datePick ? '' : 'Required'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { v: '3mo',    l: '3 months' },
              { v: '6mo',    l: '6 months' },
              { v: '1y',     l: '1 year' },
              { v: 'custom', l: 'Custom…' },
            ].map(o => {
              const on = datePick === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setDatePick(o.v)}
                  style={{
                    border: 'none', cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: on ? 'var(--accent)' : 'var(--surface)',
                    color: on ? '#1a1816' : 'var(--text)',
                    fontWeight: on ? 600 : 500,
                    fontSize: 13,
                    boxShadow: on ? '0 3px 10px rgba(200,120,86,0.25)' : 'none',
                    fontFamily: 'var(--sans)',
                  }}
                >{o.l}</button>
              );
            })}
          </div>
          {datePick && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text)',
              fontSize: 14,
              fontFeatureSettings: "'tnum'",
            }}>
              <Icon name="calendar" size={16} stroke={1.7} color="var(--text-2)"/>
              <span>{dateLabel}</span>
              {datePick !== 'custom' && (
                <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-3)', letterSpacing: '0.04em' }}>tap to refine</span>
              )}
            </div>
          )}
        </div>

        {/* Type */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>Type</div>
          {[
            { v: 'primary',   l: 'Primary',   s: 'Your headline goal. One at a time.' },
            { v: 'secondary', l: 'Secondary', s: 'Side priority. Up to two of these.' },
          ].map(o => {
            const on = type === o.v;
            return (
              <div
                key={o.v}
                onClick={() => setType(o.v)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 14px',
                  marginBottom: 6,
                  background: on ? 'color-mix(in oklab, var(--accent-dim) 35%, var(--surface))' : 'var(--surface)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: on ? 'inset 0 0 0 1px var(--accent-dim)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: on ? 'none' : '1.5px solid var(--text-3)',
                  background: on ? 'var(--accent)' : 'transparent',
                  flex: '0 0 auto', marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1a1816' }}/>}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, color: 'var(--text)', fontWeight: 500 }}>{o.l}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>{o.s}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>Theme</div>
          <div
            onClick={() => setThemeOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              background: themeOpen ? 'color-mix(in oklab, var(--accent-dim) 18%, var(--surface))' : 'var(--surface)',
              boxShadow: themeOpen ? 'inset 0 0 0 1px var(--accent-dim)' : 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            {theme ? (
              <>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: THEMES[theme].color }}/>
                <span style={{ fontSize: 14, color: 'var(--text)' }}>{THEMES[theme].name}</span>
                {prefilled && !themeOpen && (
                  <span style={{ marginLeft: 8, fontSize: 10.5, color: 'var(--accent-strong)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Coach suggested</span>
                )}
              </>
            ) : (
              <span style={{ fontSize: 14, color: 'var(--text-3)' }}>Pick a theme — AI will suggest once you've typed a goal</span>
            )}
            <Icon name={themeOpen ? 'chevDown' : 'chevRight'} size={14} stroke={1.8} color="var(--text-3)" style={{ marginLeft: 'auto' }}/>
          </div>
          {themeOpen && (
            <div style={{
              marginTop: 8,
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 14px',
              boxShadow: 'inset 0 0 0 1px var(--hairline)',
            }}>
              {Object.entries(THEMES).map(([k, t]) => {
                const on = theme === k;
                return (
                  <div
                    key={k}
                    onClick={() => { setTheme(k); setThemeOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 0',
                      borderBottom: '1px solid var(--hairline)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.color }}/>
                    <span style={{ fontSize: 14, color: 'var(--text)' }}>{t.name}</span>
                    {on && <Icon name="check" size={14} stroke={2.5} color="var(--accent)" style={{ marginLeft: 'auto' }}/>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Why (optional) */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Why does this matter?</span>
            <span style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Optional</span>
          </div>
          <textarea
            value={why}
            onChange={e => setWhy(e.target.value)}
            placeholder="In your own words. Read this back on a rough week."
            rows={3}
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontFamily: 'var(--sans)',
              fontSize: 13.5,
              lineHeight: 1.55,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              resize: 'none',
              boxShadow: 'inset 0 0 0 1px var(--hairline)',
            }}
          />
        </div>

        {!canSave && (
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>
            Title + target date are required.
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '12px 20px 22px', display: 'flex', gap: 10, borderTop: '1px solid var(--hairline)' }}>
        <button className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ flex: 1.6, opacity: canSave ? 1 : 0.45, pointerEvents: canSave ? 'auto' : 'none' }}
        >
          Save goal
        </button>
      </div>
    </div>
  );
}

// ─────────── AI Coach (entry / open) ───────────
function CoachEntry() {
  return (
    <div className="page">
      <div className="modal-head">
        <button className="icon-btn"><Icon name="x" size={20}/></button>
        <div className="title">Goal Coach</div>
        <button className="icon-btn" style={{ fontSize: 12, width: 'auto', padding: '0 10px', color: 'var(--text-3)' }}>Restart</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ alignSelf: 'center', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Just now</div>

        <div className="coach-bubble ai">
          Let's figure out what you actually want to work toward.
        </div>
        <div className="coach-bubble ai" style={{ marginTop: -2 }}>
          Not a New Year's resolution — something you'd genuinely be sad about not having tried by the end of summer. What's been pulling at you?
        </div>

        <div className="coach-bubble you" style={{ alignSelf: 'flex-end' }}>
          I keep telling friends I'm "getting into DJing" and it's been a year. I want it to mean something.
        </div>

        <div className="coach-bubble ai">
          Good — that "telling people for a year" feeling is worth chasing down. Two quick questions:
        </div>
        <div className="coach-bubble ai" style={{ marginTop: -4, background: 'var(--surface-2)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--accent-strong)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Principle</div>
          <div style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.5 }}>
            Goals need a date. "Someday I'd like to DJ" is direction, not a goal. We're looking for a deadline you'd respect.
          </div>
        </div>
        <div className="coach-bubble ai" style={{ marginTop: -2 }}>
          1. What would count as "it meant something" — a paid gig, a public set, finishing a mixtape?<br/>
          2. By when would not having it sting?
        </div>

        {/* typing indicator */}
        <div style={{ alignSelf: 'flex-start', padding: '8px 14px', background: 'var(--surface)', borderRadius: 16, borderBottomLeftRadius: 6, display: 'flex', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)', animation: 'dotpulse 1.2s infinite' }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)', animation: 'dotpulse 1.2s 0.2s infinite' }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)', animation: 'dotpulse 1.2s 0.4s infinite' }} />
        </div>
      </div>

      <div className="input-bar">
        <div className="field">Type or hold the mic…</div>
        <button className="mic-btn"><Icon name="mic" size={18} stroke={1.8} color="#1a1816"/></button>
      </div>
      <style>{`@keyframes dotpulse { 0%, 60%, 100% { opacity: 0.3 } 30% { opacity: 1 } }`}</style>
    </div>
  );
}

// ─────────── AI Coach (final summary) ───────────
function CoachSummary() {
  return (
    <div className="page">
      <div className="modal-head">
        <button className="icon-btn"><Icon name="x" size={20}/></button>
        <div className="title">Goal Coach</div>
        <button className="icon-btn" style={{ fontSize: 12, width: 'auto', padding: '0 10px', color: 'var(--text-3)' }}>Restart</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="coach-bubble you" style={{ alignSelf: 'flex-end' }}>
          A paid gig. Even fifty bucks. By September feels real — that's the festival season ending.
        </div>

        <div className="coach-bubble ai">
          That's the goal. It's specific (paid, not "perform"), dated (Sept), and you'd notice if you missed it. Three things to know before you create it:
        </div>

        <div className="coach-bubble ai" style={{ marginTop: -2, background: 'var(--surface-2)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--accent-strong)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Summary</div>
          <div style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.55 }}>
            <div style={{ marginBottom: 6 }}><strong style={{ fontFamily: 'var(--serif)', fontWeight: 500, color: 'var(--accent-strong)' }}>Goal</strong> · Land first paid DJ gig</div>
            <div style={{ marginBottom: 6 }}><strong style={{ fontFamily: 'var(--serif)', fontWeight: 500, color: 'var(--accent-strong)' }}>By</strong> · September 2026</div>
            <div><strong style={{ fontFamily: 'var(--serif)', fontWeight: 500, color: 'var(--accent-strong)' }}>Theme</strong> · DJ career</div>
          </div>
        </div>

        <div className="coach-bubble ai" style={{ marginTop: -2 }}>
          One note — this would be your <em>primary</em>. The job search you mentioned would have to sit as a secondary alongside it. You can always swap them later.
        </div>

        <div style={{ padding: '8px 0 0' }}>
          <button className="btn btn-primary btn-block">
            <Icon name="arrow" size={16} stroke={2}/> Create this goal
          </button>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Opens the Add Goal form, pre-filled. You'll review before saving.
          </div>
        </div>
      </div>

      <div className="input-bar">
        <div className="field">Want to refine? Keep chatting…</div>
        <button className="mic-btn"><Icon name="mic" size={18} stroke={1.8} color="#1a1816"/></button>
      </div>
    </div>
  );
}

// ─────────── Carry-Over: Recap step ───────────
function CarryRecap() {
  return (
    <div className="page">
      <div className="modal-head">
        <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Sunday set-up · 1 of 3</span>
        <div style={{ width: 24 }} />
      </div>
      <div style={{ flex: 1, padding: '8px 24px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '14px 0 28px' }}>
          Last week
        </h2>

        <div style={{ display: 'flex', gap: 28, alignItems: 'baseline', marginBottom: 26 }}>
          <div>
            <div className="recap-num">11<span className="of">/14</span></div>
            <div className="recap-num label" style={{ marginTop: 8 }}>Tasks done</div>
          </div>
          <div>
            <div className="recap-num" style={{ fontSize: 64 }}>3<span className="of">/3</span></div>
            <div className="recap-num label" style={{ marginTop: 8 }}>Habits on target</div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>Streaks</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', fontSize: 14 }}>
            <Icon name="flame" size={16} color="var(--gold)" stroke={1.8}/>
            <span>Gym streak</span>
            <span style={{ marginLeft: 'auto', color: 'var(--gold)', fontFeatureSettings: "'tnum'", fontWeight: 600 }}>→ 9 weeks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 0', fontSize: 14, color: 'var(--text-2)' }}>
            <Icon name="refresh" size={16} color="var(--brick)" stroke={1.6}/>
            <span>Bachata practice</span>
            <span style={{ marginLeft: 'auto', color: 'var(--brick)', fontFeatureSettings: "'tnum'" }}>reset to 0</span>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--accent-strong)', fontWeight: 600, marginBottom: 8 }}>Still working toward</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, marginBottom: 6, lineHeight: 1.3 }}>Land first paid DJ gig</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>5 tasks done toward it last week</div>
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
          Review leftovers <Icon name="arrow" size={16} stroke={2}/>
        </button>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 12 }}>
          7 tasks from last week need a decision before this week starts.
        </div>
      </div>
    </div>
  );
}

// ─────────── Carry-Over: Triage one task ───────────
function CarryTriage() {
  return (
    <div className="page">
      <div className="modal-head">
        <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Sunday set-up · 2 of 3</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ padding: '6px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>Last week's leftovers</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFeatureSettings: "'tnum'" }}>3 of 7</span>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 26 }}>
          {[0,1].map(i => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--sage)' }}/>)}
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--accent)' }}/>
          {[0,1,2,3].map(i => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--surface-hi)' }}/>)}
        </div>

        {/* Focal task card */}
        <div className="card" style={{ padding: 22, marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.01em', marginBottom: 16 }}>
            Cut 8-min demo set from Saturday recording
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <ThemeChip theme="dj" />
            <EffortChip level="med" />
            <ReturnChip level="high" />
            <GoalChip label="First paid gig" />
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="calendar" size={12} stroke={1.8}/> originally added 9 days ago
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* 3 actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary btn-block">Keep for this week</button>
          <button className="btn btn-ghost btn-block">Send to backlog</button>
          <button className="btn btn-text btn-block" style={{ color: 'var(--text-3)' }}>Drop</button>
        </div>
      </div>
    </div>
  );
}

// ─────────── Carry-Over: Pull from backlog ───────────
function CarryPull() {
  const items = [
    { id: 'p1', title: 'Build small portfolio site (Astro)', theme: 'job', effort: 'high', ret: 'high', goal: 'New role by Oct', added: false },
    { id: 'p2', title: 'Ask Sarah for intro to design lead', theme: 'job', effort: 'low', ret: 'high', goal: 'New role by Oct', added: true },
    { id: 'p3', title: 'Schedule yearly bloodwork',         theme: 'fitness', effort: 'low', ret: 'high', added: true },
    { id: 'p4', title: 'Year-in-review mix for SoundCloud', theme: 'dj', effort: 'high', ret: 'med', added: false },
    { id: 'p5', title: 'Research Pioneer FLX10 vs Rev7',    theme: 'dj', effort: 'med', ret: 'low', added: false },
    { id: 'p6', title: 'Try yoga class at Movement once',   theme: 'fitness', effort: 'low', ret: 'med', added: false },
  ];
  return (
    <div className="page">
      <div className="modal-head">
        <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Sunday set-up · 3 of 3</span>
        <div style={{ width: 24 }} />
      </div>
      <div style={{ padding: '6px 20px 100px', flex: 1, overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500, margin: '8px 0 6px', letterSpacing: '-0.015em' }}>
          Stock this week
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 22px' }}>
          Anything in your backlog you want to pull in? Optional — tap to add. <span style={{ color: 'var(--sage)', fontWeight: 600 }}>2 added.</span>
        </p>

        {items.map(t => (
          <div key={t.id} className="task" style={{ background: t.added ? 'color-mix(in oklab, var(--sage-dim), var(--surface) 30%)' : 'var(--surface)', cursor: 'pointer' }}>
            <div className="check" style={{
              border: t.added ? 'none' : '1.5px dashed var(--text-3)',
              background: t.added ? 'var(--sage)' : 'transparent',
            }}>
              {t.added ? <Icon name="check" size={13} stroke={2.5} color="var(--bg)"/> : <Icon name="plus" size={12} stroke={2} color="var(--text-3)"/>}
            </div>
            <div className="body">
              <div className="title" style={{ color: t.added ? 'var(--text)' : 'var(--text)' }}>{t.title}</div>
              <div className="meta">
                <ThemeChip theme={t.theme} />
                <EffortChip level={t.effort} />
                <ReturnChip level={t.ret} />
                {t.goal && <GoalChip label={t.goal} />}
              </div>
            </div>
            {t.added && (
              <span style={{ fontSize: 10.5, color: 'var(--sage)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, alignSelf: 'center' }}>Added</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 20px 22px', background: 'linear-gradient(to top, var(--bg) 60%, transparent)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="btn btn-primary btn-block">Start week</button>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center' }}>
          You can always pull more from the Backlog tab any time.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  VoiceListening, QuickAddDraft, QuickAddDraftInline, QuickAddHabitInline,
  AddGoalForm,
  CoachEntry, CoachSummary,
  CarryRecap, CarryTriage, CarryPull,
  TaskDetail, HabitDetail,
});

// ─────────── Faded "This Week" backdrop for the sheets ───────────
function SheetBackdrop() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ filter: 'blur(1px)', opacity: 0.55, padding: '0 20px' }}>
        <div style={{ height: 44 }} />
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginTop: 8, marginBottom: 4 }}>Week of May 12</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 30, margin: '0 0 14px', color: 'var(--text)', letterSpacing: '-0.02em' }}>This week</h1>
        <div className="milestone" style={{ marginBottom: 14 }}>
          <div className="eyebrow"><Icon name="target" size={12} stroke={2}/> Primary milestone</div>
          <h2>Land first paid DJ gig by September</h2>
          <div className="meta">
            <span className="pill">by Sept 2026</span>
            <span>5 tasks this week toward this</span>
          </div>
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 500, margin: '22px 0 10px' }}>Habits</div>
        <div className="habit">
          <div className="ring"><Ring value={3} target={4} /></div>
          <div className="body">
            <div className="title">Gym</div>
            <div className="row"><ThemeChip theme="fitness" /></div>
          </div>
        </div>
      </div>
      {/* Scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,18,16,0.55)' }} />
    </div>
  );
}

// ─────────── Task Detail (bottom sheet) ───────────
function TaskDetail() {
  return (
    <div className="page" style={{ position: 'relative' }}>
      <SheetBackdrop />
      <div className="sheet">
        <div className="grip" />

        {/* Title — large, editable feel */}
        <div style={{
          fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500,
          color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.01em',
          padding: '4px 2px 14px', borderBottom: '1px solid var(--hairline)',
          marginBottom: 18,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <span>Email Pulse Bar with mix link + dates</span>
          <Icon name="chevDown" size={16} stroke={1.8} style={{ color: 'var(--text-3)', marginTop: 6, flex: '0 0 auto' }} />
        </div>

        {/* Linked goal — tappable row that opens Goal detail (or "No goal" when unlinked).
            Read-only link in v1: re-assigning a task's goal here is out of scope. */}
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>Goal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', marginBottom: 18, cursor: 'pointer' }}>
          <Icon name="target" size={15} stroke={2} style={{ color: 'var(--accent-strong)' }}/>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>First paid gig</span>
          <Icon name="chevRight" size={14} stroke={2} style={{ color: 'var(--text-3)' }}/>
        </div>

        {/* Field chips — same vocabulary as the draft card */}
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>Details</div>
        <div className="qa-chips" style={{ marginBottom: 22 }}>
          <div className="qa-chip">
            <span className="key">Theme</span>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: THEMES.dj.color }}/>
            {THEMES.dj.name}
          </div>
          <div className="qa-chip"><span className="key">Effort</span>low</div>
          <div className="qa-chip"><span className="key">Return</span>high</div>
          <div className="qa-chip"><span className="key">Week</span>this week</div>
        </div>

        {/* Reminder — inline editable row, not a chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 22,
        }}>
          <Icon name="bell" size={16} stroke={1.7} color="var(--text-2)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>Tomorrow, 9:00 AM</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>One-time · tap to edit</div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--accent-strong)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Edit</span>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13.5 }}>
            <Icon name="inbox" size={15} stroke={1.7}/> Move to backlog
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13.5, color: 'var(--brick)' }}>
            <Icon name="x" size={15} stroke={2}/> Delete
          </button>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          Accidental? An Undo snackbar appears for ~6s after any remove.
        </div>
      </div>
    </div>
  );
}

// ─────────── Habit Detail (bottom sheet) ───────────
function HabitDetail() {
  const [target, setTarget] = React.useState(4);
  return (
    <div className="page" style={{ position: 'relative' }}>
      <SheetBackdrop />
      <div className="sheet">
        <div className="grip" />

        {/* Title */}
        <div style={{
          fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500,
          color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.01em',
          padding: '4px 2px 14px', borderBottom: '1px solid var(--hairline)',
          marginBottom: 18,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <span>Gym</span>
          <Icon name="chevDown" size={16} stroke={1.8} style={{ color: 'var(--text-3)', marginTop: 6, flex: '0 0 auto' }} />
        </div>

        {/* Theme + linked goal */}
        <div className="qa-chips" style={{ marginBottom: 22 }}>
          <div className="qa-chip">
            <span className="key">Theme</span>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: THEMES.fitness.color }}/>
            {THEMES.fitness.name}
          </div>
          <div className="qa-chip" style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>
            <span className="key">Goal</span>
            none — link one?
          </div>
        </div>

        {/* Weekly count target stepper */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px',
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 22,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500 }}>Weekly target</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>How many times per week to count this as on-target</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setTarget(t => Math.max(1, t - 1))} style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'var(--surface-hi)', color: 'var(--text)', fontSize: 16, cursor: 'pointer',
            }}>−</button>
            <div style={{
              minWidth: 44, textAlign: 'center',
              fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 22,
              color: 'var(--text)', fontFeatureSettings: "'tnum'",
            }}>{target}<span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 2 }}>×</span></div>
            <button onClick={() => setTarget(t => Math.min(14, t + 1))} style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'var(--surface-hi)', color: 'var(--text)', fontSize: 16, cursor: 'pointer',
            }}>+</button>
          </div>
        </div>

        {/* Streak block */}
        <div style={{
          padding: '16px 18px 18px',
          borderRadius: 'var(--radius-md)',
          background:
            'radial-gradient(100% 100% at 0% 0%, rgba(212,176,106,0.14), transparent 60%), var(--surface-2)',
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="flame" size={12} stroke={2}/> Streak
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 28 }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--gold)', lineHeight: 1, fontFeatureSettings: "'tnum'" }}>
                8<span style={{ fontSize: 16, color: 'var(--text-2)', marginLeft: 3 }}>wk</span>
              </div>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 500, marginTop: 6 }}>Current</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text)', lineHeight: 1, fontFeatureSettings: "'tnum'" }}>
                12<span style={{ fontSize: 13, color: 'var(--text-2)', marginLeft: 3 }}>wk</span>
              </div>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 500, marginTop: 6 }}>Best</div>
            </div>
          </div>
          {/* Last 8 weeks dot row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
            {[
              { hit: true },  { hit: true },  { hit: true },  { hit: true },
              { hit: true },  { hit: true },  { hit: true },  { hit: true, now: true },
            ].map((d, i) => (
              <div key={i} style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: d.hit ? 'var(--gold)' : 'var(--surface-hi)',
                opacity: d.now ? 1 : 0.7,
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
            <span>8 wk ago</span>
            <span>this week</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13.5 }}>
            <Icon name="pause" size={13} stroke={2}/> Pause
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13.5, color: 'var(--brick)' }}>
            <Icon name="x" size={15} stroke={2}/> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
