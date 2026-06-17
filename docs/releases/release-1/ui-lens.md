# UI Lens

**Last updated**: 2026-06-15
**Release**: 1
**Change**: Goals become a live health dashboard with milestones; This Week drops the passive goal hero; the Sunday triage gains a goal step. Visual system (vibe, palette, typography, density, component style) is unchanged — this release only adds/changes screens.

## Navigation
Unchanged 4-tab bottom bar (This Week / Backlog / Goals / Stats). Note: the **This Week goal hero is removed** (see below) — no navigation change, just a content change on the home screen. Milestone management is reached through the full-screen **Goal Detail** (which replaces the old bottom-sheet Goal Action Drawer).

## Screen inventory (new / changed this release)

| Screen | Status |
|---|---|
| This Week (home) | **Changed** — passive goal hero removed; replaced by a "Milestones" section of milestone-led this-week cursors |
| Goals tab | **Changed** — passive list → live health dashboard with milestone info |
| Goal Detail (full-screen) | **New/Changed** — replaces the bottom-sheet Goal Action Drawer; sections Health / Health trend / Milestones + footer actions |
| Add/Edit Milestone sheet | **New** |
| Carry-Over Triage | **Changed** — gains a per-goal "goal step", split Reflect → Plan |
| Set-next-milestone prompt | **New** (small confirm sheet on marking a milestone hit) |

Reused patterns: the **8-week dot row** from Habit Detail (for health trend), the **bottom-sheet quick-edit** pattern (for the milestone sheet), and the existing date-chip pattern from Add Goal (re-tuned to near-term presets).

## Per-screen details

### This Week (home) — changed
- **Purpose**: unchanged day-to-day landing view.
- **Change**: the **passive primary-goal hero card is removed** and **replaced by a "Milestones" section** (a muted section header parallel to Habits) containing the **milestone-led this-week cursors** — one row per active goal, each showing the goal's **next milestone title + a theme-color dot + the track**. The cursor reads as *this week's pace toward the next milestone*; it **moves right as the user checks off this week's goal tasks and drifts left as the week's days pass**. (Computed from goal-linked tasks — tasks don't link to milestones — the milestone is the label.) Section order: Milestones cursors → Habits → priority-sorted Tasks → collapsed Done.
- **Distinct from Goal health**: this cursor is the *objective, in-week* signal (this week's goal-task progress vs. time elapsed in the week). It is NOT the subjective macro health (which lives only on the Goals tab). They look related (both left↔right tracks) but mean different things — keep the this-week cursor visually lighter/smaller so it reads as "this week," not "overall."
- **Layout note**: with ~2 active goals there may be up to 2 compact cursors stacked; keep them minimal so This Week stays calm.
- **Dynamic content**: per active goal with this-week tasks — `count(done this-week goal tasks)` vs. expected-by-now (day-of-week scaled); recomputed live on task completion and on day change.
- **Variant states**:
  - **Goal with no tasks this week**: cursor shows a neutral "nothing planned" state, not "behind".
  - **No active goals**: no cursor; This Week opens straight into Habits.
  - The former "milestone card shows alone" empty state is retired.

### Goals tab — changed (now a health dashboard)
- **Purpose**: from a passive list to the place the user reads how each goal is *doing*.
- **Layout hierarchy**:
  1. **Primary section** — the primary goal card, now showing: eyebrow (`theme · by Mon Year`), title, the **health track** (horizontal left↔right marker, see below), and the **nearest upcoming milestone** (title + date, e.g. "Next: demo set cut · by Jun 28"). The "why" excerpt is **removed from the card** (it now appears only on Goal Detail). Existing tasks-this-week / habits-linked counts may remain as secondary text.
  2. **Secondaries section** — up to 2 secondary goal cards, each carrying its own **health track** and nearest-milestone line. Health applies to secondaries too (not just primary).
  3. **Add directly** button (unchanged; the dropped "Coach me" placeholder is out of scope to touch here).
  4. **Graveyard** (collapsed, unchanged).
- **Health track element**: a horizontal track with a marker sliding **left↔right** — brick-red (Behind, far left) → neutral mid → sage/gold (Well ahead, far right), using the existing palette. Represents the 5 levels (worst→best: Behind / Slightly behind / On track / Ahead / Well ahead). This is the "drifting left" signal the user described.
- **Dynamic content**: each active Goal + its current `health_level`, its nearest upcoming Milestone (min target date among active), and existing counts.
- **Variant states**:
  - **Goal with no milestone**: health track shows a muted "Set a milestone to track this" state instead of a marker (no health until a milestone exists).
  - **Overdue milestone**: the nearest-milestone line shows a quiet "overdue" tone (resolved in triage, not here).
  - Empty primary/secondary, loading, error — as today.

### Goal Detail (full-screen) — new (replaces the Goal Action Drawer)
- **Purpose**: tap any goal card → full-screen **Goal Detail**, the single goal-management surface. Replaces the old bottom-sheet Goal Action Drawer (now removed). Promoted to full-screen because the drawer was too dense and "adding/editing a milestone is editing the goal" needed room.
- **Layout hierarchy** — three clearly separated sections + a footer:
  1. **Health** — the goal's current `health_level` as the large labeled health track, with a plain-words "This week · [level]" callout.
  2. **Health trend** — the **8-week dot row** (reused from Habit Detail), colored by each week's `health_level`. The **current week is emphasized** (taller, full-strength bar + a "now ↑" marker) plus the "This week · [level]" callout, because raw colored bars weren't self-explanatory.
  3. **Milestones** — the goal's `active` milestone(s) as rows (title + date + a **Mark hit** action each), plus a **"+ Add milestone"** row. (No "next up / due in ~2 weeks" subtext and no "N ahead" count — rows are title + date + Mark hit only.)
  4. **Footer actions** — **Mark goal as hit / Edit / Delete**. "Edit" edits the goal's own fields only (title / target date / why); milestone management stays in the Milestones section.
- **Dynamic content**: the goal's `health_level` (Health); its last-N `GoalHealthRecord`s (trend); its `active` Milestones (list).
- **Variant states**: no milestones → Milestones section shows just "+ Add milestone"; no health history yet → trend shows muted placeholder dots; graveyard goal → Reactivate-only variant (no milestone management).

### Add/Edit Milestone sheet — new
- **Purpose**: create or edit a milestone. Lightweight — title + date only.
- **Layout hierarchy**:
  1. Title field (single line).
  2. **Target date** — **near-term quick-select chips**: *1 week / 2 weeks / 1 month / 6 weeks*. Resolved date shown below the chips. (Tighter presets than Add Goal's 1mo–1yr, since milestones are near-term.)
  3. Cancel / Save. Save disabled until title + date set.
- **Entry points**: Goal Detail's Milestones section ("+ Add milestone"); the set-next-milestone prompt; the Sunday triage Reflect gap-catch. Same sheet, opened pre-filled in Edit mode when editing (e.g. pushing the date).
- **Validation states**: date must be in the future and on/before the parent goal's target date — invalid selection shows an inline hint ("Must be on or before the goal's date").
- **Component style**: bottom sheet (not full-screen), consistent with Task/Habit detail sheets. No AI involvement — the user types the milestone.

### Carry-Over Triage — changed (gains the goal step)
- **Purpose**: existing Sunday ritual — recap → per-task triage → [NEW goal step] → optional pull-from-backlog → start week.
- **New goal step** (inserted after per-task triage, before pull-from-backlog), iterated once per active goal, **split into two sub-screens: Reflect → Plan**:
  - **Reflect**:
    1. **Goal header + next-milestone line** — goal title + its nearest upcoming milestone (title + date, e.g. "due in ~2 weeks"). If **overdue**, surface inline "[milestone] was due — Mark hit / Push date".
    2. **Two health questions** (mandatory — can't skip):
       - *Progress*: "How much did you move toward [milestone] this week?" → A lot / Some / Barely / Nothing
       - *Confidence*: "Confident you'll hit [milestone] by [date]?" → Yes / Maybe / No
       These set the goal's `health_level` (worst→best: Behind / Slightly behind / On track / Ahead / Well ahead) for the entered week.
    3. **Gap-catch lives here**: if the goal has no active milestone, Reflect prompts to add one (opens the Add/Edit Milestone sheet) before the user can rate progress.
  - **Plan**:
    4. **This week's tasks toward the goal** — a list of the goal's existing open/backlog tasks, each tap-to-add to this week (reusing the pull-from-backlog tap-to-add interaction). Optional.
    5. **Bounded AI assist** — a calm "Anything to add?" affordance offers AI-suggested *additional* tasks (each requiring a confirm tap). Never auto-creates; never the primary source.
    6. **New task** is created via the persistent **"+" FAB** (tap = new task pre-linked to this goal + defaulted to this week; hold = dictate) — there is no separate "+ New task" row.
- **Blocking behavior**: only the Reflect health questions are required to proceed; all Plan actions are optional and non-blocking (like pull-from-backlog).
- **Dynamic content**: per active Goal — nearest Milestone, the goal's open tasks, AI suggestions; writes a GoalHealthRecord for the entered week.
- **Variant states**:
  - **No active goals**: the goal step is skipped entirely.
  - **Goal with no milestone**: Reflect shows the gap-catch first.
  - **Overdue milestone**: inline mark-hit / push-date in Reflect.

### Set-next-milestone prompt — new
- **Purpose**: when the user marks a milestone **hit** (from the drawer or the triage step), a small confirm sheet appears: "Nice — [milestone] done. Set the next one?" with **Add next milestone** (opens the Add/Edit Milestone sheet) and **Not now**.
- **Rationale**: keeps the "always 1–2 milestones ahead" rhythm without nagging — the user can decline and add later.
- **Component style**: small bottom sheet, calm, no celebration animation (consistent with the anti-Duolingo ethos).
- **Variant states**: "Not now" dismisses; the goal then shows the no-/next-milestone state until one is added.
