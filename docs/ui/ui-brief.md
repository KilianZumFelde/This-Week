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

**Floating mic button** (terracotta FAB) at bottom-right above the tab bar — persistent across all primary tabs. Tapping starts voice capture.

**Floating "+" button** smaller, paired left of the mic button — opens the same draft card flow with empty fields, for manual entry.

Modal patterns: bottom sheets for quick edits (task detail, habit detail), full-screen modals for complex flows (AI Coach, Add Goal, carry-over triage).

---

## Screens

### 1. This Week (home, default)

**Purpose**: The day-to-day landing view. Shows the active primary milestone, this week's habits with progress, this week's tasks grouped by theme, and a collapsed Done section. Designed so the user opens the app and sees "what matters right now" with zero taps.

**Layout hierarchy**:
1. **Hero**: Primary milestone card at top — single line title, soft gradient background, small badge "5 tasks this week toward this goal". Tap to expand into just those tasks.
2. **Habits section**: Horizontal scrollable row OR vertical compact list of habit cards, each showing title, theme chip, weekly count (e.g., *2/4*), and a circular progress indicator. **Tap the progress ring → increment count; tap the card's text area (name/theme) → open Habit Detail/Edit.** Two hit-targets, no added chrome. Subtle gold glow when target hit (4/4). Accidental increment is reverted via the app-wide Undo snackbar.
3. **Tasks section**: Grouped by theme with collapsible theme section headers. Each task card shows: checkbox/circle, title, theme chip, effort chip, return chip, optional milestone link badge. Single tap on the circle = mark done; tap on the title body = open edit sheet.
4. **Sort toggle** above tasks: *Recommended* (default — priority score, low-effort/high-return floats top) / *By theme* / *Added order*.
5. **Done section** (bottom, collapsed by default): "Done (N)" header — expandable to reveal struck-through completed tasks for the week.

**Key UI elements**:
- Milestone hero card with target date badge ("by Sept 2026") and tasks-toward-goal count
- Habit cards with circular progress + count text
- Task cards with theme chip + effort chip + return chip + optional goal link icon
- Sort toggle (segmented control)
- Collapsible Done section
- Persistent mic FAB (terracotta) + smaller "+" button bottom-right
- Bottom tab bar
- Gear icon top-right (Settings)

**Dynamic content shown**:
- Active **Goal** (primary, type=primary) with linked tasks count for current WeekRecord
- All active **Habits** with current week's HabitWeekRecord (count vs. target)
- All **Tasks** where (week = current AND status = open) grouped by Theme
- Done tasks where (week = current AND status = done)

**Variant states**:
- **Empty (first-launch, no goals/tasks/habits)**: A calm hero illustration + warm copy: *"This is your week. Start by setting your first goal — or just add a task."* Two CTAs: *"Set my first goal (with AI Coach)"* and *"Add a task"*. No mock data.
- **Empty (has goals but no tasks/habits this week)**: Milestone card shows alone; below it, *"No tasks or habits for this week yet. Tap the mic or + to add."*
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

**Purpose**: Manage active goals (primary + up to 2 secondaries), launch the AI Coach for definition or review, browse the graveyard of past goals.

**Layout hierarchy**:
1. **Primary section** at top: the single primary goal as a large card — title, target date, optional "why" excerpt, linked tasks/habits count, subtle progress signal.
2. **Secondaries section**: up to 2 secondary goal cards, slightly smaller than the primary.
3. **CTAs**: *"+ Add Goal"* (direct form) and *"🪄 Coach me on a goal"* (opens AI Coach modal).
4. **Graveyard section** (collapsed by default): "Past goals (N)" — expands to reveal hit / missed / abandoned goals with their resolution status.

**Interaction**: tapping any goal card (primary, secondary, or a graveyard goal) opens the **Goal Action Drawer** (see its screen). Active goals → drawer with Mark as hit / Delete / Edit. Graveyard goals → drawer with Edit only (reactivate).

**Key UI elements**:
- Primary goal hero card (larger, with soft gradient — same accent treatment as milestone hero on This Week); tappable → drawer
- Secondary goal cards (medium size); tappable → drawer
- Two CTA buttons — Add Goal (secondary button style) and Coach me (primary accent button)
- Graveyard collapsible section with each past goal showing title, target date, and resolution state (hit / missed / abandoned); tappable → drawer (Edit-to-reactivate)

**Dynamic content shown**:
- All **Goals** with status = active, sorted: primary first, then secondaries
- All **Goals** with status in {hit, missed, abandoned} in the graveyard

**Variant states**:
- **Empty (no goals at all)**: Calm hero — *"You haven't set a goal yet. Want help thinking through one?"* with a single big *"🪄 Start with AI Coach"* button + smaller *"Or add directly"* link.
- **Has secondaries but no primary**: Visible prompt *"You don't have a primary goal — want to promote one?"*
- **Goal cap reached** (1 primary + 2 secondaries): Add buttons grayed out OR active but tapping shows the demotion-choice modal.
- **Loading / error**: Standard.

---

### 4. Stats

**Purpose**: Show the user they're making progress toward their goal — using plain raw counts, not percentages. This week's tasks-done and habits-on-target fractions, habit streaks (current + best ever), and a browseable past-week history. No per-theme breakdown — the app focuses on the goal, not on optimizing a theme.

**Layout hierarchy**:
1. **Top summary band**: a large calm raw-count line — `This week — 12/15 tasks · 2/3 habits` (plain fractions, no percentages), with a best-ever streak callout beside it if any.
2. **Habit streaks panel**: Each active habit with its current streak (e.g., *Gym — 8 weeks*) and best-ever (*Best: 12*).
3. **Past weeks browser**: Scrollable list of small WeekRecord cards (most recent first). Each card: week date range + the same two fractions (`May 4–10 · 11/14 tasks · 3/3 habits`), tap to expand into that week's completed tasks + habit results.

**Key UI elements**:
- Large raw-count line (top hero spot): tasks fraction · habits fraction
- Habit streak cards (small) with current + best-ever
- Past weeks list of small cards (scrollable, expandable rows)
- Small subtle gold accents on hit-target streaks; no aggressive celebration UI; no charts; no generated insight sentences; no invented week titles

**Dynamic content shown**:
- Current week **tasks fraction** = done tasks / total tasks for the current WeekRecord
- Current week **habits fraction** = habits that hit their weekly target / total active habits that week
- All active **Habits** with current and best-ever streak values
- All **WeekRecords** historically (date range + the two fractions), expandable to show their archived tasks + HabitWeekRecords

**Variant states**:
- **Empty (no historical data, first week)**: *"Stats will show up here once you've completed your first week."* + small inline preview illustration.
- **No habits**: habit fraction in the top line shows "—"; streak panel hidden entirely.
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

### 6. AI Coach Conversation (full-screen modal)

**Purpose**: Conversational AI-driven flow for goal definition (when no goals) or goal review (when goals exist). Adaptive, principle-guided, supports voice throughout.

**Layout hierarchy**:
1. Top bar with **close (X)** button + title *"Goal Coach"*.
2. **Conversation thread** — message bubbles, AI on left, user on right. Soft-rounded bubbles, warm. The coach is **purely advisory**: it never creates or edits a goal inline. AI messages are plain prose + principle callouts only — no inline editable goal cards.
3. Bottom **input bar**: text field + persistent mic button. Voice is the encouraged input.
4. When the conversation concludes, the AI posts a **final summary message in plain prose** stating the recommended goal, followed by a single **"Create this goal"** button beneath the thread. Tapping it opens the standard **Add Goal screen pre-filled** from the conversation — the user reviews and saves there. There is no in-chat "Accept" and no inline editable card.

**Key UI elements**:
- Chat-style message thread (asymmetric bubbles)
- Final summary message (plain prose) + a single *"Create this goal"* button → opens Add Goal pre-filled
- Bottom input bar with mic button (prominent)
- Close button (X) top-left
- *"Restart conversation"* secondary action if the user wants to wipe and start over

**Dynamic content shown**: Real-time conversational AI output, conditioned by user's existing Goals + Themes context. The AI is loaded with principles (force the "when"; distinguish milestones vs. continuous direction; spot compounding opportunities; advise on prioritization within the 1+2 cap). Note: the coach only *advises* on the cap in conversation — the hard cap is enforced solely at the Add Goal screen (single enforcement point), never inside the chat.

**Variant states**:
- **No existing goals (creation mode)**: Opens with *"Let's figure out what you actually want to work toward."*
- **Existing goals (review mode)**: Opens with *"Let's check in on your current goals."* — shows current goals as context cards above the thread.
- **Cap exceeded scenario**: The coach may *mention* in prose that creating this will mean demoting/dropping another goal, but it does NOT present a choice card — the demotion-choice modal lives only on the Add Goal screen, triggered on save.
- **Loading**: Typing indicator (subtle 3-dot animation).
- **Error / AI unreachable**: *"Coach is offline right now. You can still add a goal directly."* + button to switch to Add Goal form.

---

### 7. Add Goal Form (full-screen modal)

**Purpose**: The single goal-creation screen. Reached two ways: directly from the Goals tab (empty fields, for users who already know what they want) OR from the Coach's "Create this goal" button (every field pre-filled from the conversation — user reviews and saves). This is also the **single enforcement point for the 1+2 goal cap** (the cap-exceeded modal triggers here on save, never in the Coach chat).

**Layout hierarchy**:
1. Top bar with close (X) + title *"New Goal"*.
2. **Title** field (large).
3. **Target date** field — required. Quick-select chips (*3 months* / *6 months* / *1 year* / *Custom*) above a native date picker.
4. **Type** radio: *Primary* / *Secondary*. Default based on current state (Primary if none exists, else Secondary).
5. **Theme** dropdown — AI suggests based on title; user can change.
6. **Optional "why"** — multi-line text field, smaller, labeled *"Why does this matter? (optional)"*.
7. Bottom bar: *Cancel* / *Save*. Save disabled until title + target date are filled.

**Key UI elements**:
- Large title input
- Date picker with quick-select chips above
- Primary/Secondary radio
- Theme dropdown
- Optional "why" textarea
- Cancel / Save buttons

**Dynamic content shown**: Pre-fills nothing on direct entry; AI-suggested theme appears once title has enough content.

**Variant states**:
- **Cap exceeded on save**: Modal appears: *"You already have a primary goal. What would you like to do?"* — options: Demote current primary, Archive current primary, Cancel.
- **Required field missing**: Save disabled; subtle hint visible.
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

**Purpose**: Open from any task tap (on the title body, not the checkbox). Lets the user edit any field "right then and there", or move/drop/defer the task.

**Layout hierarchy**:
1. Title (large, editable inline)
2. Field chips (same as draft card): Theme / Effort / Return / Week assignment / Goal link / Reminder
3. Below: action row — *Move to backlog* / *Delete* (no separate "Drop" — "Drop" is only the gentle triage-context word for this same remove-the-task operation; general Undo snackbar covers accidental removal)
4. Sheet dismisses on drag-down or backdrop tap.

**Key UI elements**:
- Editable title field
- Tappable field chips
- Inline reminder edit (opens voice/text input)
- Action row (smaller buttons, tertiary-style)
- Bottom sheet handle

**Dynamic content shown**: The full state of the selected Task entity.

**Variant states**: Standard editing states; no special variants needed.

---

### 10. Habit Detail / Edit (bottom sheet)

**Purpose**: Edit habit fields, pause/resume, or delete. Also shows the habit's streak history at a glance. Opened by tapping a habit card's **text area (name/theme)** — the progress ring is reserved for incrementing, never opens this sheet.

**Layout hierarchy**:
1. Title (editable inline)
2. Theme chip
3. Weekly count target (editable — number stepper)
4. Optional goal link chip
5. **Streak block**: current streak + best-ever, displayed prominently
6. Action row: *Pause / Resume* / *Delete*

**Key UI elements**:
- Editable title
- Theme chip
- Number stepper for weekly count target
- Goal link chip
- Streak block (current + best, with gold accent on best)
- Pause/Resume toggle, Delete button (delete shows confirm dialog)

**Dynamic content shown**: Full state of selected Habit entity + most recent HabitWeekRecords for context.

**Variant states**:
- **Paused habit**: Pause button shows as Resume; streak block displays *"Streak: 4 (paused)"* in muted color.
- **Confirming delete**: Inline alert — *"This will permanently delete the habit and all its weekly history. Confirm?"*

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

**First-run experience instead**: there is no onboarding flow. A brand-new user lands directly on **This Week** in its empty state (see Screen 1 — *"Empty (first-launch, no goals/tasks/habits)"*: calm hero + *"Set my first goal (with AI Coach)"* / *"Add a task"* CTAs). That empty state now carries the entire first-run job — orientation happens by doing, not by a swipe tour.
