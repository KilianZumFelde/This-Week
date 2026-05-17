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
| FAB · **mic** (terracotta) | the mic button | ⤴ 05 · Voice listening |
| FAB · **+** (small, left of mic) | the + button | ⤴ 06 · Quick-add draft (with empty fields) |

**First-launch variant (15 · `ThisWeekEmpty`):**

| Element | Destination |
|---|---|
| "Set my first goal with Coach" | ⤴ 08 · Coach (in conversation, creation mode) |
| "Add a task" | ⤴ 06 · Quick-add draft (empty) |

---

## 02 · Backlog (`Backlog`)

| Element | Destination |
|---|---|
| Settings gear | ⤴ Settings |
| Sort toggle | inline re-sort |
| Theme group header | inline expand/collapse |
| Task card · circle | "Pull to this week" (visual: theme group moves task to This Week) |
| Task card · body | ↓ 17 · Task detail (same sheet as on This Week) |
| Tab bar tabs | → corresponding tab |
| FAB · mic | ⤴ 05 · Voice listening *(item lands in Backlog when added from this tab)* |
| FAB · + | ⤴ 06 · Quick-add draft (empty, defaults to Backlog) |

**Empty variant (16 · `BacklogEmpty`):** Same nav, just no task cards.

---

## 03 · Goals (`Goals`)

| Element | Destination |
|---|---|
| Settings gear | ⤴ Settings |
| Primary goal card | ↓ 07 · Goal action drawer (kind="active") |
| Secondary goal card | ↓ 07 · Goal action drawer (kind="active") |
| "Add directly" button | ⤴ 10 · New goal · empty form |
| "Coach me" button | ⤴ 08 · Coach (in conversation, creation mode) |
| Past goals header | inline expand/collapse |
| Past goal row | ↓ 07b · Goal action drawer (kind="grave") |
| Tab bar tabs | → corresponding tab |
| FAB · mic / + | as elsewhere (added to current view's default scope) |

---

## 04 · Stats (`Stats`)

| Element | Destination |
|---|---|
| Settings gear | ⤴ Settings |
| Top summary band | (no nav) |
| Habit streak row | ↓ 18 · Habit detail for that habit |
| Past-week row | inline expand → reveals that week's tasks + habit results inline |
| Tab bar tabs | → corresponding tab |
| FAB · mic / + | as elsewhere |

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
| Reactivate | ⤴ 11 · New goal · pre-filled (subject to 1+2 cap; cap-exceeded modal triggers on save) |
| Drag-down / backdrop | × back to Goals |

---

## 08 · Coach · in conversation (`CoachEntry`)

Full-screen modal. No tab bar.

| Element | Destination |
|---|---|
| Close (X) | × back to caller (conversation discarded; warn if substantive) |
| Restart (top-right) | inline reset of message thread |
| Input field | inline text entry |
| Mic button (right of input) | hold to dictate; release commits message |
| (when AI converges) "Create this goal" appears → | → 09 · Coach final summary |

## 09 · Coach · final summary (`CoachSummary`)

Same chrome as 08, with the final summary message + button.

| Element | Destination |
|---|---|
| Close (X) | × back to caller (warning: "Discard recommended goal?") |
| Restart | back to 08 with fresh thread |
| Input field / mic | inline continue chatting (stays on 09) |
| **Create this goal** (big primary button) | ⤴ 11 · New goal · pre-filled from conversation |

---

## 10 · New goal · empty (`AddGoalForm`)

Full-screen modal. Reached from Goals tab "Add directly".

| Element | Destination |
|---|---|
| Close (X, top-left) | × back to Goals (warning if any field filled) |
| Title input | inline edit |
| Target date quick-chip | inline pick (3mo / 6mo / 1y / Custom → opens native date picker) |
| Type radio (Primary / Secondary) | inline pick |
| Theme dropdown | inline expand/collapse (AI suggests once title has content) |
| Why textarea | inline edit |
| Save (top-right + bottom) | validate → save → × back to Goals · **if 1+2 cap exceeded** → cap-exceeded modal (Demote current primary / Archive / Cancel) |
| Cancel | × back to Goals |

## 11 · New goal · pre-filled from Coach (`AddGoalForm prefilled`)

Same form, every field filled from Coach conversation. Banner reads "From your conversation with Coach — review and save."

| Element | Destination |
|---|---|
| Close (X) | × back to **09 · Coach summary** (so user can keep chatting or restart) |
| All form interactions | identical to 10 |
| Save | as 10, then × back to **Goals** (Coach modal also dismisses on success) |

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
| Start week | × dismiss entire ritual → 01 · This Week with toast "Ready for the new week." |

---

## 17 · Task detail (`TaskDetail`)

Bottom sheet. Opened by tapping the body of any task card (on This Week or Backlog).

| Element | Destination |
|---|---|
| Title | inline edit |
| Field chip | inline edit (same pattern as 06b draft inline picker) |
| Reminder row | inline edit (opens reminder editor inline) |
| Move to backlog | inline change `week=backlog`; Undo snackbar; sheet stays open |
| Delete | confirm dialog → delete; × back to caller; Undo snackbar |
| Drag-down / backdrop | × back to caller |

## 18 · Habit detail (`HabitDetail`)

Bottom sheet. Opened by tapping the **text area** (not the ring) of any habit card.

| Element | Destination |
|---|---|
| Title | inline edit |
| Theme chip | inline edit |
| Goal link chip | inline edit (pick from active goals) |
| Weekly target stepper (− / +) | inline change |
| Pause / Resume | inline toggle; sheet stays open |
| Delete | confirm dialog → delete; × back to caller; Undo snackbar |
| Drag-down / backdrop | × back to caller |

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
| Persistent FAB (mic + small +) | Floats over screens 01-04 and Backlog. Hidden on all modals/sheets. |
| Bottom tab bar | Visible on screens 01-04 only. Hidden on modals/sheets. |
| Undo snackbar | App-wide. Shows for ~6s after any destructive action (drop task, delete goal, delete habit, increment-rollback). Tapping "Undo" reverses. |
| Sheets dismiss on | (a) drag-down on grip, (b) tap on dimmed backdrop, (c) explicit close/back button |
| Full-screen modals dismiss on | (a) close X, (b) Cancel button, (c) successful Save (auto-dismiss) |
| Carry-over ritual is uniquely **blocking** | No dismiss path on screens 12 + 13. App opens straight into it until triage is cleared. |

---

## Entry-point summary

These are the screens a user can reach in one tap from anywhere they typically are:

- **Mic FAB** → 05 · Voice listening (from anywhere with the tab bar)
- **+ FAB** → 06 · Quick-add draft (empty) (from anywhere with the tab bar)
- **Tab bar** → 01/02/03/04
- **Gear icon** → Settings (from any primary tab)
- **Sunday morning, first launch** → 12 · Recap (forced; can't get to 01 without finishing triage)
