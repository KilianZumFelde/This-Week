# Requirements Lens — Discovery Record

**Date**: 2026-05-14
**Lens**: Requirements

---

## Lens Summary

### Business Rules (IF/THEN logic)

**Week boundary:**
- Week flips at **Sunday 00:00 local time** (start of Sunday, not end). Week runs Sunday → Saturday.
- On flip, automatically: (a) habit counts reset to 0; (b) last week's habit results archive (visible in Stats); (c) streaks increment if last week's target was met, reset to 0 otherwise; (d) unfinished tasks stay flagged for carry-over triage prompt on next open; (e) done tasks archive into Stats.
- Carry-over is a **mandatory, blocking ritual**, NOT a dismissable prompt. It appears on the first app open after the flip and **re-appears on every app open until every leftover task has been triaged**. It is never "dismissed for the rest of the week" — there is no skip, no defer, no escape. (This corrects an earlier contradictory rule that said it "fires once then dismisses"; an escape would leave tasks in silent limbo, violating the explicit-triage hard constraint.) The ritual opens with a wins-first recap step (last week's `X/N tasks · Y/Z habits`, streak deltas, and a forward "still working toward [primary goal]" line — no "goals completed" counter), then mandatory per-task triage, then an **optional non-blocking pull-from-backlog step** ("Start week" always enabled even if nothing is pulled — pulling is additive and never creates limbo, so it is NOT mandatory, unlike triage). Triage outcomes per task: Keep for this week / Send to backlog / Drop — where **"Drop" = delete the task** (the gentle triage-context label for the same remove operation called "Delete" everywhere else; tasks are not parked in any new state).
- Timezone: device local time. Single-user, single-device for v1 — no multi-timezone complexity.

**Habit streaks:**
- A streak counts the number of **consecutive weeks** the habit hit its target (e.g., 4/4 gym).
- Streak breaks **immediately at Sunday flip** if last week's target was not hit (e.g., 3/4 gym → streak = 0). No grace period, no "actually I did it" toggle. The streak is honest data.
- **Best-ever streak is retained** alongside current streak. Shown in Stats and on habit cards.
- Going **over the target** (e.g., 5/4 gym) is allowed and shown. Doesn't break anything. Streak still counts.

**Habit danger-zone nudge (system-triggered push notification):**
- Trigger formula: fires when **count_remaining + 1 ≥ days_left**, evaluated at 09:00 local each day.
- Fires **once per habit per week** maximum.
- Notification copy is short and concrete: *"Gym 1/4 this week — 3 days left to hit your target."* No motivational fluff, no emojis (unless user opts in later).
- Globally toggleable on/off in Settings (default: on). Useful for vacation weeks.
- The "mathematically impossible to hit" scenario is **not a separate notification path** — under the once-per-week rule, the user has already been nudged earlier in the week.

**Task reminders (user-configured, per-task, one-shot or recurring):**
- Configured at capture time via AI-natural-language parsing ("remind me Thursday morning", "nudge me daily until done").
- Optional per-task — no reminder = no notification.
- AI parses speech → produces a reminder spec → dispatch layer (implementation) executes.
- **Default reminder time** when not specified ("remind me tomorrow") = **09:00 local**.
- AI **suggests a reminder** when capture sounds time-sensitive ("send email to Pedro tomorrow") and shows the suggested reminder on the draft card so the user sees it before saving.
- **Reminder fires once** at set time. Does not re-nudge if not opened/acted on (the habit nudge is the recurring mechanism, not task reminders).
- **Recurring "until done"** is supported — fires daily, auto-cancels on task completion.
- **If task is completed before reminder fires** → reminder cancelled silently.
- **Reminders persist across week flips** — a reminder set 3 weeks out survives Sunday flips.
- **Tapping the notification** → opens the app. No snooze in v1.
- **Reminder visibility (v1, 2026-05-24 clarification):** reminders are not shown on task cards in This Week / Backlog, but they ARE visible and editable inside the **Task Detail Sheet** (the bottom sheet that opens when tapping a task's title). Settings → Reminders also lists all scheduled reminders with a "Delete all" action. The earlier "reminders are invisible during normal use, only manageable behind gear icon" rule is relaxed: the Task Detail Sheet is considered an acceptable second surface because it's one tap away and contextual to the task itself.

**Reminder capability matrix the AI must support:**

| Capability | Example trigger phrase | v1 status |
|---|---|---|
| One-shot at specific time | "Remind me Thursday 9am" | ✓ Implemented |
| Relative one-shot | "Remind me in 2 hours", "tomorrow morning" | ✓ Implemented |
| Recurring until completed | "Nudge me daily until I do this" | ✓ Implemented |
| Recurring on schedule | "Remind me every Monday", "weekdays", "Mon + Wed" | ✓ Implemented (RRULE `FREQ=WEEKLY;BYDAY=...`) |
| Conditional | "If still not done Friday, ping me" | Not implemented; optional / nice-to-have |

**AI parsing rules at capture:**
- AI extracts: item type (task vs. habit), title, theme, effort (task only), return (task only), this-week vs. backlog (task only), weekly count target (habit only), goal link, reminder spec.
- **Item type** inferred from recurrence cues ("X times a week", "every", "regularly" → Habit; otherwise Task).
- **Title** = action phrase stripped of meta ("remind me to", "for later", etc.).
- **Theme** = nearest match in user's existing themes; if no decent match, AI picks "Uncategorized" pseudo-theme and flags on draft card.
- **Effort/Return** lexical cues: "quick/easy/low effort" → Low; "big/heavy/long" → High; "could be huge/important/high impact" → High return; "small thing/nice to have" → Low return; default Medium for both.
- **This week vs. backlog** default = this week, unless "for later/sometime/no rush" → backlog.
- **Weekly count target** parsed as number + unit ("4 times a week"). If unparseable, AI **asks back** on the draft card — count is too critical to guess. (Exception to "always guess" rule.)
- **Goal link** auto-applied if theme has a primary milestone.
- AI **never refuses to create** a draft. Low-confidence fields shown with visual marker (faded text).
- AI **never auto-saves** — every voice capture produces a draft requiring explicit user confirmation tap.
- **Multi-item parsing** in one utterance produces N draft cards in sequence. The user steps through them one at a time using **Save · next**; no "Save all" bulk action is provided in v1.
- **Voice undo trigger phrases** (e.g., "scratch that", "start over") are **not implemented in v1** — to dismiss a draft, the user taps Cancel.

**Effort/Return priority scoring (for "Recommended" sort on This Week):**

| | Low effort | Medium effort | High effort |
|---|---|---|---|
| **High return** | ⭐⭐⭐ Top | ⭐⭐ High | ⭐⭐ High |
| **Medium return** | ⭐⭐ High | ⭐ Medium | Low |
| **Low return** | Low | Low | Lowest |

- **Recommended sort** = priority score descending, ties broken by added-order (oldest first).
- Effort: {Low, Medium, High, Unknown}. The DB and manual creation default to **Unknown**; the AI prompt defaults to **Medium** when inferring from speech with no explicit cue. Unknown tasks are sorted as if they were Medium/Medium.
- Return: {Low, Medium, High, Unknown}. Same defaulting rule as Effort.

**Goal cap enforcement (max 1 primary + max 2 secondary active):**

**Enforcement point (v1):** the cap is enforced at the **backend on save**. The Add Goal form sends the request; if the cap would be exceeded, the backend returns `HTTP 400` and the save fails. There is **no inline demote/replace/cancel modal in v1** — the user resolves the conflict manually by going to Goals, deleting (abandoning) an existing goal, then re-saving the new one. Rationale (2026-05-24): the user finds manual conflict resolution acceptable for v1; the modal can be added later if it becomes a friction point.

| Scenario | Rule |
|---|---|
| Adding new primary when one exists | Backend rejects with `HTTP 400`. User abandons the current primary (or demotes it by editing it) and re-saves. |
| Adding 3rd secondary | Backend rejects with `HTTP 400`. User abandons one secondary and re-saves. |
| Demoting primary when 2 secondaries already exist | Save fails. User abandons one secondary first. |
| Goal target date passed | Prompt user: *Did you hit this? Extend? Drop?*. Goal moves to graveyard on "Mark as hit" or "Abandon"; "Extend" reopens the Edit form. Never silent deletion. |
| Manually abandoning a goal | Always allowed. Goal → graveyard. Linked tasks/habits **keep their `goal_id` pointer** in v1 (see domain-lens.md — orphan chips are tolerated). |

**Definition of done:**
- **Task done** = user explicitly marks done (single tap, no confirm modal). Immediately reversible via the **general Undo snackbar** (see below); also re-openable any time within the same week by tapping the done task again. **Not reversible after Sunday flip** — preserves history integrity.
- **General Undo (app-wide rule)**: every state-changing action (task complete, task drop, habit increment, entity delete; later: goal mark-hit/abandon/demote) emits a transient Undo snackbar; one tap reverts the last action. This is the single universal undo mechanism — there is NO bespoke per-entity decrement/undo (e.g., no habit decrement control). The accidental-habit-increment case is handled solely by this snackbar.
- **Habit complete-this-week** = count reaches target (e.g., 4/4). Over-target allowed and shown.
- **Week complete** = Sunday flip occurs (clock-driven, not user-driven). No "finalize my week" button.

**AI Goal Coach: DROPPED FROM SCOPE (2026-05-24).** The Coach feature is no longer planned for v1. The direct Add Goal form is sufficient. Any earlier mention of "Coach me on a goal", coach modes, principles, or the "Create this goal" handoff is obsolete.

### Hard Constraints / Negative Requirements (Must NOT)

- Must **not** require date/time on tasks (user's core constraint).
- Must **not** auto-carry-over unfinished tasks silently (explicit triage only).
- Must **not** allow >1 primary goal active.
- Must **not** allow >2 secondary goals active.
- Must **not** show motivational quotes, badges beyond the streak counter, or gamification noise (no Duolingo-style confetti).
- Must **not** delete user data silently — goals are archived not deleted; weeks are archived not purged.
- Must **not** auto-save voice captures — always require user confirmation on draft.
- Must **not** send notifications other than (a) per-task user-set reminders, and (b) per-habit weekly nudge in danger zone.
- Must **not** allow re-opening a completed task after the Sunday flip — preserves history integrity.
- Must **not** compute health objectively (no tasks-per-week cadence, no task counting) — difficulty varies too much; an objective formula would "become Jira."
- Must **not** assign tasks to milestones (no task↔milestone relationship); tasks link to goals only.
- Must **not** drift health automatically between Sundays (no clock-driven or activity-driven change).
- AI must **not** generate the goal's plan unprompted or auto-create tasks; it assists only after the user reviews their own tasks and always requires confirmation.
- Must **not** hard-cap the number of milestones ("1–2 ahead" is a soft rhythm, not an enforced limit).
- Must **not** add a blocking app-open prompt for overdue milestones (triage surfacing only).

### Triggers / Events

| Trigger | Effect |
|---|---|
| Sunday 00:00 local | Week flip: habit counts → 0, streaks update, last week archives, carry-over flag set |
| User opens app while a carry-over flag is set | Mandatory blocking carry-over ritual: recap → per-task triage (re-appears every app open until fully triaged; no skip/dismiss) → optional non-blocking pull-from-backlog → "new week" celebration → This Week |
| ~09:00 local each day (via Render Cron) | `POST /jobs/habit-nudges` runs; danger-zone formula evaluated; nudge fired if matched (max once per habit per week). The 09:00 timing is enforced by the cron schedule, not by code-side time-of-day checks. |
| Every ~5 minutes (via Render Cron) | `POST /jobs/dispatch-reminders` runs; due one-shot and recurring reminders sent via Expo Push. |
| Task completed before reminder fires | Reminder cancelled silently |
| Voice utterance submitted | AI parses → draft card(s) presented for confirmation |
| User confirms draft | Item saved to system |
| Goal target date passes | App surfaces an Overdue Goal bottom-sheet prompt with: *Mark as hit / Extend (re-opens Edit form) / Abandon*. |
| User exceeds goal cap on Add Goal save | Backend returns `HTTP 400`; the form shows a generic error. User must abandon an existing goal manually and retry. |
| Recurring "until done" reminder fires daily | Fires until task is marked done, then auto-cancels |
| Sunday ritual reaches the goal step | For each active goal: **Reflect** (next-milestone line + two mandatory health questions; gap-catch if no milestone) → **Plan** (optional task pick + AI suggestions; new task via the "+" FAB) |
| Goal has no active milestone at triage | Gap-catch: prompt to create a milestone before proceeding for that goal |
| User marks a milestone **hit** | Milestone → `hit`; immediate prompt to set the next milestone |
| Milestone target date passes without being hit | Surfaced in the **next** Sunday triage goal step (not a blocking app-open prompt) |
| User answers the two health questions | Goal's health level is (re)set per `calculateGoalHealth(current, history)`; frozen until next Sunday |

---

## Release 1 additions — Goals Drive the Week

### Business rules (new)

**Goal/milestone health (the core new rule):**
- Each active goal has a **health** with a 5-level position (worst→best): **Behind · Slightly behind · On track · Ahead · Well ahead**.
- Health is **set weekly during the Sunday triage** goal step, from **two subjective questions** asked per goal:
  1. *Progress* — "How much did you move toward [milestone] this week?" → **A lot / Some / Barely / Nothing**
  2. *Confidence* — "Confident you'll hit [milestone] by [date]?" → **Yes / Maybe / No**
- **Health level = `calculateGoalHealth(current, history)`** — computed from the user's two answers for the current week **plus up to 3 prior contiguous weekly answers** (no gaps; a skipped Sunday resets the window). The milestone's date is shown only as **context** to help the user answer (it is NOT a computational input).

  **Base score table (score 0–4 → Behind … Well ahead):**

  | Progress \ Confidence | Yes | Maybe | No |
  |---|---|---|---|
  | **A lot** | Ahead (3) | On track (2) | Slightly behind (1) |
  | **Some** | On track (2) | On track (2) | Slightly behind (1) |
  | **Barely** | Slightly behind (1) | Slightly behind (1) | Behind (0) |
  | **Nothing** | Slightly behind (1) | Slightly behind (1) | Behind (0) |

  **History adjustments (bounded ±1–2 notches; current week is always dominant):**
  - A **negative pattern** (any of the three below) lowers the score by 1 or 2 notches. The *strongest single pattern* is used — they do not stack.
    1. **Repeated low confidence** — 2× consecutive `no` → −1; 3+× `no` → −2; 3+× `!= yes` → −1
    2. **Repeated stagnation** (`progress ∈ {barely, nothing}` AND `confidence ∈ {maybe, no}`) — 2× → −1; 3+× → −2
    3. **Repeated nothing progress** — 2× → −1; 3+× → −2
  - A **positive pattern** lifts the score by 1 notch (only applied when no negative fires): 2+× `a_lot+yes` → +1; 3+× `(some|a_lot)+yes` → +1
  - The current week always breaks a streak: if this week's answers do not match the pattern, the streak count resets to 0 and no adjustment fires. **Recovery from a bad streak is always possible with a strong current week.**
  - Final score is clamped to [0, 4] (Behind … Well ahead). Stored `health_level` values from prior weeks are never re-computed; the model reads raw `progress_answer` / `confidence_answer` from `goal_health_records`.

- **Health is frozen between Sundays.** It changes only when the user answers the weekly questions.
- Health applies to **all active goals** (primary and secondaries alike).
- **Display consistency:** the Goal Detail 8-week trend's current ("now") value is the goal's displayed `health_level` (single-sourced — the two can never disagree). The trend's now-bar is labeled **"This week"** only when the newest rated week *is* the current week; if the user skipped a Sunday, the bar is labeled with that rating's actual week (e.g. "Wk of Jun 8"), not "This week".

**This-week on-track cursor (the micro signal — distinct from health):**
- Separate from the subjective Goal health. This is an **objective, derived, live** signal shown **on the This Week view**, inside a dedicated **"Milestones" section**, one row per active goal — each row **labeled by the goal's next milestone**.
- Position = **this week's completed goal tasks vs. time elapsed in the week.** Expected-by-now scales with the day of the week.
- **Moves right** when the user completes a this-week goal task; **drifts left** as days pass with them incomplete (clock-driven within the week).
- **Resets each week** at the Sunday flip.
- If a goal has **no tasks committed this week**, the cursor shows a neutral "nothing planned this week" state, not "behind".

**Milestone lifecycle:**
- A milestone is a **dated checkpoint belonging to a goal**. A goal should have 1–2 upcoming milestones at a time.
- `active → hit` (manual mark). Marking a milestone **hit** triggers an immediate prompt to **set the next milestone**.
- A milestone may be **edited** (e.g., push its date).
- A milestone may be **deleted** (hard delete, escape hatch) — surfaced as a destructive "Delete milestone" action in the milestone edit sheet, with a confirm dialog. Deleting a milestone does not affect the goal's linked tasks.
- **Overdue milestone** (target date passes without being marked hit): surfaces in the **next Sunday triage** goal step (not a blocking app-open prompt).

**Sunday ritual goal step (two sub-steps per goal: Reflect → Plan):**
- Runs once per active goal, inserted after per-task triage and before pull-from-backlog.
  - **Reflect** — shows the goal's next-milestone line and asks the **two health questions** (mandatory-light). The **gap-catch** (no active milestone) lives here.
  - **Plan** — pick existing goal tasks into the week and/or accept AI-suggested additions (all optional). New task via the persistent **"+" FAB**.
- Only the Reflect health questions are mandatory; all Plan/task actions are optional.

**Bounded AI assist (goal step):**
- AI may suggest **additional** tasks only *after* the user has reviewed the goal's own existing tasks.
- AI **never auto-creates** tasks and every AI suggestion requires the user's explicit **confirmation tap**.

### Validation rules (new)

- **Milestone target date**: required; must be in the future; must be **on or before the parent goal's target date**. Offered as relative presets in the create/edit sheet: **1 week / 2 weeks / 3 weeks / 1 month / 5 weeks / 6 weeks** (each resolved to a concrete date, then validated against the rule above).
- **Health answers**: both questions required to set/confirm a goal's health during triage (mandatory-light).

### Concurrency
Not relevant in v1 — single-user, single-device, mobile-only. No simultaneous edits, no sync conflicts.

### Validation Rules

- **Goal target date** = required, must be in the future, no upper bound. Quick-select chips: 3 months / 6 months / 1 year / Custom.
- **Habit count target** = required positive integer.
- **Task title** = required non-empty string.
- **Theme on task/habit** = required (defaults to "Uncategorized" pseudo-theme if AI can't match).
- **Effort/Return** = required for tasks (default Medium).

### Cross-Lens Flags Raised
- Task lifecycle states (backlog, this-week, done, archived) → Domain
- Habit lifecycle states (active, paused, archived) → Domain
- Goal lifecycle states (active, hit, missed, abandoned, archived) → Domain
- Streak as derived vs. stored state → Domain (best-ever stored; current derived per Sunday flip update)
- Theme uniqueness/identity rules → Domain
- Reminder management screen behind gear icon → UI lens (settings screen design)
- Effort/Return chip visualization → UI lens
- No bell icon on tasks; reminders invisible during normal use → UX (revision captured, will update ux-lens.md)

---

## Q&A

- **Q13: Sunday flip rules?**
  A: All three sub-recommendations accepted — Sunday 00:00 flip, mid-week first-open still shows carry-over prompt, streak breaks immediately (no grace).

- **Q14: Habit danger-zone nudge?**
  A: Liked formula. Sub-answers: (a) 9am fire time accepted. (b) User correctly noted that "mathematically impossible" scenario doesn't need a separate notification path under the once-per-week rule — dropped that branch. (c) Global do-not-disturb toggle accepted. **User also caught wording confusion:** "tasks remaining" was sloppy — should be "count remaining" (habit increments). Confirmed two distinct notification mechanisms: habit nudges (system, derived) vs. task reminders (user, configured at capture).

- **Q15: Task reminder rules?**
  A: All recommendations accepted. **User added a critical scope refinement:** push notification service choice is implementation-phase, but the **capability matrix** the AI must support is Requirements. Defined the matrix (one-shot, relative one-shot, recurring-until-done required; recurring-on-schedule and conditional optional). User explicitly asked for "remind me every day until achieved" as a supported pattern → included as required. Sub-answers: (a) 9am default accepted. (b) AI suggests reminders for time-sensitive captures, shown on draft. (c) Snooze deferred — just "Open app" on notification tap.

- **Q15-followup: Where are ongoing reminders visible?**
  A: User **rejected the bell icon recommendation**. Wants reminders invisible during normal use — "I should be reminded about it or not. Why do I need to see when I will be reminded about this?" Reminder management lives behind the gear icon, with at minimum a "Delete all configured reminders" action. This is a **revision of the earlier UX decision** — captured here; UX lens file will be updated at session end before final compilation.

- **Q16: AI parsing rules at capture?**
  A: All recommendations accepted. (a) Visual cue only for low confidence — no audible/haptic. (b) Voice undo phrases ("scratch that", "start over", "cancel") accepted.

- **Q17: Effort/return as ranking signal?**
  A: All recommendations accepted. **User pointed out** that (b) — the chip vs. star visualization question — belongs to UI lens, not Requirements. Acknowledged the lens drift, flagged for UI. Requirements only locks: values {Low/Medium/High}, required, AI-default Medium, priority matrix as defined, Recommended sort uses score, ties broken by added-order.

- **Q18: Goal cap edge cases, definition of done, exclusions?**
  A: All recommendations accepted: (a) done tasks not reversible after Sunday flip — accepted. (b) Nothing to add to the "Must Not" list — exclusions complete as listed.
