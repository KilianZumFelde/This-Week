# TASKS.md — Release 1: "Goals Drive the Week"

Work order for Release 1. Built from the release-1 delta lenses (product / domain / requirements / ux / ui-brief / consistency / database-design / ai-architecture) plus the design code in `/docs/ui` (`screens-r1.jsx`, `components.jsx`, `NAVIGATION.md`), and **grounded against the actual shipped code** (every file named below was read during planning).

**The feature in one line:** give each goal near-term **milestones**, a weekly subjective **goal health** verdict (set at Sunday triage), a daily **this-week on-track cursor** on Home, and a **goal step** in the Sunday ritual — so goals stop being passive dead weight.

## Two signals — never conflate them (consistency-lens glossary)

| Signal | What | Where | Stored / derived |
|---|---|---|---|
| **Goal health (macro)** | 5-level *subjective* standing set weekly from two triage answers: **Behind / Slightly behind / On track / Ahead / Well ahead** | Goals tab + Goal Detail + Sunday Reflect | **Stored** on `goals` (`health_level`), snapshotted to `goal_health_records` |
| **This-week cursor (micro)** | *Objective, live* per-goal signal: this week's completed goal tasks vs. time elapsed in the week | This Week home, "Milestones" section | **Derived** from existing task data — no new storage |

## How to read this plan

**UI fidelity:** `/docs/ui` is a **React *web* prototype** (HTML/CSS, `color-mix`, gradients). The app is **React Native** (`View`/`Text`/`StyleSheet`, hex tokens from `app/lib/tokens.ts`, no `color-mix`/gradients). Every FE task is a **faithful port** — match the design's layout, spacing, hierarchy, density, and component structure as closely as RN allows; pre-compute `color-mix` segments to hex/rgba. This is "port the design," not "loosely based on."

**Enum mapping (design ↔ DB):** the design's `HEALTH_LEVELS` (`components.jsx`) uses short keys (`behind`/`slightly`/`ontrack`/`ahead`/`well`); the **DB stores** `behind`/`slightly_behind`/`on_track`/`ahead`/`well_ahead`. Port `Track`/`HealthDots`/`healthByKey` keyed on **DB values**.

**Validation ownership** — each task's validation is tagged:
- 🤖 **Self (me):** confirmed runnable —
  - `tsc` typecheck and `vitest` (`npm test`) — deps installed in `backend/` + `app/`.
  - **Live authenticated backend calls:** run the backend locally (`npm run dev` + `backend/.env`), mint a JWT via Supabase password grant for the **test user** (`test@weeklyfocus.dev`, creds in `credentials.md` — verified working), and `curl` new endpoints with `Authorization: Bearer <jwt>`. So API routes get real end-to-end validation, not just unit tests. Precondition: migration 008 applied (see 1.1).
  - **DB migration:** I have the DB password + service-role key, so I *can* apply 008 to the dev DB myself (additive/low-risk) — but I'll confirm with you before running DDL on your real dev DB.
- 👤 **You:** all on-device visual/interaction checks (Expo Go) — rendered layout, touch, transitions, device behavior. Each phase's user check-in lists exactly what to look at.
- **FE jest harness — live (task 0.1 done):** `jest`/`jest-expo`/TypeScript and **RNTL component rendering both work** (`npm test` in `app/` — both smoke tests pass). So pure-logic tests (cursor math, helpers) **and** component/interaction tests (render output, conditional states, press handlers) are 🤖-runnable without a device. **Gotcha:** RNTL 14's `render`/`fireEvent`/user-event are **async — always `await` them.** Only rendered-pixel fidelity, touch feel, and real navigation need the device (👤).

Still **extract pure functions** (health mapping, milestone date rule, cursor position) into testable modules — the cheapest, most reliable checks.

### Phase 0 — Test harness (do first)

- [x] **0.1 — Add FE test harness** *(done — fully working)*
  - Installed: `jest`, `jest-expo`, `@testing-library/react-native` v14, `test-renderer`, `@types/jest` (RNTL 14 + React 19 uses `test-renderer`, **not** `react-test-renderer`). Config in `app/package.json` (`"test": "jest"`, `jest.preset = jest-expo`, `setupFilesAfterEnv`), `app/jest.setup.js`.
  - **Status:** both pure-TS (`harness.smoke.test.ts`) and RNTL component render (`rntl.smoke.test.tsx`) pass. **Key gotcha for all future component tests:** RNTL 14's `render`, `fireEvent`, and user-event are **async — `await` them**, or queries come back empty.
  - As components need them, add mocks to `jest.setup.js` (reanimated, expo-router, etc.).
  - Validate: 🤖 `npm test` (app) — 2 passed.

---

## Phase 1 — Milestones foundation (DB + backend + Goal Detail)

**Outcome:** The DB delta is migrated. A user can open a **full-screen Goal Detail** from a goal card (replacing the removed bottom-sheet Goal Action Drawer), see the Milestones section, and **add / edit / mark-hit** milestones with date validation, including the **set-next-milestone** prompt. Health + trend render in their "not yet rated" states (real values in Phase 2).

### Tasks

- [x] **1.1 — DB migration `008_release1_goal_health.sql`**
  - Build: new file `supabase/migrations/008_release1_goal_health.sql`, in order: (a) `alter table goals add column` the four nullable health columns + CHECKs; (b) `create table milestones` + 3 indexes; (c) `create table goal_health_records` + 2 indexes + inline `unique (goal_id, week_start_date)`; (d) RLS enable + owner policies on both new tables. No backfill.
  - Files: `supabase/migrations/008_release1_goal_health.sql` (latest existing = `007_habit_soft_delete.sql`); also append to `supabase/migrations/run_all.sql` (confirm its format first).
  - Based on: `database-design.md` (Tables / Indexes / RLS / Migration notes).
  - Validate: 🤖 I can apply it to the dev DB myself (DB password / service-role in `credentials.md`) and run a verification query confirming tables/CHECKs/unique/indexes/RLS + the 4 nullable `goals` columns — **with your go-ahead** before running DDL on the real dev DB. Otherwise 👤 you apply it and I provide the SQL + verification query.

- [x] **1.2 — Milestone Zod schemas**
  - Build: `CreateMilestoneRequestSchema` (`title` min 1, `target_date` isoDate) and `UpdateMilestoneRequestSchema` (both optional) in `backend/src/lib/request-schemas.ts`, matching the existing `uuid`/`isoDate` helpers and Goal schema style there.
  - Files: `backend/src/lib/request-schemas.ts`.
  - Based on: `requirements-lens.md` (validation), `database-design.md`.
  - Validate: 🤖 `npm run build` (tsc) in `backend/`.

- [x] **1.3 — Milestone date-validation pure function + backend routes**
  - Build: (a) pure fn `validateMilestoneDate(targetDate, goalTargetDate, today)` in a testable module (e.g. `backend/src/lib/milestones.ts`) returning ok / reason — rules: required, in the future, **≤ parent goal `target_date`**. (b) `backend/src/routes/milestones.ts` registered in `backend/src/index.ts` next to `goalsRoutes`. Routes (all `preHandler: [authenticate]`, scoped by `user_id`, patterns from `routes/goals.ts`):
    - `GET /goals/:goalId/milestones` — list (active + hit), ordered by `target_date`.
    - `POST /goals/:goalId/milestones` — fetch parent goal, run `validateMilestoneDate`, 400 on failure (message names the goal's date), else insert.
    - `PATCH /milestones/:id` — edit (push date); re-validate against parent goal.
    - `POST /milestones/:id/mark-hit` — set `status='hit'`, `hit_at=now()`; return updated row.
    - `DELETE /milestones/:id` — hard delete (escape hatch, database-design.md).
  - Files: `backend/src/lib/milestones.ts`, `backend/src/routes/milestones.ts`, `backend/src/index.ts`.
  - Based on: `requirements-lens.md` (lifecycle + validation), `database-design.md` (backend-enforced rules), `domain-lens.md`.
  - Validate: 🤖 unit-test `validateMilestoneDate` (past date / after-goal-date / valid) in `backend/src/tests/`; 🤖 **live curl** against locally-run backend with a test-user JWT — create rejects past/after-goal dates (400), accepts valid (201), mark-hit flips status + sets `hit_at`, list ordered. 👤 final create/edit/mark-hit through the app (Phase 1 check-in).

- [x] **1.4 — Frontend: shared HealthTrack + HealthDots (RN port)**
  - Build: `app/app/components/HealthTrack.tsx` exporting `Track` (5 tonal segments + terracotta marker; `size="lg"` labeled / `size="sm"` light; `muted` no-marker variant), `HealthDots` (8-week, current-week emphasis + "now ↑"), and `HEALTH_LEVELS`/`healthByKey` keyed on **DB enum values**. Port from `docs/ui/components.jsx` (`Track`/`HealthDots`/`HEALTH_LEVELS`). **Pre-compute** the `color-mix` segment colors to hex/rgba using `colors` from `tokens.ts` (`brick #a86b5e`, `sage #8ea076`, `gold #d4b06a`, `surface2`, `surfaceHi`, `accent #c87856`). No CSS gradient.
  - Files: `app/app/components/HealthTrack.tsx`.
  - Based on: `docs/ui/components.jsx`, `ui-brief.md` "The track component"; tokens from `app/lib/tokens.ts`.
  - Validate: 🤖 `tsc` + component test (renders correct segment/marker per level, `size` variants, `muted` hides marker); 👤 visual fidelity vs `/docs/ui` once rendered in Goal Detail (1.6).

- [x] **1.5 — Frontend: useMilestones hooks**
  - Build: `app/lib/hooks/useMilestones.ts` — `Milestone` type + `useMilestones(goalId)`, `useCreateMilestone`, `useUpdateMilestone`, `useMarkMilestoneHit`, `useDeleteMilestone`; invalidate `['milestones', goalId]` and `['goals']` on success. Pattern from `useGoals.ts`.
  - Files: `app/lib/hooks/useMilestones.ts`.
  - Validate: 🤖 `tsc`; 👤 data loads in Goal Detail.

- [x] **1.6 — Frontend: Goal Detail full-screen + register route + remove drawer**
  - Build: new route `app/app/goal-detail.tsx` (param `goalId`), ported from `screens-r1.jsx` `GoalDetail`: modal header (X / "Goal" / Edit), hero (eyebrow + serif title + optional why), **Health** (large labeled `Track`; muted "Set a milestone to track this" when `health_level` null), **Health trend · 8 weeks** (placeholder dots until Phase 2 wires records), **Milestones** (rows: title + date + "Mark hit"; "+ Add milestone"), footer (**Mark goal as hit** / **Delete**; Edit in header). Wire: Edit → `/add-goal?goalId=`; Mark hit → `useMarkGoalHit`; Delete → `useAbandonGoal` (reuse from `useGoals.ts`). Graveyard goal → Reactivate-only read-only variant.
  - **Register the route** in `app/app/_layout.tsx` `<Stack>` (e.g. `<Stack.Screen name="goal-detail" options={{ presentation: 'modal', headerShown: false }} />`) — mirrors `add-goal`.
  - **Remove** `app/app/components/GoalActionDrawer.tsx` and its import + `<GoalActionDrawer .../>` usage + `selectedGoal` state in `app/app/(tabs)/goals.tsx`; change `openGoal` to `router.push('/goal-detail?goalId=...')`.
  - Files: `app/app/goal-detail.tsx`, `app/app/_layout.tsx`, `app/app/(tabs)/goals.tsx`, delete `app/app/components/GoalActionDrawer.tsx`.
  - Based on: `ui-brief.md` Screen 3, `NAVIGATION.md` 07, `ux-lens.md`, `screens-r1.jsx`.
  - Validate: 🤖 `tsc` (no dangling `GoalActionDrawer` import); 👤 tap a goal → full-screen Goal Detail; old drawer gone.

- [x] **1.7 — Frontend: Add/Edit Milestone sheet**
  - Build: `app/app/components/MilestoneSheet.tsx` (RN `Modal` bottom sheet — pattern from `GoalActionDrawer`/detail sheets, with the grip/backdrop) ported from `screens-r1.jsx` `MilestoneSheet`: title input, four date chips (1w/2w/1m/6w resolved via `date-fns`), resolved-date pill, Cancel/Save (disabled until title+date). Inline invalid hint when resolved date > goal target ("Must be on or before the goal's date (…)"). Opens from Goal Detail "+ Add milestone" and milestone-row edit.
  - Files: `app/app/components/MilestoneSheet.tsx`.
  - Based on: `ui-brief.md` Screen 4, `NAVIGATION.md` 08.
  - Validate: 🤖 `tsc`; 👤 create + edit a milestone; after-goal-date is blocked.

- [x] **1.8 — Frontend: Set-Next-Milestone prompt**
  - Build: `app/app/components/SetNextMilestone.tsx` (small RN bottom sheet, **no confetti**) ported from `screens-r1.jsx` `SetNextMilestone`: sage check + "Nice — [milestone] done.", "Set the next milestone?", **Add next milestone** (→ MilestoneSheet) / **Not now**. Triggered after marking a milestone hit in Goal Detail.
  - Files: `app/app/components/SetNextMilestone.tsx`.
  - Based on: `ui-brief.md` Screen 6, `NAVIGATION.md` 09.
  - Validate: 🤖 `tsc`; 👤 mark hit → prompt → Add next opens sheet; Not now dismisses.

### 👤 User check-in (end of Phase 1)
Review **Goal Detail** vs `/docs/ui`: layout, milestone rows + Mark hit, the Add/Edit Milestone date chips, the Set-next prompt. Confirm the old drawer is gone and nothing feels lost.

### End-of-phase admin
- Mark done/deferred; record open questions here.
- Note for you: run migration 008; test Goal Detail + milestone create/edit/mark-hit.
- Update `docs/libraries.md` only if a package was installed (none expected).

---

## Phase 2 — Goal health: setting, display, trend

**Outcome:** Backend computes `health_level = f(progress, confidence)` and snapshots it; the **Goals tab becomes a health dashboard** (large labeled track + nearest-milestone line, primary + secondary); Goal Detail shows real health + 8-week trend; **no-milestone** and **overdue** card states render.

### Tasks

- [x] **2.1 — Health mapping pure function + set endpoint**
  - Build: (a) pure fn `computeHealthLevel(progress, confidence)` in `backend/src/lib/goalHealth.ts` implementing the **progress × confidence → level** table (requirements-lens.md §Business rules), returning a DB enum value. (b) `POST /goals/:id/health` in `routes/goals.ts` body `{ progress_answer, confidence_answer, week_start_date }` (new Zod schema): compute level, **upsert** `goal_health_records` on `(goal_id, week_start_date)`, update `goals` (`health_level`, `progress_answer`, `confidence_answer`, `health_set_date=week_start_date`).
  - Files: `backend/src/lib/goalHealth.ts`, `backend/src/routes/goals.ts`, `backend/src/lib/request-schemas.ts`.
  - Based on: `requirements-lens.md` (mapping, both required), `database-design.md` (upsert, NOT NULL on records).
  - Validate: 🤖 unit-test `computeHealthLevel` for all 12 pairs (A lot+Yes→well_ahead … Nothing+No→behind, Barely+Maybe→slightly_behind); 🤖 **live curl** (test-user JWT) — POST health twice in the same week → one `goal_health_records` row (upsert), `goals` columns updated. 👤 in-app once wired in Phase 4.

- [x] **2.2 — Trend read + health/milestone on goal payload**
  - Build: `GET /goals/:id/health-records?limit=8` (newest-first, uses `goal_health_records_goal_week_idx`). Decide the **lightest** way to give the Goals tab each goal's `health_level` + nearest active milestone without N calls — `health_level` already returns from `GET /goals`; for nearest milestone, either add it to `GET /goals/:id/stats` or a small batch endpoint. **Record the choice in Open Questions.**
  - Files: `backend/src/routes/goals.ts` (+ `milestones.ts` if batching there).
  - Based on: `database-design.md`, `ui-brief.md` Screen 3.
  - Validate: 🤖 `.inject()`/unit where logic is extractable; 👤 trend dots vs seeded data.

- [x] **2.3 — Frontend: extend Goal type + health hooks**
  - Build: add `health_level`, `progress_answer`, `confidence_answer`, `health_set_date` to `Goal` in `useGoals.ts`; add `useSetGoalHealth`, `useGoalHealthRecords(goalId)`; nearest-milestone derivation (min active `target_date`) from `useMilestones` or the 2.2 payload.
  - Files: `app/lib/hooks/useGoals.ts` (+ small helper).
  - Validate: 🤖 `tsc`.

- [x] **2.4 — Frontend: Goals tab health dashboard**
  - Build: rework `PrimaryGoalCard`/`SecondaryGoalCard` in `app/app/(tabs)/goals.tsx` per `screens-r1.jsx` `GoalCard`: add the **large labeled `Track`** + level text, the **nearest-milestone line** ("Next: … · by …"), keep quiet tasks/habits counts, **remove the `goalWhy` block** from `PrimaryGoalCard` (lines ~52-54 + `goalWhy` style; why now lives on Goal Detail). Header eyebrow → "How each goal is doing". Variants: **no milestone** → muted track + "+ Add milestone" hint; **overdue milestone** → brick-red tone on the line (resolved in triage, not here).
  - Files: `app/app/(tabs)/goals.tsx`.
  - Based on: `ui-brief.md` Screen 2 (+ Pending: no-milestone, overdue), `NAVIGATION.md` 03, `screens-r1.jsx`.
  - Validate: 🤖 `tsc` + component test (the three card states — health track present / no-milestone muted hint / overdue tone — render from props); 👤 the three on-device.

- [x] **2.5 — Frontend: real health + trend in Goal Detail**
  - Build: replace Phase-1 placeholders in `goal-detail.tsx` with real `health_level` (large `Track` + "This week · [level]" callout) and `HealthDots` from `useGoalHealthRecords`; muted placeholder when no history.
  - Files: `app/app/goal-detail.tsx`.
  - Validate: 🤖 `tsc`; 👤 health-set vs fresh goal; dots match seeded records.

### 👤 User check-in (end of Phase 2)
Review the **Goals tab** dashboard and **Goal Detail** health + 8-week trend vs `/docs/ui`. Macro health reads clearly; no-milestone/overdue states feel calm, not alarming.

### End-of-phase admin
- Mark tasks; record the 2.2 payload decision + open questions.
- Note for you: set health via the Phase-4 in-app path or a seeded record, then view the dashboard.

---

## Phase 3 — This Week on-track cursor (micro signal)

**Outcome:** This Week home shows a **"Milestones" section** (parallel to Habits) with one compact **cursor row per active goal that has tasks committed this week**, labeled by the next milestone, tap → Goal Detail. Section omitted entirely when no goal has this-week tasks. **The passive milestone hero is removed.**

### Tasks

- [x] **3.1 — Cursor data (dedicated endpoint or client compute) + pure position fn**
  - Build: pure fn `cursorPosition({ committed, completed, dayIndexInWeek })` → 0–1 marker pos (`expected = committed * dayIndex/7`; ahead/behind around it), in `app/lib/` (and/or shared with backend). For the data: **NOT via `/auth/bootstrap`** (that only seeds profile/themes). Choose either (a) a dedicated `GET /goals/cursors` returning per active goal `{ goal_id, next_milestone_title, theme_color, committed_count, completed_count }`, or (b) client-side from existing hooks (`useThisWeekTasks` rows carry `goal_id`; `useGoals`; nearest milestone via `useMilestones`). Default to (a) for one clean call. **Record the choice in Open Questions.** Skip goals with 0 committed this-week tasks.
  - Files: `app/lib/week.ts` (day math) + new helper; `backend/src/routes/goals.ts` if (a).
  - Based on: `requirements-lens.md` (cursor rules), `database-design.md` ("This-Week On-Track Cursor" — derived, existing indexes), `ux-lens.md`.
  - Validate: 🤖 unit-test `cursorPosition` (0 committed → omit; behind/on-pace/ahead; day-1 vs day-7); 👤 marker moves on real completion.

- [x] **3.2 — Frontend: Milestones section on This Week + remove hero**
  - Build: in `app/app/(tabs)/index.tsx`, **remove the "Milestone hero" block (lines ~272-300)** and its now-unused styles (`milestone*`), plus the `primaryGoal`/`primaryGoalStats` wiring if only used by the hero. Add the muted **"Milestones"** section above Habits per `screens-r1.jsx` `ThisWeek` cursor-block: per active goal with this-week tasks, a compact row (theme dot + next-milestone title + light `Track size="sm"` + chevron); tap → `router.push('/goal-detail?goalId=...')`. **Variant:** omit the whole section when none qualify (open straight into Habits). Keep the first-launch empty hero and loading/error states unchanged.
  - Files: `app/app/(tabs)/index.tsx`.
  - Based on: `ui-brief.md` Screen 1 (+ Pending: no-active-goals variant), `NAVIGATION.md` 01, `screens-r1.jsx`.
  - Validate: 🤖 `tsc` + component test (Milestones section renders a row per qualifying goal and is omitted entirely when none qualify; hero gone); 👤 marker moves on real completion, section disappears when nothing planned.

### 👤 User check-in (end of Phase 3)
Review the **This Week "Milestones" section** vs `/docs/ui`: confirm the cursor reads *lighter/smaller* than the Goals-tab health track (the two signals must not look identical), and completing a goal task moves the marker right.

### End-of-phase admin
- Mark tasks; record the 3.1 data-delivery decision.
- Note for you: test cursor movement on real task completion.

---

## Phase 4 — Sunday ritual goal step (Reflect → Plan) + AI assist

**Outcome:** The Sunday ritual runs a per-active-goal **Reflect → Plan** step **after per-task triage, before pull** — **including on weeks with zero leftover tasks** (today the ritual is skipped entirely then). Reflect's two mandatory questions set health (writing a `GoalHealthRecord` for the week being entered); Plan offers optional task pick + bounded AI "Anything to add?" + the "+" FAB. Gap-catch and overdue are wired.

> **Cross-cutting prerequisite found in grounding:** today `performRollover` (`backend/src/services/rollover.ts:149`) only creates a `carry_over_ritual` when there are open leftover tasks, and `_layout.tsx:56-66` gates the ritual screens via an `inRitual` allow-list. Both must change for the goal step to run reliably (4.1, 4.5).

### Tasks

- [x] **4.1 — Make the Sunday flow fire when there are active goals (even with 0 leftovers)**
  - Build: in `performRollover`, also create the ritual (or an equivalent pending marker) when the user has ≥1 active goal, not only when `openPrevTasks.length > 0` — so the goal step runs every Sunday. Keep idempotency (the `week_records` guard) intact. Decide the cleanest shape: reuse `carry_over_rituals` with zero decisions, vs. a separate flag. **Record the choice + rationale in Open Questions.**
  - Files: `backend/src/services/rollover.ts`, possibly `backend/src/routes/carry-over.ts` (pending payload), `backend/src/routes/rollover.ts`.
  - Based on: `ux-lens.md` (goal step runs per active goal every Sunday), `requirements-lens.md` (ordering), `NAVIGATION.md` 16.
  - Validate: 🤖 unit/`.inject()` on the trigger logic (active goal + no leftovers → ritual created; no goals + no leftovers → none); 👤 full ritual on a clean week.

- [x] **4.2 — Backend: AI goal-task suggestion route**
  - Build: `POST /ai/suggest-goal-tasks` in `backend/src/routes/ai.ts` (pattern from `/ai/capture`). Input: goal (title, why, target_date, health_level), nearest milestone, the goal's existing this-week + open/backlog task titles, themes, optional clarifying answers. Anthropic **tool use** forced `tool_choice` on `suggest_goal_tasks` → `{title, theme_id?, effort_level?, return_level?}[]` (**effort/return enums = `low|medium|high|unknown`**, matching `request-schemas.ts`); Zod-validate. **Soft-fail:** no tool_use / Zod reject / empty → return `{ items: [] }` (NOT 422). Model `claude-sonnet-4-6`, `max_tokens ≈ 512`. Never auto-create. Optional metadata-only log to `ai_capture_logs`.
  - Files: `backend/src/routes/ai.ts`.
  - Based on: `ai-architecture.md`, `requirements-lens.md` (bounded AI).
  - Validate: 🤖 unit-test the parse/validate/soft-fail path with a stubbed Anthropic response (success, empty, malformed → all return cleanly, no 5xx); 🤖 **live curl** (test-user JWT) with a real goal context → returns additional non-duplicate drafts; bad API key → `{ items: [] }`, no 5xx. 👤 real suggestions in-app.

- [x] **4.3 — Frontend: Reflect sub-screen**
  - Build: `app/app/carry-goal-reflect.tsx` ported from `screens-r1.jsx` `CarryGoalReflect`: "Goal N of M · reflect" header, step dots, goal title + next-milestone line, two mandatory chip-group questions (Progress: A lot/Some/Barely/Nothing · Confidence: Yes/Maybe/No), "Plan this week →" disabled until both answered. On advance → `useSetGoalHealth` (2.1) with the entered week's `week_start_date`, then go to Plan. **Gap-catch** (no active milestone): show "Add milestone" (→ MilestoneSheet) instead of questions. **Overdue:** brick-red milestone line with inline "Mark hit" (→ SetNextMilestone) / "Push date" (→ MilestoneSheet edit).
  - Files: `app/app/carry-goal-reflect.tsx`.
  - Based on: `ui-brief.md` Screen 5 Reflect, `NAVIGATION.md` 16/16c.
  - Validate: 🤖 `tsc` + component test ("Plan this week" disabled until both questions answered; gap-catch variant shows "Add milestone" instead of questions); 👤 health record written (check DB via live call); overdue path on device.

- [x] **4.4 — Frontend: Plan sub-screen**
  - Build: `app/app/carry-goal-plan.tsx` ported from `screens-r1.jsx` `CarryGoalPlan`: "Goal N of M · plan" header, "Toward: [milestone]" line, **tap-to-add** list of the goal's open/backlog tasks (tap → set `week_assignment='this_week'` + current week via existing task update hook; sage "Added"), **"Anything to add?"** AI button (calls 4.2; draft cards each needing explicit confirm → create real task pre-linked to goal + this week), persistent **"+" FAB** (tap = new task pre-linked to this goal + this week; hold = dictate — reuse existing FAB/quick-add), "Next goal"/"Continue". All Plan actions optional.
  - Files: `app/app/carry-goal-plan.tsx`.
  - Based on: `ui-brief.md` Screen 5 Plan, `NAVIGATION.md` 16b, `requirements-lens.md` (AI never primary / never auto-create).
  - Validate: 🤖 `tsc`; 👤 tap-to-add moves task; AI requires confirm; FAB creates pre-linked task; Continue advances.

- [x] **4.5 — Wire goal step into the ritual sequence + iteration + guards**
  - Build: insert the goal step between triage and pull. Today: `carry-recap` → `carry-triage` → (on last decision) `router.replace('/carry-pull')`. New: triage complete → goal 1 Reflect → Plan → goal 2 Reflect → … → after last goal → `/carry-pull`. Track active-goal list + index + answers in `app/lib/stores/rollover-store.ts` (extend it). Handle: **0 active goals** → triage → pull (skip step); **0 leftovers** → recap → (skip empty triage) → goal step → pull (today `carry-triage` renders null on 0 decisions — branch it to the goal step). **Update `_layout.tsx` `inRitual` allow-list (lines 56-66) to include `carry-goal-reflect` + `carry-goal-plan`**, and register both in the `<Stack>`. Update the "X OF 3" step labels in `carry-triage.tsx`/`carry-pull.tsx` to reflect the inserted step (or the design's "goal N of M" sub-labels).
  - Files: `app/app/_layout.tsx`, `app/app/carry-triage.tsx`, `app/app/carry-recap.tsx`, `app/app/carry-pull.tsx`, `app/lib/stores/rollover-store.ts`, the two new screens.
  - Based on: `ux-lens.md` (ritual spine), `NAVIGATION.md` 15→16→17, `requirements-lens.md`.
  - Validate: 🤖 `tsc`; 👤 walk the full ritual on (a) a week with leftovers + goals and (b) a clean week with goals — both reach the goal step, write health records, and land on pull → new-week, with no mid-step bounce.

### 👤 User check-in (end of Phase 4)
Walk the **full Sunday ritual**: recap → triage → per-goal Reflect→Plan → pull → new week, on both a leftovers week and a clean week. Judge the reflect-then-plan rhythm, mandatory-light feel (only Reflect blocks), the AI "Anything to add?" (drafts, not auto-create), and gap-catch/overdue.

### End-of-phase admin
- Mark tasks; record the AI single-shot vs clarifying-turn decision (ai-architecture.md Open Questions) and the 4.1 ritual-trigger shape.
- Update `docs/libraries.md` if anything was installed.

---

## Phase 5 — History-aware goal health model

**Outcome:** Goal health stops being a static 4×3 lookup of the *current* week only. It becomes a **deterministic, history-aware pure function** (`calculateGoalHealth`) that scores the current week from a retuned base table and then applies **one bounded adjustment** for a clear recent pattern over up to 4 contiguous weeks (current + 3 prior). The current week stays the dominant signal — history only moves the result when the user keeps telling the same risky or healthy story, and a strong current week always allows recovery. No new ritual questions, no UI questions, **no migration** (reads existing `progress_answer` / `confidence_answer` / `week_start_date`). Verified by unit tests for all 14 required cases plus a multi-week live `curl`.

### Why this is a real change, not a tweak (read before implementing)

The **base table itself is retuned** to be more conservative — history is what lifts strong patterns back up. So the *no-history* result for several pairs changes vs. what's shipped today:

| | Current shipped (`goalHealth.ts` `HEALTH_MAP`) | New base (no history) |
|---|---|---|
| `a_lot + yes` | well_ahead | **ahead** (history lifts repeats → well_ahead) |
| `a_lot + no` | on_track | **slightly_behind** (confidence is forward-looking) |
| `some + yes` | ahead | **on_track** (history lifts repeats → ahead) |
| `barely + yes` | on_track | **slightly_behind** |
| `nothing + maybe` | behind | **slightly_behind** (repeats → behind via stagnation) |

This means the shipped `computeHealthLevel` (Phase 2.1), its unit test (`goalHealth.test.ts`, all 12 pairs), and the requirements-lens mapping table are all **superseded** and must be updated together (see admin). Old stored `health_level` values stay as-is for trend display — the new calc depends only on raw answers, never on prior stored levels — so **no backfill / migration**.

### Tasks

- [x] **5.1 — Date helper: `subtractWeeks(weekStartDate, n)`**
  - Build: add `subtractWeeks(weekStartDate: string, n: number): string` to `backend/src/lib/dateUtils.ts`, alongside the existing `getPreviousWeekStartDate` (which already does the `n=1` case via `new Date(\`${d}T00:00:00\`)` + `setDate(-7)` — reuse that exact date-only pattern; **do not** use UTC parsing or local-time arithmetic that can drift around DST/midnight). Date-only `YYYY-MM-DD` in/out.
  - Files: `backend/src/lib/dateUtils.ts`.
  - Based on: ChatGPT spec §Date handling; existing `getPreviousWeekStartDate`.
  - Validate: 🤖 vitest — `subtractWeeks("2026-06-15",1)==="2026-06-08"`, `…,2)==="2026-06-01"`, `…,3)==="2026-05-25"`; a case crossing a DST boundary stays exact.

- [x] **5.2 — Rewrite `goalHealth.ts` as the history-aware pure model**
  - Build (all pure, no DB, **no floating point**, in `backend/src/lib/goalHealth.ts`):
    - Reuse existing exported types `HealthLevelValue` / `ProgressAnswer` / `ConfidenceAnswer`. Add a `HealthRecord` shape `{ goal_id; week_start_date; progress_answer; confidence_answer; health_level? }` and `CurrentHealthInput` `{ goal_id; week_start_date; progress_answer; confidence_answer }`.
    - **Score maps:** `behind=0 … well_ahead=4` and back (`scoreToHealthLevel`, clamped 0–4).
    - **New base score table** (replaces `HEALTH_MAP`): `a_lot{yes:3,maybe:2,no:1}`, `some{yes:2,maybe:2,no:1}`, `barely{yes:1,maybe:1,no:0}`, `nothing{yes:1,maybe:1,no:0}` → `getBaseScore`.
    - `getRecentContiguousRecords({ current, historicalRecords, maxWeeks:4 })`: start from current week, walk back only via `subtractWeeks` exact matches; **filter to `current.goal_id`**; **dedupe `goal_id + week_start_date`, preferring the in-memory `current` over any stored record for that same week**; stop at first gap; cap at 4 incl. current. Returns newest→oldest incl. current.
    - `getNegativeAdjustment(records)`: compute each pattern over the contiguous-from-current streak and **take the strongest (most negative), not the sum**, bounded to `[-2, 0]`: (1) repeated low confidence — 2× `no`→ −1, 3+× `no`→ −2, 3+× `!= yes`→ −1; (2) repeated stagnation (`progress ∈ {barely,nothing} AND confidence ∈ {maybe,no}`) — 2×→ −1, 3+×→ −2; (3) repeated `nothing` progress — 2×→ −1, 3+×→ −2.
    - `getPositiveAdjustment(records)`: only meaningful when negative is 0; cap `+1`: 2× `a_lot+yes`→ +1; 3+× `(some|a_lot)+yes`→ +1.
    - `calculateGoalHealth(current, historicalRecords)`: base + (neg<0 ? neg : pos), clamp 0–4, map back. Constants `MAX_HISTORY_WEEKS=4`, `MIN_ADJUSTMENT=-2`, `MAX_ADJUSTMENT=1`.
    - **Keep a `computeHealthLevel(progress, confidence)`** thin wrapper = `scoreToHealthLevel(getBaseScore(...))` so any existing import keeps working (it now returns the *base* result).
  - Files: `backend/src/lib/goalHealth.ts`.
  - Based on: ChatGPT spec §Desired model / §Base table / §Historical adjustments / §Suggested implementation shape / §Pseudocode.
  - Validate: 🤖 vitest (5.4). 🤖 `npm run build` (tsc) — strict types, no `any`.

- [x] **5.3 — Feed history into the set-health endpoint**
  - Build: in `POST /goals/:id/health` (`backend/src/routes/goals.ts`, ~line 127), **before** computing: fetch the goal's recent `goal_health_records` (`select progress_answer, confidence_answer, week_start_date, goal_id`, `eq goal_id`, `eq user_id`, `week_start_date <= week_start_date`, `order desc`, `limit 5`). Build `current` from the request body, call `calculateGoalHealth(current, records)` (the pure fn already dedupes/excludes the stored current-week row in favour of the in-memory answers), then upsert + update the `goals` row with the **computed** level exactly as today. Replace the current `computeHealthLevel(progress, confidence)` call.
  - Files: `backend/src/routes/goals.ts`.
  - Based on: ChatGPT spec §Persistence behavior, §Backward compatibility.
  - Validate: 🤖 **live curl** (test-user JWT, local backend) — seed `nothing+maybe` for week N−1, then POST `nothing+maybe` for week N → `behind` (stagnation kicks in); POST `a_lot+yes` for week N after two `nothing+no` weeks → `ahead` (recovery, streak doesn't apply); a non-contiguous prior week → ignored. Confirm one row per `(goal_id, week_start_date)` (no double-count on re-POST of the same week).

- [x] **5.4 — Tests for the history-aware model** *(replaces the old 12-pair test)*
  - Build: rewrite `backend/src/tests/goalHealth.test.ts` to cover **all 14 required cases**: (1) 12 base/no-history pairs against the *new* base table; (2) no-history behavior; (3) 2× `nothing+maybe` → behind; (4) 3× stagnation; (5) 2× `a_lot+no` → behind; (6) 3× `no` confidence; (7) 2× `a_lot+yes` → well_ahead; (8) 3× `some+yes` → ahead; (9) positive **not** applied when a negative applies; (10) missing week breaks streak (`2026-06-01` + `2026-06-15`, missing `06-08` → slightly_behind); (11) records from other goals ignored; (12) existing record for the current week not double-counted (stored differs from in-memory → in-memory wins); (13) final score clamped Behind…Well ahead; (14) recovery (`nothing+no` ×2 then `a_lot+yes` → ahead).
  - Files: `backend/src/tests/goalHealth.test.ts`.
  - Based on: ChatGPT spec §Expected examples / §Testing requirements.
  - Validate: 🤖 `npm test` (backend) green.

- [x] **5.5 — UI: surface the model honestly (no new questions)**
  - Build: **no new ritual/UI questions** and no new health value plumbing (Goals tab + Goal Detail already render the stored `health_level`; this phase only changes how it's computed). *Optional, low-risk:* add one calm explanatory line under the Health section in `app/app/goal-detail.tsx` — "Goal health is based on this week's progress, confidence, and recent patterns." — only if it sits naturally; keep wording non-judgmental (no "At risk"/"Bad"). Confirm `HealthTrack`/`healthByKey` already handle all five DB levels (they do — Phase 1.4).
  - Files: `app/app/goal-detail.tsx` (copy only, optional).
  - Based on: ChatGPT spec §UX expectations.
  - Validate: 🤖 `tsc`; 👤 a goal whose answers repeat across weeks now reads worse/better than a one-off week; the copy (if added) reads calm.

### 👤 User check-in (end of Phase 5)
On a seeded multi-week goal, confirm the model *feels honest*: one `nothing+maybe` reads "Slightly behind" but two in a row reads "Behind"; one `a_lot+yes` is "Ahead" and two is "Well ahead"; and a strong week after bad weeks **recovers** to "Ahead" (history doesn't haunt). Confirm the ritual still asks only the two questions.

### End-of-phase admin
- Mark tasks; record any tuning decisions in Open Questions.
- **Docs to update (decision changed — fold this into the baseline in 6.3, and update the release-1 deltas now so they stay coherent):**
  - `docs/releases/release-1/requirements-lens.md` — replace the `health_level = f(progress, confidence)` line + the 4×3 mapping table (lines ~14–21) with the **history-aware model**: new base table + the bounded pattern adjustments. **Keep the hard constraints true and say so explicitly:** still *subjective* (inputs are the user's own prior *answers*, never task counts / objective cadence — does not violate "must not compute health objectively"), still *frozen between Sundays* and *no auto-drift* (it only ever changes when the user answers on a Sunday).
  - `docs/releases/release-1/database-design.md` — update the "Computed / derived rules" note (lines ~252–253) from `health_level = f(progress_answer, confidence_answer)` to "computed from the current week's answers **plus up to 3 prior contiguous `goal_health_records` weeks**"; state explicitly **no schema change / no migration** (existing NOT-NULL raw answers + `unique(goal_id, week_start_date)` + `goal_health_records_goal_week_idx` already support the read).
  - `docs/libraries.md` — no change expected (no new packages).
- Note for you: nothing to install; the model is server-side only.

---

## Phase 6 — Remaining variants, tests, baseline fold-back

**Outcome:** All ui-brief "Pending" items handled, new logic has tests, and the release is folded into the baseline `/docs`.

### Tasks

- [ ] **6.1 — Close out Pending variant states**
  - Verify/fix the sweep (most landed in 2–4): This Week loading/error + no-active-goals omission (Phase 3); Goals-card no-milestone + overdue tone (Phase 2); triage Reflect overdue mark-hit/push-date (Phase 4).
  - Based on: `ui-brief.md` "Pending", `consistency-lens.md` "Deferred / open".
  - Validate: 👤 exercise each variant in-app.

- [x] **6.2 — Tests for new logic**
  - Build: backend Vitest for the **history-aware `calculateGoalHealth`** (the 14 cases — owned by Phase 5.4), `validateMilestoneDate`, the AI soft-fail path, and the 4.1 trigger logic; frontend jest tests for `cursorPosition` + the component tests written across Phases 1–4 (Track, card variants, This Week section omission, Reflect gating). Patterns from `backend/src/tests/` + `app/lib/__tests__/`.
  - Validate: 🤖 `npm test` (backend) and `npm test` (app) both green.
  - **Done:** `backend/src/lib/aiUtils.ts` (`parseSuggestToolResult`) + `backend/src/tests/ai.test.ts` (8 soft-fail cases); `backend/src/lib/rolloverUtils.ts` (`shouldCreateRitual`) + `backend/src/tests/rollover.test.ts` (4 trigger cases); `app/lib/__tests__/GoalCard.test.tsx` (5 card-variant cases: health-set/muted/no-milestone/milestone/overdue); `app/__mocks__/@expo/vector-icons.js` + jest moduleNameMapper for native font avoidance. Backend: 69/69 ✓  Frontend: 22/22 ✓. Note: This Week section omission (JSX conditional in index.tsx) and Reflect "Plan this week" button gating (covered by logic in carry-goal-reflect.tsx) remain 👤-only — extracting full-screen components for those would require extensive hook mocking without proportional test value.

- [x] **6.3 — Baseline fold-back (per CLAUDE.md Releases: Fold-Back)**
  - Build: merge release-1 deltas into main `/docs` lenses (product / domain / requirements / ux / database_design / ai-architecture): Milestone + goal health + GoalHealthRecord into domain & database baselines; goal step + two signals into ux/requirements; AI suggestion into ai-architecture; **the history-aware health model + retuned base table (Phase 5) into the requirements & database baselines** (carry over the same wording fixes made to the release-1 deltas in 5.5 admin). Keep `docs/releases/release-1/` as a dated archive. `/docs/ui` already current — no UI fold-back.
  - Validate: 🤖 re-read main lenses for dangling release-only language; 👤 sanity confirm.

- [x] **6.4 — Commit + push**
  - Build: commit + push to `main` (PowerShell git; quote parenthesized paths; here-string message). Render auto-deploys backend.
  - Validate: 🤖 `git status` clean; 👤 backend healthy at `https://this-week.onrender.com`.
  - **Done:** pushed commits `538896e` (p5+p6.2) + `4d04324` (p6.3). Render auto-deploy triggered.

### 👤 User check-in (end of Phase 6)
Final pass: goals now visibly steer the week (Home cursor, Goals dashboard, Sunday goal step). Confirm no baseline regressions.

### End-of-phase admin
- Mark all tasks; resolve/record open questions.
- `CLAUDE.md` **Current work** can move past `release-1` once you accept the release.

---

## Open questions (running)

- **AI assist shape (4.2):** single-shot first vs. clarifying-question turn (ai-architecture.md Open Questions). Default: single-shot.
- **Cursor data delivery (3.1) — DECIDED:** client-side computation from existing hooks (`useThisWeekTasks` carries `goal_id` + `status`; `useGoals`; `useNearestMilestones`). No new backend endpoint. The home screen already loads all three; per-goal committed/completed counts are derived in a `useMemo`. Avoids an extra round-trip and keeps the backend unchanged.
- **Trend/health payload (2.2) — DECIDED:** dedicated `GET /goals/nearest-milestones` endpoint + `GET /goals/:id/health-records?limit=8`. Keeps `GET /goals` payload unchanged; avoids N+1 from the client. The static route `/goals/nearest-milestones` is registered in the same `goalsRoutes` function; Fastify's trie router (find-my-way) gives priority to static segments over `:id` params.
- **Sunday-flow trigger (4.1):** how the ritual fires on a zero-leftover week (reuse `carry_over_rituals` with no decisions vs. a separate marker) — record the chosen shape and why.
- **Health model retune (Phase 5):** the base table is deliberately made more conservative and history supplies the lift — so `a_lot+yes` once = Ahead (not Well ahead) and `some+yes` once = On track (not Ahead) vs. the shipped table. Window `MAX_HISTORY_WEEKS=4`, adjustment bounds `[-2, +1]`, negatives take the *strongest* pattern (not the sum), positives apply *only* when no negative. These constants are the tuning knobs — record any change here.

## Assumptions / confirmed facts (from grounding)

- Deps installed in `backend/` + `app/`; `backend/.env` present; Supabase network reachable and a **test-user JWT mints successfully** (verified) → 🤖 `tsc`, `vitest`, and **live authenticated `curl`** against a locally-run backend are all runnable by me. **FE component tests** become 🤖-runnable once the Phase 0 harness is installed (0.1).
- Anthropic SDK + `date-fns` already present — no new packages expected; if any install is needed, hand to you (sandbox) and log in `docs/libraries.md`.
- Migration numbering continues at `008` (latest = `007_habit_soft_delete.sql`).
- `performRollover` currently skips the ritual on zero-leftover weeks; `_layout.tsx` `inRitual` allow-list gates ritual screens — both addressed in Phase 4.
- Task effort/return enums are `low|medium|high|unknown` (4 values) per `request-schemas.ts`.

---

# Adjustments (post-fold-back) — requested 2026-06-18

Small UX/UI corrections raised after release-1 shipped and folded back. The baseline `/docs` lenses are now current reality (fold-back ran in 6.3), so **doc updates here target the main `/docs` lenses + the `/docs/ui` prototype** (kept as the design source of truth), **not** the archived `docs/releases/release-1/` deltas. Each item was traced to real code during planning (every file named below was read).

**Validation ownership (same rules as the release):** 🤖 = me (`tsc` in `app/`, `npm test` jest/RNTL component tests, `npm run build`/`vitest` in `backend/`, live `curl` with a test-user JWT against a locally-run backend); 👤 = you (on-device visual/interaction in Expo Go). RNTL 14 `render`/`fireEvent` are async — always `await`.

**No backend code, schema, or migration changes in this set** — the milestone `DELETE` route, `useDeleteMilestone` hook, and `goal_health_records` already exist from the release. These phases are frontend + docs only.

---

## Phase 7 — Goals & Sunday-Plan surface cleanups

**Outcome:** The Sunday goal-Plan step loses the misleading `+ to add new` label; the Goals tab loses the dead "Coach me" button (Add directly goes full-width); past goals render as proper cards instead of hairline rows.

### Tasks

- [x] **7.1 — Remove the `+ to add new` label (Sunday Plan)**
  - Build: in `app/app/carry-goal-plan.tsx`, delete the `<Text style={styles.sectionHint}>+ to add new</Text>` inside the "PULL IN THIS WEEK'S WORK" `sectionHeader` (lines ~208–211) and remove the now-unused `sectionHint` style. The real "New task" button (`newTaskBtn`, ~322) stays. Keep the `sectionHeader` row (now just the label).
  - Files: `app/app/carry-goal-plan.tsx`.
  - Based on: user report; grounded against the shipped Plan screen.
  - Validate: 🤖 `tsc`; 👤 Sunday Plan step no longer shows the stray label.

- [x] **7.2 — Remove the "Coach me" button; make "Add directly" full-width**
  - Build: in `app/app/(tabs)/goals.tsx`, remove the "Coach me" `TouchableOpacity` (lines ~264–270) and its `btnPrimary`/`btnPrimaryText` styles if no longer referenced. The `buttonRow` keeps a single full-width "Add directly" button (drop its `flex: 1` competition — let it span the row). The Coach feature was already **dropped from scope (2026-05-24)**; this completes the cleanup. Leave the empty-state "Set my first goal with Coach" CTA out of scope (separate surface, not requested).
  - Files: `app/app/(tabs)/goals.tsx`.
  - Based on: `ux-lens.md:106`, `requirements-lens.md:98`, `ai-architecture.md:99`, `product-lens.md:41` (Coach dropped), user request.
  - Validate: 🤖 `tsc` (no dangling style refs); 👤 Goals tab shows one full-width "Add directly", no Coach button.

- [x] **7.3 — Past goals as cards (not hairline rows)**
  - Build: in `app/app/(tabs)/goals.tsx`, convert each graveyard `graveRow` (lines ~297–307) to a surface card matching the milestone/task card idiom — rounded `colors.surface` background, `radius.md`, `padding ~13/14`, `marginBottom: 8`, drop the `borderBottom` hairline. Keep the three pieces (result label + title + date). Update `graveRow`/`graveRes`/`graveName`/`graveDate` styles accordingly; keep the tap → `openGoal(g)` behavior.
  - Files: `app/app/(tabs)/goals.tsx`.
  - Based on: user request ("same card component usage as tasks and milestones"); `TaskRow.tsx` + `goal-detail.tsx` `milestoneCard` as the visual reference.
  - Validate: 🤖 `tsc` + RNTL component test (a past goal renders as a card with its result label/title/date); 👤 past-goals list reads as cards.

### 👤 User check-in (end of Phase 7)
Open the Goals tab (one full-width "Add directly", no Coach button; past goals are cards) and the Sunday Plan step (no `+ to add new`). Confirm nothing feels lost.

### End-of-phase admin ✅
- [x] Marked 7.1–7.3 in this TASKS.md.
- [x] **Docs done:** `docs/ui/screens-r1.jsx` — removed the "Coach me" button (~184) and the "+ to add a new one" hint in `CarryGoalPlan` (~457, the real Plan prototype — *not* `screens-modals.jsx` as first planned); `docs/ui/styles.css` `.goal-grave` — restyled to a card (rounded surface, `margin-bottom`, no hairline border). `docs/ux-lens.md` — Coach placeholder now **removed**, past-goals-as-cards note added. `docs/ui/ui-brief.md` (152/160) + `docs/ui/NAVIGATION.md` (72) + `docs/ai-architecture.md` (99) — "may be removed" → **removed**.
- **Validation:** 🤖 `tsc --noEmit` clean; `npm test` GoalCard + PastGoalCard → 8/8 pass. `docs/product-lens.md:41` — keep "AI Coach … out of scope" wording (no UI surface remains).

---

## Phase 8 — Milestone management: delete + more date presets

**Outcome:** A milestone can be deleted from its edit sheet (with confirm); the target-date presets gain **3 weeks** and **5 weeks**.

### Tasks

- [x] **8.1 — Add 3-week and 5-week date presets**
  - Build: in `app/app/components/MilestoneSheet.tsx`, extend `DATE_CHIPS` (lines ~36–41) and `resolveChip` (~19–26) to: `1 week / 2 weeks / 3 weeks / 1 month / 5 weeks / 6 weeks` (chronological order; `3w` = +21d, `5w` = +35d). The existing after-goal-date guard already applies to any resolved chip — no extra validation logic.
  - Files: `app/app/components/MilestoneSheet.tsx`.
  - Based on: user request.
  - Validate: 🤖 `tsc` + a small unit/component test that `resolveChip('3w')`/`'5w'` resolve to +21/+35 days and the new chips render and select; 👤 the chip row shows six presets and a resolved-date pill updates.

- [x] **8.2 — Delete a milestone from the edit sheet**
  - Build: in `app/app/components/MilestoneSheet.tsx`, when `isEditing`, add a red **"Delete milestone"** text link below the Cancel/Save row. On press → `Alert.alert` confirm → `useDeleteMilestone(goalId).mutate(milestoneId)` (hook already exists in `useMilestones.ts`; invalidates `['milestones', goalId]` + `['goals']`) → `onClose()`. Add the `useDeleteMilestone` import. Not shown in create mode.
  - Files: `app/app/components/MilestoneSheet.tsx`.
  - Based on: user request; backend `DELETE /milestones/:id` + `useDeleteMilestone` shipped in release-1 (1.3 / 1.5).
  - Validate: 🤖 **live curl** `DELETE /milestones/:id` (test-user JWT, local backend) — create a throwaway milestone, delete it, confirm it's gone from `GET /goals/:goalId/milestones`; 🤖 `tsc`; 👤 tap a milestone → Edit sheet → Delete → confirm → row disappears from Goal Detail.

### 👤 User check-in (end of Phase 8)
In Goal Detail, add a milestone using the new 3- and 5-week chips, then tap an existing one and delete it via the confirm dialog. Confirm the after-goal-date block still works on the new presets.

### End-of-phase admin ✅
- [x] Marked 8.1–8.2.
- [x] **Docs done:** `docs/ui/screens-r1.jsx` — `MilestoneSheet` chip array + `dateFor` map extended to six presets; "Delete milestone" link added in edit mode. `docs/requirements-lens.md` — milestone deletion (edit-sheet, confirm, tasks unaffected) added to lifecycle; target-date presets listed in the validation rule. `docs/database_design.md:414` — updated the stale "UI exposes only Mark hit / Edit" note to include Delete.
- **Validation:** 🤖 `tsc --noEmit` clean; `npm test` milestoneChips → 4/4 pass (chip order + `resolveChip` 3w=+21d, 5w=+35d). The `DELETE /milestones/:id` backend route is **pre-existing and unchanged** (validated by live curl in release-1 task 1.3, scoped by `user_id`, returns 204) — the only new code is the FE hook call, covered by `tsc`. On-device delete is the 👤 check below.

---

## Phase 9 — Goal health ↔ trend honesty (Goal Detail)

**Outcome:** The Goal Detail headline health and the 8-week trend's current value can never disagree, and the trend's "This week" label honestly reflects the most-recently-rated week.

### Tasks

- [x] **9.1 — Single-source the trend's current value**
  - Build: trace the divergence first — confirm `POST /goals/:id/health` writes the same computed level to both `goals.health_level` and the newest `goal_health_records` row (it does today), so any mismatch is stale data or a non-current newest record. In `app/app/goal-detail.tsx`, make the displayed trend's current ("now") cell derive from the **same** value the headline uses (`goal.health_level`) when the newest record's `week_start_date` is the current week; otherwise show the record's own value but do **not** label it "this week" (see 9.2). Keep `trendWeeks` construction (lines ~96–102) but pass the headline value through so the rightmost bar matches the headline. Document the confirmed root cause in Open Questions.
  - Files: `app/app/goal-detail.tsx`, possibly `app/app/components/HealthTrack.tsx` (`HealthDots` props).
  - Based on: user report; release-1 Phase 2.1/5.3 set-health path.
  - Validate: 🤖 `tsc` + component test (headline level === the highlighted "now" bar level for the same goal); 👤 a rated goal shows identical headline + trend-now.

- [x] **9.2 — Fix the "This week" label placement/meaning**
  - Build: in `app/app/components/HealthTrack.tsx` `HealthDots` (lines ~130–168), tie the "This week" header to the highlighted rightmost ("now ↑") bar rather than floating top-left disconnected from it. Only render the literal text **"This week"** when the newest record is the current week; when the newest rated week is older, show its actual short date (e.g. "Wk of Jun 8") so the label answers "what week?". Pass the newest record's `week_start_date` (or an `isCurrentWeek` flag + label) from `goal-detail.tsx` into `HealthDots`.
  - Files: `app/app/components/HealthTrack.tsx`, `app/app/goal-detail.tsx`.
  - Based on: user question ("why 'This week'? what week?").
  - Validate: 🤖 `tsc` + component test (newest = current week → "This week"; newest older → dated label); 👤 the trend header reads honestly and sits with the "now" bar.

### 👤 User check-in (end of Phase 9)
Open a rated goal: headline "Goal health" and the trend's current value match exactly; the trend header clearly belongs to the rightmost bar and names the right week.

### End-of-phase admin ✅
- [x] Marked 9.1–9.2; root cause recorded in Open Questions below.
- [x] **Docs done:** `docs/ui/components.jsx` (`HealthDots`) — added `nowLabel` prop, right-aligned the header to sit over the now-bar, dated-when-stale behavior. `docs/requirements-lens.md` — added a "Display consistency" bullet (trend now-value single-sourced from `health_level`; "This week" label only when the newest rating is the current week).
- **Validation:** 🤖 `tsc --noEmit` clean; `npm test` HealthDots → 4/4 pass (now-bar level matches newest week; default "This week"; dated label when stale; no header on empty trend).

**9.1 root cause (confirmed):** `routes/goals.ts:145–167` computes `health_level` **once** via `calculateGoalHealth` and writes the *identical* value to both the `goal_health_records` upsert and the `goals` row; `useSetGoalHealth` invalidates both `['goals']` and `['goal-health-records']`. So a freshly-rated goal is already consistent — any mismatch you saw was **stale pre-Phase-5 record data** (old-model `health_level` on an old record) or a transient before refetch. Fix is defensive: the Goal Detail now-cell is **single-sourced** from `goal.health_level`, so headline and trend-now can never disagree regardless of stale records.

---

## Phase 10 — Stats moves into Settings (3-tab bottom nav)

**Outcome:** The bottom nav has **3** tabs (This Week · Backlog · Goals). Stats is reached from a Settings row; its screen content is unchanged.

### Tasks

- [x] **10.1 — Relocate the Stats screen under Settings**
  - Build: move `app/app/(tabs)/stats.tsx` → `app/app/settings/stats.tsx` (content unchanged; both dirs are at `app/app/X` depth so `../../lib` / `../components` relative imports stay valid — verified). Register `<Stack.Screen name="stats" />` in `app/app/settings/_layout.tsx`. Add a **Stats** row to `app/app/settings/index.tsx` (same `styles.row` pattern as "Manage Themes"/"Reminders", `bar-chart` icon → `router.push('/settings/stats')`). Ensure the Stats screen's own back affordance returns to Settings (header back / `router.back()`).
  - Files: `app/app/settings/stats.tsx` (moved), `app/app/(tabs)/stats.tsx` (deleted), `app/app/settings/_layout.tsx`, `app/app/settings/index.tsx`.
  - Based on: user request; `settings/index.tsx` row pattern; Expo Router v55 (read `https://docs.expo.dev/versions/v55.0.0/` before moving routes, per `app/AGENTS.md`).
  - Validate: 🤖 `tsc`; 👤 Settings → Stats opens the stats screen and back returns to Settings.

- [x] **10.2 — Drop the Stats tab from the bottom nav**
  - Build: remove `stats` from the `TABS` array in `app/app/components/TabBar.tsx` (lines ~8–13) and remove `<Tabs.Screen name="stats" />` from `app/app/(tabs)/_layout.tsx`. Confirm the 3 remaining tabs lay out correctly (`justifyContent: space-around` already adapts). Verify no other code routes to `/(tabs)/stats`.
  - Files: `app/app/components/TabBar.tsx`, `app/app/(tabs)/_layout.tsx`.
  - Based on: user request.
  - Validate: 🤖 `tsc` + grep for stale `(tabs)/stats` / `name: 'stats'` references; 👤 bottom nav shows exactly 3 tabs, evenly spaced, FAB unaffected.

### 👤 User check-in (end of Phase 10)
Confirm the bottom nav is This Week · Backlog · Goals (3 tabs), the FAB still sits correctly, and Stats is reachable and back-navigable from Settings.

### End-of-phase admin ✅
- [x] Marked 10.1–10.2.
- [x] **Docs done:** `docs/ui/NAVIGATION.md` — "Tab bar · Stats" entry struck (→ Settings → Stats); "04 · Stats" reframed as a pushed Settings screen with a back chevron. `docs/ui/components.jsx:132` — `stats` removed from the prototype `TabBar` array (3 tabs). `docs/ux-lens.md` — tab table → **3 tabs**; "Secondary tabs" line, the Sunday-review Stats line, and the gear-icon line all updated to Stats-in-Settings. `docs/product-lens.md` — no change needed (references only the still-valid "Goals tab", no tab list).
- **Note:** the prototype has **no Settings *screen*** (the app's Settings was built without a prototype counterpart), so there was no prototype Settings row to add — the nav-array removal + NAVIGATION.md fully capture the move on the design side.
- **Validation:** 🤖 `tsc --noEmit` clean; full `npm test` → **33/33 pass** (file move + tab removal broke nothing); grep confirms no stale `(tabs)/stats` / `navigate('stats')` references (only the legit `settings/_layout.tsx` registration remains).

---

## Phase 11 — Task ↔ goal visibility

**Outcome:** Tapping a task shows which goal it serves (or "No goal"), and task rows carry a subtle marker when goal-linked.

### Tasks

- [x] **11.1 — Show the linked goal in the task detail sheet**
  - Build: in `app/app/components/TaskDetailSheet.tsx`, add a "Goal" line near the Details block: read goals via `useGoals()`, resolve `task.goal_id` → goal title. Show `◎ <goal title>` (tap → close sheet, then `router.push('/goal-detail?goalId=...')`) or a muted "No goal" when `goal_id` is null. Match the existing `reminderRow`/chip styling; keep it read-only (re-linking a task to a goal is out of scope for this pass).
  - Files: `app/app/components/TaskDetailSheet.tsx`.
  - Based on: user request; `Task.goal_id` (in `useTasks.ts` / `TaskRow` props), `useGoals.ts`.
  - Validate: 🤖 `tsc` + component test (goal-linked task → goal title renders; unlinked → "No goal"); 👤 tap a goal-linked task → sheet shows its goal and tapping it opens Goal Detail.

- [x] **11.2 — Subtle goal marker on task rows**
  - Build: add a quiet goal-linked indicator (small `target` icon or dot in the meta row, low-emphasis `colors.text3`) when `task.goal_id` is set, in BOTH row renderers: shared `app/app/components/TaskRow.tsx` (used by This Week + Goal Detail) `taskMeta` block, and `app/app/(tabs)/backlog.tsx` `BacklogTaskRow` (~73). Keep it subtle — not a full chip. (Goal Detail's own task lists may suppress it since every row there is the same goal — optional prop to hide.)
  - Files: `app/app/components/TaskRow.tsx`, `app/app/(tabs)/backlog.tsx`.
  - Based on: user request ("subtle, but something").
  - Validate: 🤖 `tsc` + component test (`TaskRow` shows the marker when `goal_id` set, hides when null); 👤 goal-linked tasks are visually distinguishable in This Week + Backlog without clutter.

- [x] **11.3 — Goal Detail task rows open the Task detail sheet** *(done early — user-requested 2026-06-18, ahead of 11.1/11.2)*
  - Build: in `app/app/goal-detail.tsx`, the "Tasks this week" + "All tasks" `TaskRow`s were display-only (checkbox toggle only). Wired `onPressBody={() => setSelectedTask(task)}` on both lists and rendered the shared `<TaskDetailSheet task={selectedTask} themes={themes ?? []} onClose={…} />` — identical behavior to This Week / Backlog. `useGoalTasks` keys on `['tasks','goal',…]`, and the sheet's update/delete mutations invalidate the `['tasks']` prefix, so the goal lists refresh after an edit/delete.
  - Files: `app/app/goal-detail.tsx`.
  - Validate: 🤖 `tsc --noEmit` clean; full `npm test` → 33/33 (no regressions); 👤 in Goal Detail, tap a task body → Task detail sheet opens; edits/deletes reflect back in the goal's lists.
  - **Docs done:** `docs/ui/NAVIGATION.md` screen 07 — documented the Tasks-this-week / All-tasks sections + "Task row · body → 20 · Task detail" / "circle → toggle"; `docs/ux-lens.md` Goal Detail sections 4–5 — tap-body-opens-Task-detail noted (and "four"→"five sections"). *(Also fixed while here: NAVIGATION.md screen 08 milestone chips were still "1w/2w/1m/6w" — updated to the six presets + added the Delete-milestone row, completing Phase 8's design-doc coherence.)*

### 👤 User check-in (end of Phase 11)
Scan This Week + Backlog (goal-linked tasks carry a subtle marker), then tap a task to confirm the sheet names its goal and links through to Goal Detail. **Also:** in Goal Detail, tap a task in "Tasks this week" / "All tasks" → the same Task detail sheet opens.

### End-of-phase admin ✅
- [x] Marked 11.1–11.3.
- [x] **Docs done:** `docs/ui/screens-modals.jsx` (`TaskDetail`) — replaced the static "Goal" chip with a **tappable Goal row** (→ Goal detail) matching the shipped design + approved preview. `docs/ui/components.jsx` (`Task`) — swapped the labeled `GoalChip` for a **subtle target glyph** (the agreed "subtle, not a chip" decision). `docs/ux-lens.md` — added a "Seeing a task's goal" row (subtle marker on rows + Goal row in the detail sheet; read-only; suppressed inside Goal Detail). `domain-lens.md` — unchanged (already models the task↔goal link; this is surfacing only).
- **Validation:** 🤖 `tsc --noEmit` clean; full `npm test` → **36/36 pass** (incl. new `TaskRowGoalMarker` 3/3: marker shown when linked, hidden when not, suppressed via `hideGoalMarker`). 11.1's goal-row lookup is a simple `find` over `useGoals` — covered by `tsc`; the sheet is a heavy multi-hook modal so its render is a 👤 device check (consistent with the 6.2 stance on full-screen components).

---

## Phase 12 — Baseline coherence + commit

**Outcome:** The main `/docs` lenses + `/docs/ui` prototype are internally coherent with the adjustments, and the changes are committed.

### Tasks

- [x] **12.1 — Coherence pass**
  - **Done:** swept `/docs` for stale phrases. Fixed in the **main baseline**: `ui/ui-brief.md` (4-tab table → 3 tabs + Stats-in-Settings; Coach "may be removed" → removed), `ui/app.jsx` (design-canvas "four tabs" → three), `ui/NAVIGATION.md:171` (Coach scope-flag → button removed, no entry point). Left intentionally: discovery Q&A history (`ux-lens.md:213`), the dated `docs/releases/release-1/*` archive, and `techstack.md:29` ("may be removed" = unused deps, not Coach).
  - Build: re-read the touched main lenses (`product-lens`, `ux-lens`, `requirements-lens`, `domain-lens`, `ai-architecture`, `database_design`) + `NAVIGATION.md` for dangling references (no lingering "4 tabs", "Coach me button present", "+ to add new", old milestone presets). Confirm `/docs/ui` prototype matches the shipped adjustments.
  - Validate: 🤖 grep the lenses + prototype for the stale phrases above; 👤 quick sanity read.

- [ ] **12.2 — Commit + push** *(on your go-ahead)*
  - Build: PowerShell git — quote parenthesized paths (`"app/app/(tabs)/goals.tsx"`, `"app/app/(tabs)/_layout.tsx"`), here-string commit message. Push to `main` (Render auto-deploys backend — no backend change here, so deploy is a no-op).
  - Validate: 🤖 `git status` clean after; 👤 confirm.

### End-of-phase admin
- Mark 12.1–12.2 and all adjustment tasks complete.
- `CLAUDE.md` **Current work** can move past `release-1` once you accept these adjustments.

---

## Open questions (adjustments)

- **9.1 root cause:** confirm during implementation whether the headline/trend mismatch you saw was stale pre-Phase-5 data or a non-current newest record; record the finding. Default fix (single-source the "now" cell + honest label) covers both regardless.
- **11.2 scope:** marker is read-only visibility only; re-assigning a task's goal from the row/sheet is intentionally out of scope unless you ask for it.
