# UI Design Brief: Weekly Focus — Tasks, Habits, Goals

## Product Context

A personal mobile-first productivity app for one person — designed to keep long-term goals anchored to weekly action, and to surface high-leverage low-effort actions that would otherwise get procrastinated indefinitely. The user's stated problem: months pass without measurable progress; goals are vague and undated; productivity apps are too noisy and force date/time discipline they can't sustain.

The app organizes a user's life into **themes** (e.g., DJ career, fitness, job change, bachata). Inside themes the user tracks two kinds of things: **tasks** (one-shot actions with effort/return signals and an optional goal link) and **habits** (weekly-recurring with a count target like "gym 4 times a week"). Above tasks and habits sits the **goal layer**: one **primary milestone** + up to two **secondary goals**, each with a required target date. Tasks within a theme automatically link to that theme's active milestone so the user always sees "5 tasks this week toward this goal" without bookkeeping. A **statistics** layer tracks the week's raw counts (tasks done, habits that hit target), habit streaks, and past-week history — focused on goal progress, not theme optimization.

Key feel: **calm, warm, quietly-serious, soft-modern minimalism**. Closer to a thoughtful paper notebook than a project management dashboard. Anti-Jira and anti-Duolingo — no confetti, no motivational quotes, no gamification noise, no nested forms. Dark mode is the default. Voice input via a persistent mic button is a first-class capture mechanism (an AI parses natural speech into task or habit drafts).

---

## Visual System

**Vibe**: Calm, focused, deliberate. Warm minimalism. Quietly serious — not corporate-serious, not playful. Soft-modern: rounded but not pill-shaped, generous whitespace, gentle tonal separation rather than harsh borders. Feels like an app that respects the user's attention.

**Visual references**:
- **Bear** (note-taking) — warm minimalism, beautiful typography, focused single-purpose feel
- **Things 3** — clean information hierarchy, restrained palette
- **Day One** (journaling) — calm warmth, dark mode done with intent
- **Stoic** (journaling) — quiet, focused, zero gamification

**Visual references to AVOID**:
- Notion — too dense, configurable-feeling, work-coded
- Todoist — slightly cluttered, mildly gamified
- Duolingo / Habitica — gamified, noisy, ping-heavy
- Asana / Jira — explicitly rejected: forms-heavy, project-management-coded

**Color palette**:

| Role | Dark mode (default) | Light mode |
|---|---|---|
| Background | Deep warm charcoal with brown undertone (~`#1a1816`) — not pure black | Warm off-white cream (~`#faf8f5`) |
| Surface (cards) | One step lighter, soft warm gray | Slightly-tinted white with subtle warm shadow |
| Primary accent | Muted terracotta / burnt sienna — warm rust | Same hue, darkened for legibility |
| Secondary accent | Sage / muted olive green — for done / habit completion | Same |
| Text primary | Warm off-white | Deep warm charcoal |
| Text secondary | Warm gray | Mid warm gray |
| Effort signal (low) | Soft slate blue (desaturated) | Same |
| Return signal (high) | Warm gold (desaturated) | Same |
| Streak / best-ever | Warm gold (used sparingly, only for hit-targets and active streak callouts) | Same |
| Red (missed habit visualization in last-week review) | Muted brick red — not alarming, just honest | Same |

**Typography**:
- **Headings**: Characterful but restrained serif — **Source Serif Pro** or **Newsreader**. Gives the "thoughtful notebook" feel and differentiates from every-app-uses-Inter.
- **Body**: Humanist sans — **Inter** or **Geist**. High legibility, comfortable for one-handed mobile reading.
- **Numbers** (habit counts, streak figures): Tabular figures via `font-feature-settings: 'tnum'` for clean alignment.
- **Hierarchy**: Generous heading sizes; body text comfortable for thumb-distance reading. Plenty of vertical rhythm.

**Visual density**: **Spacious.** Generous whitespace throughout. Tasks have room to breathe. The This Week screen should feel calm even with 15 items on it. Density is not utility — empty space is what makes the content feel important.

**Component style**:
- **Corners**: Medium-rounded — 8–12px radius. Not pill-shaped, not sharp.
- **Shadows**: Soft, low elevation — barely perceptible; closer to tonal separation than a drop shadow.
- **Borders**: Rarely used. Surfaces differentiate by background tone, not by lines.
- **Gradients**: Minimal. Allowed only on (a) the milestone hero card to give it presence and (b) the habit-target-hit micro-celebration.
- **Icons**: Line-style — **Phosphor** or **Lucide**. Not filled, not chunky.
- **Buttons**: Subtle. Primary action = solid accent fill; secondary = ghost / outlined; tertiary = text-only.
- **Bottom tab bar**: Floating, with a subtle blur/translucent background — iOS-recent feel.
- **Mic button (FAB)**: Persistent floating action button bottom-right, accent terracotta color, prominent but not garish. Always accessible across all screens.
- **Quick-add + button**: Smaller, paired with mic, opens the same draft card flow but with empty fields.
- **Chips** (theme tag, effort, return): Pill-shaped, subtle background tints (theme-tinted for theme chip; semantic-tinted for effort/return).

---

## Navigation

**Bottom tab bar with 4 tabs** — fixed, always visible:

| Tab | Icon | Label | Default |
|---|---|---|---|
| 1 | House | This Week | ✓ default |
| 2 | Inbox / tray | Backlog | |
| 3 | Target / bullseye | Goals | |
| 4 | Bar chart | Stats | |

**Top-right gear icon** on the This Week screen (and other primary screens) → opens Settings (full-screen, slides up).

**Single floating action button (FAB)** — terracotta, bottom-right above the tab bar, persistent across all primary tabs. **Tap → quick-add modal** (manual entry with empty fields, defaults to this-week or backlog based on the active tab). **Long-press (~300ms) → voice listening overlay** (AI parses speech into draft cards). Decision 2026-05-24 — single button with a press-and-hold gesture for voice replaces the earlier "mic FAB + smaller + button" dual-FAB design.

Modal patterns: bottom sheets for quick edits (task detail, habit detail, goal action drawer, overdue goal prompt), full-screen modals for complex flows (Add Goal, carry-over ritual screens, voice listening, quick-add).

---

## Screens

### 1. This Week (home, default)

**Purpose**: The day-to-day landing view. Shows the active primary milestone, this week's habits with progress, this week's tasks grouped by theme, and a collapsed Done section. Designed so the user opens the app and sees "what matters right now" with zero taps.

**Layout hierarchy**:
1. **Hero**: Primary milestone card at top — single-line title, flat warm-surface background (no gradient; React Native limitation, surface-tone-on-surface is the substitute), small target-date pill ("by Sept 2026") and a "N tasks this week toward this" line.
2. **Habits section**: vertical compact list of habit cards, each showing title, theme chip, weekly count (e.g., *2/4*), and a circular progress ring. **Tap the progress ring → increment count; tap the card's text area (name/theme) → open Habit Detail/Edit.** Two hit-targets, no added chrome. When the target is hit a calm gold "HIT" label appears on the row (no animation in v1). Accidental increment is reverted via the app-wide Undo snackbar. Section header shows "N/M on target" tally.
3. **Tasks section**: **Flat list sorted by priority score** (effort × return; high-return/low-effort floats top). No theme grouping on This Week. Each task card shows: circle (tap = mark done) + title + theme chip, with a **colored vertical priority stripe** down the left edge (gold = top, mid grey = mid, dim = low). **Effort and return chips are NOT shown on the card** — they live in the Task Detail sheet. The optional milestone-link badge is also not shown on the card; goal membership is implicit via the milestone hero count. Tap the title body to open the Task Detail sheet.
4. **No sort toggle on This Week** (removed 2026-05-24 — priority sort is always on). The Backlog tab retains a sort toggle (theme / priority / recent).
5. **Done section** (bottom, collapsed by default): "Done (N)" header — expandable to reveal struck-through completed tasks for the week.

**Key UI elements**:
- Milestone hero card with target date pill and tasks-toward-goal count
- Habit cards with circular progress ring + count text + gold "HIT" badge when target met
- Task cards with theme chip + colored priority stripe (no effort/return/goal chips on the card)
- Collapsible Done section
- Persistent single FAB bottom-right (tap = quick-add, long-press = voice)
- Bottom tab bar
- Gear icon top-right (Settings)

**Dynamic content shown**:
- Active **Goal** (primary, type=primary) with linked tasks count for current WeekRecord
- All active **Habits** with current week's HabitWeekRecord (count vs. target)
- All **Tasks** where (week = current AND status = open) grouped by Theme
- Done tasks where (week = current AND status = done)

**Variant states**:
- **Empty (first-launch, no goals/tasks/habits)**: A calm hero illustration + warm copy: *"This is your week. Start by setting a goal you actually want to work toward — or just add a task."* Two CTAs: *"Set my first goal with Coach"* (visual label retained — Coach feature itself is dropped) and *"Add a task"*. **Known v1 bug:** these CTAs do not currently navigate anywhere; the FAB is the working entry point.
- **Empty (has goals but no tasks/habits this week)**: Milestone card shows alone with a *"N tasks this week"* line; user adds via the FAB.
- **Loading**: Skeleton placeholders shaped like cards — same dimensions, no shimmer animation, just a calm muted fade.
- **Error (data load failed)**: Inline message *"Couldn't load this week. Pull down to retry."* with manual refresh.

---

### 2. Backlog

**Purpose**: Container for all "for later" tasks. User adds to it directly, browses, edits, and promotes tasks into "this week" with a single swipe or tap.

**Layout hierarchy**:
1. Sort toggle at top: *By theme* (default — collapsible theme sections) / *By priority* / *Recently added*.
2. List of task cards grouped or flat depending on sort.
3. Empty state: gentle message + mic/+ buttons.

**Key UI elements**:
- Sort toggle (segmented control)
- Theme section headers (collapsible) when sorted by theme
- Task cards (same shape as This Week) with a small *"Pull to this week"* action visible via swipe or long-press menu
- Persistent mic FAB + "+" — adds directly to backlog when on this tab

**Dynamic content shown**: All **Tasks** where (week assignment = backlog AND status = open), grouped by Theme (default).

**Variant states**:
- **Empty**: *"Your backlog is empty. Tasks you don't want for this week land here."* Mic + "+" still prominent.
- **Loading**: Card-shaped skeletons.
- **Error**: Inline retry.

---

### 3. Goals

**Purpose**: Manage active goals (primary + up to 2 secondaries), add new goals directly, browse the graveyard of past goals.

**Layout hierarchy**:
1. **Primary section** at top: header "Primary · N of 1"; the single primary goal as a card showing eyebrow (`theme · by Mon Year`), title, optional "why" excerpt, tasks-this-week + habits-linked counts, and a "N mo left" badge.
2. **Secondaries section**: header "Secondary · N of 2 slots"; up to 2 secondary goal cards, slightly smaller styling than the primary.
3. **Buttons row**: two side-by-side buttons — **"Add directly"** (ghost button, opens Add Goal form) and **"Coach me"** (primary accent button — currently a visible-but-non-functional button; the Coach feature was dropped 2026-05-24. May be removed in a later code cleanup pass).
4. **Graveyard section** (collapsed by default): "Past goals (N)" — expands to reveal hit / abandoned / missed goals with their resolution label and date.

**Interaction**: tapping any goal card (primary, secondary, or a graveyard goal) opens the **Goal Action Drawer** (see its screen). Active goals → drawer with Mark as hit / Delete / Edit. Graveyard goals → drawer with Reactivate (re-opens Edit form, subject to cap).

**Key UI elements**:
- Primary goal card (warm-surface background; no gradient in v1); tappable → drawer
- Secondary goal cards (similar style, lighter eyebrow color); tappable → drawer
- Two buttons — Add directly (ghost) and Coach me (accent, non-functional placeholder for now)
- Graveyard collapsible section with each past goal showing resolution label (Hit / Abandoned / Missed), title, and a date; tappable → drawer (Reactivate)

**Dynamic content shown**:
- All **Goals** with status = active, sorted: primary first, then secondaries
- All **Goals** with status in {completed, archived} in the graveyard (`completed` = hit, `archived` = abandoned)

**Variant states**:
- **Empty (no primary)**: section shows the "No primary goal yet — add one below." inline hint.
- **Empty (no secondaries)**: section shows "No secondary goals yet." inline hint.
- **Goal cap reached** (1 primary + 2 secondaries): Add Goal form save returns `HTTP 400`. The user is expected to abandon an existing goal manually and retry. (No demote/replace/cancel modal in v1.)
- **Loading / error**: Standard.

---

### 4. Stats

**Purpose**: Show the user they're making progress toward their goal — using plain raw counts, not percentages. This week's tasks-done and habits-on-target fractions, habit streaks (current + best ever), and a browseable past-week history. No per-theme breakdown — the app focuses on the goal, not on optimizing a theme.

**Layout hierarchy**:
1. **Top summary band ("This week" hero)**: two large fractions side-by-side — `tasks done` and `habits on target` (plain fractions, no percentages). If any active habit's current streak equals its best-ever streak (and is > 0), a calm gold **"New best — {title} {n} weeks running"** callout appears beneath.
2. **Habit streaks panel**: each active habit as a row with its name, current streak (e.g., *8 wk*) and best-ever (*best 12*). New-best rows have a gold accent on the current value.
3. **Past weeks browser**: scrollable list of small WeekRecord rows (most recent first). Each row: week date range + the two fractions (`May 4–10 · 11/14 tasks · 3/3 habits`). **Rows are non-interactive in v1** — no tap-to-expand into per-week tasks (deferred).

**Key UI elements**:
- Hero card (top): tasks fraction + habits fraction + optional "New best" callout
- Habit streak rows with current + best-ever
- Past weeks list of small static rows (scrollable, non-expandable)
- Small gold accents on new-best streaks; no aggressive celebration UI; no charts; no generated insight sentences; no invented week titles

**Dynamic content shown**:
- Current week **tasks fraction** = done tasks / total tasks for the current week
- Current week **habits fraction** = habits that hit their weekly target / total active habits that week
- All active **Habits** with current and best-ever streak values
- All **WeekRecords** historically (date range + the two fractions)

**Variant states**:
- **Empty (no historical data, first week)**: *"No past weeks yet — check back after the first Sunday rollover."*
- **No habits**: streak panel shows "No active habits yet."
- **Loading / error**: Standard.

---

### 5. Quick-Add Draft Card (modal / bottom sheet)

**Purpose**: Show the AI-parsed (or empty if "+" was used) task or habit draft for the user to confirm or edit before saving.

**Layout hierarchy**:
1. **Type indicator** at top with one-tap flip (e.g., a pill showing *"Task"* / *"Habit"* — tap to switch type if AI guessed wrong).
2. **Title** as a large editable text field.
3. **Field chips below** — each tappable to edit:
   - For Task: Theme chip / Effort chip / Return chip / This week vs. Backlog toggle / optional Goal link chip / optional Reminder chip
   - For Habit: Theme chip / Weekly count target / optional Goal link chip
4. Low-confidence fields displayed with faded text or subtle underline.
5. Bottom action bar: *Cancel* / *Save*.

**Key UI elements**:
- Task/Habit type pill (top)
- Large title text input
- Tappable chips for each field
- Visual marker on AI-low-confidence fields
- Cancel / Save buttons

**Dynamic content shown**: The AI-parsed draft for one item (or N drafts in sequence for multi-item utterances — *"1 of 2"* indicator visible).

**Variant states**:
- **AI parsing in progress**: Subtle inline spinner with *"Listening / Parsing..."* — minimal, no busy modal.
- **AI couldn't parse type**: Defaults to Task; flagged subtly so user can switch.
- **Multi-item sequence**: *"Save all"* secondary button appears at top of stack.
- **Error during save**: Inline message at bottom of card; data not lost.

---

### 6. AI Coach Conversation — DROPPED FROM SCOPE (2026-05-24)

The AI Coach conversational feature is no longer planned for v1. The direct Add Goal form (Screen 7) is the only goal-creation path. The "Coach me" button on the Goals screen is currently a non-functional placeholder and may be removed in a later code cleanup pass.

---

### 7. Add Goal Form (full-screen modal)

**Purpose**: The single goal-creation/editing screen. Reached from the Goals tab "Add directly" button (empty) or from any goal-action drawer's "Edit" / "Reactivate" action (pre-filled).

**Layout hierarchy**:
1. Top bar with close (X) on the left, screen title in the middle ("New goal" or "Edit goal"), Save button on the right.
2. **Goal title** field (large serif input, multiline).
3. **Target date** — required. **Quick-select chips only**: *1 month / 2 months / 3 months / 6 months / 1 year*. No "Custom" chip and no native date picker in v1. The currently-selected preset's resolved date is displayed below the chip row in a compact pill ("tap to refine" hint is currently decorative).
4. **Type** radio: *Primary* / *Secondary*. The current code defaults to Primary for new goals; backend will reject the save if the cap is exceeded.
5. **Theme** dropdown — pick from existing themes; "None" is allowed. No AI suggestion in v1.
6. **Optional "why"** — multi-line text field labeled *"Why does this matter? (optional)"*.
7. Bottom bar: *Cancel* / *Save goal*. Save disabled until title + target date are filled.

**Key UI elements**:
- Large serif title input
- Five date-preset chips (no Custom)
- Primary/Secondary radio
- Theme dropdown with "None" option
- Optional "why" textarea
- Cancel / Save goal buttons

**Dynamic content shown**: Pre-fills nothing on direct entry; pre-fills all fields when editing or reactivating an existing goal.

**Variant states**:
- **Cap exceeded on save**: Backend returns `HTTP 400`; the form surfaces a generic error. **No demote/replace/cancel modal in v1.** User dismisses, goes to Goals, abandons one existing goal, then re-saves.
- **Required field missing**: Save disabled; *"Title + target date are required."* hint visible.
- **Saving / error**: Standard.

---

### 8. Carry-Over Triage (full-screen modal, mandatory blocking ritual — persists every app open until fully triaged)

**Purpose**: The Sunday set-up ritual on the first app open after the flip: **recap (wins-first) → mandatory per-task triage of leftovers → optional pull-from-backlog → start week**. The triage portion is **mandatory and blocking** — no Skip, no dismiss, no escape; the only way past it is to triage every leftover, and it re-appears on every app open until fully cleared (anti-drift; an escape hatch would leave tasks in silent limbo, which the explicit-triage hard constraint forbids). The pull-from-backlog step that follows is **optional and non-blocking**. This completes the ritual's full purpose — both clearing last week *and* stocking the new one (previously the "pull from backlog" step had no screen).

**Layout hierarchy**:
1. **Recap step (first)**: header *"Last week"*; a large plain raw-count line `11/14 tasks · 3/3 habits` (fractions, no %); a quiet streak-delta line (*"Gym streak → 9 weeks · Bachata streak reset"*); one forward line *"Still working toward: Land first paid gig — 5 tasks done toward it"*; a single *"Review leftovers →"* button. Wins-first — never opens on failure. (No "goals completed" counter — goals rarely complete in a week; the forward line carries the goal dimension instead.)
2. **Per-task triage steps**: top *"Last week's leftovers"* with progress indicator (*"3 of 7"*).
3. **Current task card** (large, centered): title, theme chip, effort/return chips, original goal link badge if any.
4. **Exactly three buttons below the card**: *Keep for this week* (primary) / *Send to backlog* (secondary) / *Drop* (tertiary, slightly muted but not red — no shaming; "Drop" = delete the task, the gentle triage label for the same remove operation). No fourth option, no skip link anywhere.
5. **Pull-from-backlog step (optional, after all triage — implements Sunday ritual step 4)**: header *"Stock this week"*; a calm scrollable list of backlog task cards (title, theme chip, effort/return chips), each one tap-to-add (added items show a sage check + "Added"). A solid *"Start week"* button is **always enabled even if nothing is pulled** — pulling is additive and never leaves anything in limbo, so unlike triage this step is **optional, non-blocking**. (This same backlog→week promotion is also always available anytime from the Backlog tab; this is just the guided ritual surfacing of it.)

**Key UI elements**:
- Recap step: raw-count line + streak deltas + forward goal line + single continue button
- Progress indicator (small dots or text "3 of 7")
- Large task card (centered, focal)
- Exactly three triage action buttons stacked — no skip/dismiss affordance
- Pull-from-backlog list with tap-to-add + an always-enabled "Start week" button

**Dynamic content shown**: Recap = last completed WeekRecord's tasks fraction, habits fraction, streak deltas, and primary-goal task count. Triage = tasks where (week = last completed week AND status = open), iterated one by one. Pull step = tasks where (week assignment = backlog AND status = open), tappable to set week assignment = this-week.

**Variant states**:
- **No leftovers**: recap step still shows (wins are worth seeing), then skips triage and goes straight to the optional pull-from-backlog step, then confirmation.
- **Empty backlog**: pull step still appears but shows a calm *"Backlog is empty"* state with just the "Start week" button.
- **All triaged + week started**: closes with subtle confirmation toast — *"Ready for the new week."* into This Week.
- **Not fully triaged when app is closed**: the entire flow (recap + remaining untriaged tasks) re-appears on the next app open. It is never dismissed-for-the-week; it persists until cleared. (The optional pull step is only reached once triage is complete.)

---

### 9. Task Detail / Edit (bottom sheet)

**Purpose**: Open from any task tap (on the title body, not the checkbox). Lets the user edit any field "right then and there", or move/delete the task.

**Layout hierarchy**:
1. Title (large, editable inline — tap to enter edit mode)
2. Field chips: **Theme / Effort / Return / Week** — tapping a chip opens an inline picker (single tap to set, no nested modal).
3. **Reminder row**: shows "No reminder set / Tap to add one" or the current reminder summary. Tapping opens an inline reminder editor with a text field and a mic button (long-press the mic for voice). The text is sent to `/ai/parse-reminder` which returns a structured spec saved to the reminder for that task. Reminders ARE visible here (in-detail-sheet) — this is the accepted second surface beyond Settings → Reminders.
4. Action row: *Move to backlog* / *Delete*. Delete is **immediate** (no confirm dialog — tasks are low-stakes, the Undo snackbar is the safety net). Footer note: *"Accidental? An Undo snackbar appears for ~6s after any remove."*
5. Sheet dismisses on drag-down or backdrop tap (dirty fields are saved on dismiss).

**Key UI elements**:
- Editable title field
- Tappable field chips with inline pickers
- Inline reminder editor (text input + mic for voice)
- Action row (Move to backlog / Delete)
- Bottom sheet handle

**Dynamic content shown**: The full state of the selected Task entity + its current scheduled reminder if any.

**Variant states**: Standard editing states; no special variants needed.

---

### 10. Habit Detail / Edit (bottom sheet)

**Purpose**: Edit habit fields, pause/resume, or delete. Also shows the habit's streak history at a glance. Opened by tapping a habit card's **text area (name/theme)** — the progress ring is reserved for incrementing, never opens this sheet.

**Layout hierarchy**:
1. Title (editable inline — tap to enter edit mode)
2. Theme chip (tap to change) + Goal link chip (visible but currently displays *"none — link one?"*; the picker is not wired up in v1)
3. Weekly count target (editable via −/+ number stepper, range 1–14)
4. **Streak block**: gold flame icon + "Streak" eyebrow; current streak (large gold serif number) + best-ever streak (smaller); an 8-week dot row showing recent weeks (gold = hit, dim = miss), with labels "8 wk ago" / "this week"
5. Action row: *Pause / Resume* / *Delete*

**Key UI elements**:
- Editable title
- Theme chip (interactive) + Goal link chip (display-only in v1)
- Number stepper for weekly count target
- Streak block (current + best + 8-week dot row)
- Pause/Resume toggle, Delete button

**Dynamic content shown**: Full state of selected Habit entity + current week's HabitWeekRecord (used for the right-most dot in the 8-week row).

**Variant states**:
- **Paused habit**: Pause button shows as Resume; row in the parent list dims to 0.45 opacity with a *"PAUSED"* badge inline next to the title.
- **Confirming delete (target spec, not yet implemented in v1):** an inline alert should read *"This will permanently delete the habit and all its weekly history. Confirm?"* and the actual record-wipe should be deferred until the Undo snackbar window closes. **Currently in code:** delete is immediate, FK-cascading hard-delete of the habit and all `habit_week_records`; the Undo snackbar recreates an empty habit but cannot restore lost streak history. See Known bugs in TASKS.md — fix planned.

---

### 11. Settings (full-screen, via gear icon)

**Purpose**: Manage themes, reminder cleanup, habit nudge toggle, appearance preferences.

**Layout hierarchy**:
1. **Themes** section — *Manage themes* row → opens Themes management sub-screen.
2. **Reminders** section — *Reminders* row → opens Reminders sub-page (per Q15 follow-up).
3. **Notifications** section — *Habit nudges* toggle (on by default).
4. **Appearance** — Light / Dark / System toggle.
5. **About** — version, etc.

**Key UI elements**:
- Grouped list rows (iOS-style settings groupings)
- Toggle switches
- Disclosure arrows for sub-pages

**Dynamic content shown**: Static settings UI; user preferences.

**Variant states**: None special.

---

### 12. Settings → Themes Management

**Purpose**: Create, rename, delete, reorder, change color/icon for themes.

**Layout hierarchy**:
1. List of themes — each row shows colored icon + name + drag handle + edit/delete actions
2. *"+ Add theme"* button at bottom
3. Tapping a theme opens an inline edit sheet (rename, change color/icon)

**Key UI elements**:
- Reorderable list rows (drag handles)
- Color/icon swatch on each row
- "+ Add theme" button (primary action)
- Edit/delete actions per row (swipe or kebab)

**Dynamic content shown**: All user **Theme** entities.

**Variant states**:
- **Empty (rare — pre-seed prevents this)**: *"You don't have any themes yet. Add one to organize your tasks and habits."*
- **Deleting a theme with linked items**: Confirm dialog — *"This theme has N tasks/habits/goals. They'll move to Uncategorized. Confirm?"*

---

### 13. Settings → Reminders

**Purpose**: Bulk management of configured reminders. Per Q15 follow-up, this is *where* reminders are visible — not on tasks themselves.

**Layout hierarchy**:
1. (Optional) List of currently scheduled reminders, each row showing: parent task title, next fire time, recurrence pattern.
2. **"Delete all configured reminders"** action (prominent, with confirmation).

**Key UI elements**:
- Optional reminder list rows
- Delete-all button (caution-styled but not aggressive red)
- Confirmation dialog on delete-all

**Dynamic content shown**: All **Reminder** entities with status = pending.

**Variant states**:
- **No active reminders**: *"No reminders scheduled."*
- **Delete-all confirmation**: *"Delete all N reminders? Tasks themselves will remain."*

---

### 14. First-Launch Onboarding — DEFERRED (out of scope for now)

**Status**: Removed from scope (decision 2026-05-15) — judged too much for v1. Parked, not lost; can be revisited later.

**First-run experience instead**: there is no onboarding flow. A brand-new user lands directly on **This Week** in its empty state (see Screen 1). That empty state carries the entire first-run job — orientation happens by doing, not by a swipe tour. **Known v1 bug:** the empty-state CTAs are visible but not wired to navigate; the FAB is the working entry point. See Known bugs in TASKS.md.

---

### 15. New Week Celebration (full-screen)

**Purpose**: A calm transition moment between completing the Sunday set-up ritual and entering This Week. Marks the shift from "review last week" to "execute this week" so it feels deliberate, not abrupt.

**Layout hierarchy**:
1. Eyebrow text: "NEW WEEK" (small terracotta).
2. Large serif heading: "New week, fresh start." (two lines).
3. Subtitle: "You know what to do."
4. Bottom button: "Let's go" (primary accent, full width) → replaces stack with This Week.

**Key UI elements**:
- Eyebrow + large serif heading + soft subtitle
- Single primary button at the bottom

**Dynamic content shown**: Static copy. No dynamic data.

**Variant states**: None.

---

### 16. Overdue Goal Prompt (bottom sheet)

**Purpose**: Surfaces when the user opens the app and an active goal's `target_date` is in the past. Lets the user resolve the overdue goal in three ways without ever silently deleting it.

**Layout hierarchy**:
1. Eyebrow: "{Primary|Secondary} goal · past target date" (terracotta).
2. Large goal title (serif).
3. Sub-text: "Target was {Month Day, Year}".
4. Question: "Did you reach this goal?"
5. Three action rows:
   - **Mark as hit** (sage tone) — *"Move to past goals — well done."*
   - **Extend** (accent tone) — *"Reopen the form to push the target date."* — closes the sheet and opens the Add Goal form pre-filled in Edit mode.
   - **Abandon** (brick tone) — *"Move to past goals as abandoned."*
6. Footer: *"Tap outside to dismiss for now."* — dismissing the sheet only dismisses for the session; the prompt re-appears next launch until the goal is resolved.

**Key UI elements**:
- Goal preview block (eyebrow + title + target date)
- Three action rows with icons and sub-text
- Tap-outside-to-dismiss backdrop

**Dynamic content shown**: First overdue active goal (by `target_date < today`) not yet dismissed in this session.

**Variant states**: None (single template; only changes by goal data).
