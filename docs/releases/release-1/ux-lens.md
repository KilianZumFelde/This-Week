# UX Lens

**Last updated**: 2026-06-15
**Release**: 1
**Change**: Make goals drive the week — weekly goal/milestone health (subjective, set at Sunday triage) + a goal step in the Sunday ritual that helps the user pick this week's tasks toward each goal.

## Primary journey (additions to the existing Sunday ritual)

The existing Sunday ritual is unchanged in spine: **wins recap → per-task triage → optional pull-from-backlog → "new week" celebration → This Week.** This release inserts a new **goal step** after per-task triage and before pull-from-backlog.

**Goal step (new), runs once per active goal (primary and secondaries alike). Split into two sub-steps — Reflect → Plan** (one screen was too crammed; the split matches a reflect-then-plan rhythm):

*Reflect:*
1. Show the goal and its **next milestone** (a dated checkpoint, e.g. "due in ~2 weeks").
2. The user answers the **two health questions** that set the goal's **health** for the coming week. This is the mandatory part of the step.
3. **Gap-catch lives here:** if the goal has no active milestone, Reflect prompts the user to set one first — you can't rate progress toward a milestone that doesn't exist.

*Plan:*
4. Show the goal's **existing open/backlog tasks** (these link to the goal via the existing task→goal link — there is no task→milestone assignment); tap to pull into this week.
5. **AI plays a bounded supporting role**: after the user has looked at their own tasks, AI may suggest *additional* tasks. Never the primary source; never auto-creates — *"when it's AI and it's just 'hey just do it,' it doesn't work."*
6. **Creating a brand-new task** is done via the persistent **"+" FAB** (tap = new task pre-linked to this goal and defaulted to this week; hold = dictate) — no separate "+ New task" row.

**Mandatory-light:** only the Reflect health questions are required (cannot skip), because skipping the goal is exactly how goals became dead weight. All Plan actions are optional (consistent with the already-non-blocking pull-from-backlog step).

## Entry points

- **Goals view** — each goal card now carries its current **health** (set last Sunday). The Goals tab becomes the "how are my goals doing" dashboard rather than a passive list. This is where overall goal/milestone health is seen day-to-day.
- **Sunday triage** — the goal step where health is set and this week's goal tasks are chosen.
- **Goal Detail (full-screen)** — tapping a goal card opens a full-screen **Goal Detail** (this replaces the old bottom-sheet Goal Action Drawer, which is removed). Sections: Health / Health trend / Milestones, with Mark-as-hit / Edit / Delete in the footer. "Edit" edits the goal's own fields (title / target date / why) only; milestones are managed in their own section here.
- **Milestone creation** is reachable three ways: (a) anytime from **Goal Detail**'s Milestones section; (b) automatically prompted when the user marks a milestone **hit** (set the next one — keeps the "always 1–2 milestones ahead" rhythm); (c) the triage **Reflect** gap-catch when a goal has no active milestone.

## Prerequisites

- For the goal step to be meaningful, a goal should have an **upcoming milestone**. A goal with no milestone triggers the triage gap-catch prompt. Goals can still exist without one; the health/guidance value just kicks in once a milestone is set.

## User expectations at key moments

- **Health is a weekly verdict, not a live meter.** It is set by the user's triage answers and **stays frozen until the next Sunday** — it does not drift on its own between check-ins. (The user explicitly rejected clock/auto drift: "based on what will we drift" — there's no honest basis, so health only changes when the user answers the weekly questions.)
- **Health is subjective by design.** No objective tasks-per-week cadence, no task counting — difficulty varies too much and an objective formula would "become Jira." The weekly questions are the sole input.
- **Marking a milestone hit** → immediate prompt to set the next milestone.
- **Two distinct goal signals — do NOT conflate them:**
  - **Goal health (macro)** — the overall *subjective* standing toward a goal, set weekly by the two triage questions. Lives on the **Goals tab** + triage. Deliberately **not** on the This Week view ("the week is about the week" refers to *this* signal).
  - **This-week on-track cursor (micro)** — appears **on the This Week view**, inside a dedicated **"Milestones" section** (parallel to Habits): one row per active goal, **labeled by the goal's next milestone** (next-milestone title + theme-color dot + track), so it reads as *this week's pace toward the next milestone*. It **moves right** as the user checks off this week's goal tasks, and **drifts left** as the days of the week pass with them untouched (clock-driven *within* the week; resets each week). Objective and live. (Still computed from goal-linked tasks — tasks don't link to milestones — the milestone is the label.)
- **The passive baseline goal header is removed**, but the This Week view is NOT goal-free: the *active* milestone-led this-week cursors replace the old *passive* one-line label. This Week shows: a **"Milestones" section** (the milestone-led cursors, one per active goal), the Habits section, this week's tasks, and the Done section. The goal's *overall* home remains the Goals tab + Sunday triage.

## Success moment

- **Per Sunday:** the user leaves triage with (a) an honest, just-set read of each goal's health, and (b) a clear set of this week's tasks toward each goal — week-start is no longer a blank-page decision.
- **Day-to-day:** opening the Goals view, the user can see at a glance whether each goal is healthy or slipping — the passive "there's a goal somewhere" problem is gone.

## Edge journeys

- **Goal with no active milestone:** the Sunday goal step prompts the user to create one before continuing that goal's step (gap-catch). Outside the ritual, a milestone-less goal simply shows no health until one is set.
- **Milestone hit mid-rhythm:** marking hit prompts the next milestone so the user stays 1–2 ahead; the user may decline and set it later ad hoc.
