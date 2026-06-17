/* eslint-disable */
// Release 1 — "Goals that steer the week"
// Changed: This Week (cursor block), Goals (health dashboard).
// New: Goal Detail (full-screen), Add/Edit Milestone sheet,
//      Carry-Over Goal Step (Reflect → Plan), Set-Next-Milestone prompt.

// ─────────── Release 1 demo data ───────────
const GOALS = [
  {
    id: 'g1', type: 'primary', theme: 'dj',
    title: 'Land first paid DJ gig',
    short: 'First paid DJ gig',
    date: 'Sept 2026', left: '4 mo left',
    why: '"Stop describing myself as getting into DJing. One paid set on a real lineup before September."',
    health: 'slightly',
    nextMs: { title: 'Cut & send demo set', date: 'Jun 28', overdue: false },
    tasks: 5, habits: 2,
    cursorPos: 0.32,
    trend: ['ontrack', 'ahead', 'ontrack', 'slightly', 'behind', 'slightly', 'slightly', 'slightly'],
  },
  {
    id: 'g2', type: 'secondary', theme: 'job',
    title: 'New design role at a product co I respect',
    short: 'New role by Oct',
    date: 'Oct 2026', left: '5 mo left',
    why: null,
    health: 'ontrack',
    nextMs: { title: 'Ship portfolio site', date: 'Jul 5', overdue: false },
    tasks: 2, habits: 0,
    cursorPos: 0.56,
    trend: ['behind', 'behind', 'slightly', 'ontrack', 'ontrack', 'ahead', 'ontrack', 'ontrack'],
  },
];

// ─────────── 01R · This Week (cursor block replaces hero) ───────────
function ThisWeek({ taskState, onToggleTask, habitState, onIncHabit, onMic }) {
  const tasks = TASKS_WEEK.map(t => ({ ...t, done: taskState[t.id] ?? t.done }));
  const habits = HABITS_WEEK.map(h => ({ ...h, value: habitState[h.id] ?? h.value }));
  const open = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);
  const groupOrder = ['dj', 'job', 'fitness', 'bachata'];
  const groups = groupOrder.map(g => ({ theme: g, items: open.filter(t => t.theme === g) }))
                           .filter(g => g.items.length > 0);
  const [doneOpen, setDoneOpen] = React.useState(false);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Week of Jun 15</div>
          <h1>This week</h1>
        </div>
        <button className="icon-btn"><Icon name="settings" size={20} /></button>
      </div>

      <div className="page-scroll">
        {/* Milestones — near-term cursor: this week's pace toward each goal's next milestone */}
        <div className="section-label" style={{ marginTop: 6 }}>
          <span>Milestones</span>
        </div>
        <div className="cursor-block">
          {GOALS.map(g => (
            <div key={g.id} className="cursor-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: '0 0 46%', minWidth: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: THEMES[g.theme].color, flex: '0 0 auto' }} />
                <span className="cursor-name" style={{ flex: '1 1 auto' }}>{g.nextMs.title}</span>
              </div>
              <span className="cursor-track"><Track pos={g.cursorPos} size="sm" /></span>
              <Icon name="chevRight" size={15} stroke={1.8} color="var(--text-3)" />
            </div>
          ))}
        </div>

        {/* Habits (unchanged) */}
        <div className="section-label">
          <span>Habits</span>
          <span className="count">{habits.filter(h => (habitState[h.id] ?? h.value) >= h.target).length}/{habits.length} on target</span>
        </div>
        {habits.map(h => (
          <Habit key={h.id} habit={h} onInc={() => onIncHabit(h.id)} />
        ))}

        {/* Tasks (unchanged) */}
        <div className="section-label" style={{ marginTop: 26 }}>
          <span>Tasks · {open.length}</span>
          <div className="seg" style={{ marginTop: -2 }}>
            <button className="on">Recommended</button>
            <button>By theme</button>
          </div>
        </div>
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

// ─────────── 02R · Goals (health dashboard) ───────────
function GoalCard({ g }) {
  const lvl = healthByKey(g.health);
  const isPrimary = g.type === 'primary';
  return (
    <div className={`goal ${isPrimary ? 'primary' : ''}`} style={{ marginBottom: 10 }}>
      <div className="eyebrow" style={{ color: isPrimary ? 'var(--accent-strong)' : THEMES[g.theme].color }}>
        {THEMES[g.theme].name} · by {g.date}
      </div>
      <h3 style={{ fontSize: isPrimary ? 20 : 18 }}>{g.title}</h3>

      {/* Goal health track (large, labeled) */}
      <div style={{ margin: '4px 0 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Goal health</span>
          <span className="health-level" style={{ color: lvl.color }}>{lvl.label}</span>
        </div>
        <Track pos={lvl.pos} size="lg" />
      </div>

      {/* Nearest-milestone line */}
      <div className={`ms-line ${g.nextMs.overdue ? 'overdue' : ''}`} style={{ marginBottom: 12 }}>
        <Icon name={g.nextMs.overdue ? 'bell' : 'target'} size={14} stroke={1.8} />
        <span><span className="lbl">Next:</span> {g.nextMs.title} · by {g.nextMs.date}</span>
      </div>

      {/* Time left */}
      <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, color: isPrimary ? 'var(--accent-strong)' : 'var(--text-3)' }}>{g.left}</div>
    </div>
  );
}

function Goals() {
  const [graveOpen, setGraveOpen] = React.useState(false);
  const primary = GOALS.filter(g => g.type === 'primary');
  const secondary = GOALS.filter(g => g.type === 'secondary');
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>How each goal is doing</div>
          <h1>Goals</h1>
        </div>
        <button className="icon-btn"><Icon name="settings" size={20} /></button>
      </div>

      <div className="page-scroll">
        <div className="section-label" style={{ marginTop: 0 }}>
          <span>Primary</span>
          <span className="count">1 of 1</span>
        </div>
        {primary.map(g => <GoalCard key={g.id} g={g} />)}

        <div className="section-label">
          <span>Secondary</span>
          <span className="count">1 of 2 slots</span>
        </div>
        {secondary.map(g => <GoalCard key={g.id} g={g} />)}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }}><Icon name="plus" size={16} stroke={2}/> Add directly</button>
          <button className="btn btn-primary" style={{ flex: 1.3 }}><Icon name="sparkles" size={16} stroke={2}/> Coach me</button>
        </div>

        <div className="done-bar" style={{ marginTop: 30 }} onClick={() => setGraveOpen(o => !o)}>
          <span className="lbl">
            <Icon name={graveOpen ? 'chevDown' : 'chevRight'} size={14} stroke={2}/> Past goals (3)
          </span>
        </div>
        {graveOpen && (
          <div style={{ paddingTop: 6 }}>
            <div className="goal-grave hit"><span className="res">Hit</span><span className="name">First bachata social — danced 3+ songs</span><span className="date">Mar 2026</span></div>
            <div className="goal-grave missed"><span className="res">Missed</span><span className="name">Squat 1.5× bodyweight by Feb</span><span className="date">Feb 2026</span></div>
          </div>
        )}
      </div>

      <FabPair />
      <TabBar active="goals" />
    </div>
  );
}

// ─────────── 03R · Goal Detail (full-screen, roomy) ───────────
// Tapping a goal card opens this. Three concerns get their own section:
// status (health), history (trend), milestones. The three goal-level
// actions live quietly in the footer; "Edit" means edit the goal's own
// fields — milestones are managed in their own section.
function GoalDetail() {
  const g = GOALS[0];
  const lvl = healthByKey(g.health);
  return (
    <div className="page">
      <div className="modal-head">
        <button className="icon-btn"><Icon name="x" size={20}/></button>
        <div className="title">Goal</div>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-strong)', fontSize: 14, fontWeight: 600, padding: '0 6px', cursor: 'pointer' }}>Edit</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>
        {/* Hero */}
        <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent-strong)', fontWeight: 600, marginBottom: 8 }}>
          {THEMES[g.theme].name} · by {g.date}
        </div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 25, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.18, margin: '0 0 12px', color: 'var(--text)' }}>{g.title}</h2>
        {g.why && <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 20px' }}>{g.why}</p>}

        {/* Health (status) */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Goal health</span>
            <span className="health-level" style={{ color: lvl.color }}>{lvl.label}</span>
          </div>
          <Track pos={lvl.pos} size="lg" />
        </div>

        <div className="hr" />

        {/* Trend (history) */}
        <div style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 12 }}>Health trend · 8 weeks</div>
        <HealthDots weeks={g.trend} />

        <div className="hr" />

        {/* Milestones (management) — each row is a card */}
        <div style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Milestones</div>
        <div className="ms-card">
          <span className="ms-title">Cut &amp; send demo set</span>
          <span className="ms-date" style={{ marginRight: 4 }}>Jun 28</span>
          <span className="ms-hit">Mark hit</span>
        </div>
        <div className="ms-card">
          <span className="ms-title">Book one open-deck night</span>
          <span className="ms-date" style={{ marginRight: 4 }}>Jul 19</span>
          <span className="ms-hit">Mark hit</span>
        </div>
        <div className="ms-add">
          <Icon name="plus" size={15} stroke={2} /> Add milestone
        </div>

        <div className="hr" />

        {/* Tasks this week — tasks linked to this goal with this-week assignment */}
        <div style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Tasks this week</div>
        <div className="task" style={{ marginBottom: 8 }}>
          <div className="check" />
          <div className="body"><span className="title">Edit the DJ set opener</span></div>
        </div>
        <div className="task done" style={{ marginBottom: 8 }}>
          <div className="check done" />
          <div className="body"><span className="title" style={{ textDecoration: 'line-through', color: 'var(--text-3)' }}>Record practice session</span></div>
        </div>

        <div className="hr" />

        {/* All tasks — every task linked to this goal (open + done, excludes archived) */}
        <div style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>All tasks</div>
        <div className="task" style={{ marginBottom: 8 }}>
          <div className="check" />
          <div className="body"><span className="title">Edit the DJ set opener</span></div>
        </div>
        <div className="task" style={{ marginBottom: 8 }}>
          <div className="check" />
          <div className="body"><span className="title">Research venues for open-deck nights</span><span style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 8 }}>backlog</span></div>
        </div>
        <div className="task done" style={{ marginBottom: 8 }}>
          <div className="check done" />
          <div className="body"><span className="title" style={{ textDecoration: 'line-through', color: 'var(--text-3)' }}>Record practice session</span></div>
        </div>
      </div>

      {/* Footer: the three goal-level actions */}
      <div style={{ padding: '12px 20px 22px', display: 'flex', gap: 10, alignItems: 'center', borderTop: '1px solid var(--hairline)' }}>
        <button className="btn" style={{ flex: 1, background: 'var(--sage)', color: '#1a1816' }}>
          <Icon name="check" size={16} stroke={2.2}/> Mark goal as hit
        </button>
        <button className="btn btn-text" style={{ color: 'var(--brick)', flex: '0 0 auto' }}>Delete</button>
      </div>
    </div>
  );
}

// ─────────── 04R · Add / Edit Milestone (bottom sheet) ───────────
function MilestoneSheet({ editing = false }) {
  const [title, setTitle] = React.useState(editing ? 'Cut & send demo set' : '');
  const [pick, setPick] = React.useState(editing ? '2w' : null);
  const dateFor = { '1w': 'Jun 23, 2026', '2w': 'Jun 30, 2026', '1m': 'Jul 16, 2026', '6w': 'Jul 28, 2026' };
  const canSave = title.trim().length > 0 && pick !== null;

  return (
    <div className="page" style={{ position: 'relative' }}>
      <GoalsBackdrop />
      <div className="sheet">
        <div className="grip" />
        <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500, color: 'var(--text)', marginBottom: 18, padding: '0 2px' }}>
          {editing ? 'Edit milestone' : 'New milestone'}
        </div>

        {/* Title */}
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Milestone</div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="A near-term step toward the goal"
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500,
            letterSpacing: '-0.01em', padding: '0 0 10px', marginBottom: 22,
            borderBottom: '1px solid var(--hairline)',
          }}
        />

        {/* Date chips — near-term presets */}
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>Target date</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['1w', '1 week'], ['2w', '2 weeks'], ['1m', '1 month'], ['6w', '6 weeks']].map(([v, l]) => (
            <button key={v} className={`date-chip ${pick === v ? 'on' : ''}`} onClick={() => setPick(v)}>{l}</button>
          ))}
        </div>
        {pick && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14, fontFeatureSettings: "'tnum'", marginBottom: 6 }}>
            <Icon name="calendar" size={16} stroke={1.7} color="var(--text-2)"/>
            <span>{dateFor[pick]}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>on or before Oct 1</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1.4, opacity: canSave ? 1 : 0.45, pointerEvents: canSave ? 'auto' : 'none' }}>Save milestone</button>
        </div>
      </div>
    </div>
  );
}

// ─────────── 05R-a · Carry-Over Goal Step · REFLECT ───────────
function CarryGoalReflect({ gapCatch = false }) {
  const [progress, setProgress] = React.useState(null);
  const [confidence, setConfidence] = React.useState(null);
  const ready = gapCatch || (progress !== null && confidence !== null);
  const g = GOALS[0];

  return (
    <div className="page">
      <div className="modal-head">
        <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Sunday set-up · goal 1 of 2 · reflect</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ padding: '4px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Step dots: reflect ● plan ○ */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--accent)' }}/>
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--surface-hi)' }}/>
        </div>

        <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: THEMES[g.theme].color, fontWeight: 600, marginBottom: 6 }}>{THEMES[g.theme].name}</div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500, margin: '0 0 12px', letterSpacing: '-0.015em', lineHeight: 1.2 }}>{g.title}</h2>

        {gapCatch ? (
          <div style={{ padding: '18px 18px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--hairline-2)', marginTop: 6 }}>
            <div style={{ fontSize: 14.5, color: 'var(--text)', fontWeight: 500, marginBottom: 6 }}>No milestone to reflect on yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16 }}>Add a near-term milestone so this goal has something concrete to track against.</div>
            <button className="btn btn-primary" style={{ height: 44, fontSize: 13.5 }}><Icon name="plus" size={15} stroke={2}/> Add milestone</button>
          </div>
        ) : (
          <>
            <div className="ms-line" style={{ marginBottom: 30 }}>
              <Icon name="target" size={14} stroke={1.8} />
              <span><span className="lbl">Milestone:</span> {g.nextMs.title} · due in ~2 weeks</span>
            </div>

            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>How much did you move toward it this week?</div>
            <div className="chip-group" style={{ marginBottom: 30 }}>
              {['A lot', 'Some', 'Barely', 'Nothing'].map(o => (
                <button key={o} className={`health-chip ${progress === o ? 'on' : ''}`} onClick={() => setProgress(o)}>{o}</button>
              ))}
            </div>

            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>Confident you'll hit it by <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{g.nextMs.date}</strong>?</div>
            <div className="chip-group">
              {['Yes', 'Maybe', 'No'].map(o => (
                <button key={o} className={`health-chip ${confidence === o ? 'on' : ''}`} onClick={() => setConfidence(o)}>{o}</button>
              ))}
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-block" style={{ marginTop: 20, opacity: ready ? 1 : 0.45, pointerEvents: ready ? 'auto' : 'none' }}>
          Plan this week <Icon name="arrow" size={16} stroke={2}/>
        </button>
        {!gapCatch && !ready && <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>Answer both to continue</div>}
      </div>
    </div>
  );
}

// ─────────── 05R-b · Carry-Over Goal Step · PLAN ───────────
// New task is added via the persistent "+" FAB (tap = add pre-linked to this
// goal, hold = dictate) — no separate inline "New task" row.
function CarryGoalPlan({ onMic }) {
  const [added, setAdded] = React.useState({ t2: true });
  const g = GOALS[0];
  const goalTasks = [
    { id: 't1', title: 'Email Pulse Bar with mix link + dates', effort: 'low', ret: 'high' },
    { id: 't2', title: 'Cut 8-min demo set from Saturday rec', effort: 'med', ret: 'high' },
    { id: 't3', title: 'Post warm-up clip to Instagram', effort: 'low', ret: 'med' },
  ];

  return (
    <div className="page">
      <div className="modal-head">
        <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Sunday set-up · goal 1 of 2 · plan</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ padding: '4px 20px 100px', flex: 1, overflowY: 'auto' }}>
        {/* Step dots: reflect ● plan ● */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--sage)' }}/>
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--accent)' }}/>
        </div>

        <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: THEMES[g.theme].color, fontWeight: 600, marginBottom: 6 }}>{THEMES[g.theme].name}</div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 21, fontWeight: 500, margin: '0 0 10px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{g.title}</h2>
        <div className="ms-line" style={{ marginBottom: 22 }}>
          <Icon name="target" size={14} stroke={1.8} />
          <span><span className="lbl">Toward:</span> {g.nextMs.title}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Pull in this week's work</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>+ to add a new one</span>
        </div>
        {goalTasks.map(t => {
          const on = added[t.id];
          return (
            <div key={t.id} className="task" style={{ background: on ? 'color-mix(in oklab, var(--sage-dim), var(--surface) 30%)' : 'var(--surface)', cursor: 'pointer' }}
              onClick={() => setAdded(a => ({ ...a, [t.id]: !a[t.id] }))}>
              <div className="check" style={{ border: on ? 'none' : '1.5px dashed var(--text-3)', background: on ? 'var(--sage)' : 'transparent' }}>
                {on ? <Icon name="check" size={13} stroke={2.5} color="var(--bg)"/> : <Icon name="plus" size={12} stroke={2} color="var(--text-3)"/>}
              </div>
              <div className="body">
                <div className="title">{t.title}</div>
                <div className="meta"><EffortChip level={t.effort}/><ReturnChip level={t.ret}/></div>
              </div>
              {on && <span style={{ fontSize: 10.5, color: 'var(--sage)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, alignSelf: 'center' }}>Added</span>}
            </div>
          );
        })}

        <button className="btn btn-ghost btn-block" style={{ height: 44, fontSize: 13.5, color: 'var(--accent-strong)', marginTop: 12 }}>
          <Icon name="sparkles" size={15} stroke={2}/> Anything to add?
        </button>
      </div>

      {/* Persistent + FAB — reused here for "new task pre-linked to this goal" */}
      <FabPair onMic={onMic} />

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 20px 22px', background: 'linear-gradient(to top, var(--bg) 62%, transparent)' }}>
        <button className="btn btn-primary btn-block">Next goal <Icon name="arrow" size={16} stroke={2}/></button>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>Pulling tasks is optional</div>
      </div>
    </div>
  );
}

// ─────────── 06R · Set-Next-Milestone Prompt (small sheet) ───────────
function SetNextMilestone() {
  return (
    <div className="page" style={{ position: 'relative' }}>
      <GoalsBackdrop />
      <div className="sheet">
        <div className="grip" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sage-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            <Icon name="check" size={18} stroke={2.2} color="var(--sage)"/>
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500, color: 'var(--text)' }}>Nice — demo set done.</div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 20px' }}>
          You're best with one or two milestones in front of you. Set the next one?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }}>Not now</button>
          <button className="btn btn-primary" style={{ flex: 1.5 }}><Icon name="plus" size={16} stroke={2}/> Add next milestone</button>
        </div>
      </div>
    </div>
  );
}

// ─────────── Shared faded Goals backdrop for the R1 sheets ───────────
function GoalsBackdrop() {
  const g = GOALS[0];
  const lvl = healthByKey(g.health);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ filter: 'blur(1px)', opacity: 0.5, padding: '0 20px' }}>
        <div style={{ height: 44 }} />
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginTop: 8, marginBottom: 4 }}>How each goal is doing</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 30, margin: '0 0 14px', color: 'var(--text)', letterSpacing: '-0.02em' }}>Goals</h1>
        <div className="goal primary">
          <div className="eyebrow" style={{ color: 'var(--accent-strong)' }}>{THEMES[g.theme].name} · by {g.date}</div>
          <h3>{g.title}</h3>
          <div style={{ margin: '4px 0 0' }}><Track pos={lvl.pos} size="lg" /></div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,18,16,0.55)' }} />
    </div>
  );
}

Object.assign(window, {
  GOALS, ThisWeek, Goals, GoalCard, GoalDetail, MilestoneSheet,
  CarryGoalReflect, CarryGoalPlan, SetNextMilestone, GoalsBackdrop,
});
