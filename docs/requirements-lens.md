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

**Reminder capability matrix the AI must support:**

| Capability | Example trigger phrase | v1 status |
|---|---|---|
| One-shot at specific time | "Remind me Thursday 9am" | ✓ Required |
| Relative one-shot | "Remind me in 2 hours", "tomorrow morning" | ✓ Required |
| Recurring until completed | "Nudge me daily until I do this" | ✓ Required |
| Recurring on schedule | "Remind me every Monday" | Optional / nice-to-have |
| Conditional | "If still not done Friday, ping me" | Optional / nice-to-have |

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
- **Multi-item parsing** in one utterance produces N draft cards in sequence. "Save all" option offered.
- **Voice undo** trigger phrases: "scratch that", "start over", "cancel" → dismiss draft.

**Effort/Return priority scoring (for "Recommended" sort on This Week):**

| | Low effort | Medium effort | High effort |
|---|---|---|---|
| **High return** | ⭐⭐⭐ Top | ⭐⭐ High | ⭐⭐ High |
| **Medium return** | ⭐⭐ High | ⭐ Medium | Low |
| **Low return** | Low | Low | Lowest |

- **Recommended sort** = priority score descending, ties broken by added-order (oldest first).
- Effort: {Low, Medium, High}, required on every task, default Medium.
- Return: {Low, Medium, High}, required on every task, default Medium.

**Goal cap enforcement (max 1 primary + max 2 secondary active):**

**Single enforcement point:** the cap is enforced ONLY at the Add Goal screen, on save. It is the one place goals are created (whether reached directly from the Goals tab or via the Coach's "Create this goal" handoff). The AI Coach does NOT enforce the cap — it may advise on prioritization in conversation, but it has no inline create/save, so all hard enforcement happens once, on the Add Goal save.

| Scenario | Rule |
|---|---|
| Adding new primary when one exists | Force choice on save (at Add Goal screen): demote current primary to secondary, archive current primary, or cancel the new one. No silent override. |
| Adding 3rd secondary | Force: replace a specific secondary, promote new to primary (demoting current), or cancel. |
| Demoting primary when 2 secondaries already exist | Force a drop of one secondary first (would otherwise make 3). |
| Goal target date passed | Prompt user: *Did you hit this? Extend? Drop?*. Goal moves to archive on "Drop" or "Hit". Never silent deletion. |
| Manually archiving a goal | Always allowed. Goal → graveyard. All linked tasks **lose the goal link silently**; theme link remains. |

**Definition of done:**
- **Task done** = user explicitly marks done (single tap, no confirm modal). Immediately reversible via the **general Undo snackbar** (see below); also re-openable any time within the same week by tapping the done task again. **Not reversible after Sunday flip** — preserves history integrity.
- **General Undo (app-wide rule)**: every state-changing action (task complete, task drop, habit increment, entity delete; later: goal mark-hit/abandon/demote) emits a transient Undo snackbar; one tap reverts the last action. This is the single universal undo mechanism — there is NO bespoke per-entity decrement/undo (e.g., no habit decrement control). The accidental-habit-increment case is handled solely by this snackbar.
- **Habit complete-this-week** = count reaches target (e.g., 4/4). Over-target allowed and shown.
- **Week complete** = Sunday flip occurs (clock-driven, not user-driven). No "finalize my week" button.

**AI Goal Coach (advisory only — does NOT create, edit, or enforce):**
- Coach is an **adaptive AI conversation guided by principles**, not a fixed wizard.
- Principles loaded: force the "when"; distinguish one-time milestones from continuous direction (latter is a habit, redirect); identify compounding opportunities; spot low-effort/high-return candidates as secondary goal candidates; push back on vagueness; advise on prioritization within the 1 primary + max 2 secondary focus; distinguish "truly important" goals from "no-brainer compounding bet" goals.
- Coach mode auto-selected by state: **no active goals** → creation mode; **existing goals** → review/prune mode.
- **The coach never creates or edits a goal.** It concludes with a plain-prose summary of the recommended goal and a single "Create this goal" button that opens the Add Goal screen pre-filled from the conversation. The user reviews and saves there.
- **The coach does NOT enforce the cap.** It may advise in prose that a new goal would require demoting/dropping another, but the hard 1+2 enforcement (demote/drop/cancel modal) happens solely at the Add Goal screen on save. No inline overflow handling in chat.
- Coach for **goals only in v1**, not tasks.

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

### Triggers / Events

| Trigger | Effect |
|---|---|
| Sunday 00:00 local | Week flip: habit counts → 0, streaks update, last week archives, carry-over flag set |
| User opens app while a carry-over flag is set | Mandatory blocking carry-over ritual: recap → per-task triage (re-appears every app open until fully triaged; no skip/dismiss) → optional non-blocking pull-from-backlog → start week |
| 09:00 local each day | Habit danger-zone check; fires nudge if formula matches (max once per habit per week) |
| Task completed before reminder fires | Reminder cancelled silently |
| Voice utterance submitted | AI parses → draft card(s) presented for confirmation |
| User confirms draft | Item saved to system |
| Goal target date passes | Prompt: *Did you hit this? Extend? Drop?* |
| User exceeds goal cap (on Add Goal save — the single enforcement point; never in the Coach chat) | Force choice modal — demote/drop/cancel |
| Recurring "until done" reminder fires daily | Fires until task is marked done, then auto-cancels |

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
