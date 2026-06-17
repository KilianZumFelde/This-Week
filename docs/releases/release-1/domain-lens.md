# Domain Lens

**Last updated**: 2026-06-15
**Release**: 1
**Change**: Add Milestone as a dated checkpoint on a Goal, and weekly subjective health on a Goal (with retained weekly history). No task↔milestone relationship.

## Core entities

### New: Milestone
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

### Changed: Goal (gains health)
The Goal gains a **subjective weekly health**:

| Attribute | Notes |
|---|---|
| health_level | 5-level (worst→best): `Behind` / `Slightly behind` / `On track` / `Ahead` / `Well ahead` |
| progress_answer | Latest triage answer: A lot / Some / Barely / Nothing |
| confidence_answer | Latest triage answer: Yes / Maybe / No |
| health_set_date | The Sunday the current health was set |

Health lives on the **Goal** (not the Milestone): it represents the goal's standing toward its nearest upcoming milestone. When a milestone is hit and the next becomes nearest, the existing health value **carries** until the next Sunday triage re-sets it.

### New: GoalHealthRecord (weekly history)
A **snapshot of a Goal's health for a given week**, archived each Sunday alongside the existing `WeekRecord` weekly archive. Enables a trend/consistency view ("Behind → Behind → Slightly behind → On track over 4 weeks").

| Attribute | Notes |
|---|---|
| goal link | The goal this snapshot is for |
| week (Sunday date) | The Sunday of the **week being entered** — i.e. the triage Sunday on which the health was set. Health represents the goal's standing *going into* that week and is what's displayed during it. The retrospective progress answer ("how much did you move this week") is input given at that triage, not a separate keying. |
| health_level | The 5-level value set that week |
| progress_answer / confidence_answer | The raw answers given that week |

## Key relationships

| From | To | Cardinality | Notes |
|---|---|---|---|
| Goal | Milestone | 1:N | A goal has many milestones over its life; typically 1–2 active at once |
| Goal | GoalHealthRecord | 1:N | One snapshot per goal per week (once health is being tracked) |
| Milestone | Task | — | **None.** Deliberately no relationship. |

(Existing Goal↔Task and Goal↔Habit links are unchanged.)

## Lifecycle (Milestone)

- `active → hit` — manual mark by the user. On `hit`, the app prompts to create the next milestone (keeps the 1–2-ahead rhythm). `hit` is terminal.
- **Overdue** is a *derived* condition, not a stored state: a milestone is overdue when `status = active` AND `target_date` is in the past. Overdue milestones are surfaced in the **next Sunday triage** (not via a blocking app-open prompt) where the user can mark hit or push the date.
- A milestone may be **edited** (notably to push its target date) while `active`.

## Identity rules

- **Milestone**: internal ID only; no business uniqueness (duplicate titles within a goal allowed — consistent with the v1 relaxed-uniqueness stance for Goals/Habits).
- **GoalHealthRecord**: (goal, week-start-date) is unique — at most one health snapshot per goal per week.

## Derived vs. stored

| State | Derived or stored | Reasoning |
|---|---|---|
| **Goal health_level** | **Stored** on Goal | It is the user's weekly subjective verdict, not computable on the fly. Set weekly, frozen between Sundays. |
| **Health from milestone date** | **Not computed** | Health is `f(progress_answer, confidence_answer)` only. The milestone date is contextual display to help the user answer — never a computational input. |
| **This-week on-track position (micro cursor)** | **Derived** | From this week's goal-linked tasks completed vs. day-of-week elapsed. No new storage — derivable from existing `task.goal_id` + `task.week` + completion + the current date. Presented on Home labeled by the goal's next milestone (milestone-led), but computed from goal-linked tasks since tasks don't link to milestones. Distinct from the stored subjective health. |
| **Nearest upcoming milestone** | **Derived** | Min target date among a goal's `active` milestones. |
| **Milestone overdue** | **Derived** | `active` + target date in the past. |
| **Weekly health snapshot** | **Stored** (GoalHealthRecord) | Retained to support a trend/consistency view; cheap since the user answers weekly anyway. |

## Existing entities to account for
- **Goal** (baseline) — extended with health attributes; lifecycle and cap rules unchanged.
- **WeekRecord** (baseline) — GoalHealthRecord snapshots align to the same Sunday-week archive boundary.
- **Task** (baseline) — unchanged; still links to Goals, never to Milestones.
