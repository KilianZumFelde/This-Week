# Domain Lens — Discovery Record

**Date**: 2026-05-14
**Lens**: Domain & Data

---

## Lens Summary

### Core Entities

| Entity | What it represents | Key attributes |
|---|---|---|
| **Theme** | A configurable category — a slice of the user's life (e.g., DJ career, fitness, job change, bachata). The organizing principle for everything else. | name, color/icon (for UI), created date |
| **Goal** | A future milestone with a target date. The thing tasks point toward. Has a type: primary or secondary. | title, target date, type (primary/secondary), theme link, optional "why" text, status |
| **Task** | A discrete one-shot action. May or may not link to a goal. | title, theme link, effort, return, week assignment (this-week / backlog), optional goal link, optional reminder spec(s), status. `GET /tasks` supports filtering by `goal_id` to list a goal's tasks. |
| **Habit** | A recurring weekly action with a count target. Doesn't link to a specific week — perpetually active until paused/archived. | title, theme link, weekly count target, optional goal link, status, current streak, best-ever streak |
| **HabitWeekRecord** | The record of a habit's count for a specific week. One per habit per active week. Archives at Sunday flip. | habit link, week (Sunday date), count achieved, target at the time |
| **WeekRecord** | The container for a completed week's archive — references the tasks done that week + the HabitWeekRecords. Browseable in Stats. | week start date (Sunday), tasks completed this week (refs), habit results (refs) |
| **Reminder** | A scheduled notification attached to a task. | task link, schedule spec (one-shot time / recurring pattern), status |

**Non-entities (explicitly):**
- **AI Coach sessions** — the AI Coach feature has been **dropped from scope** (2026-05-24). The direct Add Goal form is sufficient for the user; no advisory chat flow will be built. Any historical references to the Coach in earlier sections are obsolete.

**Theme initial state:** Pre-seed with 3–4 generic placeholder themes (e.g., Health, Career, Personal, Learning). User can delete/rename freely. Reduces empty-state friction without forcing structure.

### Key Relationships

| From | To | Cardinality | Notes |
|---|---|---|---|
| Theme | Task | 1:N | Every task belongs to exactly one theme |
| Theme | Habit | 1:N | Every habit belongs to exactly one theme |
| Theme | Goal | 1:N | Every goal belongs to exactly one theme |
| Goal | Task | 1:N (optional) | A task may or may not link to a goal |
| Goal | Habit | 1:N (optional) | A habit may or may not link to a goal |
| Habit | HabitWeekRecord | 1:N | One record per habit per active week |
| WeekRecord | Task | 1:N (snapshot reference) | Tasks completed during that week |
| WeekRecord | HabitWeekRecord | 1:N | The week's habit results |
| Task | Reminder | 1:N (0 or more) | A task can have multiple reminders (e.g., fired one-shot + recurring) |

### Lifecycles

**Task:**
- `open → done` within the same week. Reversible via Undo while still in the same week.
- After Sunday flip: `done → archived-done` (immutable, visible in Stats).
- After Sunday flip: `open → carry-over triage` → one of: **stay open in new week** ("Keep for this week") / **moved to backlog** ("Send to backlog") / **deleted** ("Drop" — the triage's gentle label for the same delete operation used everywhere else; the task is removed, not parked in any new state).
- Tasks in backlog are also `open` state; they just have week assignment = backlog instead of a specific week.
- User can hard-delete a task at any time. **No confirmation dialog** — tasks are low-stakes and the general Undo snackbar is the safety net (consistent with the no-confirm-modal ethos for task actions). (Reconciled 2026-05-15: the earlier "single confirmation" wording predated the general-Undo decision.)

**Habit:**
- `active ⇄ paused → archived (terminal)`. Plus user-initiated hard-delete.
- **Paused freezes the streak — does NOT break it.** Paused habits do not generate HabitWeekRecords; the streak picks up where it left off when resumed. Rationale: vacation/illness/intentional break shouldn't punish the user; otherwise they'd avoid pausing and log false misses.
- **Active + target not hit at Sunday flip = streak resets to 0.** (No grace period.)
- **Active + target hit at Sunday flip = streak increments.**
- Hard delete also wipes all associated HabitWeekRecords (anti-noise — orphaned records clutter Stats). Because habit delete destroys streak history it DOES get a confirm dialog (unlike low-stakes task delete). The record wipe is **deferred until the general Undo snackbar window closes** — within the Undo window the habit and its records are restorable; only after it dismisses is the wipe committed (soft-delete window, not an irreversible immediate purge).

**Goal:**
- `active → hit | missed | abandoned` (all three are terminal "graveyard" states).
- `hit`: user confirmed achievement via the target-date-passed prompt, OR manually via the goal drawer's **"Mark as hit"**.
- `missed`: target date passed and user chose the didn't-hit option in the prompt.
- `abandoned`: user chose **"Delete"** in the goal drawer. For goals, **Delete = Abandon** — it is NOT a hard-erase; the goal moves to the graveyard and is kept as history. (Deliberate cross-entity split: "Delete" hard-removes a Task/Habit but abandons a Goal, because goals are long-term reflective objects whose history is valuable — consistent with the early "graveyard is useful data" decision and "never delete user data silently".)
- **There is no hard-erase of goals in v1.** A mistakenly-created goal can be Edited, or abandoned into the (collapsed, low-volume) graveyard; it is never permanently purged.
- **Goal link on tasks/habits is NOT cleared** when a goal becomes hit/missed/abandoned (v1 behavior, 2026-05-24). The goal moves to the graveyard but linked tasks/habits keep their `goal_id` pointer. Rationale: low-cost trade-off — orphaned chips on a few tasks is acceptable for v1, and the user re-thinks goals periodically anyway, so the cleanup happens naturally. May be revisited if it becomes noisy.
- Graveyard goals are visible in the Goals tab — Graveyard section. Tapping one opens Goal Detail in a read-only variant showing **only "Reactivate"** in the footer (reactivate = set a future date → back to `active`, subject to the 1+2 cap).
- **CRUD surface:** Goal update & lifecycle transitions are hosted by (a) the **full-screen Goal Detail modal** (tap any goal card → opens full-screen; sections: hero, health + 8-week trend, milestones as cards, "Tasks this week", "All tasks"; footer: Mark as hit / Delete for active goals, Reactivate for past goals; Edit button in header) and (b) the **dual-mode Add/Edit Goal screen** (Edit opens it pre-filled — title/why/date/theme + Primary/Secondary radio, cap enforced on save).

**Reminder:**
- `pending → fired` (one-shot) or `pending → fired-cycle (repeats) → cancelled` (when task is done or user cancels).
- Reminders cascade: if a task is hard-deleted, all its reminders are cancelled.
- Reminders persist across Sunday flips.

### Identity Rules

| Entity | Uniqueness |
|---|---|
| Theme | Name unique per user (case-sensitive in v1 — enforced by DB `unique (user_id, name)`; case-insensitive matching is not enforced in code) |
| Goal | No business uniqueness in v1 — duplicate titles within a theme are allowed |
| Task | No business uniqueness — multiple tasks with same title are allowed. Internal ID only. |
| Habit | No business uniqueness in v1 — duplicate titles within a theme are allowed |
| HabitWeekRecord | (habit, week-start-date) is the unique key — exactly one record per habit per week |
| WeekRecord | (user, week-start-date) is unique — exactly one per Sunday |
| Reminder | Internal ID only |

Note: the earlier "(title, theme) unique" rule for Goal and Habit was relaxed for v1 (2026-05-24). The user is single-user-single-device and prefers tolerating accidental duplicates over hitting a save-blocking error.

### Derived vs. Stored

| State | Derived or stored | Reasoning |
|---|---|---|
| **Current streak** | **Stored** on Habit; updated at Sunday flip | Computing from N HabitWeekRecords on every screen render = wasteful. Update once per week. |
| **Best-ever streak** | **Stored** on Habit | Protects against accidental loss if records are deleted/edited. |
| **Habit current-week count** | **Stored** on HabitWeekRecord (active week's record) | User actively increments. |
| **"In danger zone" status** | **Derived** | Computed at app open / 9am daily check. Depends on time-of-day, not persistent. |
| **Priority score (effort × return)** | **Derived** | Trivial computation. No persistence needed. |
| **"Tasks this week toward goal X" count** | **Derived** | Just count tasks where (goal=X, week=current). |
| **Goal "on track" signal** | **Derived** | Computed on demand from linked task/habit activity over recent weeks. |
| **Week tasks fraction** | **Derived** | done_tasks / total_tasks for the week, computed at view time. Shown as a raw fraction, NOT a percentage. |
| **Week habits fraction** | **Derived** | habits_that_hit_weekly_target / total_active_habits that week, computed at view time. Shown as a raw fraction, NOT a percentage. |
| **Goal health_level** | **Stored** on Goal | It is the user's weekly subjective verdict, not computable on the fly. Set weekly, frozen between Sundays. |
| **Health from milestone date** | **Not computed** | Health is `f(progress_answer, confidence_answer, history)`. The milestone date is contextual display to help the user answer — never a computational input. |
| **This-week on-track position (micro cursor)** | **Derived** | From this week's goal-linked tasks completed vs. day-of-week elapsed. No new storage — derivable from existing `task.goal_id` + `task.week` + completion + the current date. Distinct from the stored subjective health. |
| **Nearest upcoming milestone** | **Derived** | Min target date among a goal's `active` milestones. |
| **Milestone overdue** | **Derived** | `active` + target date in the past. |
| **Weekly health snapshot** | **Stored** (GoalHealthRecord) | Retained to support a trend/consistency view; cheap since the user answers weekly anyway. |

### Existing Entities to Account For
None — this is a new system, no legacy entities.

---

## Release 1 additions — Goals Drive the Week

### New entity: Milestone
A **dated checkpoint belonging to a Goal** — a near-term marker the user works toward, distinct from the Goal's own (often distant) target date. It exists to give the Goal an *upcoming* reference point the user reflects against each week.

| Attribute | Notes |
|---|---|
| title | Short description of the checkpoint |
| target date | Required; future; on or before the parent Goal's target date |
| status | `active` / `hit` |
| created date | |
| hit date | Set when marked hit; null while active |

- **No relationship to Task.** Tasks link to Goals only (existing mechanism). A Milestone never owns or tags tasks — this was an explicit anti-Jira scoping decision.
- The Goal's **nearest upcoming milestone** = the `active` milestone with the soonest target date. **Derived**, not a stored flag.
- A Goal should carry **1–2 upcoming (active) milestones** at a time — a soft rhythm, not an enforced cap.

### Changed entity: Goal (gains health)
The Goal gains a **subjective weekly health**:

| Attribute | Notes |
|---|---|
| health_level | 5-level (worst→best): `Behind` / `Slightly behind` / `On track` / `Ahead` / `Well ahead` |
| progress_answer | Latest triage answer: A lot / Some / Barely / Nothing |
| confidence_answer | Latest triage answer: Yes / Maybe / No |
| health_set_date | The Sunday the current health was set |

Health lives on the **Goal** (not the Milestone): it represents the goal's standing toward its nearest upcoming milestone. When a milestone is hit and the next becomes nearest, the existing health value **carries** until the next Sunday triage re-sets it.

### New entity: GoalHealthRecord (weekly history)
A **snapshot of a Goal's health for a given week**, archived each Sunday alongside the existing `WeekRecord` weekly archive. Enables a trend/consistency view ("Behind → Behind → Slightly behind → On track over 4 weeks").

| Attribute | Notes |
|---|---|
| goal link | The goal this snapshot is for |
| week (Sunday date) | The Sunday of the **week being entered** — i.e. the triage Sunday on which the health was set |
| health_level | The 5-level value set that week |
| progress_answer / confidence_answer | The raw answers given that week |

### Key relationships (new edges)

| From | To | Cardinality | Notes |
|---|---|---|---|
| Goal | Milestone | 1:N | A goal has many milestones over its life; typically 1–2 active at once |
| Goal | GoalHealthRecord | 1:N | One snapshot per goal per week (once health is being tracked) |
| Milestone | Task | — | **None.** Deliberately no relationship. |

### Lifecycle (Milestone)

- `active → hit` — manual mark by the user. On `hit`, the app prompts to create the next milestone (keeps the 1–2-ahead rhythm). `hit` is terminal.
- **Overdue** is a *derived* condition, not a stored state: a milestone is overdue when `status = active` AND `target_date` is in the past. Overdue milestones are surfaced in the **next Sunday triage** (not via a blocking app-open prompt) where the user can mark hit or push the date.
- A milestone may be **edited** (notably to push its target date) while `active`.

### Identity rules (new)

- **Milestone**: internal ID only; no business uniqueness (duplicate titles within a goal allowed — consistent with the v1 relaxed-uniqueness stance for Goals/Habits).
- **GoalHealthRecord**: (goal, week-start-date) is unique — at most one health snapshot per goal per week.

### Cross-Lens Flags Raised
- "Habit hard delete wipes all weekly records" rule → Requirements (negative requirement: must NOT preserve orphaned habit records after deletion)
- "Paused freezes streak, doesn't break it" rule → Requirements (positive rule on streak update at Sunday flip)
- Theme pre-seed defaults → UI (initial-state design for Themes settings screen)

---

## Q&A

- **Q19: Core entities — complete? Theme pre-seed strategy?**
  A: User agreed seven entities feel right. **Asked thoughtful follow-up about AI Coach as entity** — leaning intuitively "no", asked for my thoughts. Confirmed: AI Coach is ephemeral, not an entity. (b) Pre-seed with 3–4 generic themes — accepted.
  **User asked another important follow-up:** "Maybe the goal doesn't need 'archived' or did we define it? Or is archived deleted? Can you delete goals? Or tasks if they are not relevant anymore, or habits?" Triggered a deletion-policy refinement: dropped "archived" as a Goal state (graveyard is just UI grouping for hit/missed/abandoned); defined hard-delete rules per entity with appropriate confirmation copy.

- **Q19-followup: Habit delete — wipe or preserve records?**
  A: Wipe — accepted. Reasoning: orphaned habit records clutter Stats; preserve-everything is for compliance contexts not personal apps.

- **Q20: Relationships, lifecycles, identity, derived/stored?**
  A: All recommendations accepted. (a) Paused freezes streak (doesn't break it) — accepted, with user noting we may have implicitly covered this in UX/Requirements but it wasn't explicit. Now locked in Domain. (b) Nothing in the model contradicts user's intent.
