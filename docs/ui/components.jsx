/* eslint-disable */
// Shared primitives: icons, chips, status bar, tab bar, FABs, helpers
// Loaded as window globals for use by screen files.

// ─────────── Icons (Lucide/Phosphor-flavor line icons) ───────────
const Icon = ({ name, size = 20, stroke = 1.5, color = 'currentColor', style }) => {
  const s = size;
  const sw = stroke;
  const common = {
    width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
    style,
  };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>,
    inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    bar: <><path d="M3 3v18h18" /><rect x="7" y="13" width="3" height="5" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="5" width="3" height="13" /></>,
    settings: <><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.27 16.96l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <><path d="m5 12 5 5L20 7" /></>,
    chevDown: <><path d="m6 9 6 6 6-6" /></>,
    chevRight: <><path d="m9 6 6 6-6 6" /></>,
    chevLeft: <><path d="m15 6-6 6 6 6" /></>,
    x: <><path d="M18 6 6 18M6 6l12 12" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    sparkles: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    drag: <><circle cx="9" cy="5" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="9" cy="19" r="1.2"/><circle cx="15" cy="5" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="15" cy="19" r="1.2"/></>,
    flame: <><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.5 0 2.5-1 2.5-2.5 0-1-.5-2-1.5-3-1-1-1.5-2-1.5-3 0-1.5 1-2.5 2.5-2.5 2 0 3.5 1.5 3.5 4 0 4-3 7-7 7s-7-3-7-7c0-2.5 1.5-4.5 3.5-5.5"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    cards: <><rect x="3" y="5" width="14" height="14" rx="2" /><path d="M7 19h12a2 2 0 0 0 2-2V8" /></>,
    waveform: <><path d="M2 12h2M6 9v6M10 5v14M14 8v8M18 10v4M22 12h-2"/></>,
    pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
};

// ─────────── Themes data ───────────
const THEMES = {
  dj:      { name: 'DJ career',  color: '#c87856', icon: 'waveform' },
  fitness: { name: 'Fitness',    color: '#8ea076', icon: 'flame' },
  bachata: { name: 'Bachata',    color: '#c89072', icon: 'sparkles' },
  job:     { name: 'Job change', color: '#7a90a8', icon: 'cards' },
};

// ─────────── Chips ───────────
const ThemeChip = ({ theme }) => {
  const t = THEMES[theme] || {};
  return (
    <span className="chip" style={{
      background: `${t.color}22`,
      color: t.color,
    }}>
      <span className="dot" style={{ background: t.color }} />
      {t.name}
    </span>
  );
};

const EffortChip = ({ level }) => {
  const cls = level === 'low' ? 'chip-effort-low' : level === 'high' ? 'chip-effort-high' : 'chip-effort-med';
  const txt = level === 'low' ? '· low effort' : level === 'high' ? '· high effort' : '· med effort';
  return <span className={`chip ${cls}`}>{txt}</span>;
};
const ReturnChip = ({ level }) => {
  const cls = level === 'high' ? 'chip-return-high' : 'chip-return-med';
  const txt = level === 'high' ? '· high return' : '· med return';
  return <span className={`chip ${cls}`}>{txt}</span>;
};
const GoalChip = ({ label }) => (
  <span className="chip chip-goal">
    <Icon name="link" size={11} stroke={2}/> {label}
  </span>
);

// ─────────── Circular habit progress ring ───────────
const Ring = ({ value, target, size = 44, stroke = 4, hit }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / target, 1);
  const dash = c * pct;
  const color = hit ? 'var(--gold)' : 'var(--accent-strong)';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-hi)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray .25s ease' }}
      />
      <text
        x="50%" y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size > 50 ? 13 : 11}
        fontWeight={600}
        fontFamily="var(--sans)"
        style={{ fontFeatureSettings: "'tnum'" }}
        fill="var(--text)"
      >{value}/{target}</text>
    </svg>
  );
};

// ─────────── Phone status bar ───────────
const StatusBar = ({ time = '9:41', tint = 'var(--text)' }) => (
  <div className="status-bar" style={{ color: tint }}>
    <span>{time}</span>
    <div className="right">
      {/* signal */}
      <svg width="18" height="11" viewBox="0 0 18 11" fill={tint}><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="5" y="5" width="3" height="6" rx="0.5"/><rect x="10" y="2" width="3" height="9" rx="0.5"/><rect x="15" y="0" width="3" height="11" rx="0.5"/></svg>
      {/* wifi */}
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke={tint} strokeWidth="1.5"><path d="M1 4a11 11 0 0 1 14 0"/><path d="M3.5 6.5a7 7 0 0 1 9 0"/><circle cx="8" cy="9.2" r="1" fill={tint}/></svg>
      {/* battery */}
      <svg width="26" height="11" viewBox="0 0 26 11" fill="none"><rect x="0.5" y="0.5" width="22" height="10" rx="2" stroke={tint} strokeOpacity="0.5"/><rect x="2" y="2" width="19" height="7" rx="1" fill={tint}/><rect x="23.5" y="3.5" width="1.5" height="4" rx="0.5" fill={tint} fillOpacity="0.5"/></svg>
    </div>
  </div>
);

// ─────────── Tab bar ───────────
const TabBar = ({ active = 'home' }) => {
  const tabs = [
    { id: 'home', label: 'This Week', icon: 'home' },
    { id: 'backlog', label: 'Backlog', icon: 'inbox' },
    { id: 'goals', label: 'Goals', icon: 'target' },
    { id: 'stats', label: 'Stats', icon: 'bar' },
  ];
  return (
    <nav className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className={active === t.id ? 'on' : ''}>
          <Icon name={t.icon} size={21} stroke={1.6} />
          {t.label}
        </button>
      ))}
    </nav>
  );
};

// ─────────── FAB pair ───────────
const FabPair = ({ onMic }) => (
  <div className="fab-pair">
    <button className="fab small" aria-label="Add">
      <Icon name="plus" size={20} stroke={2} />
    </button>
    <button className="fab" aria-label="Voice" onClick={onMic}>
      <Icon name="mic" size={22} stroke={1.8} />
    </button>
  </div>
);

// ─────────── Task row ───────────
const Task = ({ task, onToggle }) => {
  return (
    <div className={`task ${task.done ? 'done' : ''}`}>
      <div className={`check ${task.done ? 'done' : ''}`} onClick={onToggle}>
        {task.done && <Icon name="check" size={13} stroke={2.5} />}
      </div>
      <div className="body">
        <div className="title">{task.title}</div>
        <div className="meta">
          <ThemeChip theme={task.theme} />
          {task.effort && <EffortChip level={task.effort} />}
          {task.ret && <ReturnChip level={task.ret} />}
          {task.goal && <GoalChip label={task.goal} />}
        </div>
      </div>
    </div>
  );
};

// ─────────── Habit row ───────────
const Habit = ({ habit, onInc }) => {
  const hit = habit.value >= habit.target;
  return (
    <div className={`habit ${hit ? 'hit' : ''}`}>
      <div className="ring" onClick={onInc}>
        <Ring value={habit.value} target={habit.target} hit={hit} />
      </div>
      <div className="body">
        <div className="title">{habit.title}</div>
        <div className="row">
          <ThemeChip theme={habit.theme} />
          {habit.streak > 0 && (
            <span className="chip" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
              <Icon name="flame" size={10} stroke={2} /> {habit.streak} wk
            </span>
          )}
        </div>
      </div>
      {hit && (
        <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Hit</span>
      )}
    </div>
  );
};

// Expose
Object.assign(window, {
  Icon, THEMES, ThemeChip, EffortChip, ReturnChip, GoalChip,
  Ring, StatusBar, TabBar, FabPair, Task, Habit,
});
