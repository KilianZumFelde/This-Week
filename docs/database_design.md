# DATABASE_DESIGN.md

## Overview

Database design for the Weekly Focus app.

Database provider: Supabase Postgres.

Authentication provider: Supabase Auth.

All core user-owned data is scoped by `user_id`, referencing `auth.users(id)`.

The database is designed for a mobile-first personal productivity app with:

- themes
- goals
- tasks
- habits
- weekly habit records
- weekly archive records
- reminders
- notification tokens
- carry-over rituals
- user settings

---

## General Conventions

### Primary Keys

Use UUID primary keys.

```sql
id uuid primary key default gen_random_uuid()
```

### User Ownership

All user-owned tables include:

```sql
user_id uuid not null references auth.users(id) on delete cascade
```

### Timestamps

Use:

```sql
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Tables should use an `updated_at` trigger where appropriate.

### Soft Delete vs Hard Delete

Default behavior:

- Tasks: hard delete when user chooses Delete/Drop.
- Themes: avoid hard delete if referenced by active data; either prevent deletion or require reassignment.
- Goals: archive/complete rather than delete by default.
- Habits: archive/pause rather than delete by default.
- Historical records: never delete during normal app use.

### Timezone

For v1, timezone is user/device local timezone.

Store the user timezone in `user_settings.timezone`.

All scheduled rules should use this timezone.

### Week Definition

A week starts on Sunday at 00:00 local time and ends on Saturday at 23:59:59 local time.

Store week start dates as `date` values representing the local Sunday date.

Column convention:

```sql
week_start_date date not null
```

---

## Enums

Postgres enums or text columns with check constraints may be used. The following logical enums are required.

### goal_type

```txt
primary
secondary
```

### goal_status

```txt
active
completed
archived
```

### task_status

```txt
open
done
archived_done
```

Dropped/deleted tasks are removed rather than moved to a `dropped` status.

### task_week_assignment

```txt
this_week
backlog
```

### effort_level

```txt
low
medium
high
unknown
```

### return_level

```txt
low
medium
high
unknown
```

### habit_status

```txt
active
paused
archived
```

### reminder_status

```txt
scheduled
sent
cancelled
expired
failed
```

### reminder_kind

```txt
one_shot
recurring_until_done
```

### carry_over_ritual_status

```txt
pending
completed
```

### carry_over_decision

```txt
keep_this_week
send_to_backlog
drop
```

### notification_platform

```txt
android
ios
web
unknown
```

Primary v1 platform is Android.

### theme_mode

```txt
dark
light
system
```

Stored on `user_settings.theme_mode`. Not currently a Postgres enum or CHECK constraint — validated at the backend layer (Zod) on update.

### milestone_status (Release 1)

```txt
active
hit
```

### goal_health_level (Release 1)

5-level, worst→best. Display → stored:

```txt
Behind          → behind
Slightly behind → slightly_behind
On track        → on_track
Ahead           → ahead
Well ahead      → well_ahead
```

### goal_progress_answer (Release 1)

The retrospective "how much did you move this week" answer.

```txt
A lot   → a_lot
Some    → some
Barely  → barely
Nothing → nothing
```

### goal_confidence_answer (Release 1)

The "confident you'll hit it by [date]" answer.

```txt
Yes   → yes
Maybe → maybe
No    → no
```

---

## Tables

## profiles

Optional profile metadata for the authenticated user.

Supabase Auth remains the source of truth for authentication.

```sql
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## user_settings

Stores user-level app settings.

```sql
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Europe/Berlin',
  danger_zone_nudges_enabled boolean not null default true,
  theme_mode text not null default 'dark',
  accent_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notes:

- `timezone` is required for week rollover, reminders, and habit nudges.
- `danger_zone_nudges_enabled` controls system-triggered habit nudges globally.

---

## themes

Configurable life areas such as DJ career, fitness, job change, bachata.

```sql
create table themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  icon text,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, name)
);
```

Indexes:

```sql
create index themes_user_id_idx on themes(user_id);
create index themes_user_active_idx on themes(user_id, is_archived);
```

---

## goals

Milestones with required target dates.

A user may have at most:

- 1 active primary goal
- 2 active secondary goals

```sql
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id uuid references themes(id) on delete set null,
  title text not null,
  why text,
  goal_type text not null check (goal_type in ('primary', 'secondary')),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  target_date date not null,
  completed_at timestamptz,
  archived_at timestamptz,
  sort_order integer not null default 0,

  -- Release 1: subjective weekly health (nullable until first triage / first milestone)
  health_level text check (health_level in
    ('behind', 'slightly_behind', 'on_track', 'ahead', 'well_ahead')),
  progress_answer text check (progress_answer in ('a_lot', 'some', 'barely', 'nothing')),
  confidence_answer text check (confidence_answer in ('yes', 'maybe', 'no')),
  health_set_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notes:

- `health_set_date` is the **Sunday the current health was set** — used to tell whether this week's health has been answered yet and to detect a stale (pre-this-week) value.
- All four health columns are nullable: existing goals migrate cleanly without a backfill, and the "no health yet" UI state is a real, designed state — not an error.
- The 5-level set deliberately has **no "at risk"** value and **adds "well_ahead"** at the top.

Indexes:

```sql
create index goals_user_id_idx on goals(user_id);
create index goals_user_status_idx on goals(user_id, status);
create index goals_user_type_status_idx on goals(user_id, goal_type, status);
create index goals_theme_id_idx on goals(theme_id);
```

Recommended partial unique index for primary goal cap:

```sql
create unique index goals_one_active_primary_per_user_idx
on goals(user_id)
where goal_type = 'primary' and status = 'active';
```

Recommended enforcement for max 2 active secondary goals should be handled in backend business logic. It can also be enforced with a trigger if desired.

---

## milestones (Release 1)

A dated checkpoint belonging to a goal — a near-term marker, distinct from the goal's own (often distant) target date. Lifecycle `active → hit` (`hit` terminal). "Overdue" and "nearest upcoming" are **derived**, not stored.

```sql
create table milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  title text not null,
  target_date date not null,
  status text not null default 'active' check (status in ('active', 'hit')),
  hit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Indexes:

```sql
-- All milestones for a goal (Goal Detail milestone list)
create index milestones_goal_id_idx on milestones(goal_id);

-- Nearest upcoming milestone per goal: min(target_date) where status='active'
create index milestones_goal_active_due_idx on milestones(goal_id, target_date)
  where status = 'active';

-- Ownership / RLS scans
create index milestones_user_id_idx on milestones(user_id);
```

Notes:

- `on delete cascade` on `goal_id`: a milestone makes no sense without its goal, so deleting a goal takes its milestones with it.
- Hard delete is allowed even though the v1 UI exposes only *Mark hit* and *Edit*.
- **No Task relationship** — deliberate anti-Jira scoping. Tasks link to goals only; a milestone never owns or tags tasks.
- Duplicate titles within a goal are allowed — internal ID only, no business uniqueness.
- `hit_at` is set when the user marks the milestone hit; null while active.

---

## goal_health_records (Release 1)

A snapshot of a goal's health for a given week, archived alongside the existing `week_records` weekly boundary. One row per goal per week. Powers the 8-week health-trend dot row on Goal Detail.

```sql
create table goal_health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  week_start_date date not null,
  health_level text not null check (health_level in
    ('behind', 'slightly_behind', 'on_track', 'ahead', 'well_ahead')),
  progress_answer text not null check (progress_answer in ('a_lot', 'some', 'barely', 'nothing')),
  confidence_answer text not null check (confidence_answer in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (goal_id, week_start_date)
);
```

Indexes:

```sql
-- Trend read: a goal's last N weeks, newest first (8-week dot row)
create index goal_health_records_goal_week_idx
  on goal_health_records(goal_id, week_start_date desc);

-- Ownership / RLS scans
create index goal_health_records_user_week_idx
  on goal_health_records(user_id, week_start_date);
```

Notes:

- `week_start_date` is the **Sunday of the week being entered** — same `date` (local Sunday) convention as `week_records`.
- `unique (goal_id, week_start_date)` enforces at most one snapshot per goal per week; re-running the goal step in the same week upserts this row.
- `health_level`, `progress_answer`, `confidence_answer` are all **NOT NULL** here (unlike on `goals`): a snapshot only exists once the mandatory triage questions have been answered.

---

## tasks

One-shot actions. Tasks belong to one theme and may optionally link to a goal.

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id uuid not null references themes(id) on delete restrict,
  goal_id uuid references goals(id) on delete set null,
  title text not null,
  notes text,
  status text not null default 'open' check (status in ('open', 'done', 'archived_done')),
  week_assignment text not null default 'this_week' check (week_assignment in ('this_week', 'backlog')),
  week_start_date date,
  effort_level text not null default 'unknown' check (effort_level in ('low', 'medium', 'high', 'unknown')),
  return_level text not null default 'unknown' check (return_level in ('low', 'medium', 'high', 'unknown')),
  completed_at timestamptz,
  archived_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    (week_assignment = 'this_week' and week_start_date is not null)
    or
    (week_assignment = 'backlog')
  )
);
```

Notes:

- `week_start_date` is required for tasks assigned to the current week.
- Backlog tasks may have `week_start_date` null.
- Done tasks remain in the same weekly context until archived at Sunday rollover.
- Dropped/deleted tasks are hard deleted.

Indexes:

```sql
create index tasks_user_id_idx on tasks(user_id);
create index tasks_user_week_idx on tasks(user_id, week_start_date);
create index tasks_user_status_idx on tasks(user_id, status);
create index tasks_user_assignment_idx on tasks(user_id, week_assignment);
create index tasks_theme_id_idx on tasks(theme_id);
create index tasks_goal_id_idx on tasks(goal_id);
create index tasks_user_this_week_open_idx on tasks(user_id, week_start_date, status)
where week_assignment = 'this_week';
create index tasks_user_backlog_idx on tasks(user_id, status, theme_id)
where week_assignment = 'backlog';
```

---

## habits

Recurring weekly actions with count targets.

```sql
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id uuid not null references themes(id) on delete restrict,
  goal_id uuid references goals(id) on delete set null,
  title text not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  weekly_target integer not null check (weekly_target > 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  danger_zone_nudge_enabled boolean not null default true,
  archived_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Indexes:

```sql
create index habits_user_id_idx on habits(user_id);
create index habits_user_status_idx on habits(user_id, status);
create index habits_theme_id_idx on habits(theme_id);
create index habits_goal_id_idx on habits(goal_id);
```

---

## habit_week_records

One record per habit per active week.

Stores the weekly count and target snapshot.

```sql
create table habit_week_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  week_start_date date not null,
  target_count integer not null check (target_count > 0),
  completed_count integer not null default 0 check (completed_count >= 0),
  target_met boolean generated always as (completed_count >= target_count) stored,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (habit_id, week_start_date)
);
```

Indexes:

```sql
create index habit_week_records_user_week_idx on habit_week_records(user_id, week_start_date);
create index habit_week_records_habit_idx on habit_week_records(habit_id);
```

Notes:

- `target_count` snapshots the habit target for that week.
- Counts may exceed the target.
- At Sunday rollover, last week records are archived and new records are created for active habits.

---

## week_records

Weekly archive container.

One record per user per week.

```sql
create table week_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  tasks_completed_count integer not null default 0 check (tasks_completed_count >= 0),
  tasks_total_count integer not null default 0 check (tasks_total_count >= 0),
  habits_met_count integer not null default 0 check (habits_met_count >= 0),
  habits_total_count integer not null default 0 check (habits_total_count >= 0),
  primary_goal_id uuid references goals(id) on delete set null,
  primary_goal_tasks_completed_count integer not null default 0 check (primary_goal_tasks_completed_count >= 0),
  archived_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, week_start_date)
);
```

Indexes:

```sql
create index week_records_user_week_idx on week_records(user_id, week_start_date desc);
```

Notes:

- Stores summary counts for past-week browsing and stats.
- Detailed task and habit history remains available through archived tasks and habit week records.

---

## reminders

Scheduled notifications attached to tasks.

```sql
create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  kind text not null check (kind in ('one_shot', 'recurring_until_done')),
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled', 'expired', 'failed')),
  scheduled_for timestamptz not null,
  recurrence_rule text,
  last_sent_at timestamptz,
  next_run_at timestamptz,
  cancelled_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Indexes:

```sql
create index reminders_user_id_idx on reminders(user_id);
create index reminders_task_id_idx on reminders(task_id);
create index reminders_due_idx on reminders(status, next_run_at);
create index reminders_scheduled_for_idx on reminders(status, scheduled_for);
```

Notes:

- For one-shot reminders, `scheduled_for` is the dispatch time.
- For recurring reminders, `next_run_at` is used for dispatch.
- Completing a task cancels pending reminders for that task.
- Reminder default time when not specified is 09:00 local time.

---

## habit_nudge_log

Tracks once-per-week habit danger-zone nudges.

```sql
create table habit_nudge_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  week_start_date date not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique (habit_id, week_start_date)
);
```

Indexes:

```sql
create index habit_nudge_log_user_week_idx on habit_nudge_log(user_id, week_start_date);
```

Notes:

- Enforces once-per-habit-per-week danger-zone nudges.

---

## notification_tokens

Expo push tokens per device.

```sql
create table notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'android' check (platform in ('android', 'ios', 'web', 'unknown')),
  device_name text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (expo_push_token)
);
```

Indexes:

```sql
create index notification_tokens_user_active_idx on notification_tokens(user_id, is_active);
```

---

## carry_over_rituals

Represents the mandatory weekly carry-over ritual after Sunday rollover.

One ritual per user per week when there are unfinished tasks from the previous week.

```sql
create table carry_over_rituals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_week_start_date date not null,
  to_week_start_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, from_week_start_date, to_week_start_date)
);
```

Indexes:

```sql
create index carry_over_rituals_user_status_idx on carry_over_rituals(user_id, status);
```

---

## carry_over_task_decisions

Stores each unfinished task requiring triage in a carry-over ritual.

```sql
create table carry_over_task_decisions (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references carry_over_rituals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  decision text check (decision in ('keep_this_week', 'send_to_backlog', 'drop')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (ritual_id, task_id)
);
```

Indexes:

```sql
create index carry_over_task_decisions_ritual_idx on carry_over_task_decisions(ritual_id);
create index carry_over_task_decisions_user_idx on carry_over_task_decisions(user_id);
```

Notes:

- Ritual remains pending until every associated decision has a non-null decision.
- `keep_this_week` updates task to the new week.
- `send_to_backlog` moves task to backlog.
- `drop` hard deletes the task after recording the decision or deletes the task as part of the same transaction.

---

## ai_capture_logs

Optional minimal log for AI capture/debugging.

Do not store full sensitive transcripts unless explicitly required.

```sql
create table ai_capture_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_type text not null,
  output_type text,
  success boolean not null default false,
  error_code text,
  created_record_id uuid,
  created_at timestamptz not null default now()
);
```

Indexes:

```sql
create index ai_capture_logs_user_created_idx on ai_capture_logs(user_id, created_at desc);
```

Notes:

- Keep this table minimal.
- Stores **metadata only** in v1 — no raw transcripts, no raw AI responses, no sanitized previews.
- `tasks.notes` and `habits.notes` columns exist in the schema for future use but are **not surfaced anywhere in the v1 UI** (neither read nor written by the app).

---

## Key Relationships

```txt
auth.users 1:1 profiles
auth.users 1:1 user_settings
auth.users 1:N themes
auth.users 1:N goals
auth.users 1:N tasks
auth.users 1:N habits
auth.users 1:N week_records
auth.users 1:N reminders
auth.users 1:N notification_tokens
auth.users 1:N milestones           (Release 1)
auth.users 1:N goal_health_records  (Release 1)

themes 1:N goals
themes 1:N tasks
themes 1:N habits

goals 1:N tasks
goals 1:N habits
goals 1:N milestones           (Release 1 — cascade delete)
goals 1:N goal_health_records  (Release 1 — cascade delete)

milestones — tasks             NONE (deliberately no relationship)

habits 1:N habit_week_records

tasks 1:N reminders

carry_over_rituals 1:N carry_over_task_decisions
carry_over_task_decisions N:1 tasks
```

---

## Business Rule Enforcement

### Enforced in Database

- UUID primary keys.
- Required `user_id` ownership.
- Basic enum validity through check constraints.
- Required target dates for goals.
- Required weekly target for habits.
- Unique habit week record per habit/week.
- Unique week record per user/week.
- Unique active primary goal per user via partial unique index.
- Once-per-habit-per-week nudge log.
- Unique carry-over ritual per user/from-week/to-week.
- Milestone `status` validity (`active` / `hit`) via CHECK. (Release 1)
- Goal health enum validity (`health_level`, `progress_answer`, `confidence_answer`) via CHECK on both `goals` and `goal_health_records`. (Release 1)
- At most one health snapshot per goal per week via `unique (goal_id, week_start_date)` on `goal_health_records`. (Release 1)
- Cascade delete of milestones and health records when a goal (or user) is deleted. (Release 1)

### Enforced in Backend

- Max 2 active secondary goals per user.
- Goal creation/update rules.
- Theme deletion/reassignment behavior.
- Week rollover process.
- Habit streak calculations.
- Carry-over ritual creation and completion.
- Carry-over task decision application.
- Reminder scheduling and cancellation.
- Recurring reminder updates.
- Habit danger-zone nudge formula.
- Notification dispatch.
- AI output validation before writes.
- User confirmation before saving AI-generated drafts where required.
- **Milestone target-date validation** (Release 1): target date required + in the future at creation; target date on or before the parent goal's `target_date` (cross-table comparison, backend-only).
- **`health_level = calculateGoalHealth(current, history)`** (Release 1): computed from the current week's answers **plus up to 3 prior contiguous `goal_health_records` rows** (fetched at write-time, ordered newest→oldest, stopped at the first missing week). Written to both `goals` (current) and `goal_health_records` (snapshot). Stored values from prior weeks are never re-computed retroactively.
- **Both health questions required** to set/confirm a goal's health during triage (mandatory-light). (Release 1)
- **Mark-hit flow** (Release 1): set `status='hit'` + `hit_at`, then prompt to create the next milestone.
- **Overdue surfacing** (Release 1): derived (`status='active'` AND `target_date < today`); surfaced in the next Sunday triage goal step. No blocking app-open prompt.
- **Health freeze between Sundays** (Release 1): no clock- or activity-driven drift; `goals` health columns change only when the user answers the weekly questions.
- **Carry-over ritual creation** (Release 1): ritual is created when there are open leftover tasks OR active goals (not only when there are leftover tasks, so the goal step runs every Sunday even with a clean task slate).

---

## Sunday Rollover Data Flow

At Sunday 00:00 local time, or on first app open after the week changes, backend logic should:

1. Determine previous and current `week_start_date` for the user timezone.
2. Archive completed tasks from the previous week as `archived_done`.
3. Create/update `week_records` summary for the previous week.
4. Archive previous week `habit_week_records`.
5. Update habit streaks:
   - increment if target was met
   - reset to 0 if target was missed
   - preserve `best_streak`
6. Create new `habit_week_records` for active habits for the new week.
7. Identify unfinished previous-week tasks.
8. If unfinished tasks exist OR active goals exist, create a pending `carry_over_ritual` and `carry_over_task_decisions`. (Release 1: ritual fires even with no leftover tasks so the goal step — Reflect health + Plan tasks — always runs on Sundays with active goals.)
9. Block normal app entry until the pending ritual is completed.

**Release 1 — goal step (within the ritual, after per-task triage):**

For each active goal, the ritual presents:
- **Reflect**: next-milestone + two health questions (mandatory-light); gap-catch if no active milestone.
- **Plan**: existing open/backlog tasks to pull into this week + optional AI task suggestions.

The goal step runs per-active-goal before the optional pull-from-backlog step.

**Release 1 — This-week on-track cursor (derived — no storage):**

The Home-screen "Milestones" section cursor is **fully derived** and adds **no table or column**. Per goal with tasks committed this week:

```txt
position = (this week's completed goal tasks) vs (expected-by-now)
expected-by-now ≈ committed_goal_tasks_this_week * (day_index_in_week / 7)
```

Resets at the Sunday flip. If a goal has no tasks committed this week, the row shows a neutral "nothing planned this week" state. Distinct from the stored `goals.health_level`; does not feed it. The existing `tasks_goal_id_idx` and `tasks_user_this_week_open_idx` already support this query; no new index required.

**Release 1 — RLS for new tables:**

```sql
alter table milestones enable row level security;
alter table goal_health_records enable row level security;

create policy milestones_owner on milestones
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy goal_health_records_owner on goal_health_records
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

---

## Carry-Over Decision Effects

For each unfinished task:

### keep_this_week

```txt
week_assignment = this_week
week_start_date = new week_start_date
status = open
```

### send_to_backlog

```txt
week_assignment = backlog
week_start_date = null or preserved only if needed for history
status = open
```

### drop

```txt
hard delete task
```

The ritual is completed only after all decisions are made.

---

## Reminder Rules

- Task reminders are optional.
- One task can have multiple reminders.
- One-shot reminders fire once.
- Recurring-until-done reminders repeat until task completion.
- Completing a task cancels scheduled reminders for that task.
- If no time is specified, default reminder time is 09:00 local time.
- Failed reminders should be logged through status/failure fields.

---

## Habit Nudge Rules

Habit danger-zone nudge fires when:

```txt
count_remaining + 1 >= days_left
```

Evaluated at 09:00 local time.

Constraints:

- once per habit per week maximum
- only if global setting enabled
- only if habit-level nudge enabled
- no separate impossible-to-hit notification path

Use `habit_nudge_log` to prevent duplicate nudges.

---

## Row-Level Security

RLS is **enabled** on every user-owned table via `supabase/migrations/005_rls.sql`, with the baseline policy:

```sql
user_id = auth.uid()
```

The backend uses the Supabase service role and still scopes every query by `user_id` from the authenticated session.

---

## Initial Seed Data

On first user setup, create:

- `profiles` row
- `user_settings` row
- default themes if desired

Suggested default themes:

- Health
- Career
- Personal
- Learning

Default themes are editable/deletable by the user.

---

## Resolved Decisions

These were originally open questions during design; all have been resolved as built:

1. **`theme_id` on goals: optional** (`uuid references themes(id) on delete set null`, nullable).
2. **Backlog tasks do not preserve previous `week_start_date`** — when a task is sent to backlog (including via carry-over `send_to_backlog`), `week_start_date` is set to NULL. No separate historical column.
3. **No audit trail for dropped tasks beyond carry-over decisions.** Dropped tasks are hard-deleted; the carry-over decision row records that a drop happened.
4. **AI capture logs are metadata-only** — no raw input, no raw output, no sanitized previews stored.
5. **Secondary goal cap is enforced in backend only** (`backend/src/routes/goals.ts` counts active secondaries before insert). No DB trigger. The primary goal cap is enforced via the partial unique index `goals_one_active_primary_per_user_idx`.

