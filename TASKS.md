
# TASKS.md — Weekly Focus App

## Status Key
- `[ ]` — not started
- `[~]` — in progress
- `[x]` — complete
- `[-]` — skipped / deferred

---

## Open Questions
1. Should `theme_id` on goals be required or optional? (DATABASE_DESIGN.md open question #1) — **Assumption: optional for now; backend accepts null.**
2. Should backlog tasks preserve their previous `week_start_date` in a separate column? — **Assumption: no; set to null on backlog move.**
3. Should deleted/dropped tasks have an audit trail beyond carry-over decisions? — **Assumption: no; hard delete only.**
4. Should AI capture logs store sanitized input/output previews? — **Assumption: metadata only in v1.**
5. Secondary goal cap: backend only or DB trigger too? — **Assumption: backend only.**

---

## Phase 0 — Repository & Infrastructure Setup

**Outcome**: Monorepo running locally. Expo app launches on Android device via Expo Go. Backend starts. Supabase connected. Env files in place.

### Tasks

- [x] **P0-1** Create monorepo folder structure: `/app`, `/backend`, `/packages/shared`, `/supabase`, `/docs` (docs already exists).
  - Run `mkdir app backend packages/shared supabase` at project root.
  - Based on: TECHSTACK.md § Repository Structure.
  - Validate: directories exist.

- [x] **P0-2** Initialize Expo app in `/app` with TypeScript template.
  - Configured Expo Router, NativeWind, babel, metro, tailwind, global.css.
  - Using EAS dev build instead of Expo Go (Expo Go only supports SDK 54; project is SDK 55).
  - Added expo-dev-client, react-native-worklets (required peer dep for reanimated 4.x), eas.json.
  - Validate: app loads on Android via dev client showing "This Week" screen. ✓

- [x] **P0-3** Initialize Fastify backend in `/backend` with TypeScript.
  - Validate: `npm run dev` starts; `curl http://localhost:3000/health` returns `{"ok":true}`. ✓

- [x] **P0-4** Initialize shared package in `/packages/shared`.
  - `package.json`, `tsconfig.json`, `src/index.ts` created. npm install done. ✓

- [x] **P0-5** Create `/docs/credentials.md` and `/docs/env.md`.
  - `credentials.md`: template for Supabase project URL, anon key, service role key, Anthropic API key, Expo push credentials.
  - `env.md`: lists all required env vars per TECHSTACK.md § Configuration, with instructions for where to set them (`.env` in `/backend`, `app.config.js` or `.env` in `/app`).
  - Based on: TECHSTACK.md § Configuration; CLAUDE.md § Credentials and environment.
  - Validate: files exist and contain all required variable names.

- [x] **P0-6** **[User setup]** Create Supabase project at supabase.com.
  - Project name: "weekly-focus-dev", region: nearest.
  - Copy URL, anon key, service role key into `docs/credentials.md`.
  - Validate: Supabase dashboard accessible; credentials recorded. ✓

- [x] **P0-7** Wire environment variables into backend and app.
  - `/backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `BACKEND_PUBLIC_URL`.
  - `/app/.env` (or `app.config.js`): `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
  - Add `.env` to `.gitignore`.
  - Based on: TECHSTACK.md § Configuration.
  - Validate: backend reads `process.env.SUPABASE_URL` at startup without error. ✓
  - Note: `ANTHROPIC_API_KEY` left as `<FILL IN>` — needed for Phase 5 AI features only.

### End-of-Phase Admin
- [x] Mark completed tasks above. All P0 tasks complete.
- [x] Deferred: `ANTHROPIC_API_KEY` — user to fill in from console.anthropic.com before Phase 5.
- [x] Git commit: `feat(p0): monorepo scaffold, Expo app, Fastify backend, shared package, env setup`

---

## Phase 1 — Authentication

**Outcome**: User can sign in with Supabase email+password. Auth session persists across app restarts. Backend validates JWT and returns 401 for unauthenticated requests.

### Tasks

- [x] **P1-1** Add `@supabase/supabase-js` to `/app` and initialize the Supabase client.
  - `src/lib/supabase.ts`: create client with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
  - Use `AsyncStorage` as the storage adapter for session persistence.
  - Based on: TECHSTACK.md § Database and Auth.
  - Validate: client initializes without errors; no console errors on app boot.

- [x] **P1-2** Build a minimal Sign In screen in the app.
  - Route: `app/(auth)/sign-in.tsx`.
  - Fields: email, password. Submit calls `supabase.auth.signInWithPassword()`.
  - On success: redirect to `/(tabs)/index` (This Week).
  - Based on: UX lens (no onboarding flow; first launch lands on This Week or auth).
  - Validate: sign in with a test Supabase user succeeds; app navigates to main tab.

- [x] **P1-3** Add Expo Router auth guard.
  - Root layout (`app/_layout.tsx`) checks session; redirects unauthenticated users to sign-in.
  - Based on: Expo Router docs (layout-level auth guards).
  - Validate: navigating to `/(tabs)` without session redirects to sign-in.

- [x] **P1-4** Add JWT auth middleware to the Fastify backend.
  - Uses Supabase `auth.getUser(token)` — no separate JWT library needed.
  - Attach `request.userId` (from user.id) to all authenticated routes.
  - Return 401 if no valid token.
  - Based on: TECHSTACK.md § Database and Auth.
  - Validate: `curl -H "Authorization: Bearer <valid_token>" http://localhost:3000/me` returns 200; without token returns 401.

- [x] **P1-5** Create `/me` endpoint that returns user ID.
  - `GET /me → { userId: string }` — confirms auth flow end-to-end.
  - Based on: TECHSTACK.md § Backend.
  - Validate: app can call `/me` with Supabase session token and receive user ID.

- [x] **P1-6** On first login, auto-create `profiles` and `user_settings` rows.
  - Backend `POST /auth/bootstrap` (called after sign-in): upsert `profiles` and `user_settings` for the user.
  - Seed 4 default themes (Health, Career, Personal, Learning) if none exist.
  - Based on: DATABASE_DESIGN.md § Initial Seed Data; requirements-lens (first-run experience is just the empty This Week state).
  - Validate: after sign-in, Supabase table `profiles`, `user_settings`, and `themes` each have one row for the user.
  - **Status**: Tables now exist (Phase 2 complete). Re-validate by signing in and checking Supabase for profiles/user_settings/themes rows.

### User Check-In
After P1-6: open app → sign in → confirm This Week screen loads. Confirm 4 default themes exist in Supabase.

### End-of-Phase Admin
- [x] Mark completed tasks. All P1-1 through P1-6 complete (implemented in prior session, recovered by code inspection).
- [x] Deviation: P1-4 uses `supabase.auth.getUser(token)` instead of a JWT library — simpler and equally valid.
- [x] Git commit: `feat(p1): Supabase auth, sign-in screen, auth guard, JWT middleware, bootstrap endpoint`

---

## Phase 2 — Database Migrations

**Outcome**: All tables, enums, constraints, indexes, and RLS policies applied to Supabase dev project. Schema matches DATABASE_DESIGN.md exactly.

### Tasks

- [-] **P2-1** Set up Supabase CLI and migration folder.
  - Skipped CLI install — supabase CLI not installable on this machine via winget/npm. Used Supabase Dashboard SQL Editor instead (see P2-2 note).

- [x] **P2-2** Migration 001: core tables.
  - File: `supabase/migrations/001_core_tables.sql`.
  - Applied via `supabase/migrations/run_all.sql` pasted into Supabase Dashboard SQL Editor. ✓

- [x] **P2-3** Migration 002: weekly records + habit records.
  - File: `supabase/migrations/002_weekly_records.sql`. Applied in run_all.sql. ✓

- [x] **P2-4** Migration 003: notifications + reminders.
  - File: `supabase/migrations/003_notifications.sql`. Applied in run_all.sql. ✓

- [x] **P2-5** Migration 004: carry-over + AI logs.
  - File: `supabase/migrations/004_carryover_ai.sql`. Applied in run_all.sql. ✓

- [x] **P2-6** Migration 005: RLS policies.
  - File: `supabase/migrations/005_rls.sql`. Applied in run_all.sql. ✓

- [x] **P2-7** Migration 006: updated_at triggers.
  - File: `supabase/migrations/006_triggers.sql`. Applied in run_all.sql. ✓

### End-of-Phase Admin
- [x] Mark completed tasks. P2-2 through P2-7 complete. P2-1 skipped (no CLI; SQL editor used).
- [x] Schema confirmed applied — Supabase SQL Editor returned success with no errors.
- Note: Future migrations should be applied the same way — paste into Supabase Dashboard SQL Editor.
- [x] Git commit: `feat(p2): SQL migrations for all tables, RLS policies, indexes, and triggers`

---

## Phase 3 — Shared Types Package

**Outcome**: All shared Zod schemas, TypeScript types, and enum constants defined in `/packages/shared` and imported by both `/app` and `/backend`.

### Tasks

- [x] **P3-1** Define all enums in `/packages/shared/src/enums.ts`.
  - `GoalType`, `GoalStatus`, `TaskStatus`, `TaskWeekAssignment`, `EffortLevel`, `ReturnLevel`, `HabitStatus`, `ReminderStatus`, `ReminderKind`, `CarryOverRitualStatus`, `CarryOverDecision`, `NotificationPlatform`.
  - Based on: DATABASE_DESIGN.md § Enums.
  - Validate: `tsc --noEmit` passes in `/packages/shared`. ✓

- [x] **P3-2** Define Zod schemas and TypeScript types for all entities.
  - `Theme`, `Goal`, `Task`, `Habit`, `HabitWeekRecord`, `WeekRecord`, `Reminder`, `CarryOverRitual`, `CarryOverTaskDecision`, `NotificationToken`, `UserSettings`, `Profile`.
  - Export from `src/index.ts`.
  - Based on: DATABASE_DESIGN.md § Tables.
  - Validate: schemas compile; inferred types match table shapes. ✓

- [x] **P3-3** Define request/response Zod schemas for all API endpoints (to be used by backend routes and app API clients).
  - `CreateTaskRequest`, `UpdateTaskRequest`, `ListTasksQuery`, `CreateHabitRequest`, `UpdateHabitRequest`, `CreateThemeRequest`, `UpdateThemeRequest`, `CreateGoalRequest`, `UpdateGoalRequest`, `CreateReminderRequest`, `UpdateReminderRequest`, `SubmitCarryOverDecisionRequest`, `UpdateUserSettingsRequest`, `RegisterNotificationTokenRequest`.
  - Based on: DATABASE_DESIGN.md; requirements-lens.
  - Validate: `tsc --noEmit` passes. ✓

### End-of-Phase Admin
- [x] Mark completed tasks. All P3-1 through P3-3 complete.
- Files: `packages/shared/src/enums.ts`, `packages/shared/src/schemas.ts`, `packages/shared/src/api.ts`. All re-exported from `src/index.ts`.
- [x] Git commit: `feat(p3): shared enums, entity schemas, and API request/response types`

---

## Phase 4 — This Week: Tasks + Habits (Core Loop)

**Outcome**: This Week screen shows tasks and habits for the current week. User can add/complete/delete tasks and increment/decrement habits. Data persists to Supabase via backend API. Undo snackbar works.

### Tasks

#### Backend

- [x] **P4-1** Themes CRUD endpoints.
  - `GET /themes` — list user's active themes.
  - `POST /themes` — create theme.
  - `PATCH /themes/:id` — update name/color/icon/sort_order.
  - `DELETE /themes/:id` — delete theme (only if no linked active tasks/habits/goals; otherwise 400).
  - Based on: DATABASE_DESIGN.md § themes; domain-lens § Lifecycles.
  - Validate: create theme, read it back, update name, delete it via curl.

- [x] **P4-2** Tasks CRUD endpoints.
  - `GET /tasks?week_assignment=this_week&week_start_date=YYYY-MM-DD` — list this week's open tasks.
  - `POST /tasks` — create task (default `week_assignment=this_week`, `week_start_date=current_sunday`).
  - `PATCH /tasks/:id` — update any field.
  - `DELETE /tasks/:id` — hard delete.
  - `POST /tasks/:id/complete` — set `status=done`, `completed_at=now()`.
  - `POST /tasks/:id/reopen` — set `status=open`, `completed_at=null` (only if same week, not after Sunday flip).
  - Based on: DATABASE_DESIGN.md § tasks; requirements-lens § Definition of done; domain-lens § Lifecycles.
  - Validate: create task, complete it, reopen it, delete it.

- [x] **P4-3** Habits CRUD endpoints.
  - `GET /habits?status=active` — list active habits.
  - `POST /habits` — create habit (also creates this week's `habit_week_records` row).
  - `PATCH /habits/:id` — update fields.
  - `DELETE /habits/:id` — soft-window delete: mark for deletion; wipe records after Undo window (6s in v1, backend does immediate delete for now — streaks/records deleted in same transaction).
  - `POST /habits/:id/increment` — increment `completed_count` on current week's record.
  - Based on: DATABASE_DESIGN.md § habits, habit_week_records; domain-lens § Lifecycles.
  - Validate: create habit, increment count 3x, check `completed_count=3`.

- [x] **P4-4** Current week resolution helper (shared backend utility).
  - Given a `timezone` string, compute the current `week_start_date` (most recent Sunday in that timezone).
  - Used by tasks and habits endpoints.
  - Based on: DATABASE_DESIGN.md § Week Definition.
  - Validate: unit test — given a Wednesday in `Europe/Berlin`, returns the Sunday 4 days prior.

#### Frontend

- [x] **P4-5** Bottom tab bar navigation shell.
  - File: `app/(tabs)/_layout.tsx`.
  - Prototype reference: `docs/ui/components.jsx` → `TabBar` + `FabPair` components; `docs/ui/styles.css` → `.tabbar`, `.fab`, `.fab.small`, `.fab-pair` rules.
  - **Tab bar** — implement exactly as `TabBar` in components.jsx:
    - 4 tabs in order: id=`home` label="This Week" icon=`home`, id=`backlog` label="Backlog" icon=`inbox`, id=`goals` label="Goals" icon=`target`, id=`stats` label="Stats" icon=`bar`.
    - Position: `position: absolute; left: 16px; right: 16px; bottom: 14px; height: 64px; padding: 0 10px; z-index: 4`.
    - Glass background: `color-mix(in oklab, var(--surface) 86%, transparent)` with `backdrop-filter: blur(20px) saturate(140%)`.
    - Shape: `border-radius: 22px; box-shadow: 0 14px 36px rgba(0,0,0,0.32), 0 0 0 1px var(--hairline)`.
    - Tab button: column layout, `gap: 3px; font-size: 10.5px; letter-spacing: 0.01em; font-weight: 500; border-radius: 12px`.
    - Active state: `color: var(--accent-strong)` on both label text and SVG icon — no background fill on active tab button.
  - **FAB pair** — implement exactly as `FabPair` in components.jsx:
    - Container: `position: absolute; right: 22px; bottom: 92px; flex-direction: column; gap: 10px; align-items: center; z-index: 5`.
    - Mic FAB (bottom, larger): `width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: #1a1816; box-shadow: 0 12px 28px rgba(200,120,86,0.32), 0 2px 6px rgba(0,0,0,0.28)` — mic icon size=22 stroke=1.8.
    - + FAB (top, smaller): `width: 44px; height: 44px; border-radius: 50%; background: var(--surface-hi); color: var(--text); box-shadow: 0 8px 18px rgba(0,0,0,0.30), 0 0 0 1px var(--hairline-2)` — plus icon size=20 stroke=2.
  - Wire design tokens from `docs/ui/styles.css` `:root` as React Native StyleSheet values or NativeWind CSS variables.
  - Based on: `docs/ui/components.jsx` (`TabBar`, `FabPair`); `docs/ui/styles.css` (`.tabbar`, `.fab`); `docs/ui/NAVIGATION.md` § Cross-cutting.
  - Validate: Open in Expo Go — tab bar floats with blur glass effect, does NOT fill full width. Active tab accent-strong tint on icon + label. FABs at correct position (not bottom-right edge of screen but 22px in, 92px up). Side-by-side compare with prototype.

- [x] **P4-6** This Week screen (`app/(tabs)/index.tsx`).
  - Prototype reference: `docs/ui/screens-primary.jsx` → `ThisWeek` (populated) and `ThisWeekEmpty` (first-launch empty state).
  - Prototype reference: `docs/ui/components.jsx` → `Task`, `Habit`, `Ring`, `ThemeChip`, `EffortChip`, `ReturnChip`, `GoalChip`.
  - Prototype reference: `docs/ui/styles.css` → `.page-head`, `.milestone`, `.section-label`, `.habit`, `.task`, `.theme-group`, `.done-bar`, `.seg`.

  **Page header** — match `ThisWeek` `div.page-head { padding: 8px 20px 14px }`:
    - Eyebrow above title: `fontSize: 11, letterSpacing: 0.14em, textTransform: uppercase, color: var(--text-3), fontWeight: 600, marginBottom: 4` — "Week of [date]".
    - `h1`: `fontFamily: var(--serif); fontWeight: 500; fontSize: 30px; letterSpacing: -0.02em`.
    - Gear icon-btn top-right: `width: 38px; height: 38px; border-radius: 12px` — navigates to Settings.

  **Milestone hero** — match `.milestone` + `ThisWeek` JSX:
    - `border-radius: var(--radius-lg); padding: 18px 18px 16px; overflow: hidden`.
    - Background: `radial-gradient(120% 100% at 0% 0%, rgba(200,120,86,0.16), transparent 60%), radial-gradient(120% 100% at 100% 100%, rgba(212,176,106,0.10), transparent 55%), var(--surface)`.
    - Eyebrow: `fontSize: 10.5px; letterSpacing: 0.14em; uppercase; color: var(--accent-strong); display: flex; gap: 6px` with target icon size=12 stroke=2.
    - `h2`: `fontFamily: var(--serif); fontSize: 22px; fontWeight: 500; lineHeight: 1.18; letterSpacing: -0.01em; margin: 0 0 12px`.
    - Meta row: `gap: 14px; fontSize: 12.5px; color: var(--text-2)` — pill `{ background: rgba(255,245,232,0.06); padding: 4px 9px; border-radius: 8px }` + task count text.
    - If no primary goal: render `ThisWeekEmpty` layout — quiet SVG (dashed circle + center dot, opacity 0.7), serif h2 26px "This is your week.", sub-text, two buttons (btn-primary with sparkles, btn-ghost "Add a task").

  **Habits section** — match `ThisWeek` habits block + `Habit` component:
    - Section label (`.section-label`): left "Habits", right "N/N on target" in text-3 tnum.
    - Each habit: `.habit { display: flex; alignItems: center; gap: 14px; padding: 13px 14px; border-radius: var(--radius-md); background: var(--surface); marginBottom: 8px }`.
    - `Ring` component: SVG 44px circle, background track `var(--surface-hi)` stroke=4, progress arc `var(--accent-strong)` (or `var(--gold)` when value >= target), driven by strokeDasharray from circumference × pct, `rotate(-90deg)`, transition `stroke-dasharray 0.25s ease`. Center text: value/target, `fontSize: 11, fontWeight: 600`.
    - Tap ring only → increment count. Tap habit body (name + chips area) → Habit Detail sheet.
    - Hit state: "Hit" label on right `{ fontSize: 11, color: var(--gold), letterSpacing: 0.06em, uppercase, fontWeight: 600 }`.

  **Tasks section** — match `ThisWeek` tasks block + `Task` component:
    - Section label: "Tasks · N" + `.seg` segmented control right-aligned ("Recommended" / "By theme"). `.seg button.on { background: var(--surface-hi); color: var(--text) }`.
    - Theme groups: `.theme-group { display: flex; alignItems: center; gap: 8px; margin: 18px 0 8px }` — chevDown icon size=14 stroke=2, swatch dot `width: 7px; height: 7px; border-radius: 50%`, name `{ fontSize: 12px; fontWeight: 600; letterSpacing: 0.08em; textTransform: uppercase }`, count `{ color: var(--text-3) }`.
    - Each task: `.task { display: flex; alignItems: flex-start; gap: 12px; padding: 13px 14px; border-radius: var(--radius-md); background: var(--surface); marginBottom: 8px }`.
    - Checkbox `.task .check`: `width: 22px; height: 22px; borderRadius: 50%; border: 1.5px solid var(--text-3); marginTop: 1px`. Done: `background: var(--sage); borderColor: var(--sage)` + check icon `color: var(--bg)` size=13 stroke=2.5.
    - Title: `fontSize: 14.5px; fontWeight: 450; lineHeight: 1.35; marginBottom: 6px`. Done: `color: var(--text-3); textDecoration: line-through`.
    - Meta chips: use exactly `ThemeChip` (colored bg ~13% opacity), `EffortChip` (low=slate-dim/slate, med=muted, high=brick-dim/brick), `ReturnChip` (high=gold-dim/gold, med=muted), `GoalChip` (accent-dim bg, link icon). See `components.jsx` for exact color formulas.
    - Tap circle → toggle done. Tap body → Task Detail sheet.

  **Done bar** — match `ThisWeek` done section:
    - `.done-bar { padding: 14px 4px 6px; color: var(--text-2); cursor: pointer }` with `.lbl { display: flex; gap: 8px; letterSpacing: 0.04em; textTransform: uppercase; fontSize: 11px }` — chevDown/chevRight. Collapsed by default.

  - TanStack Query: fetch habits + this week's habit_week_records; tasks filtered `week_assignment=this_week`, `week_start_date=current_sunday` (from P4-4 utility).
  - Based on: `docs/ui/screens-primary.jsx` (`ThisWeek`, `ThisWeekEmpty`); `docs/ui/components.jsx`; `docs/ui/styles.css`; `docs/ui/NAVIGATION.md` §01.
  - Validate: Run Expo Go, compare side-by-side with prototype. Check: milestone radial-gradient visible; ring animates on tap; task strikethrough on complete + moves to Done; Done collapses by default; `ThisWeekEmpty` layout matches on first launch.

- [x] **P4-7** Undo snackbar (global Zustand state).
  - `src/stores/undo-store.ts`: stores last reversible action (type + reversal function + 6s timer).
  - Component `UndoSnackbar` rendered in root layout, appears for 6s on any destructive action.
  - Actions wired: task complete, task delete, habit increment.
  - No dedicated prototype component exists — implement using the design system from `docs/ui/styles.css`: dark surface background (`var(--surface-hi)`), accent-strong "Undo" tap target, consistent border-radius and font sizing with rest of UI.
  - The snackbar is referenced in `docs/ui/screens-modals.jsx` `TaskDetail`: "Accidental? An Undo snackbar appears for ~6s after any remove." — treat that footnote text as copy reference.
  - Based on: requirements-lens § General Undo; domain-lens § Habit lifecycle.
  - Validate: complete a task, undo it within 6s, task reappears as open.

- [x] **P4-8** Quick-Add Draft Card modal (`app/(modals)/quick-add.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `QuickAddDraftInline` (Task variant) and `QuickAddHabitInline` (Habit variant).
  - Prototype reference: `docs/ui/styles.css` → `.modal-head`, `.qa-chips`, `.qa-chip`, `.qa-chip.low-conf`.
  - Manual entry only (+ FAB) for this phase; voice transcript header shown only in Phase 9.

  **Modal header** — match `.modal-head { padding: 14px 16px 12px; display: flex; alignItems: center; justifyContent: space-between }`:
    - Left: X icon-btn (size=20). Center: title (`.modal-head .title { fontFamily: var(--serif); fontSize: 17px; fontWeight: 500 }`). Right: nothing for manual mode (Phase 9 adds "1 of N" counter).

  **Type toggle pill** — match `QuickAddDraftInline` type toggle:
    - `display: inline-flex; background: var(--surface); borderRadius: 10px; padding: 3px; gap: 2px; marginBottom: 18px`.
    - Selected tab: `background: var(--accent); color: #1a1816; borderRadius: 7px; padding: 7px 16px; fontWeight: 600; fontSize: 12.5px`.
    - Unselected: `background: transparent; color: var(--text-2); padding: 7px 16px; fontWeight: 500; fontSize: 12.5px`.

  **Title field** — match `QuickAddDraftInline` title section:
    - Section label: `fontSize: 11px; letterSpacing: 0.12em; textTransform: uppercase; color: var(--text-3); fontWeight: 600; marginBottom: 8px` — "Title".
    - Input: `fontFamily: var(--serif); fontSize: 24px; fontWeight: 500; color: var(--text); lineHeight: 1.25; letterSpacing: -0.01em; borderBottom: 1px solid var(--hairline); paddingBottom: 10px; background: transparent`.

  **Detail chips (Task)** — implement inline-picker pattern from `QuickAddDraftInline`:
    - `.qa-chips { display: flex; flexWrap: wrap; gap: 8px }`.
    - Each chip: `.qa-chip { display: inline-flex; alignItems: center; gap: 6px; padding: 8px 12px; borderRadius: 12px; background: var(--surface-2); fontSize: 13px; fontWeight: 500 }`.
    - Chip key label: `.qa-chip .key { color: var(--text-3); fontSize: 11.5px; letterSpacing: 0.04em; textTransform: uppercase; fontWeight: 600; marginRight: 4px }`.
    - Tapping a chip opens an inline picker card **directly below the chip in the same scroll view** — not a separate bottom sheet. The picker card: `background: color-mix(in oklab, var(--accent-dim) 18%, var(--surface)); borderRadius: var(--radius-md); padding: 14px; boxShadow: inset 0 0 0 1px var(--accent-dim)`. Picker label `{ fontSize: 11px; letterSpacing: 0.10em; uppercase; color: var(--accent-strong); fontWeight: 600 }`.
    - Task fields in order: Theme / Effort / Return / Week / Goal (locked) / Reminder.
    - Effort picker options: Low ("Under ~30 min, no setup"), Medium ("A focused hour or so"), High ("Half-day or more, real activation cost"). Each option row: radio dot (18×18, accent when selected), label + sub text.
    - Week picker options: "This week" ("You're committing now") / "Backlog" ("For later — surfaces in Sunday set-up").

  **Detail chips (Habit)** — match `QuickAddHabitInline`:
    - Fields: Theme / Weekly count / Goal (locked). No effort/return/week.
    - Weekly count picker: 7-button grid (1×–7×), each `aspectRatio: 1/1; borderRadius: 10; background: var(--surface-2)`, selected: `background: var(--accent); color: #1a1816; fontFamily: var(--serif); fontWeight: 500; fontSize: 17px`. Below grid: explanatory text `{ fontSize: 11.5px; color: var(--text-3) }`.

  **Bottom bar** — match `QuickAddDraftInline` bottom:
    - `padding: 12px 20px 22px; display: flex; gap: 10px; borderTop: 1px solid var(--hairline)`.
    - Cancel: `btn-ghost flex: 1`. Save: `btn-primary flex: 1.4` text "Save" (or "Save habit" for habit variant).

  - Based on: `docs/ui/screens-modals.jsx` (`QuickAddDraftInline`, `QuickAddHabitInline`); `docs/ui/styles.css` (`.qa-chip`, `.modal-head`); `docs/ui/NAVIGATION.md` §06.
  - Validate: Tap +, fill title + theme + effort via inline picker, tap Save → task appears in This Week. Tap + → select Habit type → weekly count grid appears → save → habit appears. Side-by-side compare with prototype inline-picker interaction.

- [x] **P4-9** Task Detail / Edit bottom sheet (`app/(sheets)/task-detail.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `TaskDetail` function and `SheetBackdrop` function.
  - Prototype reference: `docs/ui/styles.css` → `.sheet`, `.sheet .grip`.
  - Opened by tapping task body on This Week or Backlog.

  **Backdrop** — match `SheetBackdrop`:
    - Blurred + dimmed This Week behind the sheet: `filter: blur(1px); opacity: 0.55` on the background content.
    - Scrim overlay: `position: absolute; inset: 0; background: rgba(20,18,16,0.55)`.

  **Sheet container** — match `.sheet`:
    - `position: absolute; left: 0; right: 0; bottom: 0; background: var(--surface); borderTopLeftRadius: 22px; borderTopRightRadius: 22px; padding: 12px 20px 28px; boxShadow: 0 -10px 40px rgba(0,0,0,0.40); z-index: 6`.
    - Grip: `.grip { width: 36px; height: 4px; borderRadius: 2px; background: var(--text-3); opacity: 0.35; margin: 4px auto 16px }`.

  **Title** — match `TaskDetail` title block:
    - `fontFamily: var(--serif); fontSize: 22px; fontWeight: 500; color: var(--text); lineHeight: 1.25; letterSpacing: -0.01em`.
    - `padding: 4px 2px 14px; borderBottom: 1px solid var(--hairline); marginBottom: 18px`.
    - ChevDown icon on the right: `size=16 stroke=1.8 color=var(--text-3) marginTop: 6`.
    - Tapping the title opens an editable text input (same styling, transparent bg).

  **Detail chips** — match `TaskDetail` qa-chips block:
    - "Details" section label: same uppercase 11px pattern.
    - Same `.qa-chips` + `.qa-chip` layout as Quick-Add. Fields: Theme / Effort / Return / Week / Goal.
    - Tapping a chip opens the same inline picker pattern from P4-8.

  **Reminder row** — match `TaskDetail` reminder section:
    - Separate from chips — standalone row: `display: flex; alignItems: center; gap: 12px; padding: 12px 14px; background: var(--surface-2); borderRadius: var(--radius-md); marginBottom: 22px`.
    - Bell icon size=16 stroke=1.7 color=var(--text-2).
    - Line 1: `fontSize: 13px; color: var(--text)` — scheduled time.
    - Line 2: `fontSize: 11.5px; color: var(--text-3)` — "One-time · tap to edit".
    - Right: "Edit" `{ fontSize: 11px; color: var(--accent-strong); letterSpacing: 0.06em; textTransform: uppercase; fontWeight: 600 }`.
    - If no reminder set: show add-reminder row instead.

  **Action row** — match `TaskDetail` action row:
    - `display: flex; gap: 10px`.
    - "Move to backlog": `btn-ghost flex: 1; fontSize: 13.5px` with inbox icon size=15 stroke=1.7.
    - "Delete": `btn-ghost flex: 1; fontSize: 13.5px; color: var(--brick)` with X icon.
    - Footer: "Accidental? An Undo snackbar appears for ~6s after any remove." `{ fontSize: 11.5px; color: var(--text-3); textAlign: center; marginTop: 14px; lineHeight: 1.5 }`.

  - Based on: `docs/ui/screens-modals.jsx` (`TaskDetail`, `SheetBackdrop`); `docs/ui/styles.css` (`.sheet`); `docs/ui/NAVIGATION.md` §17.
  - Validate: Tap a task body → sheet slides up over blurred This Week. Verify grip, title serif, chip row, reminder row, action buttons. Change effort chip → save → effort chip updates on task card in list.

- [x] **P4-10** Habit Detail / Edit bottom sheet (`app/(sheets)/habit-detail.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `HabitDetail` function.
  - Prototype reference: `docs/ui/styles.css` → `.sheet`, `.sheet .grip`.
  - Opened by tapping habit body (name + chips area — NOT the ring).

  **Sheet structure** — same `SheetBackdrop` + `.sheet` as P4-9.

  **Title** — note: habit title is `fontSize: 24px` (NOT 22px like task title):
    - `fontFamily: var(--serif); fontSize: 24px; fontWeight: 500; letterSpacing: -0.01em`.
    - `padding: 4px 2px 14px; borderBottom: 1px solid var(--hairline); marginBottom: 18px`.
    - ChevDown icon right `size=16 stroke=1.8 color=var(--text-3)`.

  **Detail chips** — match `HabitDetail` qa-chips:
    - Theme chip: same `.qa-chip` structure.
    - Goal chip: if no goal linked, display italic text-3 "none — link one?" `{ fontStyle: italic }`.

  **Weekly target stepper** — match `HabitDetail` stepper block:
    - Container: `display: flex; alignItems: center; gap: 14px; padding: 14px 16px; background: var(--surface-2); borderRadius: var(--radius-md); marginBottom: 22px`.
    - Label: `fontSize: 13.5px; color: var(--text); fontWeight: 500` — "Weekly target". Sub: `fontSize: 11.5px; color: var(--text-3); marginTop: 2px`.
    - Stepper: `display: flex; alignItems: center; gap: 4px`. Buttons: `width: 30px; height: 30px; borderRadius: 8px; background: var(--surface-hi); fontSize: 16px`. Count display: `minWidth: 44px; textAlign: center; fontFamily: var(--serif); fontWeight: 500; fontSize: 22px; fontFeatureSettings: tnum` + `×` suffix `{ fontSize: 13px; color: var(--text-3) }`. Range: 1–14.

  **Streak block** — match `HabitDetail` streak section:
    - Container: `padding: 16px 18px 18px; borderRadius: var(--radius-md); background: radial-gradient(100% 100% at 0% 0%, rgba(212,176,106,0.14), transparent 60%), var(--surface-2); marginBottom: 18px`.
    - Label row: `fontSize: 11px; letterSpacing: 0.10em; uppercase; color: var(--gold); fontWeight: 600` — flame icon size=12 stroke=2 + "Streak".
    - Current streak: `fontFamily: var(--serif); fontSize: 38px; fontWeight: 400; letterSpacing: -0.02em; color: var(--gold)` + "wk" suffix `{ fontSize: 16px; color: var(--text-2) }`. Label below: `fontSize: 11px; uppercase; color: var(--text-3)` "Current".
    - Best streak: `fontFamily: var(--serif); fontSize: 22px; color: var(--text)` + "wk" suffix. Label below: "Best".
    - 8-week dot row: 8 flex bars `{ flex: 1; height: 6px; borderRadius: 3px; background: var(--gold); opacity: 0.7 }` (or `var(--surface-hi)` if not hit), current week at full opacity. Date labels below: "8 wk ago" left + "this week" right at `fontSize: 10.5px; color: var(--text-3)`.

  **Action row** — match `HabitDetail` actions:
    - "Pause": `btn-ghost flex: 1; fontSize: 13.5px` with pause icon size=13 stroke=2.
    - "Delete": `btn-ghost flex: 1; fontSize: 13.5px; color: var(--brick)` with X icon.

  - Based on: `docs/ui/screens-modals.jsx` (`HabitDetail`); `docs/ui/styles.css` (`.sheet`); `docs/ui/NAVIGATION.md` §18.
  - Validate: Tap habit body → sheet opens. Verify: serif 24px title, stepper increments/decrements, streak block gold gradient, 8-week dots render. Change target → save → ring ring shows new target on This Week card.

### User Check-In
After P4-10: open the app, add a habit ("Gym 4x/week") and 2 tasks. Tap the gym ring 2x — confirm count shows 2/4. Complete a task — confirm it moves to Done section. Undo the completion — confirm it moves back. Inspect on second device or Supabase dashboard that data persisted.

### Backend Deployment (added after Phase 4 implementation — preferred over local network testing)

- [x] **P4-11** **[User setup]** Create Render Web Service for the backend.
  - Service URL: https://this-week.onrender.com
  - Validate: service deploys without errors; Render logs show server started. ✓

- [x] **P4-12** Set environment variables on Render.
  - Set: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `DEFAULT_TIMEZONE`.
  - Skipped: `SUPABASE_ANON_KEY` (backend never uses it), `PORT` (Render injects automatically), `BACKEND_PUBLIC_URL` (not read by backend code).
  - Validate: `curl https://this-week.onrender.com/health` returns `{"ok":true}`. ✓
  - Note: also removed unused `@fastify/jwt` dependency which had 2 critical CVEs.

- [x] **P4-13** Update app to point to Render backend.
  - `app/.env`: `EXPO_PUBLIC_API_URL=https://this-week.onrender.com`. ✓

- [x] **P4-14** New EAS dev build — skipped. No native packages added since last build.

### End-of-Phase Admin
- [x] Mark completed tasks (P4-11 through P4-14).
- [x] Git commit: `feat(p4): core loop — tasks, habits, tab bar, quick-add, undo snackbar, detail sheets` (covers P4-1 through P4-10)
- [x] Git commit: `feat(p4): render deployment, app wired to production backend`
- [x] Record Render service URL in `docs/env.md`. ✓

---

## Phase 5 — Backlog

**Outcome**: Backlog tab shows all backlog tasks. User can add tasks directly to the backlog, and promote them to this week with a tap.

### Tasks

- [x] **P5-1** Backend: `GET /tasks?week_assignment=backlog` — list open backlog tasks (already covered by PATCH from P4-2; confirm filter works).
  - Confirmed: `week_assignment` filter at tasks.ts:34 handles this. `useBacklogTasks` hook calls `/tasks?week_assignment=backlog&status=open`.

- [x] **P5-2** Backend: `POST /tasks/:id/promote` — move backlog task to this week.
  - Sets `week_assignment=this_week`, `week_start_date=current_sunday`.
  - Added to `backend/src/routes/tasks.ts`. Also added `usePromoteTask` mutation hook.
  - Undo: PATCH back to `week_assignment=backlog`, `week_start_date=null`.

- [x] **P5-3** Backlog screen (`app/(tabs)/backlog.tsx`).
  - Prototype reference: `docs/ui/screens-primary.jsx` → `Backlog` (populated) and `BacklogEmpty` (empty state).
  - Prototype reference: `docs/ui/components.jsx` → `Task` component (same as This Week).
  - Prototype reference: `docs/ui/styles.css` → `.page-head`, `.theme-group`, `.task`, `.seg`.

  **Page header** — match `Backlog` header:
    - Eyebrow: "For later" (`fontSize: 11; letterSpacing: 0.14em; uppercase; color: var(--text-3); fontWeight: 600; marginBottom: 4`).
    - h1: "Backlog" — same serif 30px/500/letterSpacing -0.02em style.
    - Gear icon-btn top-right.

  **Sort control** — match `Backlog` segmented control:
    - `.seg` at top of scroll, `marginBottom: 16px`. **Three options** (not two like This Week): "By theme" / "By priority" / "Recent". Default: "By theme".

  **Theme groups** — match `Backlog` groups block:
    - Same `.theme-group` header structure (chevDown + swatch + name + count).
    - Groups are **collapsible** by tapping header: toggled independently. First 2 groups open by default, rest collapsed — match the `Backlog` `openGroups` initial state.
    - Each task: same `.task` component. Tap circle → **promote to this week** (calls P5-2 endpoint, does NOT mark as done). Tap body → Task Detail sheet.

  **Empty state** — match `BacklogEmpty`:
    - Inline SVG: `width: 56px; height: 56px; opacity: 0.6` — rect with inbox-style lines (no external library, match the SVG path in prototype).
    - h2: `fontFamily: var(--serif); fontSize: 22px; fontWeight: 500; letterSpacing: -0.01em` — "Your backlog is empty."
    - p: `fontSize: 14.5px; color: var(--text-2); lineHeight: 1.55` — "Tasks you don't want for this week land here. Tap the mic or + to add one."
    - Centered content with `padding: 0 36px 140px`.

  - FAB + defaults to backlog week_assignment when opened from this tab.
  - Based on: `docs/ui/screens-primary.jsx` (`Backlog`, `BacklogEmpty`); `docs/ui/components.jsx`; `docs/ui/styles.css`; `docs/ui/NAVIGATION.md` §02.
  - Validate: Add backlog task via + FAB on Backlog tab — does NOT appear on This Week. Tap circle on backlog task → appears in This Week. Groups collapse/expand on header tap. Empty state matches prototype layout.

### User Check-In
After P5-3: add a task to the backlog. Navigate to This Week — confirm it's not there. Go back to Backlog, promote it. Navigate to This Week — confirm it appears.

### End-of-Phase Admin
- [x] Mark completed tasks. All P5-1 through P5-3 complete.
- [x] Also fixed HK-1: Ring counter now uses absolute-positioned RN Text overlay (removes unreliable dominantBaseline on Android).
- [x] FAB tab context: + FAB on Backlog tab defaults quick-add to `week_assignment=backlog`.
- [x] Git commit: `feat(p5): backlog screen, promote-to-this-week, collapsible theme groups`

---

## Phase 6 — Goals

**Outcome**: Goals tab shows active goals and graveyard. User can create/edit/delete goals. Primary goal appears as milestone hero on This Week. Goal cap enforced on save. Goal Action Drawer works.

### Tasks

#### Backend

- [x] **P6-1** Goals CRUD endpoints.
  - `GET /goals` — list all goals (active + archived/hit/missed/abandoned).
  - `POST /goals` — create goal. Enforce max 1 active primary (400 if cap hit — frontend handles demotion modal before this call). Enforce max 2 active secondary (400 if cap hit).
  - `PATCH /goals/:id` — update fields, status, type.
  - `POST /goals/:id/mark-hit` — set `status=completed`, `completed_at=now()`. Unlink tasks.
  - `POST /goals/:id/abandon` — set `status=archived`, `archived_at=now()`. Unlink tasks.
  - Based on: DATABASE_DESIGN.md § goals; domain-lens § Goal lifecycle; requirements-lens § Goal cap enforcement.
  - Validate: create primary goal, try to create a second primary → 400; create secondary, check cap.

- [x] **P6-2** `GET /goals/:id/stats` — return task counts toward this goal for the current week (derived, not stored).
  - Based on: domain-lens § Derived vs. Stored.
  - Validate: link 3 tasks to a goal; endpoint returns `{ tasks_this_week: 3, tasks_completed_this_week: N }`.

#### Frontend

- [x] **P6-3** Goals screen (`app/(tabs)/goals.tsx`).
  - Prototype reference: `docs/ui/screens-primary.jsx` → `Goals` function.
  - Prototype reference: `docs/ui/styles.css` → `.goal`, `.goal.primary`, `.goal-grave`, `.section-label`, `.done-bar`.

  **Page header** — match `Goals` header:
    - Eyebrow: "What you're working toward" (`fontSize: 11; letterSpacing: 0.14em; uppercase; color: var(--text-3); fontWeight: 600; marginBottom: 4`).
    - h1: "Goals" — serif 30px/500.
    - Gear icon-btn top-right.

  **Primary goal section** — match `Goals` primary block:
    - Section label `.section-label { marginTop: 0 }`: left "Primary", right "N of 1" count.
    - `.goal.primary` card: `padding: 18px; borderRadius: var(--radius-lg); background: radial-gradient(120% 110% at 0% 0%, rgba(200,120,86,0.20), transparent 60%), radial-gradient(120% 100% at 100% 100%, rgba(212,176,106,0.12), transparent 55%), var(--surface)`.
    - Eyebrow inside: `fontSize: 10.5px; letterSpacing: 0.14em; uppercase; color: var(--accent-strong)` — "Theme · by Date".
    - h3: `fontFamily: var(--serif); fontSize: 20px; fontWeight: 500; lineHeight: 1.2; letterSpacing: -0.01em; margin: 0 0 12px`.
    - `.why`: `fontSize: 13.5px; color: var(--text-2); lineHeight: 1.5; margin: 0 0 12px` — quoted "why" text.
    - `.stats { display: flex; gap: 16px; alignItems: center; fontSize: 12.5px; color: var(--text-2) }` — `.stats .n { color: var(--text); fontWeight: 600; fontSize: 15px }` + right-aligned "N mo left" `{ marginLeft: auto; color: var(--accent-strong); fontSize: 11px; letterSpacing: 0.06em; uppercase; fontWeight: 600 }`.

  **Secondary goal section** — match `Goals` secondary block:
    - Section label: "Secondary", right "N of 2 slots".
    - Regular `.goal` card (no primary gradient): eyebrow `color: #7a90a8` (slate), h3, stats row — "N mo left" in `color: var(--text-3)` (not accent-strong).

  **Button row** — match `Goals` button row exactly:
    - `display: flex; gap: 10px; marginTop: 18px`.
    - "Add directly" → `btn-ghost flex: 1` with plus icon size=16 stroke=2.
    - "Coach me" → `btn-primary flex: 1.3` with sparkles icon size=16 stroke=2. Note: flex 1 vs 1.3 ratio matters for visual balance.

  **Graveyard** — match `Goals` graveyard section:
    - `.done-bar { marginTop: 30 }` "Past goals (N)" — collapsed by default, chevRight/chevDown toggle.
    - When expanded: `.goal-grave { display: flex; alignItems: center; gap: 10px; padding: 14px 0; borderBottom: 1px solid var(--hairline) }`.
    - `.goal-grave .res { fontSize: 11px; letterSpacing: 0.06em; uppercase; fontWeight: 600; color: var(--text-3) }` — `.hit .res { color: var(--sage) }`, `.missed .res { color: var(--brick) }`, abandoned stays `var(--text-3)`.
    - `.goal-grave .name { color: var(--text-2); fontSize: 14px; flex: 1 }`.
    - `.goal-grave .date { color: var(--text-3); fontSize: 12px; fontFeatureSettings: tnum }`.

  - Tap any active goal card → Goal Action Drawer. Tap past goal row → Goal Action Drawer graveyard variant.
  - Based on: `docs/ui/screens-primary.jsx` (`Goals`); `docs/ui/styles.css` (`.goal`, `.goal-grave`); `docs/ui/NAVIGATION.md` §03.
  - Validate: Create 1 primary + 1 secondary goal — both appear in correct sections with correct gradient/color treatment. Graveyard collapsed by default, expands to show past goals with hit/missed/abandoned status colors.

- [x] **P6-4** Goal Action Drawer (`app/components/GoalActionDrawer.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `GoalActionDrawer` function and `ActionRow` function.
  - Prototype reference: `docs/ui/styles.css` → `.sheet`, `.sheet .grip`.

  **Backdrop** — match `GoalActionDrawer` `Backdrop`:
    - Blurred Goals tab behind: `filter: blur(1px); opacity: 0.5`.
    - Scrim: `position: absolute; inset: 0; background: rgba(20,18,16,0.55)`.

  **Goal preview at top of sheet** — match `GoalActionDrawer` preview section:
    - `padding: 4px 4px 16px; marginBottom: 18px; borderBottom: 1px solid var(--hairline)`.
    - Type label: `fontSize: 10.5px; letterSpacing: 0.14em; uppercase; color: var(--accent-strong); fontWeight: 600; marginBottom: 6px` — "Primary goal" or "Past goal · abandoned".
    - Goal title: `fontFamily: var(--serif); fontSize: 22px; fontWeight: 500; lineHeight: 1.25; letterSpacing: -0.01em; marginBottom: 10px`.
    - Chip row: theme chip + calendar chip (calendar icon + date) + "N tasks · N habits linked" chip.

  **ActionRow component** — match `ActionRow` function exactly:
    - Container: `display: flex; alignItems: center; gap: 14px; padding: 14px 16px; background: bgMap[tone]; borderRadius: var(--radius-md); cursor: pointer`.
    - Icon container (36×36): `width: 36px; height: 36px; borderRadius: 10px; background: var(--surface); display: flex; alignItems: center; justifyContent: center; flex: 0 0 auto`.
    - Label: `fontSize: 14.5px; fontWeight: 500` in tone color. Sub: `fontSize: 12px; color: var(--text-3); marginTop: 2px; lineHeight: 1.4`.
    - Right: chevRight icon size=14 stroke=2 color=var(--text-3).
    - Tone color map: `default=var(--text)`, `sage=var(--sage)`, `brick=var(--brick)`, `accent=var(--accent-strong)`.
    - Tone bg map: `default=var(--surface-2)`, `sage=color-mix(in oklab, var(--sage-dim) 65%, var(--surface-2))`, `brick=color-mix(in oklab, var(--brick-dim) 65%, var(--surface-2))`, `accent=color-mix(in oklab, var(--accent-dim) 65%, var(--surface-2))`.

  **Active variant** (3 actions, `gap: 8px` flex-column):
    - "Mark as hit" → tone=sage, icon=check, sub="Move to past goals · keep all the tied tasks for posterity".
    - "Edit" → tone=default, icon=settings, sub="Reopen the goal form to refine title, date, theme, or why".
    - "Delete" → tone=brick, icon=x, sub="Send to past goals as abandoned · tied tasks stay where they are".

  **Graveyard variant** (1 action):
    - "Reactivate" → tone=accent, icon=refresh, sub="Reopen the goal form to rethink it · subject to the 1+2 cap".

  - Footer: "Pull down to dismiss." `{ fontSize: 11.5px; color: var(--text-3); textAlign: center; marginTop: 18px; lineHeight: 1.5 }`.
  - Based on: `docs/ui/screens-modals.jsx` (`GoalActionDrawer`, `ActionRow`); `docs/ui/styles.css`; `docs/ui/NAVIGATION.md` §07.
  - Validate: Tap primary goal → drawer opens, goal preview shows at top, 3 action rows with correct colors. Tap "Mark as hit" → goal moves to graveyard. Tap past goal → single "Reactivate" row in accent tone.

- [x] **P6-5** Add Goal Form (`app/add-goal.tsx` modal).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `AddGoalForm` function (both `prefilled=false` and `prefilled=true` variants).
  - Prototype reference: `docs/ui/styles.css` → `.modal-head`, `.btn`, `.btn-primary`, `.btn-ghost`.

  **Modal header** — match `AddGoalForm` modal-head:
    - Left: X icon-btn. Center: "New goal" in `.modal-head .title`. Right: **Save text button** (NOT a full btn in footer for the header action): `background: transparent; border: none; color: var(--accent-strong); fontSize: 14px; fontWeight: 600; padding: 0 6px` — disabled state: `color: var(--text-3)`.

  **Coach prefill banner** (shown only when from Coach): `margin: 0 16px 4px; padding: 8px 12px; background: var(--accent-dim); borderRadius: 10px; display: flex; alignItems: center; gap: 8px; color: var(--accent-strong); fontSize: 12px` — sparkles icon + "From your conversation with Coach — review and save."

  **Title field** — match `AddGoalForm` title section:
    - Label "Goal": `fontSize: 11px; letterSpacing: 0.12em; uppercase; color: var(--text-3); fontWeight: 600; marginBottom: 10px`.
    - Input: `fontFamily: var(--serif); fontSize: 24px; fontWeight: 500; background: transparent; border: none; outline: none; lineHeight: 1.25; letterSpacing: -0.01em; paddingBottom: 10px; borderBottom: 1px solid var(--hairline)`. Placeholder: "What are you working toward?".

  **Target date** — match `AddGoalForm` date section:
    - Label row: "Target date" left + "Required" / empty right `{ fontSize: 10.5px; letterSpacing: 0.06em; uppercase; color: var(--accent-strong); fontWeight: 600 }`.
    - Quick-select chips: `display: flex; gap: 8px; flexWrap: wrap; marginBottom: 12px`. Options: "3 months", "6 months", "1 year", "Custom…". Selected: `background: var(--accent); color: #1a1816; fontWeight: 600; boxShadow: 0 3px 10px rgba(200,120,86,0.25)`. Unselected: `background: var(--surface); color: var(--text); fontWeight: 500`. All: `padding: 8px 14px; borderRadius: 10px; fontSize: 13px`.
    - Date display row (shown when date selected): `display: flex; alignItems: center; gap: 10px; padding: 12px 14px; background: var(--surface-2); borderRadius: var(--radius-md); fontSize: 14px; fontFeatureSettings: tnum` — calendar icon size=16 stroke=1.7 + date text + "tap to refine" `{ marginLeft: auto; fontSize: 11.5px; color: var(--text-3) }`.

  **Type selector** — match `AddGoalForm` type section:
    - 2 radio card options stacked with `marginBottom: 6px`:
    - Selected: `background: color-mix(in oklab, var(--accent-dim) 35%, var(--surface)); boxShadow: inset 0 0 0 1px var(--accent-dim)`. Unselected: `background: var(--surface)`. Both: `padding: 12px 14px; borderRadius: var(--radius-md)`.
    - Radio dot: `width: 18px; height: 18px; borderRadius: 50%; border: 1.5px solid var(--text-3)` → selected: `background: var(--accent); border: none` with inner dot `width: 7px; height: 7px; borderRadius: 50%; background: #1a1816`.
    - Option text: `fontSize: 14.5px; color: var(--text); fontWeight: 500`. Sub: `fontSize: 12px; color: var(--text-3); lineHeight: 1.45`.
    - Primary: "Primary · Your headline goal. One at a time." Secondary: "Secondary · Side priority. Up to two of these."

  **Theme selector** — match `AddGoalForm` theme section:
    - Collapsible row: `display: flex; alignItems: center; gap: 10px; padding: 12px 14px; background: var(--surface); borderRadius: var(--radius-md); cursor: pointer`. Open state: `background: color-mix(in oklab, var(--accent-dim) 18%, var(--surface)); boxShadow: inset 0 0 0 1px var(--accent-dim)`.
    - Swatch dot (9×9) + theme name + chevRight/chevDown right-aligned.
    - Expanded list: `background: var(--surface); borderRadius: var(--radius-md); padding: 4px 14px; boxShadow: inset 0 0 0 1px var(--hairline)` — rows with swatch + name + check icon (size=14 stroke=2.5 color=var(--accent)) on selected.

  **Why field** — match `AddGoalForm` why section:
    - Label row: "Why does this matter?" left + "Optional" right.
    - `textarea { background: var(--surface); fontFamily: var(--sans); fontSize: 13.5px; lineHeight: 1.55; padding: 12px 14px; borderRadius: var(--radius-md); boxShadow: inset 0 0 0 1px var(--hairline); resize: none; rows: 3 }`. Placeholder: "In your own words. Read this back on a rough week."

  **Bottom bar**: Cancel (btn-ghost flex:1) + "Save goal" (btn-primary flex:1.6, `opacity: canSave ? 1 : 0.45`). Save enabled only when title + date both filled.

  - On save: if primary cap exceeded, show demotion-choice modal (Demote current primary / Archive current primary / Cancel).
  - Based on: `docs/ui/screens-modals.jsx` (`AddGoalForm`); `docs/ui/styles.css`; `docs/ui/NAVIGATION.md` §10/11; requirements-lens § Goal cap enforcement.
  - Validate: Fill title only → Save opacity 0.45. Fill date → Save enabled. Try to exceed primary cap → demotion modal. Save → goal in Goals tab.

- [x] **P6-6** Wire primary goal into This Week milestone hero card.
  - TanStack Query fetches active primary goal from backend.
  - Render in P4-6 milestone hero: eyebrow "Primary milestone" with target icon, h2 with goal title, meta row with date pill + "N tasks this week toward this" count from `/goals/:id/stats`.
  - If no primary goal: render `ThisWeekEmpty` milestone placeholder (quiet SVG + serif "This is your week." + CTA buttons) as defined in `docs/ui/screens-primary.jsx` `ThisWeekEmpty`.
  - Based on: `docs/ui/screens-primary.jsx` (`ThisWeek`, `ThisWeekEmpty`); `docs/ui/styles.css` (`.milestone`).
  - Validate: create primary goal → milestone card appears on This Week with radial gradient, goal title, date pill, task count. Delete goal → empty state CTA appears.

### User Check-In
After P6-6: create a primary goal "Land first paid DJ gig" with target date 6 months out. See it on the Goals tab and in the This Week milestone hero. Create a task linked to that theme. See "1 task this week toward this goal" badge.

### End-of-Phase Admin
- [x] Mark completed tasks. All P6-1 through P6-6 complete.
- [x] Note: GoalActionDrawer implemented as a component (not a separate sheet file) — consistent with HabitDetailSheet/TaskDetailSheet pattern.
- [x] Note: Demotion modal for primary cap exceeded deferred — backend returns 400 on duplicate primary; frontend will surface the error message in a future pass if needed.
- [x] Git commit: `feat(p6): goals CRUD, goal action drawer, add goal form, primary goal milestone hero`

---

## Phase 7 — Stats

**Outcome**: Stats tab shows current week raw fractions, habit streaks, and past week history.

### Tasks

- [x] **P7-1** Backend: `GET /stats/current-week` — return tasks done/total and habits on-target/total for the current week.
  - Derived counts, not from `week_records` (which is only populated at rollover).
  - Based on: domain-lens § Derived vs. Stored; ui-brief.md §4.
  - Validate: complete 3 of 5 tasks; endpoint returns `{ tasks_done: 3, tasks_total: 5, habits_on_target: N, habits_total: M }`.

- [x] **P7-2** Backend: `GET /stats/habit-streaks` — return all active habits with `current_streak` and `best_streak`.
  - Based on: DATABASE_DESIGN.md § habits; domain-lens § Derived vs. Stored.
  - Validate: endpoint returns habit list with streak values.

- [x] **P7-3** Backend: `GET /stats/past-weeks` — return paginated list of `week_records` most recent first, with expandable task/habit detail.
  - Based on: DATABASE_DESIGN.md § week_records; ui-brief.md §4.
  - Validate: will only have data after first rollover (Phase 8); confirm empty list returns cleanly.

- [x] **P7-4** Stats screen (`app/(tabs)/stats.tsx`).
  - Prototype reference: `docs/ui/screens-primary.jsx` → `Stats` function.
  - Prototype reference: `docs/ui/styles.css` → `.stats-hero`, `.streak-row`, `.week-row`, `.section-label`.

  **Page header** — match `Stats` header:
    - Eyebrow: "Quiet progress" (`fontSize: 11; letterSpacing: 0.14em; uppercase; color: var(--text-3); fontWeight: 600`).
    - h1: "Stats" — serif 30px/500.
    - Gear icon-btn top-right.

  **Stats hero card** — match `.stats-hero` + `Stats` hero block:
    - `padding: 22px 20px 22px; border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-card)`.
    - "This week" label: `fontSize: 11px; letterSpacing: 0.12em; uppercase; color: var(--text-3); fontWeight: 600; marginBottom: 14px`.
    - Fractions row `.fracs { display: flex; gap: 24px; alignItems: baseline }`:
      - Each: `.frac { fontFamily: var(--serif); fontSize: 36px; fontWeight: 400; fontFeatureSettings: tnum; letterSpacing: -0.02em; color: var(--text); lineHeight: 1 }` + `.frac .of { color: var(--text-3) }`.
      - Label below: `.fracName { fontSize: 12px; color: var(--text-2); marginTop: 6px; letterSpacing: 0.04em }`.
      - Two stats: "tasks done" (N/N) + "habits on target" (N/N).
    - "New best" gold banner (shown only when a habit hit a new best streak this week): `marginTop: 18px; padding: 12px; borderRadius: 10px; background: var(--gold-dim); display: flex; alignItems: center; gap: 10px; color: var(--gold); fontSize: 13px` — flame icon size=16 stroke=1.8.

  **Habit streaks section** — match `Stats` streak rows:
    - Section label: "Habit streaks".
    - Each `.streak-row { display: flex; alignItems: center; gap: 12px; padding: 14px; borderRadius: var(--radius-md); background: var(--surface); marginBottom: 8px }`:
      - `.streak-row .name { flex: 1; fontSize: 14px }`.
      - `.streak-row .now { fontFeatureSettings: tnum; fontSize: 15px; fontWeight: 600; color: var(--text) }` — when habit has best-ever streak: add `.gold { color: var(--gold) }`.
      - `.streak-row .best { fontFeatureSettings: tnum; fontSize: 11.5px; color: var(--text-3); letterSpacing: 0.02em; textAlign: right; minWidth: 60px }` — "best N".

  **Past weeks section** — match `Stats` week rows:
    - Section label: "Past weeks".
    - Each `.week-row { padding: 14px; borderRadius: var(--radius-md); background: var(--surface); marginBottom: 8px; display: flex; alignItems: center; justifyContent: space-between }`:
      - `.range { fontSize: 13px; color: var(--text-2) }` — e.g. "May 4 – 10".
      - `.fracs { fontFeatureSettings: tnum; fontSize: 13.5px; color: var(--text) }` — "11/14 tasks · 3/3 habits".

  - Based on: `docs/ui/screens-primary.jsx` (`Stats`); `docs/ui/styles.css` (`.stats-hero`, `.streak-row`, `.week-row`); `docs/ui/NAVIGATION.md` §04.
  - Validate: Complete tasks and increment habits, open Stats. Verify: fraction numbers correct, streak rows match habit list, past weeks empty until first rollover (clean empty state). Compare layout to prototype.

### User Check-In
After P7-4: complete 2 tasks, increment gym to 3/4. Open Stats — confirm fractions show. Check that streak shows 0 (no rollover yet).

### End-of-Phase Admin
- [x] Mark completed tasks.
- [x] Git commit: `feat(p7): stats screen — current week fractions, habit streaks, past weeks history`

---

## Phase 8 — Sunday Rollover + Carry-Over Ritual

**Outcome**: On first app open after Sunday 00:00 local time, the carry-over ritual blocks the app. User triages leftover tasks one-by-one. Pull-from-backlog step follows. After completion, This Week shows the new week. WeekRecords and habit streaks are updated.

### Tasks

#### Backend

- [x] **P8-1** Rollover logic service (`backend/src/services/rollover.ts`).
  - Input: `userId`, `timezone`.
  - Steps per DATABASE_DESIGN.md § Sunday Rollover Data Flow:
    1. Compute previous and current `week_start_date`.
    2. Archive done tasks from previous week (`status=archived_done`).
    3. Create/update `week_records` summary for previous week.
    4. Archive previous week `habit_week_records` (set `archived_at`).
    5. Update habit streaks (increment if target_met, reset to 0 otherwise); update `best_streak`.
    6. Create new `habit_week_records` for active habits for new week.
    7. Identify open tasks from previous week (week_assignment=this_week, status=open).
    8. If open tasks exist: create `carry_over_ritual` (status=pending) + one `carry_over_task_decisions` row per task (decision=null).
  - Based on: DATABASE_DESIGN.md § Sunday Rollover Data Flow; requirements-lens § Week boundary.
  - Validate: manually create test data for last week; call rollover; inspect DB: week_records row created, habits streaks updated, carry_over_ritual row with pending decisions.

- [x] **P8-2** `POST /rollover/check` — idempotent rollover trigger.
  - Called by the app on every startup.
  - If current week ≠ stored week for the user, run rollover (idempotent via unique constraint on carry_over_ritual).
  - Returns `{ rolled_over: boolean, pending_ritual_id: string | null }`.
  - Based on: DATABASE_DESIGN.md § Sunday Rollover Data Flow.
  - Validate: call twice in same week → `rolled_over: false` both times. Cross week boundary (advance test date) → `rolled_over: true` on first call, `false` on second.

- [x] **P8-3** Carry-over ritual endpoints.
  - `GET /carry-over/pending` — return pending ritual + all undecided task_decisions for the user.
  - `POST /carry-over/:ritualId/decisions/:decisionId` — record decision (`keep_this_week` / `send_to_backlog` / `drop`) for one task.
    - `keep_this_week`: update task `week_assignment=this_week`, `week_start_date=new_week`.
    - `send_to_backlog`: update task `week_assignment=backlog`, `week_start_date=null`.
    - `drop`: hard delete task.
    - If all decisions made: set ritual `status=completed`, `completed_at=now()`.
  - Based on: DATABASE_DESIGN.md § Carry-Over Decision Effects; requirements-lens § Week boundary.
  - Validate: triage 3 tasks (1 keep, 1 backlog, 1 drop); confirm ritual complete, tasks updated.

#### Frontend

- [x] **P8-4** Call `POST /rollover/check` on app startup (in root layout, after auth).
  - Store `pending_ritual_id` in Zustand if returned.
  - Based on: requirements-lens § Triggers / Events.
  - Validate: restart app; request made; no crashes.

- [x] **P8-5** Carry-Over Recap screen (`app/carry-recap.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `CarryRecap` function.
  - Prototype reference: `docs/ui/styles.css` → `.recap-num`, `.card`.
  - Only shown when `pending_ritual_id` exists; blocks navigation to main tabs (root layout checks and routes here before tabs).

  **Modal header** — match `CarryRecap` modal-head (no X/close button — user cannot dismiss):
    - Left label: "Sunday set-up · 1 of 3" `{ fontSize: 11px; color: var(--text-3); letterSpacing: 0.12em; uppercase; fontWeight: 600 }`.
    - Right: empty spacer div (no actions here).

  **Last week heading**: `fontFamily: var(--serif); fontSize: 28px; fontWeight: 500; letterSpacing: -0.02em; margin: 14px 0 28px`.

  **Fractions row** — match `CarryRecap` fracs:
    - `display: flex; gap: 28px; alignItems: baseline; marginBottom: 26px`.
    - `.recap-num { fontFamily: var(--serif); fontSize: 64px; fontWeight: 400; letterSpacing: -0.03em; fontFeatureSettings: tnum; lineHeight: 1 }` + `.recap-num .of { color: var(--text-3) }`.
    - Label below: `.recap-num.label { fontFamily: var(--sans); fontSize: 12px; letterSpacing: 0.12em; color: var(--text-3); uppercase; fontWeight: 500; marginTop: 8px }`.
    - Two values: "Tasks done" (N/N) + "Habits on target" (N/N).

  **Streaks card** — match `CarryRecap` streaks card:
    - `.card { padding: 16px; marginBottom: 12px }`.
    - Label: "Streaks" `{ fontSize: 11px; letterSpacing: 0.10em; uppercase; color: var(--text-3); fontWeight: 600; marginBottom: 10px }`.
    - Streak rows: `display: flex; alignItems: center; gap: 10px; padding: 4px 0; fontSize: 14px`. Flame icon (gold) for streak increase, refresh icon (brick) for reset. Value: `{ marginLeft: auto; fontFeatureSettings: tnum; fontWeight: 600 }` in `var(--gold)` (continued) or `var(--brick)` (reset).

  **Goal card** — match `CarryRecap` goal card:
    - `.card { padding: 16px }`.
    - Label: "Still working toward" `{ fontSize: 11px; uppercase; color: var(--accent-strong); fontWeight: 600; marginBottom: 8px }`.
    - Goal title: `fontFamily: var(--serif); fontSize: 17px; fontWeight: 500; marginBottom: 6px; lineHeight: 1.3`.
    - Sub: "N tasks done toward it last week" `{ fontSize: 13px; color: var(--text-2) }`.

  - Button: "Review leftovers →" (`btn-primary btn-block`, arrow icon). Footer: "N tasks from last week need a decision before this week starts." `{ fontSize: 11.5px; color: var(--text-3); textAlign: center; marginTop: 12px }`.
  - Based on: `docs/ui/screens-modals.jsx` (`CarryRecap`); `docs/ui/styles.css` (`.recap-num`, `.card`); `docs/ui/NAVIGATION.md` §12.
  - Validate: Simulate rollover (insert carry_over_ritual row); open app → recap screen appears, cannot navigate to tabs. Verify 64px fraction numbers, streak rows, goal card, single CTA button.

- [x] **P8-6** Carry-Over Triage screen (`app/carry-triage.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `CarryTriage` function.
  - Prototype reference: `docs/ui/styles.css` → `.card`, `.task` chip components.

  **Modal header** — match `CarryTriage` modal-head (no close button):
    - "Sunday set-up · 2 of 3" label left. Right: empty spacer.

  **Title + progress counter** — match `CarryTriage`:
    - `display: flex; alignItems: baseline; justifyContent: space-between; marginBottom: 24px`.
    - h2 "Last week's leftovers": `fontFamily: var(--serif); fontSize: 22px; fontWeight: 500; margin: 0; letterSpacing: -0.01em`.
    - Counter "N of N": `fontSize: 12px; color: var(--text-3); fontFeatureSettings: tnum`.

  **Progress dot bar** — match `CarryTriage` progress dots:
    - `display: flex; gap: 5px; marginBottom: 26px`. One flex bar per task.
    - Decided (previous): `flex: 1; height: 3px; borderRadius: 2px; background: var(--sage)`.
    - Current: `flex: 1; height: 3px; borderRadius: 2px; background: var(--accent)`.
    - Remaining: `flex: 1; height: 3px; borderRadius: 2px; background: var(--surface-hi)`.

  **Focal task card** — match `CarryTriage` card:
    - `.card { padding: 22px; marginBottom: 24px }`.
    - Title: `fontFamily: var(--serif); fontSize: 22px; fontWeight: 500; lineHeight: 1.25; letterSpacing: -0.01em; marginBottom: 16px`.
    - Chip row: `ThemeChip` + `EffortChip` + `ReturnChip` + `GoalChip` (same components as task rows).
    - Footer: `{ marginTop: 14px; fontSize: 12px; color: var(--text-3); display: flex; alignItems: center; gap: 6px }` — calendar icon size=12 stroke=1.8 + "originally added N days ago".

  **3-button action block** — match `CarryTriage` button stack exactly:
    - `display: flex; flexDirection: column; gap: 10px` (stacked vertically, NOT side by side).
    - "Keep for this week": `btn-primary btn-block`.
    - "Send to backlog": `btn-ghost btn-block`.
    - "Drop": `btn-text btn-block; color: var(--text-3)` — `.btn-text { background: transparent; height: 40px; padding: 0 12px }`.
    - No skip/dismiss. These are the only 3 options.

  - On "Drop" → fire Undo snackbar (P4-7) before backend call. After last decision → navigate to Carry-Over Pull.
  - Based on: `docs/ui/screens-modals.jsx` (`CarryTriage`); `docs/ui/styles.css`; `docs/ui/NAVIGATION.md` §13.
  - Validate: Triage 3 tasks — progress dots update per task (sage = done, accent = current, surface-hi = remaining). After all triaged, transitions to pull step. "Drop" fires Undo snackbar.

- [x] **P8-7** Carry-Over Pull screen (`app/carry-pull.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `CarryPull` function.

  **Modal header** — "Sunday set-up · 3 of 3" label left, no close button.

  **Header text** — match `CarryPull`:
    - h2 "Stock this week": `fontFamily: var(--serif); fontSize: 24px; fontWeight: 500; margin: 8px 0 6px; letterSpacing: -0.015em`.
    - Sub-paragraph: `fontSize: 14px; color: var(--text-2); lineHeight: 1.5; margin: 0 0 22px`. Added count shown inline in `color: var(--sage); fontWeight: 600`.

  **Backlog task list** — match `CarryPull` task list:
    - Scrollable list padded `padding: 6px 20px 100px`.
    - Each row uses `.task` structure. **Two states** — not added vs. added:
      - Not added: `background: var(--surface)`. Checkbox area: `border: 1.5px dashed var(--text-3)` with plus icon size=12 stroke=2 color=var(--text-3).
      - Added: `background: color-mix(in oklab, var(--sage-dim), var(--surface) 30%)`. Checkbox: `border: none; background: var(--sage)` with check icon color=var(--bg). "Added" badge on right: `fontSize: 10.5px; color: var(--sage); letterSpacing: 0.08em; textTransform: uppercase; fontWeight: 700`.
    - Tap any row to toggle added/not-added state.

  **Sticky bottom bar** — match `CarryPull` bottom:
    - `position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 20px 22px; background: linear-gradient(to top, var(--bg) 60%, transparent); display: flex; flexDirection: column; gap: 6px`.
    - "Start week": `btn-primary btn-block` — always enabled (user can skip pulling tasks).
    - Footnote: "You can always pull more from the Backlog tab any time." `{ fontSize: 11.5px; color: var(--text-3); textAlign: center }`.

  - On "Start week" → dismiss ritual, navigate to This Week with toast "Ready for the new week."
  - Based on: `docs/ui/screens-modals.jsx` (`CarryPull`); `docs/ui/NAVIGATION.md` §14.
  - Validate: Backlog tasks show with dashed + icon. Tap one → transforms to sage added state. Tap "Start week" → This Week loads with pulled tasks present.

### User Check-In
After P8-7: simulate a week flip (manually set carry_over_ritual status to pending with test tasks). Open app — confirm ritual blocks. Triage all tasks. Pull 1 from backlog. Tap "Start week" — confirm toast and This Week loads.

### End-of-Phase Admin
- [x] Mark completed tasks.
- [x] Test actual Sunday timing once (or simulate with timezone offset).
- [x] Git commit: `feat(p8): sunday rollover, carry-over ritual — recap, triage, pull screens`

---

## Phase 9 — Voice Input + AI Capture

**Outcome**: Mic FAB opens voice listening. Spoken input is sent to the backend, parsed by Claude into a task or habit draft. User reviews and confirms the draft. Low-confidence fields marked. Multi-item capture works.

### Tasks

#### Backend

- [x] **P9-1** AI capture endpoint `POST /ai/capture`.
  - Input: `{ transcript: string, context: { themes: Theme[], active_primary_goal?: Goal } }`.
  - Calls Anthropic API (`claude-sonnet-4-6`) with structured output (Zod schema) to parse:
    - `item_type` (task | habit)
    - `title`
    - `theme_id` (nearest match or null)
    - `effort_level`, `return_level` (task only; default medium)
    - `week_assignment` (task only; default this_week)
    - `weekly_target` (habit only; null if unparseable → ask back)
    - `goal_id` (auto-infer from theme)
    - `reminder_spec` (optional, see requirements-lens § Reminder capability matrix)
    - `confidence_flags` (array of low-confidence field names)
    - Multi-item: returns array of draft items.
  - Log to `ai_capture_logs` (input_type, output_type, success, error_code).
  - Based on: requirements-lens § AI parsing rules; product-lens § Voice + AI-parsed input.
  - Validate: POST with transcript `"add gym 4 times a week"` → returns habit draft with weekly_target=4; POST with `"call Pedro tomorrow about the booking"` → returns task draft with reminder_spec.

- [x] **P9-2** Reminder spec parser (part of capture output).
  - Parse natural language reminder phrases into `{ kind, scheduled_for, recurrence_rule }`.
  - Supported: one-shot at specific time, relative one-shot, recurring until done.
  - Default time when not specified: 09:00 local.
  - Based on: requirements-lens § Task reminders; § Reminder capability matrix.
  - Validate: "remind me Thursday 9am" → one-shot; "nudge me daily until done" → recurring_until_done.

#### Frontend

- [x] **P9-3** Voice listening overlay (`app/voice-listening.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `VoiceListening` function.
  - Prototype reference: `docs/ui/styles.css` → `.voice-overlay`, `.voice-orb` + pulse animation keyframes.
  - Uses `expo-av` or `expo-speech-recognition` to record audio.

  **Blurred background** — match `VoiceListening` backdrop:
    - This Week screen visible behind at `filter: blur(2px); opacity: 0.5` — partial layout shown (h1 + milestone + one habit row).

  **Voice overlay** — match `.voice-overlay`:
    - `position: absolute; inset: 0; background: rgba(20,18,16,0.78); backdropFilter: blur(20px); display: flex; flexDirection: column; alignItems: center; justifyContent: center; padding: 0 40px`.

  **Voice orb** — match `.voice-orb`:
    - `width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle at 50% 45%, var(--accent-strong), var(--accent) 55%, var(--accent-dim) 100%); box-shadow: 0 0 80px rgba(200,120,86,0.4)`.
    - Mic icon: size=42 stroke=1.6 color="#1a1816".
    - Two pulsing ring pseudo-elements: `position: absolute; inset: -16px; border-radius: 50%; border: 1.5px solid rgba(200,120,86,0.30); animation: pulse 2.4s ease-out infinite`. Second ring offset: `animationDelay: 1.2s`. Keyframes: `0% { transform: scale(0.9); opacity: 0.8 } 100% { transform: scale(1.45); opacity: 0 }`.

  **Text content** — match `VoiceListening` text:
    - "Listening…": `fontFamily: var(--serif); fontSize: 22px; fontWeight: 500; color: var(--text); textAlign: center; letterSpacing: -0.01em; marginTop: 36px`.
    - Transcript preview (live transcription): `fontSize: 14px; color: var(--text-2); textAlign: center; lineHeight: 1.5; marginTop: 10px`.

  **Controls** — match `VoiceListening` button row:
    - `display: flex; gap: 22px; alignItems: center; marginTop: 40px`.
    - X cancel button: `width: 52px; height: 52px; border-radius: 50%; background: var(--surface); color: var(--text-2)` with X icon size=20 stroke=2.
    - Check confirm button: same dimensions and style with check icon size=22 stroke=2.

  - On confirm: send transcript to `POST /ai/capture`, receive draft(s), open Quick-Add modal pre-filled (P9-4).
  - Based on: `docs/ui/screens-modals.jsx` (`VoiceListening`); `docs/ui/styles.css` (`.voice-overlay`, `.voice-orb`); `docs/ui/NAVIGATION.md` §05.
  - Validate: Tap mic FAB → overlay appears with pulsing orb animation. Cancel → returns. Confirm → parsed draft card opens with AI-filled fields.

- [x] **P9-4** Wire voice capture into Quick-Add Draft Card (from Phase 4).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `QuickAddDraft` (initial non-interactive view) and `QuickAddDraftInline` / `QuickAddHabitInline` (interactive) — specifically the AI-prefill + low-confidence chip states.

  **Voice header** — add to modal-head when opened from voice (not from + FAB):
    - AI heard preview below modal-head: `padding: 0 20px 6px; display: flex; alignItems: center; gap: 8px; color: var(--text-3); fontSize: 12px` — sparkles icon size=12 stroke=2 + transcript text.
    - Multi-item counter in modal-head right slot: "1 of N" `{ fontSize: 12px; color: var(--text-3); fontFeatureSettings: tnum }`.

  **Pre-filled fields**: populate all AI-parsed values into the chip/picker state before rendering. User sees filled values, not empty placeholders.

  **Low-confidence chips** — match `.qa-chip.low-conf`:
    - `boxShadow: inset 0 0 0 1px var(--accent-dim); color: var(--text-2); fontStyle: italic`.
    - `.qa-chip.low-conf .key { color: var(--accent-strong); fontStyle: normal }`.
    - Applied to fields where `confidence_flags` from `/ai/capture` response includes that field.

  **Multi-item save button**: when N > 1, save button text changes to "Save · next" (advancing through items), final item shows "Save" only. No "Save all" shortcut in prototype — go one at a time.

  - Based on: `docs/ui/screens-modals.jsx` (`QuickAddDraft`, `QuickAddDraftInline`); `docs/ui/styles.css` (`.qa-chip.low-conf`).
  - Validate: Voice input "gym 4x a week and call Pedro tomorrow" → two draft cards in sequence. Confirm low-confidence chips show italic style with accent-dim border. "1 of 2" / "2 of 2" counter in header.

### User Check-In
[-] Deferred — will be tested combined with end of Phase 10 (single EAS build covers P9 voice overlay + P10 push notifications).

### End-of-Phase Admin
- [x] Mark completed tasks. P9-1 through P9-4 complete.
- [x] AI capture logs confirmed written in Supabase (3 rows, all success=true).
- [x] libraries.md updated: `expo-speech-recognition` (app), `@anthropic-ai/sdk` (backend).
- [x] Git commit: `feat(p9): voice input, AI capture endpoint, quick-add prefill, low-confidence chips`

---

## Phase 10 — Notifications + Reminders

**Outcome**: Task reminders fire as push notifications at scheduled times. Habit danger-zone nudges fire at 09:00 when formula matches. Completing a task cancels its reminders.

### Tasks

- [~] **P10-1** **[User setup]** Configure Expo push notification credentials (FCM for Android).
  - Generate FCM server key in Google Cloud Console.
  - Add to Expo EAS credentials.
  - Record in `docs/credentials.md`.
  - Based on: TECHSTACK.md § Notifications and Jobs.
  - Validate: new EAS dev build succeeds and device receives a test push.
  - Note: requires a new EAS build after `google-services.json` is added. See setup instructions below.

- [x] **P10-2** Register push token on app startup.
  - `app/lib/hooks/useNotifications.ts`: request permissions, call `Notifications.getExpoPushTokenAsync`, POST to `/notifications/register`.
  - `app/app/_layout.tsx`: `useNotificationSetup(session?.user?.id)` called in `AuthGuard`.
  - `expo-notifications` plugin added to `app.json`.
  - `backend/src/routes/notifications.ts`: `POST /notifications/register` upserts token; `GET /notifications/reminders`; `DELETE /notifications/reminders`.
  - Validate: after new EAS build and permissions granted, `notification_tokens` table has row.

- [x] **P10-3** Backend: schedule reminder when task is created/updated with reminder_spec.
  - `backend/src/routes/tasks.ts`: `createReminderForTask()` called after task created if `reminder_spec` present.
  - `POST /tasks/:id/complete` now calls `cancelRemindersForTask()`.
  - `POST /tasks/:id/reminders` added for adding reminder to existing task.
  - `reminder_spec` field added to `CreateTaskRequestSchema` and `useCreateTask` hook.
  - `quick-add.tsx`: passes `currentDraft?.reminder_spec` through on voice-mode save.
  - Validate: voice capture "call Pedro tomorrow" → task saved → `reminders` row in DB with `scheduled_for` set.

- [x] **P10-4** Backend: reminder dispatch job (`POST /jobs/dispatch-reminders`).
  - `backend/src/routes/jobs.ts`: finds `one_shot` reminders past `scheduled_for` and `recurring_until_done` past `next_run_at`.
  - Calls Expo Push API via `services/push.ts`.
  - Updates `status=sent` for one_shot; advances `next_run_at` +1 day for recurring.
  - Protected by `X-Cron-Secret` header (set `CRON_SECRET` env var on Render).
  - Validate: configure Render Cron → `POST /jobs/dispatch-reminders` every 5 min. Insert test reminder 1 min in future → check `status=sent` in DB.

- [x] **P10-5** Backend: habit danger-zone nudge job (`POST /jobs/habit-nudges`).
  - `backend/src/routes/jobs.ts`: formula `count_remaining + 1 >= days_left`. Checks `habit_nudge_log` for duplicates. Sends push + inserts log row.
  - Validate: configure Render Cron → `POST /jobs/habit-nudges` daily at 09:00 UTC.

- [x] **P10-6** Settings → Reminders sub-page (`app/(settings)/reminders.tsx`).
  - `app/app/(settings)/`: `_layout.tsx` (Stack), `index.tsx` (settings landing), `reminders.tsx` (reminders list + delete all).
  - Gear icon on all 4 tabs now navigates to `/(settings)`.
  - Reminders screen: lists scheduled reminders with task title + next fire time. Confirm → delete all → cancels in DB.
  - Validate: tap gear → Settings opens. Tap Reminders → list shows scheduled reminders. Delete all → list clears.

- [x] **P10-7** FAB redesign — merge two floating buttons into single orange `+` button.
  - `app/app/components/TabBar.tsx`: removed `fabSmall`, single `fabLarge` with `onPress` → quick-add and `onLongPress` (300ms + haptic) → voice overlay.
  - Validate: tap FAB → quick-add opens. Long-press FAB → voice overlay appears.

- [x] **P10-8** Backend: `POST /ai/parse-reminder` — natural language → ReminderSpec.
  - `backend/src/routes/ai.ts`: uses `claude-haiku-4-5-20251001` with forced tool use. Input: `{ text, timezone }`. Output: `{ kind, scheduled_for, recurrence_rule }` or 422.
  - Handles: "tomorrow at 9am", "Friday", "tonight", "daily until done", "in 2 hours", etc.
  - Validate: POST `{ text: "tomorrow at 9am", timezone: "Europe/Berlin" }` → ISO datetime returned.

- [x] **P10-9** `reminder-input-store.ts` — Zustand store for cross-screen transcript relay.
  - `app/lib/stores/reminder-input-store.ts`: holds `{ pendingTranscript, sourceContext }`. Used to pass voice transcript from voice overlay back to the screen that triggered it.

- [x] **P10-10** Voice overlay: `mode=reminder` param.
  - `app/app/voice-listening.tsx`: accepts `?mode=reminder&ctx=<task-detail|quick-add>`. In reminder mode: skips AI capture, stores transcript in `reminder-input-store`, calls `router.back()`. Existing capture flow unchanged. Hint text changes to "Say when to remind you…".
  - Validate: navigate to `/voice-listening?mode=reminder&ctx=task-detail` → speak → tick → store has transcript.

- [x] **P10-11** Inline reminder bubble in `TaskDetailSheet`.
  - Tapping the reminder row's EDIT expands into a text input + orange mic button. Long-pressing mic opens `VoiceReminderModal` (inline, see P10-13). Confirm calls `POST /ai/parse-reminder` then `POST /tasks/:id/reminders`. Shows parsed time once saved. Error text shown if parse fails.
  - `app/app/components/TaskDetailSheet.tsx`.
  - Validate: open task detail → tap EDIT → type "next Monday 8am" → Set reminder → reminder row shows parsed date.

- [x] **P10-12** Inline reminder bubble in `quick-add.tsx`.
  - Same bubble below the chips, tasks only, manual mode. Parsed spec stored locally and passed to `createTask` on save.
  - `app/app/quick-add.tsx`.
  - Validate: open quick-add manually → "Add reminder" row visible → type reminder → Set reminder → save task → `reminders` row in DB.

- [x] **P10-13** `VoiceReminderModal` component.
  - `app/app/components/VoiceReminderModal.tsx`: self-contained `<Modal>` with full speech recognition (pulse animations, X / check controls, error/retry state). Rendered inside `TaskDetailSheet` instead of `router.push` to avoid pushed screens rendering behind a React Native system Modal.
  - Validate: long-press mic in task detail reminder bubble → overlay appears above the sheet → speak → tick → transcript populates input.

### User Check-In
After P10 setup + new EAS build: use voice capture "remind me in 2 minutes to check the set list". Confirm token in `notification_tokens` table, reminder in `reminders` table. Wait 2 min → push fires.

### P10-1 Setup Instructions (requires user action + new EAS build)

**Step 1 — Create Firebase project:**
1. Go to https://console.firebase.google.com
2. Create a new project (or use existing): "Weekly Focus"
3. Add an **Android app** with package name `com.kilianzf.weeklyfocus`
4. Download `google-services.json`
5. Place it at `app/google-services.json`

**Step 2 — Update `app.json`:**
Add `"googleServicesFile": "./google-services.json"` inside the `"android"` block.

**Step 3 — Upload FCM key to EAS:**
In your terminal inside `app/`:
```
! eas credentials
```
Select Android → Development build → FCM → upload the server key from Firebase console (Project Settings → Cloud Messaging → Server key).

**Step 4 — Build:**
```
! eas build --profile development --platform android
```

**Step 5 — Set `CRON_SECRET` on Render:**
Set env var `CRON_SECRET=<random-string>` on Render. Then configure two Render Cron Jobs:
- `POST https://this-week.onrender.com/jobs/dispatch-reminders` — every 5 min — header `X-Cron-Secret: <your-secret>`
- `POST https://this-week.onrender.com/jobs/habit-nudges` — daily at 09:00 UTC — same header

### End-of-Phase Admin
- [x] Mark completed tasks (P10-2 through P10-6 implemented).
- [~] P10-1 deferred: awaiting user setup (Firebase + google-services.json + new EAS build).
- [x] Git commit: `feat(p10): push notifications, reminder dispatch job, habit danger-zone nudges`

---

## Phase 11 — AI Goal Coach

**Outcome**: "Coach me" button opens an AI conversation. Coach is purely advisory; concludes with a "Create this goal" button that opens the Add Goal form pre-filled.

### Tasks

- [ ] **P11-1** Backend: `POST /ai/coach/message`.
  - Input: `{ messages: ConversationMessage[], user_context: { goals: Goal[], themes: Theme[] } }`.
  - Calls Anthropic with system prompt that loads coach principles (force the "when"; distinguish milestones vs. continuous direction; identify compounding opportunities; advise on 1+2 cap; push back on vagueness).
  - Returns `{ reply: string, is_conclusion: boolean, suggested_goal?: GoalDraft }`.
  - When `is_conclusion=true`: includes pre-fill data for Add Goal form.
  - Based on: requirements-lens § AI Goal Coach; UX lens § Goal-Setting Sub-Journey.
  - Validate: POST with messages leading to a goal conclusion → `is_conclusion=true` returned with `suggested_goal` fields populated.

- [ ] **P11-2** Coach conversation screen (`app/(modals)/coach.tsx`).
  - Prototype reference: `docs/ui/screens-modals.jsx` → `CoachEntry` (mid-conversation) and `CoachSummary` (conclusion/summary state).
  - Prototype reference: `docs/ui/styles.css` → `.coach-bubble`, `.input-bar`, `.modal-head`.

  **Modal header** — match `CoachEntry` modal-head:
    - Left: X icon-btn (close coach). Center: "Goal Coach" in `.modal-head .title` (serif 17px).
    - Right: "Restart" as text-style icon-btn `{ fontSize: 12px; width: auto; padding: 0 10px; color: var(--text-3) }`.

  **Chat thread** — match `CoachEntry` message list:
    - Scrollable flex-column with `gap: 12px; padding: 8px 20px 12px`.
    - Timestamp: `alignSelf: center; fontSize: 11px; color: var(--text-3); letterSpacing: 0.08em; uppercase; fontWeight: 600; marginBottom: 4px`.
    - AI bubble `.coach-bubble.ai`: `background: var(--surface); color: var(--text); borderRadius: 16px; borderBottomLeftRadius: 6px; maxWidth: 82%; padding: 12px 14px; fontSize: 14px; lineHeight: 1.45`.
    - User bubble `.coach-bubble.you`: `background: var(--accent); color: #1a1816; alignSelf: flex-end; borderRadius: 16px; borderBottomRightRadius: 6px; maxWidth: 82%`.
    - Principle box (special AI message variant): `background: var(--surface-2); padding: 14px`. Label: `fontSize: 11px; color: var(--accent-strong); letterSpacing: 0.10em; uppercase; fontWeight: 600; marginBottom: 6px` "Principle". Body: `color: var(--text-2); fontSize: 13.5px; lineHeight: 1.5`.
    - Typing indicator: `display: flex; gap: 4px; alignSelf: flex-start; padding: 8px 14px; background: var(--surface); borderRadius: 16px; borderBottomLeftRadius: 6px`. Three `6px × 6px` dots, `border-radius: 50%; background: var(--text-3)`, animation `dotpulse 1.2s infinite` with 0.2s stagger per dot. `@keyframes dotpulse { 0%, 60%, 100% { opacity: 0.3 } 30% { opacity: 1 } }`.

  **Conclusion state** (when `is_conclusion=true`) — match `CoachSummary`:
    - Summary box AI bubble: `background: var(--surface-2)`. Label "Summary" (accent-strong uppercase). Body: goal name (serif/accent-strong), date (serif/accent-strong), theme (serif/accent-strong) — 3 labeled lines.
    - Below the last AI message: "Create this goal" button `btn-primary btn-block` with arrow icon. Footnote: `fontSize: 11.5px; color: var(--text-3); textAlign: center; marginTop: 10px` "Opens the Add Goal form, pre-filled. You'll review before saving."

  **Input bar** — match `.input-bar + CoachEntry input-bar`:
    - `display: flex; gap: 10px; alignItems: center; padding: 12px 16px; background: var(--surface); borderTop: 1px solid var(--hairline)`.
    - Text field: `flex: 1; background: var(--surface-2); borderRadius: 999px; padding: 10px 16px; color: var(--text-3); fontSize: 13.5px` — placeholder "Type or hold the mic…" / "Want to refine? Keep chatting…".
    - Mic button: `width: 40px; height: 40px; borderRadius: 50%; background: var(--accent); display: flex; alignItems: center; justifyContent: center` — mic icon size=18 stroke=1.8 color="#1a1816".

  - Based on: `docs/ui/screens-modals.jsx` (`CoachEntry`, `CoachSummary`); `docs/ui/styles.css` (`.coach-bubble`, `.input-bar`); `docs/ui/NAVIGATION.md` §08/09.
  - Validate: Open coach → correct header layout. Send message → AI bubble appears. Typing indicator shows while waiting. Reach conclusion → summary bubble + "Create this goal" button appear. Tap button → Add Goal form opens pre-filled. Save → goal appears in Goals tab.

### User Check-In
After P11-2: tap "🪄 Coach me on a goal". Have a conversation about a goal. Coach recommends a specific goal with a date. Tap "Create this goal". Review pre-filled form, save. Confirm goal appears.

### End-of-Phase Admin
- [ ] Mark completed tasks.
- [ ] Git commit: `feat(p11): AI goal coach — conversation, conclusion, pre-filled goal form`

---

## Phase 12 — Settings + Final Polish

**Outcome**: Settings screen complete. Theme management works. Habit nudges toggle works. Appearance toggle works. App is stable, handles errors, and is ready for daily personal use.

### Tasks

- [ ] **P12-1** Settings screen (`app/(settings)/index.tsx`).
  - No prototype component in `docs/ui/` for Settings — implement using the design system from `docs/ui/styles.css` `:root` tokens and consistent with the page/card/chip patterns used in primary screens.
  - Page header: same `.page-head` pattern (serif h1, gear not needed here, back chevron instead).
  - Sections (grouped list pattern): Themes / Reminders / Notifications (habit nudges toggle) / Appearance (Light/Dark/System) / About (version).
  - Section rows: `background: var(--surface); border-radius: var(--radius-md); padding: 14px 16px`. Section headers use `.section-label` uppercase 11px pattern.
  - Toggle: use standard toggle switch, `color: var(--accent)` when on.
  - Gear icon on all 4 primary tabs opens this screen (navigation wired in P4-5).
  - Based on: `docs/ui/styles.css` (design tokens); `docs/ui/NAVIGATION.md` § Settings.
  - Validate: open settings from each tab; toggle habit nudges persists; toggle appearance switches theme mode.

- [ ] **P12-2** Settings → Themes Management (`app/(settings)/themes.tsx`).
  - No prototype component in `docs/ui/` for Themes Management — implement using design system tokens from `docs/ui/styles.css`.
  - List of themes: each row `background: var(--surface); border-radius: var(--radius-md); padding: 13px 14px; display: flex; gap: 12px`. Color swatch (9×9 circle), theme name, drag handle (`.drag` icon from `docs/ui/components.jsx` Icon paths), edit/delete actions.
  - Theme color dot uses same swatch pattern as `ThemeChip` in `docs/ui/components.jsx`.
  - Drag-to-reorder, "+ Add theme" at bottom.
  - Delete theme with linked items: confirm dialog; items move to Uncategorized pseudo-theme (ASSUMPTION: Uncategorized in v1).
  - Based on: `docs/ui/styles.css` (design tokens); `docs/ui/components.jsx` (Icon `drag`); DATABASE_DESIGN.md § themes.
  - Validate: reorder themes, save; create a new theme with custom color; delete a theme with tasks → items show Uncategorized.

- [ ] **P12-3** Appearance / theme mode persistence.
  - Store `theme_mode` in `user_settings`. Apply NativeWind dark/light class on root.
  - Based on: DATABASE_DESIGN.md § user_settings.
  - Validate: switch to light mode; restart app; light mode persists.

- [ ] **P12-4** Error states and loading skeletons on all screens.
  - All TanStack Query error states: inline "Couldn't load. Pull to retry." in `color: var(--text-3); fontSize: 13px` consistent with design system.
  - Loading skeletons: card-shaped placeholders using `.skel` from `docs/ui/styles.css`: `background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%); border-radius: var(--radius-md)`. No shimmer animation — static muted cards.
  - Skeleton cards should match the height/shape of the content they replace (habit row, task row, stats-hero card, etc.).
  - Based on: `docs/ui/styles.css` (`.skel`).
  - Validate: disable network; open app; skeleton cards appear then error state. Re-enable; pull to refresh works.

- [ ] **P12-5** Goal target date passed prompt.
  - On app open, check for active goals whose `target_date < today`. If found, show prompt: "Did you hit [goal]? → Mark as hit / Extend / Abandon."
  - Extend: opens Edit Goal form (from P6-5 `AddGoalForm`) with target date field pre-focused.
  - No dedicated prototype component for this prompt — implement as a bottom sheet using `.sheet` + `.grip` pattern from `docs/ui/styles.css`, with `ActionRow`-style buttons from `docs/ui/screens-modals.jsx` `GoalActionDrawer`.
  - Based on: domain-lens § Goal lifecycle; requirements-lens § Triggers; `docs/ui/styles.css`.
  - Validate: create goal with `target_date = today - 1 day`; open app; prompt appears; mark as hit → goal in graveyard.

- [ ] **P12-6** Habit nudges global toggle wired to backend.
  - `PATCH /user-settings` — update `danger_zone_nudges_enabled`.
  - Backend nudge job checks this flag before sending.
  - Based on: DATABASE_DESIGN.md § user_settings; requirements-lens § Habit danger-zone nudge.
  - Validate: disable nudges; run nudge job; no notifications sent.

- [ ] **P12-7** Vitest unit tests for critical backend logic.
  - Week resolution utility (P4-4).
  - Rollover service (P8-1).
  - Habit danger-zone formula (P10-5).
  - Based on: TECHSTACK.md § Testing; CLAUDE.md § Validation Rules.
  - Validate: `pnpm test` passes.

### User Check-In
After P12-7: full end-to-end daily use test. Add goals, tasks, habits. Complete a week. Trigger carry-over ritual. Check Stats. Verify everything feels calm, quick, and correct.

### End-of-Phase Admin
- [ ] Mark completed tasks.
- [ ] Git commit: `feat(p12): settings, theme management, error states, skeletons, unit tests`
- [ ] Record any deferred items for post-v1.
- [ ] Update `docs/env.md` with any new env vars discovered.
- [ ] Tag git commit as `v1-complete`.

---

## Housekeeping — Open Bugs

Bugs found during testing that haven't been fixed yet. Fix these before or alongside the phase they belong to.

- [ ] **HK-2** Carry-over recap: 64px fraction numbers may render smaller/dimmer than the prototype on some Android devices.
  - The nested `<Text>` approach was already replaced with sibling `<Text>` in a baseline-aligned row, but the visual difference versus the browser prototype persists. Likely caused by Georgia font metrics or Android font rendering at large sizes.
  - **Do not fix unless the user explicitly requests it.** Leave as-is for now.
  - If targeted: try loading a custom serif (Source Serif 4) via expo-font, or adjust fontSize/letterSpacing until it matches the prototype visually on device.

- [x] **HK-1** Ring counter text not visually centered on Android.
  - `dominantBaseline="central"` was applied in P4 fix but the text still appears slightly off-center on Android. Likely a react-native-svg rendering difference on Android vs iOS/web.
  - Investigate: try using `y={cy + fontSize * 0.35}` and no `dominantBaseline`, or render the counter as an absolute-positioned `<Text>` overlay on top of the SVG ring instead.
  - Validate: open app on Android device, habit ring counter sits visually centered inside the circle.

---

## Post-v1 Parking Lot (do not implement unless explicitly requested)

- Offline-first sync
- iOS optimization
- Desktop web
- Staging environment
- AI Coach for tasks
- Sub-tasks / task hierarchy
- Export UI
- Multi-device / multi-user
- First-launch onboarding flow (deferred 2026-05-15)
- Sentry error tracking
- Recurring-on-schedule reminders (nice-to-have per requirements-lens)
- Conditional reminders (nice-to-have)
