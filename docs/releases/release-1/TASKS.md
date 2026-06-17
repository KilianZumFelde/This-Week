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

- [ ] **4.1 — Make the Sunday flow fire when there are active goals (even with 0 leftovers)**
  - Build: in `performRollover`, also create the ritual (or an equivalent pending marker) when the user has ≥1 active goal, not only when `openPrevTasks.length > 0` — so the goal step runs every Sunday. Keep idempotency (the `week_records` guard) intact. Decide the cleanest shape: reuse `carry_over_rituals` with zero decisions, vs. a separate flag. **Record the choice + rationale in Open Questions.**
  - Files: `backend/src/services/rollover.ts`, possibly `backend/src/routes/carry-over.ts` (pending payload), `backend/src/routes/rollover.ts`.
  - Based on: `ux-lens.md` (goal step runs per active goal every Sunday), `requirements-lens.md` (ordering), `NAVIGATION.md` 16.
  - Validate: 🤖 unit/`.inject()` on the trigger logic (active goal + no leftovers → ritual created; no goals + no leftovers → none); 👤 full ritual on a clean week.

- [ ] **4.2 — Backend: AI goal-task suggestion route**
  - Build: `POST /ai/suggest-goal-tasks` in `backend/src/routes/ai.ts` (pattern from `/ai/capture`). Input: goal (title, why, target_date, health_level), nearest milestone, the goal's existing this-week + open/backlog task titles, themes, optional clarifying answers. Anthropic **tool use** forced `tool_choice` on `suggest_goal_tasks` → `{title, theme_id?, effort_level?, return_level?}[]` (**effort/return enums = `low|medium|high|unknown`**, matching `request-schemas.ts`); Zod-validate. **Soft-fail:** no tool_use / Zod reject / empty → return `{ items: [] }` (NOT 422). Model `claude-sonnet-4-6`, `max_tokens ≈ 512`. Never auto-create. Optional metadata-only log to `ai_capture_logs`.
  - Files: `backend/src/routes/ai.ts`.
  - Based on: `ai-architecture.md`, `requirements-lens.md` (bounded AI).
  - Validate: 🤖 unit-test the parse/validate/soft-fail path with a stubbed Anthropic response (success, empty, malformed → all return cleanly, no 5xx); 🤖 **live curl** (test-user JWT) with a real goal context → returns additional non-duplicate drafts; bad API key → `{ items: [] }`, no 5xx. 👤 real suggestions in-app.

- [ ] **4.3 — Frontend: Reflect sub-screen**
  - Build: `app/app/carry-goal-reflect.tsx` ported from `screens-r1.jsx` `CarryGoalReflect`: "Goal N of M · reflect" header, step dots, goal title + next-milestone line, two mandatory chip-group questions (Progress: A lot/Some/Barely/Nothing · Confidence: Yes/Maybe/No), "Plan this week →" disabled until both answered. On advance → `useSetGoalHealth` (2.1) with the entered week's `week_start_date`, then go to Plan. **Gap-catch** (no active milestone): show "Add milestone" (→ MilestoneSheet) instead of questions. **Overdue:** brick-red milestone line with inline "Mark hit" (→ SetNextMilestone) / "Push date" (→ MilestoneSheet edit).
  - Files: `app/app/carry-goal-reflect.tsx`.
  - Based on: `ui-brief.md` Screen 5 Reflect, `NAVIGATION.md` 16/16c.
  - Validate: 🤖 `tsc` + component test ("Plan this week" disabled until both questions answered; gap-catch variant shows "Add milestone" instead of questions); 👤 health record written (check DB via live call); overdue path on device.

- [ ] **4.4 — Frontend: Plan sub-screen**
  - Build: `app/app/carry-goal-plan.tsx` ported from `screens-r1.jsx` `CarryGoalPlan`: "Goal N of M · plan" header, "Toward: [milestone]" line, **tap-to-add** list of the goal's open/backlog tasks (tap → set `week_assignment='this_week'` + current week via existing task update hook; sage "Added"), **"Anything to add?"** AI button (calls 4.2; draft cards each needing explicit confirm → create real task pre-linked to goal + this week), persistent **"+" FAB** (tap = new task pre-linked to this goal + this week; hold = dictate — reuse existing FAB/quick-add), "Next goal"/"Continue". All Plan actions optional.
  - Files: `app/app/carry-goal-plan.tsx`.
  - Based on: `ui-brief.md` Screen 5 Plan, `NAVIGATION.md` 16b, `requirements-lens.md` (AI never primary / never auto-create).
  - Validate: 🤖 `tsc`; 👤 tap-to-add moves task; AI requires confirm; FAB creates pre-linked task; Continue advances.

- [ ] **4.5 — Wire goal step into the ritual sequence + iteration + guards**
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

- [ ] **5.1 — Date helper: `subtractWeeks(weekStartDate, n)`**
  - Build: add `subtractWeeks(weekStartDate: string, n: number): string` to `backend/src/lib/dateUtils.ts`, alongside the existing `getPreviousWeekStartDate` (which already does the `n=1` case via `new Date(\`${d}T00:00:00\`)` + `setDate(-7)` — reuse that exact date-only pattern; **do not** use UTC parsing or local-time arithmetic that can drift around DST/midnight). Date-only `YYYY-MM-DD` in/out.
  - Files: `backend/src/lib/dateUtils.ts`.
  - Based on: ChatGPT spec §Date handling; existing `getPreviousWeekStartDate`.
  - Validate: 🤖 vitest — `subtractWeeks("2026-06-15",1)==="2026-06-08"`, `…,2)==="2026-06-01"`, `…,3)==="2026-05-25"`; a case crossing a DST boundary stays exact.

- [ ] **5.2 — Rewrite `goalHealth.ts` as the history-aware pure model**
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

- [ ] **5.3 — Feed history into the set-health endpoint**
  - Build: in `POST /goals/:id/health` (`backend/src/routes/goals.ts`, ~line 127), **before** computing: fetch the goal's recent `goal_health_records` (`select progress_answer, confidence_answer, week_start_date, goal_id`, `eq goal_id`, `eq user_id`, `week_start_date <= week_start_date`, `order desc`, `limit 5`). Build `current` from the request body, call `calculateGoalHealth(current, records)` (the pure fn already dedupes/excludes the stored current-week row in favour of the in-memory answers), then upsert + update the `goals` row with the **computed** level exactly as today. Replace the current `computeHealthLevel(progress, confidence)` call.
  - Files: `backend/src/routes/goals.ts`.
  - Based on: ChatGPT spec §Persistence behavior, §Backward compatibility.
  - Validate: 🤖 **live curl** (test-user JWT, local backend) — seed `nothing+maybe` for week N−1, then POST `nothing+maybe` for week N → `behind` (stagnation kicks in); POST `a_lot+yes` for week N after two `nothing+no` weeks → `ahead` (recovery, streak doesn't apply); a non-contiguous prior week → ignored. Confirm one row per `(goal_id, week_start_date)` (no double-count on re-POST of the same week).

- [ ] **5.4 — Tests for the history-aware model** *(replaces the old 12-pair test)*
  - Build: rewrite `backend/src/tests/goalHealth.test.ts` to cover **all 14 required cases**: (1) 12 base/no-history pairs against the *new* base table; (2) no-history behavior; (3) 2× `nothing+maybe` → behind; (4) 3× stagnation; (5) 2× `a_lot+no` → behind; (6) 3× `no` confidence; (7) 2× `a_lot+yes` → well_ahead; (8) 3× `some+yes` → ahead; (9) positive **not** applied when a negative applies; (10) missing week breaks streak (`2026-06-01` + `2026-06-15`, missing `06-08` → slightly_behind); (11) records from other goals ignored; (12) existing record for the current week not double-counted (stored differs from in-memory → in-memory wins); (13) final score clamped Behind…Well ahead; (14) recovery (`nothing+no` ×2 then `a_lot+yes` → ahead).
  - Files: `backend/src/tests/goalHealth.test.ts`.
  - Based on: ChatGPT spec §Expected examples / §Testing requirements.
  - Validate: 🤖 `npm test` (backend) green.

- [ ] **5.5 — UI: surface the model honestly (no new questions)**
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

- [ ] **6.2 — Tests for new logic**
  - Build: backend Vitest for the **history-aware `calculateGoalHealth`** (the 14 cases — owned by Phase 5.4), `validateMilestoneDate`, the AI soft-fail path, and the 4.1 trigger logic; frontend jest tests for `cursorPosition` + the component tests written across Phases 1–4 (Track, card variants, This Week section omission, Reflect gating). Patterns from `backend/src/tests/` + `app/lib/__tests__/`.
  - Validate: 🤖 `npm test` (backend) and `npm test` (app) both green.

- [ ] **6.3 — Baseline fold-back (per CLAUDE.md Releases: Fold-Back)**
  - Build: merge release-1 deltas into main `/docs` lenses (product / domain / requirements / ux / database_design / ai-architecture): Milestone + goal health + GoalHealthRecord into domain & database baselines; goal step + two signals into ux/requirements; AI suggestion into ai-architecture; **the history-aware health model + retuned base table (Phase 5) into the requirements & database baselines** (carry over the same wording fixes made to the release-1 deltas in 5.5 admin). Keep `docs/releases/release-1/` as a dated archive. `/docs/ui` already current — no UI fold-back.
  - Validate: 🤖 re-read main lenses for dangling release-only language; 👤 sanity confirm.

- [ ] **6.4 — Commit + push**
  - Build: commit + push to `main` (PowerShell git; quote parenthesized paths; here-string message). Render auto-deploys backend.
  - Validate: 🤖 `git status` clean; 👤 backend healthy at `https://this-week.onrender.com`.

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
