# Navigation Map — To do App

Every tap-target → destination, organized by source screen. This is the single source of truth for navigation; the JSX files describe layout and demo state but don't wire actual routing.

**Conventions:**

- "→ X" means tapping the element navigates to screen X (push)
- "↓ X" means it opens X as a bottom sheet over the current screen
- "⤴ X" means it opens X as a full-screen modal (slides up from bottom)
- "× back" means it dismisses the current modal/sheet and returns to the caller
- Screen numbers refer to the artboard labels on the design canvas

---

## 01 · This Week (`ThisWeek`)

| Element | Tap target | Destination |
|---|---|---|
| Settings gear (top-right) | gear icon | ⤴ Settings (full-screen) |
| Milestone hero card | anywhere | → expanded view of tasks linked to this milestone (filter applied to This Week) |
| Habit card · **progress ring** | the ring only | inline increment (count +1, no nav) |
| Habit card · **text area** (name + theme) | the body | ↓ 18 · Habit detail |
| Task card · **circle** | the circle only | inline toggle done (no nav) |
| Task card · **title body** | the body | ↓ 17 · Task detail |
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
| Task card · body | ↓ 17 · Task detail (same sheet as on This Week) |
| Tab bar tabs | → corresponding tab |
| FAB · tap | ⤴ 06 · Quick-add draft (empty, defaults to Backlog when added from this tab) |
| FAB · long-press | ⤴ 05 · Voice listening *(item lands in Backlog when added from this tab)* |

**Empty variant (16 · `BacklogEmpty`):** Same nav, just no task cards.

---

## 03 · Goals (`Goals`)

| Element | Destination |
|---|---|
| Settings gear | ⤴ Settings |
| Primary goal card | ↓ 07 · Goal action drawer (kind="active") |
| Secondary goal card | ↓ 07 · Goal action drawer (kind="active") |
| "Add directly" button | ⤴ 10 · New goal · empty form |
| "Coach me" button | ⚠ **Non-functional placeholder in v1** — AI Coach feature was dropped (2026-05-24). Button has no onPress. May be removed in a code cleanup pass. |
| Past goals header | inline expand/collapse |
| Past goal row | ↓ 07b · Goal action drawer (kind="grave") |
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

## 07 · Goal action drawer (`GoalActionDrawer`)

Bottom sheet over the Goals screen.

**Active variant (`kind="active"`):**

| Element | Destination |
|---|---|
| Mark as hit | confirmation toast → goal moves to Past goals as `hit`; × back to Goals |
| Edit | ⤴ 11 · New goal · pre-filled (form acts as Edit when title already exists) |
| Delete | confirm dialog → goal moves to Past goals as `abandoned`; × back to Goals; Undo snackbar |
| Drag-down / backdrop | × back to Goals |

**Graveyard variant (`kind="grave"`, screen 07b):**

| Element | Destination |
|---|---|
| Reactivate | ⤴ 10 · New goal · pre-filled in Edit mode (subject to 1+2 cap — backend returns HTTP 400 if exceeded; no cap-exceeded modal in v1) |
| Drag-down / backdrop | × back to Goals |

---

## 08 / 09 · Coach screens — REMOVED FROM SCOPE (2026-05-24)

The AI Coach feature was dropped from v1. The Goals tab's "Coach me" button is currently a non-functional placeholder and may be removed in a later code cleanup pass.

---

## 10 · New / Edit goal (`AddGoalForm`)

Full-screen modal. Reached from Goals tab "Add directly" (empty fields), or from the Goal Action Drawer's "Edit" / "Reactivate" actions (pre-filled).

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

## 12 · Carry-over recap (`CarryRecap`)

Full-screen blocking modal — appears on first app open after week flip. **No close X.** Persists every app open until fully triaged.

| Element | Destination |
|---|---|
| Review leftovers → | → 13 · Triage (or → 14 · Pull-from-backlog if no leftovers) |

## 13 · Carry-over triage (`CarryTriage`)

Full-screen blocking modal. **No skip, no dismiss, no X.**

| Element | Destination |
|---|---|
| Keep for this week | task → status `open, week=current`; advance to next leftover (or → 14 if last) |
| Send to backlog | task → status `open, week=backlog`; advance |
| Drop | task → deleted; Undo snackbar; advance |

## 14 · Carry-over pull (`CarryPull`)

Full-screen modal. **Optional** — non-blocking; can finish with 0 pulled.

| Element | Destination |
|---|---|
| Backlog task card | inline tap-to-add toggle (no nav; chip flips to "Added" with sage check) |
| Start week | promote selected tasks → clear ritual → → **15 · New week celebration** |

---

## 15 · New week celebration (`NewWeek`)

Full-screen transitional view shown after Carry-pull's "Start week". Has no tab bar and no FAB.

| Element | Destination |
|---|---|
| "Let's go" button | `router.replace('/(tabs)')` → 01 · This Week |

This is a brief calm moment between the Sunday ritual and execution. Not a planning step; purely a transition.

---

## 16 · Overdue Goal Prompt (`OverdueGoalPrompt`)

Bottom sheet overlay. Appears on app open whenever an active goal's `target_date` is in the past and hasn't been dismissed this session. Renders on top of any screen.

| Element | Destination |
|---|---|
| Mark as hit | mark goal `completed`; sheet dismisses; goal moves to graveyard |
| Extend | sheet dismisses; → 10 · New / Edit goal (pre-filled, status reactivates if it was graveyard) |
| Abandon | mark goal `archived`; sheet dismisses; goal moves to graveyard |
| Tap outside / backdrop | dismiss for the current session only — prompt re-appears next launch until the goal is resolved |

The sheet iterates one overdue goal at a time. If multiple goals are overdue, the next one surfaces after the current one is resolved or dismissed.

---

## 17 · Task detail (`TaskDetail`)

Bottom sheet. Opened by tapping the body of any task card (on This Week or Backlog).

| Element | Destination |
|---|---|
| Title | inline edit (tap to enter edit mode) |
| Field chip (Theme / Effort / Return / Week) | inline picker opens below the chip; tap an option to set |
| Reminder row | inline edit — text field + mic button (long-press mic → 05b · Voice reminder modal); confirm sends text to `/ai/parse-reminder` and saves the spec |
| Move to backlog | inline change `week=backlog`; × back to caller |
| Delete | **immediate delete (no confirm dialog in v1 — consistent with domain-lens.md "tasks are low-stakes")**; × back to caller; Undo snackbar appears for ~6s |
| Drag-down / backdrop | × back to caller (dirty fields auto-save on dismiss) |

### 05b · Voice reminder modal (`VoiceReminderModal`)

A sub-overlay used only inside the Task Detail Sheet's reminder editor. Long-press the mic button there to open it. Single-purpose dictation overlay; confirm pastes the recognized transcript back into the reminder text field.

## 18 · Habit detail (`HabitDetail`)

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
| Persistent single FAB | Floats over screens 01-04. Tap → 06 Quick-add. Long-press → 05 Voice listening. Hidden on all modals/sheets. |
| Bottom tab bar | Visible on screens 01-04 only. Hidden on modals/sheets. |
| Undo snackbar | App-wide. Shows for ~6s after task-complete, task-delete, habit-increment, habit-delete, and carry-over drop. Tapping "Undo" reverses (note: habit-delete undo currently cannot restore lost streak history — see Known bugs in TASKS.md). Goal mark-hit / abandon do NOT emit Undo in v1. |
| Sheets dismiss on | (a) drag-down on grip, (b) tap on dimmed backdrop, (c) explicit close/back button |
| Full-screen modals dismiss on | (a) close X, (b) Cancel button, (c) successful Save (auto-dismiss) |
| Carry-over ritual is uniquely **blocking** | No dismiss path on screens 12 + 13. App opens straight into it until triage is cleared. Screens 14 (Pull) and 15 (New week) are non-blocking continuation steps. |

---

## Entry-point summary

These are the screens a user can reach in one tap (or long-press) from anywhere they typically are:

- **FAB · tap** → 06 · Quick-add draft (empty) — from any primary tab
- **FAB · long-press** → 05 · Voice listening — from any primary tab
- **Tab bar** → 01/02/03/04
- **Gear icon** → Settings (from any primary tab)
- **Sunday morning, first launch** → 12 · Recap → 13 · Triage → 14 · Pull → 15 · New week → 01 · This Week (12+13 are forced; 14+15 are continuation steps)
- **Overdue goal present on app open** → 16 · Overdue Goal Prompt surfaces as a bottom sheet on top of the current screen
