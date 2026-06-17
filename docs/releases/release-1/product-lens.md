# Product Lens

**Last updated**: 2026-06-15
**Release**: 1
**Change**: Make goals actually drive the week — give each goal an expected trajectory so the app can show a weekly on-track signal (a gradient: how far behind / on track / ahead) and provide guidance for what to do or add toward the goal at week-start. End the "passive goal sitting in a tab" problem.

## Problem

The shipped goal layer is **passive dead weight**. A goal exists in the Goals tab with a target date and some optionally-linked tasks/habits, but it does no work for the user. The user's words: *"This passive 'there is a goal somewhere here' is simply no use at all."*

The root cause is that **a goal has no expected trajectory** — no sense of "by now I should have done roughly X toward this." With nothing to be on-track *against*:

1. **Mid-stream blindness:** the user cannot sense, within a week, whether they are working toward the goal and how on track they are. Off-track is only noticed months later. (Baseline framed this as "drifting — months pass without progress.")
2. **Week-start paralysis:** when a new week begins, facing the pile of existing tasks (or a blank slate), the user has no guidance for *which* tasks to do or *what* to create next toward the goal. *"I don't have any guidance of anything."*

The user accepts that defining what a goal needs is itself hard — so the fix cannot be a manual planning chore (that would rebuild the "Jira" the product explicitly rejects). The yardstick has to be lightweight to create.

The operative felt quality the user is chasing is **consistency** — sensing whether they are consistently moving the goal forward.

## Success looks like

This release's success is felt at the **weekly** timescale (tighter than the baseline's quarter-level criteria):

- **Within a week or two**, the user can sense whether they are working toward the goal and **how far behind / on track / ahead** they are. The signal is a **gradient, not binary**. The user's example: "I have 4 tasks planned for a goal this week — if I did none I'm very behind; if I did 3/4 I'm still behind, but not as much." Off-track is caught early instead of three months later.
- **At week planning**, the user has a good feeling of what to add or do to keep progressing toward the goal — week-start is no longer a blank-page decision.
- The user senses **consistency** toward the goal rather than sporadic, untracked effort.

User confirmation: *"Success is that. I can sense inside of a week if I'm behind, if I'm on track... when I plan a next week, I have a good feeling of what I should add or do to continue with my goal."* Plus the gradient refinement above.

## Scope boundaries for this release

**In scope:**
- The on-track signal + week-start guidance applies to **all active goals** (primary and secondary alike). The user runs ~2 goals at a time and considers a passive secondary goal useless — secondaries are included from day one, not deferred.
- The yardstick mechanism combines **milestone-style checkpoints and a pace/consistency notion** ("something about milestones, and also the pace thing — both"). The signal is measured as a gradient against a weekly intended amount of goal-directed work. Exact mechanism deferred to Domain/UX/Requirements.
- Guidance is **suggestive**: the app proposes what to do/add; the user accepts, edits, or ignores. No autonomous task creation (consistent with the standing "no autonomous AI actions without confirmation" rule).

**Out of scope (deferred):**
- Multi-step Gantt charts, task dependencies, or sub-milestone hierarchies — explicitly rejected: *"I definitely don't want any multi-step Gantt dependency sub thingies planning."*
- Automatic re-forecasting / shifting of goal target dates.
