# Requirements Lens

**Last updated**: 2026-06-15
**Release**: 1
**Change**: Weekly subjective goal/milestone health (set at Sunday triage), milestone checkpoints on goals, and a bounded AI assist for picking the week's goal tasks.

## Business rules

**Goal/milestone health (the core new rule):**
- Each active goal has a **health** with a 5-level position (worst→best): **Behind · Slightly behind · On track · Ahead · Well ahead**. (Renamed in the build: the earlier draft used "At risk … Ahead"; "At risk" was dropped and "Well ahead" added at the top.)
- Health is **set weekly during the Sunday triage** goal step, from **two subjective questions** asked per goal:
  1. *Progress* — "How much did you move toward [milestone] this week?" → **A lot / Some / Barely / Nothing**
  2. *Confidence* — "Confident you'll hit [milestone] by [date]?" → **Yes / Maybe / No**
- **Health level = `calculateGoalHealth(current, history)`** — computed from the user's two answers for the current week **plus up to 3 prior contiguous weekly answers** (no gaps; a skipped Sunday resets the window). The inputs are always the user's own subjective answers — never task counts or objective cadence — so the signal remains subjective. The milestone's date is shown only as **context** to help the user answer (it is NOT a computational input).

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

- **Health is frozen between Sundays.** It changes only when the user answers the weekly questions — there is no clock-driven or activity-driven drift. (The user explicitly rejected auto-drift: there is no honest objective basis to drift on.) History adjustments are bounded and read from the user's own prior answers; they never apply automatically without an active Sunday submission.
- Health applies to **all active goals** (primary and secondaries alike).

**This-week on-track cursor (the micro signal — distinct from health):**
- Separate from the subjective Goal health. This is an **objective, derived, live** signal shown **on the This Week view**, inside a dedicated **"Milestones" section** (parallel to Habits), one row per active goal — each row **labeled by the goal's next milestone** (the cursor reads as *this week's pace toward that milestone*). Milestone-led: the row shows the next-milestone title + a theme-color dot + the track.
- Position = **this week's completed goal tasks vs. time elapsed in the week.** "Committed goal tasks this week" = tasks where (week = current AND goal = this goal). Tasks link to the goal (not the milestone), so the computation is goal-task-based; the next milestone is the *label/context* that frames it as near-term pace. Expected-by-now scales with the day of the week (e.g., committed 4, it's day 4 of 7 → expected ≈ 2.3 done).
- **Moves right** when the user completes a this-week goal task; **drifts left** as days pass with them incomplete (clock-driven within the week).
- **Resets each week** at the Sunday flip (new week = fresh cursor).
- If a goal has **no tasks committed this week**, the cursor shows a neutral "nothing planned this week" state, not "behind".
- This is the in-week push the user wanted; it is NOT the same as the weekly subjective health and does not feed it.

**Milestone lifecycle:**
- A milestone is a **dated checkpoint belonging to a goal**. A goal should have 1–2 upcoming milestones at a time.
- `active → hit` (manual mark). Marking a milestone **hit** triggers an immediate prompt to **set the next milestone** (keeps the "1–2 ahead" rhythm).
- A milestone may be **edited** (e.g., push its date).
- Health is evaluated against the goal's **nearest upcoming milestone**.
- **Overdue milestone** (target date passes without being marked hit): does **NOT** raise a blocking app-open prompt. It surfaces in the **next Sunday triage** goal step ("[milestone] was due — did you hit it, or push the date?"). Rationale: the existing overdue-*goal* prompt already blocks at app-open; a second one would over-nag, and a milestone is a lower-stakes private checkpoint.

**Sunday ritual goal step (two sub-steps per goal: Reflect → Plan):**
- Runs once per active goal, inserted after per-task triage and before pull-from-backlog. **Split into Reflect → Plan** (one crammed screen was too much; the split matches a reflect-then-plan rhythm).
  - **Reflect** — shows the goal's next-milestone line and asks the **two health questions** (mandatory-light: must answer, cannot skip). The **gap-catch** (no active milestone) lives here — you can't rate progress toward a milestone that doesn't exist, so Reflect prompts you to add one first.
  - **Plan** — pick existing goal tasks into the week and/or accept AI-suggested additions (all optional). Creating a brand-new task on the spot is done via the persistent **"+" FAB** (tap = new task pre-linked to this goal and defaulted to this week; hold = dictate) — there is no separate "+ New task" row.
- Only the Reflect health questions are mandatory; all Plan/task actions are optional.

**Bounded AI assist (goal step):**
- AI may suggest **additional** tasks only *after* the user has reviewed the goal's own existing tasks, and may ask a couple of clarifying questions ("anything missing?").
- AI **never auto-creates** tasks, **never is the primary source** of the plan, and every AI suggestion requires the user's explicit **confirmation tap** (inherits the existing "never auto-save voice captures" rule).

## Validation rules

- **Milestone target date**: required; must be in the future; must be **on or before the parent goal's target date** (a milestone cannot fall after the goal it serves).
- **Health answers**: both questions required to set/confirm a goal's health during triage (mandatory-light).

## Triggers / events

| Trigger | Effect |
|---|---|
| Sunday ritual reaches the goal step | For each active goal: **Reflect** (next-milestone line + two mandatory health questions; gap-catch if no milestone) → **Plan** (optional task pick + AI suggestions; new task via the "+" FAB) |
| Goal has no active milestone at triage | Gap-catch: prompt to create a milestone before proceeding for that goal |
| User marks a milestone **hit** | Milestone → `hit`; immediate prompt to set the next milestone |
| Milestone target date passes without being hit | Surfaced in the **next** Sunday triage goal step (not a blocking app-open prompt) |
| User answers the two health questions | Goal's health level is (re)set per the mapping; frozen until next Sunday |

## Definition of done

- A goal shows a 5-level health in the Goals view, set by the user's two triage answers, and unchanged between Sundays.
- The Sunday ritual includes a goal step that forces a health answer per active goal and offers optional this-week task selection toward the goal.
- Milestones can be created (anytime / at hit / triage gap-catch), edited, and marked hit, with date validation against the parent goal.

## Explicit exclusions (new this release)

- Must **not** compute health objectively (no tasks-per-week cadence, no task counting) — difficulty varies too much; an objective formula would "become Jira."
- Must **not** assign tasks to milestones (no task↔milestone relationship); tasks link to goals only.
- Must **not** drift health automatically between Sundays (no clock-driven or activity-driven change).
- AI must **not** generate the goal's plan unprompted or auto-create tasks; it assists only after the user reviews their own tasks and always requires confirmation.
- Must **not** hard-cap the number of milestones ("1–2 ahead" is a soft rhythm, not an enforced limit).
- Must **not** add a blocking app-open prompt for overdue milestones (triage surfacing only).
