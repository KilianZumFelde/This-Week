# Navigation Map — To do App

Every tap-target → destination, organized by source screen. This is the single source of truth for navigation; the JSX files describe layout and demo state but don't wire actual routing.

**Conventions:**

- "→ X" means tapping the element navigates to screen X (push)
- "↓ X" means it opens X as a bottom sheet over the current screen
- "⤴ X" means it opens X as a full-screen modal (slides up from bottom)
- "× back" means it dismisses the current modal/sheet and returns to the caller
- Screen numbers refer to the artboard labels on the design canvas

---

## 01 · This Week (`ThisWeek`) — near-term, milestone-led

The passive milestone hero is gone. The screen now opens with a muted **"Milestones"** section (parallel to Habits): one compact **cursor row per active goal** showing the goal's next-milestone title + theme dot + the light unlabeled **track** (this week's pace toward that milestone). Long-term goal health lives on the Goals tab, not here.

| Element | Tap target | Destination |
|---|---|---|
| Settings gear (top-right) | gear icon | ⤴ Settings (full-screen) |
| Milestone cursor row | the row | → 03 · Goals, deep-linked to that goal → 07 · Goal detail |
| Habit card · **progress ring** | the ring only | inline increment (count +1, no nav) |
| Habit card · **text area** (name + theme) | the body | ↓ 21 · Habit detail |
| Task card · **circle** | the circle only | inline toggle done (no nav) |
| Task card · **title body** | the body | ↓ 20 · Task detail |
| Sort toggle | segmented control | inline re-sort (no nav) |
| Done section header | the row | inline expand/collapse |
| Tab bar · Backlog | tab button | → 02 · Backlog |
| Tab bar · Goals | tab button | → 03 · Goals |
| Tab bar · Stats | tab button | → 04 · Stats |
| **FAB (single terracotta button)** · tap | the FAB | ⤴ 06 · Quick-add draft (empty fields, default-week derived from active tab) |
| **FAB (single terracotta button)** · long-press (~300ms) | the FAB | ⤴ 05 · Voice listening |

**First-launch variant (`ThisWeekEmpty`):**

| Element | Destination |
|---|---|
| "Set my first goal with Coach" | ⚠ **No-op in v1** (known bug — see TASKS.md). Visual placeholder only. |
| "Add a task" | ⚠ **No-op in v1** (known bug — see TASKS.md). Visual placeholder only. |
| FAB (tap or long-press) | works as elsewhere — the actual entry point for first-run users. |

---

## 02 · Backlog (`Backlog`)

| Element | Destination |
|---|---|
| Settings gear | ⤴ Settings |
| Sort toggle | inline re-sort |
| Theme group header | inline expand/collapse |
| Task card · circle | "Pull to this week" (promote task to current week; Undo snackbar) |
| Task card · body | ↓ 20 · Task detail (same sheet as on This Week) |
| Tab bar tabs | → corresponding tab |
| FAB · tap | ⤴ 06 · Quick-add draft (empty, defaults to Backlog when added from this tab) |
| FAB · long-press | ⤴ 05 · Voice listening *(item lands in Backlog when added from this tab)* |

**Empty variant (19 · `BacklogEmpty`):** Same nav, just no task cards.

---

## 03 · Goals (`Goals`) — long-term health dashboard

Each goal card shows: eyebrow (`theme · by Mon Year`), serif title, the large labeled **goal-health track** (5-level: Behind / Slightly behind / On track / Ahead / Well ahead), a **nearest-milestone line** ("Next: … · by …"), and quiet tasks/habits counts. The "why" excerpt is NOT shown here (moved to Goal detail).

| Element | Destination |
|---|---|
| Settings gear | ⤴ Settings |
| Primary goal card | → 07 · Goal detail (full-page) |
| Secondary goal card | → 07 · Goal detail (full-page) |
| "Add directly" button | ⤴ 12 · New goal · empty form |
| "Coach me" button | ⚠ **Non-functional placeholder in v1** — AI Coach feature was dropped (2026-05-24). Button has no onPress. May be removed in a code cleanup pass. |
| Past goals header | inline expand/collapse |
| Past goal row | → 07 · Goal detail (graveyard mode — Reactivate / read-only) |
| Tab bar tabs | → corresponding tab |
| FAB · tap / long-press | as elsewhere (no Backlog-default scope on the Goals tab) |

---

## 04 · Stats (`Stats`)

| Element | Destination |
|---|---|
| Settings gear | ⤴ Settings |
| Top summary band | (no nav) |
| Habit streak row | (no nav in v1 — row is display-only; tap-to-open Habit detail is deferred) |
| Past-week row | (no nav in v1 — rows are display-only; tap-to-expand is deferred) |
| Tab bar tabs | → corresponding tab |
| FAB · tap / long-press | as elsewhere |

---

## 05 · Voice listening (`VoiceListening`)

Full-screen overlay. No tab bar.

| Element | Destination |
|---|---|
| Cancel (X icon, bottom-left) | × back to caller |
| Confirm (check, bottom-right) | → 06 · Quick-add draft (pre-filled with AI-parsed values) |
| Tap-outside / pull-down | × back to caller |

---

## 06 · Quick-add draft (`QuickAddDraft` / `QuickAddDraftInline` / `QuickAddHabitInline`)

Full-screen modal. No tab bar.

| Element | Destination |
|---|---|
| Close (X, top-left) | × back to caller (changes discarded; show Undo if voice-captured) |
| Type pill (Task / Habit) | inline flip type |
| Title field | inline edit |
| Field chip (Theme / Effort / Return / Week / Goal / Reminder) | **06**: ↓ small per-field sheet · **06b/06c**: inline expand picker (no nav) |
| Cancel | × back to caller |
| **Save · next** | next draft in queue (multi-item voice utterance) OR × back to caller if last |
| Save all (only on multi-item) | bulk save → × back to caller |

---

## 07 · Goal detail (`GoalDetail`) — full-page goal-management surface

**Reached by:** tapping any goal card on the Goals tab (or a milestone cursor row on This Week, which deep-links here). **Replaces the old bottom-sheet Goal Action Drawer**, which was retired this release — managing a goal and its milestones needed more room than a sheet allowed.

> **Baseline-reversal note (for `domain-lens.md`):** the baseline had *retired* the standalone Goal Detail page in favor of the drawer. Release 1 **un-retires it** and makes it canonical; the drawer is removed. Record this as an intentional change.

Full-screen modal. Sections, top→bottom: hero (eyebrow + title + optional "why"), **Goal health** (large labeled track), **Health trend · 8 weeks** (one bar per week colored by that week's level; current week emphasized + named in words), **Milestones** (rows of title + date + "Mark hit", then "+ Add milestone"). Footer holds the goal-level actions.

| Element | Destination |
|---|---|
| Close (X, top-left) | × back to Goals |
| Edit (top-right) | ⤴ 12 · New / Edit goal (pre-filled — edits the goal's own fields only) |
| Milestone row · "Mark hit" | mark milestone hit → ↓ 09 · Set-next-milestone prompt |
| "+ Add milestone" | ↓ 08 · Add milestone sheet |
| "Mark goal as hit" (footer) | mark goal `completed` → × back to Goals; goal moves to graveyard |
| "Delete" (footer) | mark goal `archived` → × back to Goals; goal moves to graveyard |

**Graveyard mode:** opened from a past-goal row. Health/trend/milestone editing is read-only; the only action is **Reactivate** → ⤴ 12 · New / Edit goal (pre-filled; subject to the 1+2 cap on save).

---

## 08 · Add / Edit milestone (`MilestoneSheet`)

Bottom sheet. Reached from Goal detail's "+ Add milestone" (empty), a milestone row's edit affordance (pre-filled, screen **08b**), the Set-next-milestone prompt, and the Sunday goal-step gap-catch. Deliberately lightweight — title + date only.

| Element | Destination |
|---|---|
| Title field | inline edit |
| Date quick-chip (1 week / 2 weeks / 1 month / 6 weeks) | inline pick; resolved date shows in a pill below |
| Cancel | × back to caller |
| Save | validate (title + date set, date ≤ goal's target date) → save → × back to caller. Disabled until valid. |

---

## 09 · Set-next-milestone prompt (`SetNextMilestone`)

Small bottom sheet. Fires right after a milestone is marked **hit** (from Goal detail or the Sunday goal-step overdue action) — keeps the "always 1–2 milestones ahead" rhythm. No celebration animation.

| Element | Destination |
|---|---|
| "Add next milestone" | ↓ 08 · Add milestone sheet |
| "Not now" | × dismiss; goal shows its no-/next-milestone state until one is added |

---

## 10 / 11 · Coach screens (`CoachEntry` / `CoachSummary`)

> **Scope flag:** `NAVIGATION.md` previously recorded the AI Coach as *dropped from v1 scope (2026-05-24)*. These screens still exist in the **design canvas** as a designed-but-not-shipped flow. Decide whether v1 ships them; if not, the Goals "Coach me" button stays a placeholder. Kept here for design completeness only.

Advisory chat that, on conclusion, hands off to the Add Goal form pre-filled via "Create this goal". Never creates a goal inline.

| Element | Destination |
|---|---|
| Close (X, top-left) | × back to caller |
| Input field / mic | inline chat (text or dictation) |
| Restart | inline reset of the thread |
| "Create this goal" (summary screen only) | ⤴ 13 · New goal · from Coach (pre-filled) |

---

## 12 · New / Edit goal (`AddGoalForm`)

Full-screen modal. Reached from Goals tab "Add directly" (empty fields, screen 12), Goal detail's "Edit"/"Reactivate" (pre-filled), or the Coach summary's "Create this goal" (pre-filled, screen 13).

| Element | Destination |
|---|---|
| Close (X, top-left) | × back to caller |
| Title input | inline edit |
| Target date quick-chip | inline pick (1mo / 2mo / 3mo / 6mo / 1y). **No Custom chip, no native date picker in v1.** |
| Type radio (Primary / Secondary) | inline pick |
| Theme dropdown | inline expand/collapse (manual pick; no AI suggestion in v1) |
| Why textarea | inline edit |
| Save (top-right + bottom) | validate → save → × back to caller · **if 1+2 cap exceeded** → backend returns HTTP 400, form shows generic error; user must abandon an existing goal manually and retry. **No demote/archive/cancel modal in v1.** |
| Cancel | × back to caller |

---

## 14 · Carry-over recap (`CarryRecap`)

Full-screen blocking modal — appears on first app open after week flip. **No close X.** Persists every app open until fully triaged.

| Element | Destination |
|---|---|
| Review leftovers → | → 15 · Triage (or → 16 · Goal step if no leftovers) |

## 15 · Carry-over triage (`CarryTriage`)

Full-screen blocking modal. **No skip, no dismiss, no X.**

| Element | Destination |
|---|---|
| Keep for this week | task → status `open, week=current`; advance to next leftover (or → 16 if last) |
| Send to backlog | task → status `open, week=backlog`; advance |
| Drop | task → deleted; Undo snackbar; advance |

## 16 · Per-goal step — Reflect → Plan (`CarryGoalReflect` / `CarryGoalPlan`)

Inserted after per-task triage, before pull-from-backlog. Iterates **once per active goal** ("goal 1 of N"). Two sub-steps each:

**16 · Reflect (`CarryGoalReflect`)** — look back. Milestone line + two **mandatory** health questions (Progress: A lot/Some/Barely/Nothing · Confidence: Yes/Maybe/No). "Plan this week →" is disabled until both are answered. On advance, writes the week's `GoalHealthRecord` and sets the goal's `health_level`.

**16c · Reflect · gap-catch** — variant when the goal has **no milestone**: can't rate progress, so it shows "Add milestone" (↓ 08) instead of the questions before proceeding.

**16b · Plan (`CarryGoalPlan`)** — look forward. Tap-to-add the goal's open tasks to this week (optional) + "Anything to add?" AI assist. **New tasks are added via the persistent + FAB** (tap = new task pre-linked to this goal; long-press = dictate) — there is no separate "New task" row. "Next goal" → next goal's Reflect, or → 17 · Pull on the last goal.

> **Overdue-milestone variant (spec, not yet in canvas):** if the nearest milestone is past due, the Reflect milestone line takes a brick-red tone with inline "Mark hit" (→ 09) / "Push date" (→ 08b) actions.

## 17 · Carry-over pull (`CarryPull`)

Full-screen modal. **Optional** — non-blocking; can finish with 0 pulled.

| Element | Destination |
|---|---|
| Backlog task card | inline tap-to-add toggle (no nav; chip flips to "Added" with sage check) |
| Start week | promote selected tasks → clear ritual → → **17b · New week celebration** |

---

## 17b · New week celebration (`NewWeek`)

Full-screen transitional view shown after Carry-pull's "Start week". Has no tab bar and no FAB.

| Element | Destination |
|---|---|
| "Let's go" button | `router.replace('/(tabs)')` → 01 · This Week |

This is a brief calm moment between the Sunday ritual and execution. Not a planning step; purely a transition.

---

## Overdue Goal Prompt (`OverdueGoalPrompt`) — overlay, no fixed screen number

Bottom sheet overlay. Appears on app open whenever an active goal's `target_date` is in the past and hasn't been dismissed this session. Renders on top of any screen.

| Element | Destination |
|---|---|
| Mark as hit | mark goal `completed`; sheet dismisses; goal moves to graveyard |
| Extend | sheet dismisses; → 12 · New / Edit goal (pre-filled, status reactivates if it was graveyard) |
| Abandon | mark goal `archived`; sheet dismisses; goal moves to graveyard |
| Tap outside / backdrop | dismiss for the current session only — prompt re-appears next launch until the goal is resolved |

The sheet iterates one overdue goal at a time. If multiple goals are overdue, the next one surfaces after the current one is resolved or dismissed.

---

## 18 / 19 · Empty states (`ThisWeekEmpty` / `BacklogEmpty`)

| Screen | Notes |
|---|---|
| 18 · First-launch home | Calm hero; FAB (tap/long-press) is the actual entry point. The two CTA buttons are visual placeholders in v1 (see TASKS.md). |
| 19 · Empty backlog | Gentle message; FAB still works. |

---

## 20 · Task detail (`TaskDetail`)

Bottom sheet. Opened by tapping the body of any task card (on This Week or Backlog).

| Element | Destination |
|---|---|
| Title | inline edit (tap to enter edit mode) |
| Field chip (Theme / Effort / Return / Week) | inline picker opens below the chip; tap an option to set |
| Reminder row | inline edit — text field + mic button (long-press mic → Voice reminder modal); confirm sends text to `/ai/parse-reminder` and saves the spec |
| Move to backlog | inline change `week=backlog`; × back to caller |
| Delete | **immediate delete (no confirm dialog in v1 — consistent with domain-lens.md "tasks are low-stakes")**; × back to caller; Undo snackbar appears for ~6s |
| Drag-down / backdrop | × back to caller (dirty fields auto-save on dismiss) |

### Voice reminder modal (`VoiceReminderModal`)

A sub-overlay used only inside the Task Detail Sheet's reminder editor. Long-press the mic button there to open it. Single-purpose dictation overlay; confirm pastes the recognized transcript back into the reminder text field.

## 21 · Habit detail (`HabitDetail`)

Bottom sheet. Opened by tapping the **text area** (not the ring) of any habit card.

| Element | Destination |
|---|---|
| Title | inline edit (tap to enter edit mode) |
| Theme chip | inline picker opens below; tap to set |
| Goal link chip | **Display-only in v1** — shows *"none — link one?"* but the picker is not wired up. Known bug — see TASKS.md. |
| Weekly target stepper (− / +) | inline change (range 1–14) |
| Pause / Resume | inline toggle; × back to caller |
| Delete | **Target spec:** confirm dialog → deferred wipe (during Undo window habit + records are restorable; after the snackbar dismisses, the wipe is committed). **Current v1 behavior:** immediate FK-cascading hard-delete with an Undo snackbar that can only recreate an empty habit — streak history is lost. **Known bug — fix planned (see TASKS.md).** |
| Drag-down / backdrop | × back to caller (dirty fields auto-save on dismiss) |

---

## Settings (not on canvas — referenced in PRD)

Full-screen modal, slides up. Reached from any gear icon (top-right of 01/02/03/04).

- Themes → Themes management sub-page (PRD §12)
- Reminders → bulk reminder management (PRD §13)
- Notifications → habit nudges toggle
- Appearance → Light / Dark / System
- About

---

## Cross-cutting

| Pattern | Behavior |
|---|---|
| Persistent single FAB | Floats over screens 01-04 (and the goal Plan step 16b). Tap → 06 Quick-add. Long-press → 05 Voice listening. Hidden on all other modals/sheets. |
| Bottom tab bar | Visible on screens 01-04 only. Hidden on modals/sheets. |
| The "track" component | Shared goal-signal bar (5 warm tonal segments + terracotta marker). Two renderings: light unlabeled **cursor** on This Week (near-term milestone pace), large labeled **health** on Goals + Goal detail (long-term). |
| Undo snackbar | App-wide. Shows for ~6s after task-complete, task-delete, habit-increment, habit-delete, and carry-over drop. Tapping "Undo" reverses (note: habit-delete undo currently cannot restore lost streak history — see Known bugs in TASKS.md). Goal mark-hit / abandon do NOT emit Undo in v1. |
| Sheets dismiss on | (a) drag-down on grip, (b) tap on dimmed backdrop, (c) explicit close/back button |
| Full-screen modals dismiss on | (a) close X, (b) Cancel button, (c) successful Save (auto-dismiss) |
| Carry-over ritual is uniquely **blocking** | No dismiss path on screens 14 + 15, and the goal-step Reflect (16) blocks until both health questions are answered. Screens 16b (Plan), 17 (Pull) and 17b (New week) are non-blocking continuation steps. |

---

## Entry-point summary

These are the screens a user can reach in one tap (or long-press) from anywhere they typically are:

- **FAB · tap** → 06 · Quick-add draft (empty) — from any primary tab
- **FAB · long-press** → 05 · Voice listening — from any primary tab
- **Tab bar** → 01/02/03/04
- **Gear icon** → Settings (from any primary tab)
- **Goal card (or This Week milestone row)** → 07 · Goal detail
- **Sunday morning, first launch** → 14 · Recap → 15 · Triage → 16 · Goal step (Reflect→Plan, per goal) → 17 · Pull → 17b · New week → 01 · This Week (14+15 and each Reflect are forced; Plan/Pull/New week are continuation steps)
- **Overdue goal present on app open** → Overdue Goal Prompt surfaces as a bottom sheet on top of the current screen
