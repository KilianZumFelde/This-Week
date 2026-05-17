/* eslint-disable */
// Canvas wiring: applies theme/accent tweaks, renders all phone screens
// as DCArtboards organized into sections.

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "dark",
  "accent": "#c87856",
  "headingFont": "serif"
}/*EDITMODE-END*/;

const PHONE_W = 390;
const PHONE_H = 844;

// Map accent hex → an "accent-strong" + dim rgba shade for live theming.
// Pre-baked rather than computed to stay consistent across modes.
const ACCENT_VARIANTS = {
  '#c87856': { strong: '#d68a68', dim: 'rgba(200,120,86,0.16)' }, // clay
  '#8ea076': { strong: '#a3b58a', dim: 'rgba(142,160,118,0.16)' }, // moss
  '#b78f5a': { strong: '#cba075', dim: 'rgba(183,143,90,0.16)' }, // copper
  '#9a7ba0': { strong: '#b294b6', dim: 'rgba(154,123,160,0.16)' }, // dusk
};

function PhoneFrame({ children, label }) {
  return (
    <div className="phone" data-screen-label={label}>
      <StatusBar />
      {children}
    </div>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(DEFAULTS);

  // Live-apply tweaks to <html>
  React.useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', tweaks.mode);
    const v = ACCENT_VARIANTS[tweaks.accent] || ACCENT_VARIANTS['#c87856'];
    r.style.setProperty('--accent', tweaks.accent);
    r.style.setProperty('--accent-strong', v.strong);
    r.style.setProperty('--accent-dim', v.dim);
    r.style.setProperty('--serif', tweaks.headingFont === 'newsreader'
      ? '"Newsreader", Georgia, serif'
      : '"Source Serif 4", "Source Serif Pro", Georgia, serif');
  }, [tweaks]);

  // Interactive state (only on the "This Week" hero)
  const [taskState, setTaskState] = React.useState({});
  const [habitState, setHabitState] = React.useState({});
  const onToggleTask = (id) => setTaskState(s => ({ ...s, [id]: !(s[id] ?? TASKS_WEEK.find(t => t.id === id).done) }));
  const onIncHabit = (id) => setHabitState(s => {
    const h = HABITS_WEEK.find(h => h.id === id);
    const cur = s[id] ?? h.value;
    return { ...s, [id]: Math.min(cur + 1, h.target) };
  });

  return (
    <>
      <DesignCanvas>
        <DCSection id="primary" title="Primary tabs" subtitle="The four tabs the user lives in day-to-day. Tap a task circle or habit ring to interact.">
          <DCArtboard id="this-week" label="01 · This Week" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="01 This Week">
              <ThisWeek
                taskState={taskState}
                onToggleTask={onToggleTask}
                habitState={habitState}
                onIncHabit={onIncHabit}
              />
            </PhoneFrame>
          </DCArtboard>

          <DCArtboard id="backlog" label="02 · Backlog" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="02 Backlog">
              <Backlog />
            </PhoneFrame>
          </DCArtboard>

          <DCArtboard id="goals" label="03 · Goals" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="03 Goals">
              <Goals />
            </PhoneFrame>
          </DCArtboard>

          <DCArtboard id="stats" label="04 · Stats" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="04 Stats">
              <Stats />
            </PhoneFrame>
          </DCArtboard>
        </DCSection>

        <DCSection id="capture" title="Capture flow" subtitle="The mic-first capture path. Voice → AI-parsed draft → save. The draft card is also reached from the + button (with empty fields).">
          <DCArtboard id="voice" label="05 · Voice listening" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="05 Voice listening">
              <VoiceListening />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="draft" label="06 · Quick-add draft" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="06 Quick-add draft">
              <QuickAddDraft />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="draft-inline" label="06b · Quick-add · inline picker" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="06b Quick-add inline picker">
              <QuickAddDraftInline />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="draft-habit" label="06c · Quick-add · habit" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="06c Quick-add habit">
              <QuickAddHabitInline />
            </PhoneFrame>
          </DCArtboard>
        </DCSection>

        <DCSection id="coach" title="Goal lifecycle" subtitle="Tap any goal card to open the action drawer. Edit reopens the form. The Coach is an advisory chat that hands off to the same form, pre-filled.">
          <DCArtboard id="goal-drawer" label="07 · Goal action drawer" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="07 Goal action drawer">
              <GoalActionDrawer />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="goal-drawer-grave" label="07b · Drawer · past goal" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="07b Goal drawer past">
              <GoalActionDrawer kind="grave" />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="coach-entry" label="08 · Coach · in conversation" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="08 Coach in conversation">
              <CoachEntry />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="coach-summary" label="09 · Coach · final summary" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="09 Coach final summary">
              <CoachSummary />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="goal-empty" label="10 · New goal · empty" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="10 New goal empty">
              <AddGoalForm />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="goal-prefilled" label="11 · New goal · from Coach" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="11 New goal prefilled">
              <AddGoalForm prefilled />
            </PhoneFrame>
          </DCArtboard>
        </DCSection>

        <DCSection id="ritual" title="Sunday set-up ritual" subtitle="Recap → mandatory per-task triage → optional pull-from-backlog. The triage step blocks every app open until cleared.">
          <DCArtboard id="recap" label="12 · Recap" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="12 Carry-over recap">
              <CarryRecap />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="triage" label="13 · Triage" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="13 Carry-over triage">
              <CarryTriage />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="pull" label="14 · Pull from backlog" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="14 Carry-over pull">
              <CarryPull />
            </PhoneFrame>
          </DCArtboard>
        </DCSection>

        <DCSection id="empty" title="Empty states" subtitle="Calm first-launch + empty backlog. No mock data, no motivational copy.">
          <DCArtboard id="empty-home" label="15 · First-launch home" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="15 First-launch home">
              <ThisWeekEmpty />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="empty-backlog" label="16 · Empty backlog" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="16 Empty backlog">
              <BacklogEmpty />
            </PhoneFrame>
          </DCArtboard>
        </DCSection>

        <DCSection id="sheets" title="Edit sheets" subtitle="Task Detail reuses the draft-card chip vocabulary (same fields, filled values, different chrome). Habit Detail adds streak + target controls that don't exist anywhere else.">
          <DCArtboard id="task-detail" label="17 · Task detail" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="17 Task detail">
              <TaskDetail />
            </PhoneFrame>
          </DCArtboard>
          <DCArtboard id="habit-detail" label="18 · Habit detail" width={PHONE_W} height={PHONE_H}>
            <PhoneFrame label="18 Habit detail">
              <HabitDetail />
            </PhoneFrame>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            label="Mode"
            value={tweaks.mode}
            options={[{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }]}
            onChange={(v) => setTweak('mode', v)}
          />
          <TweakColor
            label="Accent"
            value={tweaks.accent}
            options={['#c87856', '#8ea076', '#b78f5a', '#9a7ba0']}
            onChange={(v) => setTweak('accent', v)}
          />
        </TweakSection>
        <TweakSection label="Typography">
          <TweakRadio
            label="Headings"
            value={tweaks.headingFont}
            options={[{ label: 'Source Serif', value: 'serif' }, { label: 'Newsreader', value: 'newsreader' }]}
            onChange={(v) => setTweak('headingFont', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
