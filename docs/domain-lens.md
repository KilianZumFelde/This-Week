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
| **Task** | A discrete one-shot action. May or may not link to a goal. | title, theme link, effort, return, week assignment (this-week / backlog), optional goal link, optional reminder spec(s), status |
| **Habit** | A recurring weekly action with a count target. Doesn't link to a specific week — perpetually active until paused/archived. | title, theme link, weekly count target, optional goal link, status, current streak, best-ever streak |
| **HabitWeekRecord** | The record of a habit's count for a specific week. One per habit per active week. Archives at Sunday flip. | habit link, week (Sunday date), count achieved, target at the time |
| **WeekRecord** | The container for a completed week's archive — references the tasks done that week + the HabitWeekRecords. Browseable in Stats. | week start date (Sunday), tasks completed this week (refs), habit results (refs) |
| **Reminder** | A scheduled notification attached to a task. | task link, schedule spec (one-shot time / recurring pattern), status |

**Non-entities (explicitly):**
- **AI Coach sessions** — ephemeral. No transcripts saved. Output is the resulting Goal(s); the conversation is process, not data. (Can be revisited as a feature later if needed.)

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
- Abandoning a goal (or it becoming hit/missed) **unlinks its tasks/habits** (goal link cleared, theme link remains) — keeps "tasks toward this goal" surfaces clean.
- Graveyard goals are visible in the Goals tab — Graveyard section. Tapping one opens the drawer with **only "Edit"** (reactivate by setting a future date → back to `active`, subject to the 1+2 cap). Mark-as-hit/Delete do not apply to already-terminal goals.
- **CRUD surface (resolved 2026-05-15):** Goal Update & lifecycle transitions are hosted by (a) a small **goal action drawer** (tap any goal card → title + Mark as hit / Delete / Edit) and (b) the **dual-mode Add/Edit Goal screen** (Edit opens it pre-filled — title/why/date/theme + promote↔demote via the Primary/Secondary radio, cap enforced on save). This retires the previously-deferred standalone Goal Detail screen.

**Reminder:**
- `pending → fired` (one-shot) or `pending → fired-cycle (repeats) → cancelled` (when task is done or user cancels).
- Reminders cascade: if a task is hard-deleted, all its reminders are cancelled.
- Reminders persist across Sunday flips.

### Identity Rules

| Entity | Uniqueness |
|---|---|
| Theme | Name unique per user (case-insensitive) — "DJ Career" = "dj career" |
| Goal | (title, theme) together must be unique — prevents accidental duplicates within a theme |
| Task | No business uniqueness — multiple tasks with same title are allowed. Internal ID only. |
| Habit | (title, theme) together must be unique — no two "Gym" habits in the Fitness theme |
| HabitWeekRecord | (habit, week-start-date) is the unique key — exactly one record per habit per week |
| WeekRecord | week-start-date is unique — exactly one per Sunday |
| Reminder | Internal ID only |

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

### Existing Entities to Account For
None — this is a new system, no legacy entities.

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
