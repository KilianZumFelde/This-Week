/* eslint-disable */
// Primary screens: This Week, Backlog, Goals, Stats + their empty states.

// ─────────── Demo data ───────────
const TASKS_WEEK = [
  // DJ career
  { id: 1, title: 'Email Pulse Bar with mix link + dates',     theme: 'dj',     effort: 'low',  ret: 'high', goal: 'First paid gig', done: false },
  { id: 2, title: 'Cut 8-min demo set from Saturday recording', theme: 'dj',    effort: 'med',  ret: 'high', goal: 'First paid gig', done: false },
  { id: 3, title: 'Post warm-up clip to Instagram',             theme: 'dj',    effort: 'low',  ret: 'med',  done: true },
  // fitness
  { id: 4, title: 'Order new lifting shoes',                    theme: 'fitness', effort: 'low', ret: 'med', done: false },
  { id: 5, title: 'Book physio for left shoulder',              theme: 'fitness', effort: 'low', ret: 'high', done: false },
  // job change
  { id: 6, title: 'Reply to Mira from Linear about coffee chat', theme: 'job',  effort: 'low',  ret: 'high', goal: 'New role by Oct', done: false },
  { id: 7, title: 'Rewrite résumé summary, 3 sentences max',    theme: 'job',   effort: 'med',  ret: 'high', goal: 'New role by Oct', done: false },
  // bachata
  { id: 8, title: 'Pick song for next month\u2019s social',     theme: 'bachata', effort: 'low', ret: 'med', done: false },
  { id: 9, title: 'Watch Daniel y Tom dip tutorial',            theme: 'bachata', effort: 'low', ret: 'med', done: true },
];

const HABITS_WEEK = [
  { id: 'h1', title: 'Gym',                       theme: 'fitness', value: 3, target: 4, streak: 8 },
  { id: 'h2', title: 'Practice on CDJs',          theme: 'dj',      value: 2, target: 3, streak: 2 },
  { id: 'h3', title: 'Bachata practice (solo)',   theme: 'bachata', value: 4, target: 4, streak: 6 },
];

const BACKLOG = {
  dj: [
    { id: 'b1', title: 'Research Pioneer DDJ-FLX10 vs Rev7',    theme: 'dj', effort: 'med', ret: 'low' },
    { id: 'b2', title: 'Make a "year-in-review" mix for SoundCloud', theme: 'dj', effort: 'high', ret: 'med' },
    { id: 'b3', title: 'Ask Andre about gear hire for next set', theme: 'dj', effort: 'low', ret: 'med' },
  ],
  fitness: [
    { id: 'b4', title: 'Try yoga class at Movement once',       theme: 'fitness', effort: 'low', ret: 'med' },
    { id: 'b5', title: 'Schedule yearly bloodwork',             theme: 'fitness', effort: 'low', ret: 'high' },
  ],
  job: [
    { id: 'b6', title: 'Build small portfolio site (Astro)',    theme: 'job', effort: 'high', ret: 'high', goal: 'New role by Oct' },
    { id: 'b7', title: 'Ask Sarah for intro to design lead at Linear', theme: 'job', effort: 'low', ret: 'high', goal: 'New role by Oct' },
  ],
  bachata: [
    { id: 'b8', title: 'Find a teacher who specializes in dips', theme: 'bachata', effort: 'med', ret: 'med' },
  ],
};

window.TASKS_WEEK = TASKS_WEEK;
window.HABITS_WEEK = HABITS_WEEK;
window.BACKLOG = BACKLOG;

// ─────────── This Week (populated) ───────────
function ThisWeek({ taskState, onToggleTask, habitState, onIncHabit, onMic }) {
  const tasks = TASKS_WEEK.map(t => ({ ...t, done: taskState[t.id] ?? t.done }));
  const habits = HABITS_WEEK.map(h => ({ ...h, value: habitState[h.id] ?? h.value }));
  const open = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  // Group open tasks by theme (in this order)
  const groupOrder = ['dj', 'job', 'fitness', 'bachata'];
  const groups = groupOrder.map(g => ({ theme: g, items: open.filter(t => t.theme === g) }))
                            .filter(g => g.items.length > 0);

  const [sort, setSort] = React.useState('rec');
  const [doneOpen, setDoneOpen] = React.useState(false);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Week of May 12</div>
          <h1>This week</h1>
        </div>
        <button className="icon-btn"><Icon name="settings" size={20} /></button>
      </div>

      <div className="page-scroll">
        {/* Milestone hero */}
        <div className="milestone">
          <div className="eyebrow"><Icon name="target" size={12} stroke={2}/> Primary milestone</div>
          <h2>Land first paid DJ gig by September</h2>
          <div className="meta">
            <span className="pill">by Sept 2026</span>
            <span>5 tasks this week toward this</span>
          </div>
        </div>

        {/* Habits */}
        <div className="section-label">
          <span>Habits</span>
          <span className="count">{habits.filter(h => (habitState[h.id] ?? h.value) >= h.target).length}/{habits.length} on target</span>
        </div>
        {habits.map(h => (
          <Habit key={h.id} habit={h} onInc={() => onIncHabit(h.id)} />
        ))}

        {/* Tasks */}
        <div className="section-label" style={{ marginTop: 26 }}>
          <span>Tasks · {open.length}</span>
          <div className="seg" style={{ marginTop: -2 }}>
            <button className={sort === 'rec' ? 'on' : ''} onClick={() => setSort('rec')}>Recommended</button>
            <button className={sort === 'theme' ? 'on' : ''} onClick={() => setSort('theme')}>By theme</button>
          </div>
        </div>

        {/* Always rendered as theme groups, but the segmented control is decorative */}
        {groups.map(g => (
          <div key={g.theme}>
            <div className="theme-group">
              <Icon name="chevDown" size={14} stroke={2} />
              <span className="name">
                <span className="swatch" style={{ background: THEMES[g.theme].color }} />
                {THEMES[g.theme].name}
              </span>
              <span className="ct">· {g.items.length}</span>
            </div>
            {g.items.map(t => (
              <Task key={t.id} task={t} onToggle={() => onToggleTask(t.id)} />
            ))}
          </div>
        ))}

        {/* Done bar */}
        <div className="done-bar" onClick={() => setDoneOpen(o => !o)}>
          <span className="lbl">
            <Icon name={doneOpen ? 'chevDown' : 'chevRight'} size={14} stroke={2} /> Done ({done.length})
          </span>
        </div>
        {doneOpen && done.map(t => (
          <Task key={t.id} task={t} onToggle={() => onToggleTask(t.id)} />
        ))}
      </div>

      <FabPair onMic={onMic} />
      <TabBar active="home" />
    </div>
  );
}

// ─────────── This Week (first-launch empty) ───────────
function ThisWeekEmpty() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Week of May 12</div>
          <h1>This week</h1>
        </div>
        <button className="icon-btn"><Icon name="settings" size={20} /></button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 32px 140px', textAlign: 'left' }}>
        {/* Quiet symbolic mark */}
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 28, opacity: 0.7 }}>
          <circle cx="32" cy="32" r="22" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="2 6" />
          <circle cx="32" cy="32" r="3" fill="var(--accent)" />
        </svg>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 500, letterSpacing: '-0.015em', lineHeight: 1.2, margin: '0 0 12px', color: 'var(--text)' }}>
          This is your week.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 28px', maxWidth: 280 }}>
          Start by setting a goal you actually want to work toward — or just add a task.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary"><Icon name="sparkles" size={16} stroke={2} /> Set my first goal with Coach</button>
          <button className="btn btn-ghost">Add a task</button>
        </div>
      </div>
      <FabPair />
      <TabBar active="home" />
    </div>
  );
}

// ─────────── Backlog (populated) ───────────
function Backlog() {
  const [sort, setSort] = React.useState('theme');
  const [openGroups, setOpenGroups] = React.useState({ dj: true, fitness: true, job: true, bachata: false });
  const order = ['dj', 'job', 'fitness', 'bachata'];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>For later</div>
          <h1>Backlog</h1>
        </div>
        <button className="icon-btn"><Icon name="settings" size={20} /></button>
      </div>

      <div className="page-scroll">
        <div className="seg" style={{ marginBottom: 16 }}>
          <button className={sort === 'theme' ? 'on' : ''} onClick={() => setSort('theme')}>By theme</button>
          <button className={sort === 'pri' ? 'on' : ''} onClick={() => setSort('pri')}>By priority</button>
          <button className={sort === 'new' ? 'on' : ''} onClick={() => setSort('new')}>Recent</button>
        </div>

        {order.map(g => {
          const items = BACKLOG[g] || [];
          if (!items.length) return null;
          const open = openGroups[g];
          return (
            <div key={g}>
              <div className={`theme-group ${open ? '' : 'collapsed'}`}
                onClick={() => setOpenGroups(o => ({ ...o, [g]: !o[g] }))}>
                <Icon name="chevDown" size={14} stroke={2} />
                <span className="name">
                  <span className="swatch" style={{ background: THEMES[g].color }} />
                  {THEMES[g].name}
                </span>
                <span className="ct">· {items.length}</span>
              </div>
              {open && items.map(t => (
                <Task key={t.id} task={t} onToggle={() => {}} />
              ))}
            </div>
          );
        })}
      </div>

      <FabPair />
      <TabBar active="backlog" />
    </div>
  );
}

// ─────────── Backlog (empty) ───────────
function BacklogEmpty() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>For later</div>
          <h1>Backlog</h1>
        </div>
        <button className="icon-btn"><Icon name="settings" size={20} /></button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 36px 140px' }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ marginBottom: 24, opacity: 0.6 }}>
          <rect x="6" y="14" width="44" height="32" rx="6" stroke="var(--text-2)" strokeWidth="1.2"/>
          <path d="M6 24h14l3 4h10l3-4h14" stroke="var(--text-2)" strokeWidth="1.2"/>
        </svg>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, margin: '0 0 10px', color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Your backlog is empty.
        </h2>
        <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
          Tasks you don't want for this week land here. Tap the mic or + to add one.
        </p>
      </div>
      <FabPair />
      <TabBar active="backlog" />
    </div>
  );
}

// ─────────── Goals ───────────
function Goals() {
  const [graveOpen, setGraveOpen] = React.useState(false);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>What you're working toward</div>
          <h1>Goals</h1>
        </div>
        <button className="icon-btn"><Icon name="settings" size={20} /></button>
      </div>

      <div className="page-scroll">
        <div className="section-label" style={{ marginTop: 0 }}>
          <span>Primary</span>
          <span className="count">1 of 1</span>
        </div>
        <div className="goal primary">
          <div className="eyebrow">DJ career · by Sept 2026</div>
          <h3>Land first paid DJ gig</h3>
          <p className="why">"Stop describing myself as 'getting into' DJing. I want one paid set on a real lineup before September."</p>
          <div className="stats">
            <div><span className="n">5</span> tasks this week</div>
            <div><span className="n">2</span> habits linked</div>
            <div style={{ marginLeft: 'auto', color: 'var(--accent-strong)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>4 mo left</div>
          </div>
        </div>

        <div className="section-label">
          <span>Secondary</span>
          <span className="count">1 of 2 slots</span>
        </div>
        <div className="goal" style={{ marginBottom: 10 }}>
          <div className="eyebrow" style={{ color: '#7a90a8' }}>Job change · by Oct 2026</div>
          <h3>New design role at a product co I respect</h3>
          <div className="stats">
            <div><span className="n">2</span> tasks this week</div>
            <div><span className="n">0</span> habits linked</div>
            <div style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>5 mo left</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }}><Icon name="plus" size={16} stroke={2}/> Add directly</button>
          <button className="btn btn-primary" style={{ flex: 1.3 }}><Icon name="sparkles" size={16} stroke={2}/> Coach me</button>
        </div>

        {/* Graveyard */}
        <div className="done-bar" style={{ marginTop: 30 }} onClick={() => setGraveOpen(o => !o)}>
          <span className="lbl">
            <Icon name={graveOpen ? 'chevDown' : 'chevRight'} size={14} stroke={2}/> Past goals (3)
          </span>
        </div>
        {graveOpen && (
          <div style={{ paddingTop: 6 }}>
            <div className="goal-grave hit">
              <span className="res">Hit</span>
              <span className="name">First bachata social — danced 3+ songs</span>
              <span className="date">Mar 2026</span>
            </div>
            <div className="goal-grave missed">
              <span className="res">Missed</span>
              <span className="name">Squat 1.5× bodyweight by Feb</span>
              <span className="date">Feb 2026</span>
            </div>
            <div className="goal-grave">
              <span className="res">Abandoned</span>
              <span className="name">Learn Mandarin (rethink it)</span>
              <span className="date">Jan 2026</span>
            </div>
          </div>
        )}
      </div>

      <FabPair />
      <TabBar active="goals" />
    </div>
  );
}

// ─────────── Stats ───────────
function Stats() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Quiet progress</div>
          <h1>Stats</h1>
        </div>
        <button className="icon-btn"><Icon name="settings" size={20} /></button>
      </div>

      <div className="page-scroll">
        <div className="stats-hero">
          <div className="label">This week</div>
          <div className="fracs">
            <div>
              <div className="frac">12<span className="of">/15</span></div>
              <div className="fracName">tasks done</div>
            </div>
            <div>
              <div className="frac">2<span className="of">/3</span></div>
              <div className="fracName">habits on target</div>
            </div>
          </div>
          <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gold)', fontSize: 13 }}>
            <Icon name="flame" size={16} stroke={1.8}/>
            New best — bachata practice 6 weeks running
          </div>
        </div>

        <div className="section-label">Habit streaks</div>
        <div className="streak-row">
          <span className="name">Gym</span>
          <span className="now">8 wk</span>
          <span className="best">best 12</span>
        </div>
        <div className="streak-row">
          <span className="name">Practice on CDJs</span>
          <span className="now">2 wk</span>
          <span className="best">best 5</span>
        </div>
        <div className="streak-row">
          <span className="name">Bachata practice</span>
          <span className="now gold">6 wk</span>
          <span className="best">best 6</span>
        </div>

        <div className="section-label">Past weeks</div>
        <div className="week-row">
          <span className="range">May 4 – 10</span>
          <span className="fracs">11/14 tasks · 3/3 habits</span>
        </div>
        <div className="week-row">
          <span className="range">Apr 27 – May 3</span>
          <span className="fracs">9/12 tasks · 2/3 habits</span>
        </div>
        <div className="week-row">
          <span className="range">Apr 20 – 26</span>
          <span className="fracs">14/16 tasks · 3/3 habits</span>
        </div>
        <div className="week-row">
          <span className="range">Apr 13 – 19</span>
          <span className="fracs">7/11 tasks · 1/3 habits</span>
        </div>
        <div className="week-row">
          <span className="range">Apr 6 – 12</span>
          <span className="fracs">12/13 tasks · 3/3 habits</span>
        </div>
      </div>

      <FabPair />
      <TabBar active="stats" />
    </div>
  );
}

Object.assign(window, { ThisWeek, ThisWeekEmpty, Backlog, BacklogEmpty, Goals, Stats });
