# UX Lens — Discovery Record

**Date**: 2026-05-14
**Lens**: UX & Interaction

---

## Lens Summary

### Primary Journey (the default loop)

**Day-to-day (any random day of the week):**
1. User opens the app on phone.
2. **This Week** screen loads immediately — zero taps to see the day's reality.
3. User sees, top-down: a **"Milestones" cursor section** (one compact row per active goal that has tasks committed this week — theme dot, next-milestone title, sm pace Track, chevron → Goal Detail; section omitted when no goal qualifies), then **habits with current progress** (e.g., *Gym 2/4*, *Bachata 1/2*, *CVs 0/3*), then **tasks for this week as a single flat list sorted by priority score** (effort × return; high-return/low-effort floats to top). Each task row shows a **colored priority stripe** down its left edge (gold = top priority, mid = grey, low = dim) and a theme chip. Effort/return values themselves are not chips on the card — they live in the Task Detail sheet. There is **no sort toggle** on This Week (priority sort is always on; backlog still has its own sort toggle).
4. User taps a habit's progress ring to increment its count (or taps the habit card's text to open its detail/edit sheet), and taps a task's circle to complete it (or its title to open detail).
5. Throughout the day, user captures new tasks via the **single floating action button** (bottom-right, persistent across primary tabs). **Tap = quick-add modal** (manual entry, empty fields). **Long-press = voice listening overlay** (speech → AI parses into draft cards). Decision 2026-05-24: one button with a press-and-hold gesture for voice, rather than two separate FABs.
6. User confirms or edits the draft inline (single tap to change theme, effort, return, week vs. backlog). Saves.
7. Done items strike through and fade into a collapsible "Done (n)" section at the bottom of This Week.

**Weekly planning ritual (Sunday — single moment, no separate "reset"):**
1. Sunday: user opens the app for the planning ritual.
2. **Habits carry over identically** — no setup work needed (they're weekly-recurring with the same target each week, e.g., gym 4x/week).
3. **Mandatory carry-over ritual** (blocking — no skip/dismiss/defer; re-appears every app open until fully triaged):
   - **Frame 0 — wins-first recap**: last week `X/N tasks · Y/Z habits` (fractions, no %), streak deltas (kept/broken), one forward line "still working toward [primary goal] — N tasks done toward it". Never opens on failure. (No "goals completed" counter — goals rarely complete in a week.)
   - **Then per-task triage**: unfinished tasks one-by-one with exactly three buttons each: *Keep for this week / Send to backlog / Drop*. No fourth option, no skip. ("Drop" = delete the task — the gentle triage word for the same remove operation called "Delete" everywhere else.)
4. **Pull-from-backlog (optional, non-blocking)**: once triage is cleared, a "Stock this week" step lists backlog items; tap any to add to the week. A "Start week" button is always enabled even if nothing is pulled (pulling is additive, never limbo — so optional, unlike mandatory triage). Same promotion is also available anytime from the Backlog tab; this is the guided ritual surfacing of it.
5. **New week celebration**: after tapping "Start week", a brief full-screen "New week, fresh start." screen appears with a single "Let's go" button that drops the user into This Week. (Not a planning step — just a calm transition moment so the shift from review to execution feels deliberate.)
6. (Last week's habit/task results live in the Frame 0 recap above — not a separate step.)
7. **+ Add new** — voice or manual capture for fresh items.
8. Total time: 2–5 minutes. Designed to be lightweight, not a 30-minute planning session.

### Entry Points
- **Primary**: opening the mobile app — always lands on **This Week**.
- **Secondary tabs**: Backlog, Goals, Stats — reached via bottom tab bar.
- **Settings / theme management / reminder config**: top-right gear icon on This Week (not a dedicated tab — anti-noise).

### Prerequisites
- User needs at least one **theme** defined (themes are configurable; user creates them e.g., DJ career, fitness, job change, bachata).
- For meaningful goal-anchoring: at least one **active goal/milestone** (otherwise tasks just exist without linkage — which is fine but loses the anchoring benefit).
- Habits and tasks can exist without goals; the goal connection is an *enhancement*, not a *requirement* for using the app.

### User Expectations at Key Moments

| Moment | Expected behavior |
|---|---|
| **Tapping a task** | Strikes through immediately, fades to "Done" section. No confirm modal. |
| **Tapping a habit** | **Tap the progress ring** → count increments by 1. **Tap the card's text area (name/theme)** → opens Habit Detail/Edit sheet. Two distinct hit-targets on the same card; no added chrome (no kebab). When target is hit (e.g., 4/4), a calm gold "HIT" badge appears on the row. **No confetti. No motivational quotes. No popups.** Anti-Jira is also anti-Duolingo. |
| **Accidental habit increment** | Caught by the **general Undo snackbar** (see Edge journeys / Key Decisions) — fat-finger Gym to 3/4, tap Undo, back to 2/4. No bespoke decrement control needed; the ring stays a safe small target because Undo is universal. |
| **FAB (single button)** | Persistent floating button bottom-right above the tab bar, on all primary tabs. **Tap → quick-add modal** (manual entry, empty fields, defaults to this-week or backlog based on which tab you're on). **Long-press (~300ms) → voice listening overlay** (AI parses speech into draft cards). |
| **Editing a draft** | All AI-inferred fields are tappable inline. Single tap changes value. No nested modals. |
| **Editing existing item** | Same — tap to edit inline, "right then and there", no navigation. |
| **Mid-week change of mind** | Tap a task → menu offers *Move to backlog / Delete*. Tap a habit → *Pause* (stops counting until resumed). One tap into a menu, not surfaced on the main view. (No "move to next week" — there is no next-week state; backlog + Sunday pull is the forward-staging mechanism. "Drop" is NOT used here — it's only the gentle triage label for the same delete operation.) |
| **Streak broken** | Resets to 0. "Best ever" stays visible alongside current — motivating without punishing. |
| **Habit nudge** | When user is in "danger zone" of missing weekly target (e.g., Friday, gym at 1/4), the app fires a smart push notification. Not user-configured per-habit; system-triggered based on progress state. |
| **Reminders visibility** | No bell icon on task cards in This Week / Backlog (the user shouldn't see a "next-fire countdown" in the main lists). However, reminders ARE visible and editable inside the **Task Detail Sheet** (the bottom sheet that opens when tapping a task's title) — this is considered an acceptable second surface because it's contextual to the task and one tap away. Settings → Reminders also exposes a global list with a *"Delete all configured reminders"* action. Revision 2026-05-24 — earlier "invisible during normal use" rule relaxed to allow the in-detail-sheet view. |

### Branching / Alternative Paths

**Item type during capture (Task vs. Habit):** AI infers from speech cues:
- *"X times a week", "regularly", "every week"* → **Habit** draft (fields: title, theme, weekly count target, optional goal link)
- *"Do X", "need to X", "remind me to X"* (no recurrence) → **Task** draft (fields: title, theme, effort, return, this-week vs. backlog, optional goal link, optional reminder)

User can flip the type with one tap if AI guesses wrong.

**Capture destination (this week vs. backlog):** AI defaults to *this week* unless the speech includes "for later", "sometime", "no rush", "in the future". Capture can also originate directly on the **Backlog** tab — items there are explicitly backlog, no inference needed.

**Goal linkage:**
- If the assigned theme has an **active milestone**, task auto-links to it.
- If the theme has **multiple active milestones** (primary + secondary on same theme), AI defaults to primary; user can tap to switch.
- If the theme has **no milestone**, the task links to **nothing** (that's fine — maintenance tasks don't need a milestone).

**Multi-item utterance:** AI parses multiple items in one utterance ("add gym 4x a week and also remind me to call Pedro"). Shows two draft cards in sequence.

### Goal Detail Screen

Tapping any goal card on the Goals tab opens a full-screen modal (not a bottom drawer). It contains four sections in order:

1. **Hero** — eyebrow (theme · target date), serif title, optional "why" paragraph.
2. **Goal health** — large labeled 5-segment Track with current health level and the 8-week HealthDots trend. Muted/placeholder when no health rating has been set yet.
3. **Milestones** — each milestone displayed as an individual surface card (same card style as task rows — rounded corners, surface background). Active milestones show title, target date, and a "Mark hit" action. Hit milestones are dimmed with a check icon and hit date. "+ Add milestone" link below.
4. **Tasks this week** — task cards (using the shared TaskRow component: priority stripe, toggle checkbox, theme chip) for all tasks linked to this goal with this-week assignment. Tapping the checkbox completes or reopens the task.
5. **All tasks** — task cards for every task linked to this goal regardless of week assignment (open + done, excludes archived). Backlog tasks show a quiet "backlog" badge.

**Footer:** Mark goal as hit / Delete (active goals) or Reactivate (past goals). Edit in the header opens the Add/Edit Goal screen pre-filled.

### Goal-Setting Sub-Journey

**One path from the Goals tab:**

**+ Add Goal (direct)** — the only goal-creation flow in v1:
- Title
- Target date — **required**, the form refuses to save without one. Quick-select chips offered: 1 mo / 2 mo / 3 mo / 6 mo / 1 year. No "Custom" arbitrary-date picker in v1 — if the user needs a date outside the presets, they'll need to wait or pick the nearest preset.
- Type — Primary or Secondary. Default: Primary when no goal exists; otherwise the user picks. (Current code defaults new goals to Primary regardless of existing primary; the backend will reject if the cap is exceeded.)
- Theme — picked from a list (no AI suggestion in v1).
- Optional "why" paragraph (surfaced occasionally to maintain motivation).

**AI Coach feature: DROPPED FROM SCOPE (2026-05-24).** The previously-planned "🪄 Coach me on a goal" conversational flow is not being built. The direct Add Goal form is sufficient.

**Hard cap enforcement (v1):** the 1 primary + 2 secondary cap is enforced **at the backend on save**. If saving would exceed the cap, the backend returns `HTTP 400` and the Add Goal form shows a generic error. There is no inline demote/replace/cancel modal in v1 — the user resolves the conflict by going to Goals, abandoning an existing goal manually, then re-saving.

**Target-date-passed prompt:** when the user opens the app and an active goal's `target_date` is in the past, an Overdue Goal bottom-sheet appears with three actions: **Mark as hit** (moves to graveyard as `hit`), **Extend** (reopens Edit form so user can push the date), **Abandon** (moves to graveyard as `archived`). Tapping the backdrop dismisses the prompt for the session.

### Success Moment

Per micro-action: completion is subtle and satisfying. Tap → strike-through + fade. Habit target hit → brief glow/color change.

Per week: the user feels the success at the **Sunday review** — looking at the week's raw counts (tasks done, habits that hit target), habit streaks alive, and tasks done toward the active milestone. The Stats tab makes this glanceable. (Raw fractions, not percentages — decided in the Stitch-iteration pass; see discovery.md Key Decisions.)

Per quarter (the real success of the product): the user can name their primary milestone instantly, knows the next 3 actions toward it, and feels they're "actually on track" rather than drifting.

### Edge Journeys

- **Carry-over (Sunday):** mandatory blocking ritual — wins-first recap → per-task triage (kept / sent to backlog / dropped) → optional pull-from-backlog → "new week" celebration → This Week. The triage step is blocking and re-appears every app open until cleared. Pulling and the celebration are non-blocking. Never silently moved.
- **Mid-week re-prioritization:** one-tap menu on any task to move/drop/defer.
- **Missed habit days:** flagged in red on next week's "last week's results" view. No guilt-trip; just visibility.
- **Streak broken:** resets to 0; "Best ever" persists as motivation.
- **Goal target date passes:** an **Overdue Goal bottom-sheet** appears with three actions (Mark as hit / Extend / Abandon). Goal never silently deleted; tapping the backdrop dismisses for the session only — the prompt re-appears next launch until the goal is resolved.
- **Pausing a habit:** habit stops counting until resumed; doesn't break streak history.
- **Pulling from backlog mid-week:** allowed via Backlog tab → tap → "Add to this week".
- **General Undo (app-wide):** any state-changing action — task completed, task dropped, habit incremented, task delete, habit delete — surfaces a brief Undo snackbar; one tap reverts the last action. This is the universal safety net. (Task-done also remains separately re-openable by tapping it again any time before the Sunday flip — the immediate Undo and the deliberate same-week reversal coexist.) Goal mark-hit / abandon do NOT currently emit Undo in v1 (low priority — goals are deliberate, low-frequency actions).
- **Capture-anywhere via voice:** the single FAB long-pressed; works on any primary tab.
- **First-launch empty state:** brand-new users land on This Week's empty state with a calm hero and two CTAs ("Set my first goal" / "Add a task"). **Known issue (v1):** these CTAs do not currently navigate anywhere — see Known bugs in TASKS.md. The FAB (tap or long-press) is the working entry point for new users.

### Navigation

**Bottom tab bar — 4 tabs:**

| Tab | Default? | Contains |
|---|---|---|
| 🏠 **This Week** | ✓ default | "Milestones" cursor section (compact per-goal pace row, sm Track, omitted when no goal has this-week tasks), habits with progress, tasks sorted by priority (with theme chip), collapsible Done section at bottom, persistent FAB |
| 📥 **Backlog** | | All "for later" tasks. Always accessible. Direct add, browse, edit, swipe-to-promote into this week. |
| 🎯 **Goals** | | Active primary + secondaries (health dashboard — large Track, nearest-milestone line, time left), + Add Goal, archive of past goals. Tapping a card → Goal Detail full-screen modal. |
| 📊 **Stats** | | Week raw counts `X/N tasks · Y/Z habits` (no %), habit streaks (current + best ever), past-weeks browser. No per-theme breakdown. |

**Top-right gear icon** on This Week → settings, theme management, reminder config.

### Cross-Lens Flags Raised
- No mandatory date/time on tasks (hard constraint) → Requirements
- AI must parse task vs. habit, theme guess, effort/return guess, week vs. backlog, goal link → Requirements (parsing rules)
- Backlog state (this week vs. later vs. done) → Domain (task lifecycle)
- Habit lifecycle: active, paused, with weekly count + streak → Domain
- Streak reset rule (broken when target not met) → Requirements
- "Best ever" streak retention → Domain (stored separately from current)
- Smart nudge for habits in "danger zone" → Requirements (derived trigger rule) + Domain (danger threshold is derived, not stored)
- 1 primary + 2 secondary cap enforced at a single point (Add Goal screen on save); Coach only advises → Requirements
- Goal type distinction (milestone vs. compounding/low-hanging) → Domain
- Target-date-passed prompt → Requirements (trigger) + Domain (goal lifecycle state: active, completed, missed, abandoned)
- Done tasks archive into Stats after week ends → Domain (lifecycle continuation)
- Multi-item parsing in one utterance → Requirements (AI capability scope)

---

## Q&A

- **Q5: Default landing view?**
  A: User agreed with recommendation — **This Week** as default, top-down: milestone header, habits with weekly counts, tasks grouped by theme with effort/return chips, persistent + / voice quick-add.

- **Q6: Weekly planning ritual?**
  A: Liked the recommendation. Sub-answers:
  - **(a) Week starts Sunday** (not Monday). Reasoning: "If I start working on Monday, I might forget to do it or postpone." Single ritual on Sunday combines reset + planning to avoid complexity.
  - **(b) Explicit carry-over** (triage each unfinished task) — recommended option accepted.
  - **(c) Show last week's habit results** during planning — accepted.

- **Q7: Quick-capture flow (voice + AI)?**
  A: Liked the recommendation. Stressed: "as long as we keep things lightweight, and not overwhelming. Changing, if necessary, should also be very straight forward. Like right then and there." Sub-answers:
  - **(a) AI always guesses and lets user correct** (no asking back) — accepted.
  - **(b) Voice-add works anywhere in app** (persistent mic button) — accepted.
  - **(c) Multi-item parsing in one utterance** — accepted.
  - **Added clarifying question** about whether habits and tasks have different fields → handled with preview (task: effort, return, this-week/backlog, one-shot reminder; habit: weekly count target, theme — *not* effort/return since recurring, *no* per-habit reminders).

- **Q7-followup: Habit reminders?**
  A: User rejected user-configured per-habit reminders. Instead: smart nudge fires only when "in dangerous territory" (running behind weekly target). System-triggered, not user-configured.

- **Q8: Goal ↔ task linkage?**
  A: Liked the recommendation. Sub-answers:
  - **(a) No active milestone on theme → task links to nothing** (some themes are pure habit/maintenance) — accepted.
  - **(b) Task can link to secondary goal if theme has both** (AI defaults to primary; user can switch) — accepted.
  - **(c) This Week header shows primary milestone only**; secondaries on Goals tab — accepted.

- **Q9: Goal-setting flow?**
  A: Form is fine, BUT — bigger problem first: "by the time I got that, then I already know what I want to achieve. And that is not simple. I might need help for this." Added requirement for an AI-coached goal-definition flow. Sub-answers:
  - **(a) Only one primary goal at a time** — accepted, AND added: **max 2 secondary goals at a time** as well (hard cap on total active goals = 1 + 2).
  - **(b) Goal target date passed → prompt to review** (extend/hit/drop, never silent delete) — accepted.
  - **(c) Goals stay flat** (no sub-milestones) — accepted.

- **Q10: AI Coach design?**
  A: Liked the recommendation, with an important refinement: "the prompt can be more having values and concepts, and not static questions." Coach is an **adaptive AI conversation guided by principles** (force the when; distinguish milestones vs. continuous direction; identify compounding opportunities; spot low-effort/high-return candidates; push back on vagueness; enforce 1+2 cap), **not a fixed wizard**. Sub-answers:
  - **(a) Coach helps create when no goals exist, and review/prune when goals exist** — accepted (user said: "if there are no goals, then it helps me create a new one. And if there are already a few, it helps me review.")
  - **(b) Voice supported in coach** — accepted ("phone writing is pain in the ass ish").
  - **(c) Coach for goals only in v1; not for tasks** — accepted.
  - **POST-DISCOVERY SIMPLIFICATION (2026-05-15):** the coach is now **purely advisory** — no inline editable proposed-goal card, no in-chat "Accept". It concludes with a prose summary + a single "Create this goal" button that opens the standard Add Goal screen pre-filled. The 1+2 cap is enforced solely at the Add Goal screen on save (single enforcement point); the coach only advises on prioritization. See discovery.md Key Decisions.

- **Q11: Success moment + edge journeys?**
  A: Liked recommendations across the board — subtle completion feedback (no confetti), one-tap menu for mid-week changes, missed-day red flag with no guilt, streaks reset hard (3/4 = streak gone), "Best ever" retained.

- **Q12: Navigation + backlog/done accessibility?**
  A: Liked recommendation — 4 bottom tabs (This Week / Backlog / Goals / Stats), settings behind gear icon. Backlog is its own tab, always accessible. Done items fade into a collapsible "Done" section on This Week during the active week; after Sunday flip, archive into the Stats tab as browsable past weeks. Habits don't have a per-task done state; their history = weekly counts + streak progression in Stats. Done-this-week section **collapsed by default** — accepted.
