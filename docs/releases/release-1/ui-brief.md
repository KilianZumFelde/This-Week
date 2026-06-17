# UI Design Brief: Release 1 — Goals Drive the Week

**Release**: 1 — covers only the **new and changed screens** for this release. The baseline `/docs/ui/ui-brief.md` still describes all other screens unchanged.

## Product Context

Weekly Focus is a calm, warm, mobile-first personal productivity app for one person. Until now, goals were a passive section — a goal with a date and some loosely linked tasks that did no work. This release makes goals steer the week: each goal gets near-term **milestones**, a daily **this-week on-track cursor**, a weekly subjective **goal health** verdict, and a **goal step** in the existing Sunday ritual. The feel must stay true to the app: calm, warm minimalism, anti-Jira, anti-Duolingo — no confetti, no gamification, gentle tonal separation, generous whitespace.

## Visual System (delta only)

Unchanged from the baseline brief (vibe, typography — Source Serif Pro / Newsreader headings, Inter/Geist body; spacious density; 8–12px rounded corners; soft low shadows; dark mode default warm charcoal `#1a1816`). One **new shared component** this release needs a definition for:

**The "track" component (used by both goal signals).** A slim horizontal bar representing a left↔right position, drawn from the *existing warm palette* — explicitly **not** a generic red/green:
- **Left end (off track / behind):** the muted **brick red** already used for missed-habit visualization — honest, not alarming.
- **Middle (neutral):** warm gray / surface tone.
- **Right end (on track / ahead):** the **sage / muted olive** already used for done/habit-completion, with **warm gold** reserved for the furthest "well ahead" tip.
- **The marker:** a small filled **terracotta** (primary accent) dot/pill that sits at the current position, so "you" reads consistently wherever it lands.
- Built as **5 subtle tonal segments** (not a gradient — matches the baseline's React Native gradient limitation note), low saturation, calm.

This single component is rendered **two ways** (see screens): a larger labeled version for **goal health** on the Goals tab, and a smaller, lighter, unlabeled version for the **this-week cursor** on the home screen — so the two signals never read as the same thing. The five named health levels (worst→best) are **Behind / Slightly behind / On track / Ahead / Well ahead**.

---

## Screens

### 1. This Week (home) — CHANGED

**Purpose**: The day-to-day landing view. The passive primary-goal hero is gone; in its place, a **"Milestones" section** (parallel to Habits) of compact **milestone-led this-week cursors** — one per active goal that has tasks this week.

**Layout hierarchy**:
1. **"Milestones" section** (top): a muted section header (parallel to Habits), then for each active goal with tasks committed this week, one compact row — the goal's **next milestone title** + a **theme-color dot** on the left (e.g. *Cut demo set*), the **slim track + terracotta marker** on the right. No level label — deliberately lighter than the Goals-tab health track. Up to ~2 rows stacked. The cursor reads as *this week's pace toward the next milestone* (computed from goal-linked tasks; the milestone is the label). Tap a row → opens that goal's Goal Detail.
2. **Habits section** (unchanged): habit cards with progress ring + count + gold "HIT" badge.
3. **Tasks section** (unchanged): flat priority-sorted list, colored priority stripe, theme chip.
4. **Done section** (unchanged): collapsed "Done (N)".

**Key UI elements**: the "Milestones" section with milestone-led cursor row(s); habit cards; task cards; collapsible Done; the single persistent "+" FAB (tap = quick-add, hold = voice); gear icon.

**Dynamic content**: per active goal with this-week tasks → marker position = (this week's completed goal tasks) vs. (expected-by-now, scaled by day of week). Recomputes live on task completion and on day change. Resets at Sunday flip.

**Variant states**:
- **No active goals / no goals with tasks this week**: the "Milestones" section is omitted entirely; This Week opens straight into Habits. (The "nothing planned toward a goal" case is caught on the Goals tab and at Sunday triage, not nagged here.)
- **First-launch empty**: unchanged calm hero; no goal hero reference.
- **Loading / error**: standard skeletons / inline retry (unchanged).

---

### 2. Goals — CHANGED (now a health dashboard)

**Purpose**: Turn the passive goal list into the place the user reads how each goal is *doing* overall.

**Layout hierarchy**:
1. **Primary section** — header "Primary · N of 1". The primary goal card now shows: eyebrow (`theme · by Mon Year`), serif title, the **goal health track (large, labeled)** with its level text (e.g. *Slightly behind*), and a **nearest-milestone line** — *"Next: cut demo set · by Jun 28"*. The "why" excerpt is **removed from the card** (it now lives only on Goal Detail). Existing tasks-this-week / habits-linked counts remain as quiet secondary text.
2. **Secondaries section** — header "Secondary · N of 2 slots". Up to 2 secondary cards, same structure, slightly smaller. Health applies here too.
3. **Buttons row** — "Add directly" (ghost) + the existing non-functional "Coach me" placeholder (untouched this release).
4. **Graveyard** (collapsed, unchanged).

**Goal health track (large)**: the shared track component, full card width, with the level label (Behind / Slightly behind / On track / Ahead / Well ahead) beside or below it. Marker in terracotta. This is the *macro, subjective* signal — distinct from the home-screen cursor.

**Interaction**: tap any goal card → **Goal Detail** (full-screen).

**Key UI elements**: goal cards with the large labeled health track + nearest-milestone line + secondary counts; Add directly / Coach me buttons; graveyard.

**Dynamic content**: each active Goal → `health_level` (set last Sunday), nearest upcoming Milestone (min target date among active), existing counts.

**Variant states**:
- **Goal with no milestone**: health track shows a muted *"Set a milestone to track this"* state (no marker); nearest-milestone line replaced by a subtle "+ Add milestone" hint.
- **Overdue milestone**: nearest-milestone line takes a quiet brick-red "overdue" tone (resolved in triage, not here).
- **Empty primary / secondary**: existing inline hints.
- **Loading / error**: standard.

---

### 3. Goal Detail — NEW full-screen (replaces the Goal Action Drawer)

**Purpose**: Tap a goal card → full-screen **Goal Detail**, the single goal-management surface. Replaces the old bottom-sheet Goal Action Drawer (now removed) — promoted to full-screen because the drawer was too dense and "adding/editing a milestone is editing the goal" needed room.

**Layout hierarchy** — three clearly separated sections + a footer:
1. **Health** — the goal's current `health_level` as the large labeled health track, plus a plain-words *"This week · [level]"* callout.
2. **Health trend** — the **8-week dot row** (reused from Habit Detail), each dot colored by that week's `health_level` (brick-red → sage palette). The **current week is emphasized** — taller, full-strength bar with a *"now ↑"* marker — because raw colored bars weren't self-explanatory on their own.
3. **Milestones** — the goal's `active` milestones as rows (title + date + a quiet **"Mark hit"** action each), then a **"+ Add milestone"** row. Rows are **title + date + Mark hit only** — no "next up / due in ~2 weeks" subtext, no "N ahead" count.

**Footer**: **Mark goal as hit / Edit / Delete**. *Edit* edits the goal's own fields only (title / target date / why); milestones are managed in the Milestones section.

**Key UI elements**: large labeled health track + "This week · [level]" callout; 8-week trend dots with current-week emphasis; milestone rows with Mark hit; "+ Add milestone" row; footer action bar.

**Dynamic content**: the goal's `health_level` (Health); its last-N `GoalHealthRecord`s (trend); its `active` Milestones (list).

**Variant states**:
- **No milestones**: Milestones section shows only the "+ Add milestone" row.
- **No health history yet**: trend shows muted placeholder dots.
- **Graveyard goal**: Reactivate-only variant — milestone/trend sections hidden or read-only; no editing of a terminal goal.

---

### 4. Add / Edit Milestone — NEW (bottom sheet)

**Purpose**: Create or edit a milestone. Deliberately lightweight — title + date only. Reached from Goal Detail's Milestones section ("+ Add milestone"), the set-next-milestone prompt, and the Sunday Reflect gap-catch.

**Layout hierarchy**:
1. Sheet handle + title: *"New milestone"* / *"Edit milestone"*.
2. **Title** field (single-line, serif).
3. **Target date** — **near-term quick-select chips**: *1 week / 2 weeks / 1 month / 6 weeks*. The resolved date shows below in a compact pill (e.g. *"Jun 30, 2026"*). Tighter presets than Add Goal's 1mo–1yr, since milestones are near-term.
4. Bottom bar: *Cancel* / *Save*. Save disabled until title + date are set.

**Component style**: bottom sheet, consistent with Task/Habit detail sheets. No AI — the user types the milestone.

**Key UI elements**: title input; four date chips; resolved-date pill; Cancel / Save.

**Dynamic content**: empty on create; pre-filled on edit.

**Variant states**:
- **Invalid date (after the goal's target date)**: inline hint — *"Must be on or before the goal's date (Oct 1, 2026)."* Save disabled.
- **Saving / error**: inline, data not lost.

---

### 5. Carry-Over Triage → Goal Step — NEW (sub-screens in the Sunday ritual)

**Purpose**: The new ritual step inserted **after per-task triage, before pull-from-backlog**. Iterates once **per active goal** (progress indicator *"Goal 1 of 2"*), **split into two sub-screens: Reflect → Plan** (one screen was too crammed; the split matches a reflect-then-plan rhythm).

**Reflect — layout hierarchy**:
1. **Goal header + next-milestone line** — serif goal title + *"Milestone: cut demo set · due in ~2 weeks"*.
   - **Gap-catch variant** (no active milestone): shows *"No milestone set — add one to track this goal"* + an **"Add milestone"** button (opens the Add Milestone sheet). You can't rate progress toward a milestone that doesn't exist, so it's resolved here first.
   - **Overdue variant**: milestone line takes the brick-red overdue tone with inline *"Mark hit"* / *"Push date"*.
2. **Two health questions** (mandatory):
   - *Progress* — *"How much did you move toward [milestone] this week?"* → **A lot / Some / Barely / Nothing**.
   - *Confidence* — *"Confident you'll hit it by [date]?"* → **Yes / Maybe / No**.
   These set the goal's `health_level` (Behind / Slightly behind / On track / Ahead / Well ahead).
3. **Continue → Plan** button, disabled until both questions are answered.

**Plan — layout hierarchy**:
1. **This week's tasks toward the goal** — a calm list of the goal's open/backlog tasks, each **tap-to-add** (tapped items show a sage check + *"Added"*).
2. **AI assist** — a quiet *"Anything to add?"* button; tapping it has the AI propose *additional* tasks as draft cards, each requiring an explicit confirm tap. Appears only after the user's own tasks are shown; never auto-creates.
3. **New task** via the persistent **"+" FAB** (tap = new task pre-linked to this goal + this week; hold = dictate) — no separate "+ New task" row.
4. **Continue button** — *"Next goal"* (or *"Continue"* on the last goal → pull-from-backlog step). All Plan actions are optional.

**Key UI elements**: "Goal N of M" progress indicator; Reflect = goal header + milestone line (gap-catch / overdue variants) + two chip-group questions; Plan = tap-to-add task list + "Anything to add?" AI button + the "+" FAB; Continue buttons.

**Dynamic content**: per active Goal — nearest Milestone, the goal's open tasks, AI suggestions. On completing Reflect, writes a `GoalHealthRecord` for the week being entered and sets the goal's `health_level`.

**Variant states**:
- **No active goals**: the goal step is skipped entirely (triage → pull-from-backlog).
- **Goal with no milestone**: Reflect gap-catch (above).
- **Overdue milestone**: inline mark-hit / push-date in Reflect.
- **Goal with no tasks**: Plan list shows *"No tasks yet"* with AI assist + the "+" FAB still available.

---

### 6. Set-Next-Milestone Prompt — NEW (small bottom sheet)

**Purpose**: When the user marks a milestone **hit** (from the drawer or the triage overdue action), a calm prompt keeps the "always 1–2 ahead" rhythm.

**Layout hierarchy**:
1. Small sheet: a sage check accent + *"Nice — [milestone] done."*
2. Line: *"Set the next milestone?"*
3. Two buttons: **Add next milestone** (primary → opens Add Milestone sheet) / **Not now** (ghost).

**Component style**: small bottom sheet, calm, **no celebration animation / no confetti** (anti-Duolingo).

**Key UI elements**: sage check; one-line prompt; two buttons.

**Variant states**: *"Not now"* dismisses; the goal then shows its no-/next-milestone state until one is added.

---

## Pending — spec'd but not yet built

In this brief but not produced in the current design pass. Flagged so they become explicit build tasks (or a follow-up design pass), not silent omissions:

- **Overdue-milestone variant** (Screens 2 & 5): brick-red overdue tone on the nearest-milestone line + inline *Mark hit / Push date*. Overdue handling is a Requirements rule, so it must be built somewhere — not dropped.
- **Goals-card "no milestone" muted state** (Screen 2): the *"Set a milestone to track this"* + "+ Add milestone" hint on the Goals-tab card. Only the triage Reflect gap-catch was built; the Goals-card version is pending.
- **This Week variant states** (Screen 1): no-active-goals → omit the "Milestones" section; loading / error. Not yet built.
