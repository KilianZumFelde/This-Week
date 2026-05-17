# UX Lens — Discovery Record

**Date**: 2026-05-14
**Lens**: UX & Interaction

---

## Lens Summary

### Primary Journey (the default loop)

**Day-to-day (any random day of the week):**
1. User opens the app on phone.
2. **This Week** screen loads immediately — zero taps to see the day's reality.
3. User sees, top-down: the active **primary milestone** (one-line header), then **habits with current progress** (e.g., *Gym 2/4*, *Bachata 1/2*, *CVs 0/3*), then **tasks for this week grouped by theme** with effort/return chips on each.
4. User taps a habit's progress ring to increment its count (or taps the habit card's text to open its detail/edit sheet), and taps a task's circle to complete it (or its title to open detail).
5. Throughout the day, user captures new tasks via the **always-visible mic button** (bottom-right, persistent across screens). Speaks naturally; AI parses into a task or habit draft card.
6. User confirms or edits the draft inline (single tap to change theme, effort, return, week vs. backlog). Saves.
7. Done items strike through and fade into a collapsible "Done (n)" section at the bottom of This Week.

**Weekly planning ritual (Sunday — single moment, no separate "reset"):**
1. Sunday: user opens the app for the planning ritual.
2. **Habits carry over identically** — no setup work needed (they're weekly-recurring with the same target each week, e.g., gym 4x/week).
3. **Mandatory carry-over ritual** (blocking — no skip/dismiss/defer; re-appears every app open until fully triaged):
   - **Frame 0 — wins-first recap**: last week `X/N tasks · Y/Z habits` (fractions, no %), streak deltas (kept/broken), one forward line "still working toward [primary goal] — N tasks done toward it". Never opens on failure. (No "goals completed" counter — goals rarely complete in a week.)
   - **Then per-task triage**: unfinished tasks one-by-one with exactly three buttons each: *Keep for this week / Send to backlog / Drop*. No fourth option, no skip. ("Drop" = delete the task — the gentle triage word for the same remove operation called "Delete" everywhere else.)
4. **Pull-from-backlog (optional, non-blocking — the final ritual step)**: once triage is cleared, a "Stock this week" step lists backlog items; tap any to add to the week. A "Start week" button is always enabled even if nothing is pulled (pulling is additive, never limbo — so optional, unlike mandatory triage). Same promotion is also available anytime from the Backlog tab; this is the guided ritual surfacing of it.
5. (Last week's habit/task results live in the Frame 0 recap above — not a separate step.)
6. **+ Add new** — voice or manual capture for fresh items.
7. Total time: 2–5 minutes. Designed to be lightweight, not a 30-minute planning session.

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
| **Tapping a habit** | **Tap the progress ring** → count increments by 1. **Tap the card's text area (name/theme)** → opens Habit Detail/Edit sheet. Two distinct hit-targets on the same card; no added chrome (no kebab). When target hit (e.g., 4/4), subtle visual celebration (brief animation, cell turns gold/green). **No confetti. No motivational quotes. No popups.** Anti-Jira is also anti-Duolingo. |
| **Accidental habit increment** | Caught by the **general Undo snackbar** (see Edge journeys / Key Decisions) — fat-finger Gym to 3/4, tap Undo, back to 2/4. No bespoke decrement control needed; the ring stays a safe small target because Undo is universal. |
| **Mic button** | Always available, anywhere in app. Tap → record → AI parses → draft card appears. |
| **Editing a draft** | All AI-inferred fields are tappable inline. Single tap changes value. No nested modals. |
| **Editing existing item** | Same — tap to edit inline, "right then and there", no navigation. |
| **Mid-week change of mind** | Tap a task → menu offers *Move to backlog / Delete*. Tap a habit → *Pause* (stops counting until resumed). One tap into a menu, not surfaced on the main view. (No "move to next week" — there is no next-week state; backlog + Sunday pull is the forward-staging mechanism. "Drop" is NOT used here — it's only the gentle triage label for the same delete operation.) |
| **Streak broken** | Resets to 0. "Best ever" stays visible alongside current — motivating without punishing. |
| **Habit nudge** | When user is in "danger zone" of missing weekly target (e.g., Friday, gym at 1/4), the app fires a smart push notification. Not user-configured per-habit; system-triggered based on progress state. |
| **Reminders visibility** | **Revised after Q15:** reminders are **invisible during normal use** — no bell icon on tasks, no inline "next-fire time", no in-app reminder list view. The user sees reminders only when the OS push notification fires. Reminder management lives behind the **Settings (gear icon) → Reminders** sub-page, containing at minimum a *"Delete all configured reminders"* action. Rationale: "I should be reminded about it or not. Why do I need to see when I will be reminded about this?" |

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

### Goal-Setting Sub-Journey

**Two paths from the Goals tab:**

1. **+ Add Goal (direct)** — for when the user already knows what they want:
   - Title
   - Target date — **required**, the form refuses to save without one. Quick-select chips offered: 3 months / 6 months / 1 year / Custom.
   - Type — Primary or Secondary. Default: Primary if no primary exists; Secondary otherwise.
   - Theme — AI suggests from title; user can change.
   - Optional "why" paragraph (surfaced occasionally to maintain motivation).

2. **🪄 Coach me on a goal** — for when the user doesn't yet know what they want, or wants help prioritizing:
   - Adaptive AI conversation, **not a fixed wizard**.
   - Guided by **principles, not static questions**. The AI is loaded with concepts: force the "when"; distinguish one-time milestones from continuous directions (latter = habit territory); identify compounding opportunities; spot low-effort/high-return candidates that should be secondary goals; push back on vagueness; advise on prioritization within the 1 primary + max 2 secondary focus; distinguish "truly important" goals from "no-brainer compounding bet" goals.
   - Voice supported throughout — phone typing is painful.
   - **Purely advisory.** The coach never creates or edits a goal inline. It concludes with a plain-prose summary of the recommended goal + a single **"Create this goal"** button that opens the standard **Add Goal screen pre-filled** from the conversation. The user reviews and saves there. No in-chat accept, no inline editable card. (This is the simplification decided post-discovery — see discovery.md Key Decisions.)

**Two trigger modes for the coach:**
- **No active goals** → coach helps define the first set (first-goal creation mode — note: this is the coach's mode, NOT a separate onboarding flow; first-launch onboarding was removed from scope 2026-05-15).
- **Existing goals** → coach helps review and re-prioritize ("is this still primary?", "this secondary hasn't moved in 8 weeks — drop or recommit?").

**Hard cap enforcement:** the 1 primary + 2 secondary cap is enforced at a **single point — the Add Goal screen, on save**. If saving would exceed the cap, the Add Goal screen forces a demotion/drop/cancel choice. No silent overflow. The Coach may *advise* on prioritization in prose but does NOT enforce the cap itself (it has no inline create/save).

### Success Moment

Per micro-action: completion is subtle and satisfying. Tap → strike-through + fade. Habit target hit → brief glow/color change.

Per week: the user feels the success at the **Sunday review** — looking at the week's raw counts (tasks done, habits that hit target), habit streaks alive, and tasks done toward the active milestone. The Stats tab makes this glanceable. (Raw fractions, not percentages — decided in the Stitch-iteration pass; see discovery.md Key Decisions.)

Per quarter (the real success of the product): the user can name their primary milestone instantly, knows the next 3 actions toward it, and feels they're "actually on track" rather than drifting.

### Edge Journeys

- **Carry-over (Sunday):** mandatory blocking ritual — wins-first recap, then unfinished tasks triaged explicitly one-by-one (kept / sent to backlog / dropped). No skip/dismiss; re-appears every app open until cleared. Never silently moved.
- **Mid-week re-prioritization:** one-tap menu on any task to move/drop/defer.
- **Missed habit days:** flagged in red on next week's "last week's results" view. No guilt-trip; just visibility.
- **Streak broken:** resets to 0; "Best ever" persists as motivation.
- **Goal target date passes:** prompt to review — "Did you hit this? Extend? Drop?". Goal never silently deleted. A graveyard of missed goals is also useful data.
- **Pausing a habit:** habit stops counting until resumed; doesn't break streak history.
- **Pulling from backlog mid-week:** allowed via Backlog tab → tap → "Add to this week".
- **General Undo (app-wide):** any state-changing action — task completed, task dropped, habit incremented, deletes (and later: goal mark-hit/abandon/demote) — surfaces a brief Undo snackbar; one tap reverts the last action. This is the universal safety net; it replaces bespoke per-entity undo. (Task-done also remains separately re-openable by tapping it again any time before the Sunday flip — the immediate Undo and the deliberate same-week reversal coexist.)
- **Capture-anywhere via voice:** mic button persistent in bottom-right; works on any tab.

### Navigation

**Bottom tab bar — 4 tabs:**

| Tab | Default? | Contains |
|---|---|---|
| 🏠 **This Week** | ✓ default | Milestone header, habits with progress, tasks grouped by theme (with effort/return chips), collapsible Done section at bottom, persistent mic + button |
| 📥 **Backlog** | | All "for later" tasks. Always accessible. Direct add, browse, edit, swipe-to-promote into this week. |
| 🎯 **Goals** | | Active primary + secondaries, + Add Goal, 🪄 Coach me, archive of past/missed goals. |
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
