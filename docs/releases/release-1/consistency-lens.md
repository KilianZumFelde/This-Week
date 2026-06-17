# Consistency Lens

**Last updated**: 2026-06-16
**Release**: 1
**Change**: Goals drive the week — Milestone checkpoints, weekly subjective goal health, a Sunday goal step.

## Documents audited
Release deltas: product-lens, ux-lens, requirements-lens, domain-lens, ui-lens, ui-brief (release-1).
Baselines: product-lens, ux-lens, requirements-lens, domain-lens, ui-brief (/docs).
A second pass on **2026-06-16** reconciled the built Claude Design output (ui-lens, ui-brief, `/docs/ui`) against the deltas — see "design-pass reconciliation" below.

**Global change noted (no doc edit needed):** the dual mic + "+" FAB collapsed into a single "+" FAB (tap = quick-add, hold = voice) app-wide — this already matches the baseline decision (2026-05-24, single FAB); the build just implements it.

Scope of this audit: **mainly the internal coherence of the four release deltas against each other**, then baseline collisions **outside** the behaviors the release intentionally changes. Behaviors the deltas deliberately replace (the passive This-Week goal header; the old derived on-track signal; the loose "milestone"=goal vocabulary) are the release doing its job — they are NOT findings.

## Canonical glossary
The agreed vocabulary downstream work (planning, UI, code) should use:

| Term | Canonical meaning | Notes / rejected usage |
|---|---|---|
| **Goal** | The long-term objective with a target date and primary/secondary type. What tasks/habits link to; what carries health. | The baseline sometimes wrote "milestone" to mean this. After this release, "milestone" never means the goal. |
| **Milestone** | A dated near-term checkpoint belonging to a Goal. Owns no tasks. Drives the *reference point* the user reflects against weekly. | New entity. Distinct from Goal. |
| **Goal health (macro)** | A goal's 5-level *subjective* standing (worst→best: Behind / Slightly behind / On track / Ahead / Well ahead), set weekly from two triage answers. Lives on the Goals tab / Goal Detail. | Not derived from task/habit activity; not computed from the milestone date. Distinct from the this-week cursor. Level names finalized in the build ("At risk" dropped, "Well ahead" added). |
| **This-week on-track cursor (micro)** | An *objective, live* per-goal signal on the This Week view: this week's goal-task completion vs. time elapsed in the week. Moves right on task completion, drifts left as days pass; resets weekly. Shown on Home in a **"Milestones" section**, labeled by the goal's next milestone (milestone-led). | A separate concept from Goal health — same left↔right metaphor, different meaning and home. Do not conflate. |
| **GoalHealthRecord** | The retained weekly snapshot of a goal's health. | Keyed to the Sunday of the week being entered. |
| **Goal step** | The new per-goal segment of the Sunday triage ritual, split into **Reflect → Plan**. | Mandatory-light: Reflect's health answers required; Plan (tasks/AI) optional. |
| **Goal Detail** | The full-screen goal-management surface (Health / Health trend / Milestones + footer Mark-hit/Edit/Delete). | Replaces the removed bottom-sheet Goal Action Drawer. |

## Findings — Must reconcile

| # | Area | The seam | Owning lens | Resolution | Status |
|---|---|---|---|---|---|
| 1 | Quantitative / temporal | The Domain delta introduced `GoalHealthRecord` (weekly snapshot) but did not define which Sunday-week a snapshot is keyed to. Ambiguous between the week just reviewed and the week being entered. | Domain | Key the snapshot to the **week being entered** (the triage Sunday). Health is the goal's standing going into that week and is displayed during it; the retrospective progress answer is input, not a separate key. | Resolved — domain-lens.md `GoalHealthRecord.week` clarified. |

## Findings — Worth a look

| Area | Observation | Status |
|---|---|---|
| Intent ↔ capability | Baseline Sunday recap (Frame 0) keeps a factual line "still working toward [goal] — N tasks done toward it." This is a retrospective *count*, separate from the new subjective *health*; the two coexist (different purpose). | Accepted as-is — no conflict; the recap stat is not the health signal. |
| Ritual ordering | The goal step is mandatory-light and sits after per-task triage, before pull-from-backlog. The blocking boundary now extends through the goal step's health questions. | Accepted as-is — stated consistently in ux-lens + requirements-lens. |

## Findings — design-pass reconciliation (2026-06-16 build)

After the design was built in Claude Design, several deliberate changes were reconciled back into the lenses:

| # | Area | The seam | Owning lens | Resolution | Status |
|---|---|---|---|---|---|
| 2 | Terminology / referential | Baseline `domain-lens.md` had *retired* the standalone Goal Detail screen in favor of the bottom-sheet drawer. The build re-introduces a full-screen **Goal Detail** as the single goal-management surface and **removes the drawer**. | UI/UX (+ baseline note) | **Intentional reversal**, recorded: Goal Detail un-retired and made canonical; bottom-sheet Goal Action Drawer removed (incl. the lingering generic one in the old "Goal lifecycle" canvas section). For baseline fold-back. | Resolved. |
| 3 | Terminology / quantity | Health-level names changed in the build: "At risk" dropped, "Well ahead" added. The Requirements progress×confidence→level mapping referenced the old names. | Requirements (+ Domain/UI/glossary) | Renamed everywhere to **Behind / Slightly behind / On track / Ahead / Well ahead**; mapping table remapped monotonically. | Resolved across all lenses + brief + glossary. |
| 4 | Intent ↔ capability | Brief specified a single goal step + a "+ New task" row; build split it into **Reflect → Plan** and replaced the inline new-task row with the persistent **"+" FAB**. | UX/UI/Requirements | Reflect (milestone line + 2 health Qs + gap-catch) → Plan (task pick + AI; new task via FAB). Propagated. | Resolved. |
| 5 | Intent ↔ capability | Home cursor reframed as **milestone-led** inside a "Milestones" section (parallel to Habits), not a bare goal cursor. | UX/UI/Requirements/Domain | Recorded: cursor labeled by the next milestone but still computed from goal-linked tasks (no task↔milestone link). | Resolved. |

## Resolutions applied
- **domain-lens.md** — `GoalHealthRecord.week` defined as the Sunday of the week being entered (closes finding #1).
- **ux-lens.md** — This Week composition stated plainly, and the **two distinct goal signals separated**: macro Goal health (Goals tab) vs. the micro this-week on-track cursor (This Week view). An earlier pass had conflated them and dropped the this-week cursor; restored here.
- **requirements-lens.md / domain-lens.md / ui-lens.md** — added the this-week on-track cursor as an objective, derived, live per-goal signal (this week's goal-task progress vs. time elapsed in the week), distinct from the subjective health. No new stored entity (derived from existing task data).
- **2026-06-16 design-pass propagation** — across requirements / domain / ux / ui / ui-brief: health-level rename + mapping remap; Goal Detail (full-screen) replacing the removed drawer; goal step split Reflect → Plan; "+ New task" row replaced by the "+" FAB; "why" excerpt removed from Goals cards (now on Goal Detail); milestone-led Home cursor in a "Milestones" section; trend dots gain current-week emphasis + "This week · [level]" callout.

## Deferred / open (pending build — spec'd but not yet in the design)

These are in the lenses/brief but were not produced in the build; they need build tasks (or a follow-up design pass), tracked in the ui-brief "Pending" section:
- **Overdue-milestone variant** (Goals card + triage Reflect): brick-red tone + inline Mark hit / Push date. Overdue handling is a Requirements rule, so it must be built.
- **Goals-card "no milestone" muted state** (only the triage gap-catch was built).
- **This Week variant states** (no active goals → omit "Milestones" section; loading / error).

## Forwarded to UI
- `[FOR UI: Goals tab becomes a live health dashboard — each goal card shows its 5-level health (the left↔right position the user described) for primary AND secondary goals.]`
- `[FOR UI: Milestone affordances on a goal — create (anytime), edit (push date), mark hit (prompts next milestone). Show active milestone + its date; show overdue state.]`
- `[FOR UI: The Sunday triage gains a goal step — per goal: goal + nearest upcoming milestone + the goal's existing tasks to pick this week, bounded AI "anything to add?" suggestion, and the two health questions (progress, confidence).]`
- `[FOR UI: Health trend / consistency view — the retained weekly history surfaced as last-N-weeks health on the goal (Goals or Stats). This was not explicit in the UX pass; the UI brief should give it a home.]`
- `[FOR UI: This Week — the passive primary-goal header is removed and replaced by an active per-goal "this-week on-track cursor" (objective: this week's goal-task progress vs. time elapsed in the week; moves right on completion, drifts left as days pass). Keep it visually lighter/smaller than the Goals-tab health track so the two signals don't read as the same thing.]`
- `[FOR UI: Overdue milestone is handled in the triage goal step (not a blocking app-open prompt).]`
