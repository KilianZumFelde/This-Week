# DATABASE_DESIGN.md — Release 1 delta

Scoped database changes for **Release 1 — "Goals drive the week."** Only new or changed
content is included; every section heading mirrors the baseline `/docs/database_design.md`.
Unchanged tables, conventions, and rules are not repeated.

This release adds:
- a **`milestones`** table — dated checkpoints belonging to a goal,
- **health columns on `goals`** — the user's weekly subjective verdict, frozen between Sundays,
- a **`goal_health_records`** table — one health snapshot per goal per week for the 8-week trend.

All new tables follow the baseline conventions unchanged: UUID PKs (`gen_random_uuid()`),
`user_id` ownership referencing `auth.users(id) on delete cascade`, `created_at` / `updated_at`
timestamps, RLS keyed on `user_id = auth.uid()`.

---

## Enums

Stored as `text` + CHECK constraints, consistent with the baseline (easier to alter later than
native Postgres enums — the business consequence is that adding a level never needs an enum
migration). Display labels map to snake_case stored values.

### milestone_status

```txt
active
hit
```

### goal_health_level

5-level, worst→best. Display → stored:

```txt
Behind          → behind
Slightly behind → slightly_behind
On track        → on_track
Ahead           → ahead
Well ahead      → well_ahead
```

### goal_progress_answer

The retrospective "how much did you move this week" answer.

```txt
A lot   → a_lot
Some    → some
Barely  → barely
Nothing → nothing
```

### goal_confidence_answer

The "confident you'll hit it by [date]" answer.

```txt
Yes   → yes
Maybe → maybe
No    → no
```

---

## Tables

## goals — CHANGED (gains subjective weekly health)

`-- replaces baseline definition`

Adds four nullable health columns. A goal that has not yet been through a Sunday triage (or has
no milestone to rate against) carries `NULL` health and renders the muted "set a milestone to
track this" / "not yet rated" state in the UI. Health is the user's subjective verdict toward the
goal's **nearest upcoming milestone**; it is `f(progress_answer, confidence_answer)` only — the
milestone date is never a computational input. It is frozen between Sundays and carries across a
milestone being hit until the next triage re-sets it.

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

Indexes: baseline indexes unchanged; no new index needed (health is read with the goal row, not
queried independently).

Notes:

- `health_set_date` is the **Sunday the current health was set** — used to tell whether this
  week's health has been answered yet and to detect a stale (pre-this-week) value.
- All four columns are nullable on purpose: existing goals migrate cleanly without a backfill, and
  the "no health yet" UI state is a real, designed state — not an error.
- The 5-level set deliberately has **no "at risk"** value (dropped in the build) and **adds
  "well_ahead"** at the top.

---

## milestones — NEW

A dated checkpoint belonging to a goal — a near-term marker, distinct from the goal's own
(often distant) target date. Lifecycle `active → hit` (`hit` terminal). "Overdue" and "nearest
upcoming" are **derived**, not stored.

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
-- (drives the "Next: … · by …" line on Goals, Home cursor label, triage Reflect)
create index milestones_goal_active_due_idx on milestones(goal_id, target_date)
  where status = 'active';

-- Ownership / RLS scans
create index milestones_user_id_idx on milestones(user_id);
```

Notes:

- `on delete cascade` on `goal_id`: a milestone makes no sense without its goal, so deleting a
  goal takes its milestones with it.
- **Hard delete is allowed** (per Release 1 decision) even though the v1 UI exposes only
  *Mark hit* and *Edit*. A plain `DELETE` is available as an escape hatch for a mistaken milestone.
- **No `Task` relationship** — deliberate anti-Jira scoping. Tasks link to goals only; a milestone
  never owns or tags tasks.
- **Duplicate titles within a goal are allowed** — internal ID only, no business uniqueness
  (consistent with the v1 relaxed-uniqueness stance for goals/habits).
- `hit_at` is set when the user marks the milestone hit; null while active. Marking hit triggers
  the backend "set the next milestone" prompt flow.

---

## goal_health_records — NEW

A snapshot of a goal's health for a given week, archived alongside the existing `week_records`
weekly boundary. One row per goal per week. Powers the 8-week health-trend dot row on Goal Detail.

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

- `week_start_date` is the **Sunday of the week being entered** — the triage Sunday on which the
  health was set. Health represents the goal's standing *going into* that week and is what's shown
  during it. Same `date` (local Sunday) convention as `week_records` / `habit_week_records`.
- `unique (goal_id, week_start_date)` enforces at most one snapshot per goal per week. If the user
  re-runs the goal step in the same week, the backend **upserts** this row (and re-sets the
  matching columns on `goals`) rather than inserting a duplicate.
- `health_level`, `progress_answer`, `confidence_answer` are all **NOT NULL** here (unlike on
  `goals`): a snapshot only exists once the mandatory triage questions have been answered, so the
  values always exist.

---

## Key Relationships

New edges (existing edges unchanged):

```txt
auth.users 1:N milestones
auth.users 1:N goal_health_records

goals 1:N milestones            (cascade delete)
goals 1:N goal_health_records   (cascade delete)

milestones — tasks             NONE (deliberately no relationship)
```

---

## Business Rule Enforcement

### Enforced in Database (new this release)

- Milestone `status` validity (`active` / `hit`) via CHECK.
- Goal health enum validity (`health_level`, `progress_answer`, `confidence_answer`) via CHECK on
  both `goals` and `goal_health_records`.
- **At most one health snapshot per goal per week** via `unique (goal_id, week_start_date)` on
  `goal_health_records`.
- Cascade delete of milestones and health records when a goal (or user) is deleted.

### Enforced in Backend (new this release)

- **Milestone target-date validation** (decision: backend only) — both rules live in
  Fastify/Zod before insert/update:
  - target date **required** and **in the future** at creation;
  - target date **on or before the parent goal's `target_date`** (a cross-table comparison a CHECK
    can't express). Same pattern as the existing secondary-goal cap. Rule changes need no migration;
    the backend is the only writer.
- **`health_level = calculateGoalHealth(current, history)`** — computed in the backend from the
  current week's `progress_answer` + `confidence_answer` **plus up to 3 prior contiguous
  `goal_health_records` rows** (fetched at write-time, ordered newest→oldest, stopped at the first
  missing week). The result is then written to both `goals` (current) and `goal_health_records`
  (snapshot for the entered week). **No schema change / no migration** — the existing NOT-NULL raw
  answers + `unique(goal_id, week_start_date)` + `goal_health_records_goal_week_idx` already
  support the history read. Stored `health_level` values from prior weeks are display-only and are
  never re-computed retroactively.
- **Both health questions required** to set/confirm a goal's health during triage (mandatory-light).
- **"1–2 upcoming milestones" rhythm** — a soft guideline only; **not** an enforced cap (no
  trigger, no unique index limiting count).
- **Mark-hit flow** — set `status='hit'` + `hit_at`, then prompt to create the next milestone.
- **Overdue surfacing** — derived (`status='active'` AND `target_date < today`); surfaced in the
  next Sunday triage goal step. **No** blocking app-open prompt.
- **Health freeze between Sundays** — no clock- or activity-driven drift; `goals` health columns
  change only when the user answers the weekly questions.

---

## This-Week On-Track Cursor (derived — no storage)

The Home-screen "Milestones" section cursor is **fully derived** and adds **no table or column**.
Per goal with tasks committed this week:

```txt
position = (this week's completed goal tasks) vs (expected-by-now)
expected-by-now ≈ committed_goal_tasks_this_week * (day_index_in_week / 7)
```

- "Committed goal tasks this week" = `tasks` where `goal_id = <goal>` AND `week_assignment =
  'this_week'` AND `week_start_date = <current week>`. Computable from existing columns +
  completion + the current date — no new persistence.
- Resets at the Sunday flip (new `week_start_date`). If a goal has no tasks committed this week,
  the row shows the neutral "nothing planned this week" state, not "behind".
- This is **distinct** from the stored subjective `goals.health_level` and does **not** feed it.
- The existing `tasks_goal_id_idx` and `tasks_user_this_week_open_idx` already support this query;
  no new index required.

---

## Row-Level Security

Both new tables are user-owned; enable RLS with the baseline policy `user_id = auth.uid()`:

```sql
alter table milestones enable row level security;
alter table goal_health_records enable row level security;

create policy milestones_owner on milestones
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy goal_health_records_owner on goal_health_records
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

(The backend uses the service role and still scopes every query by `user_id` from the
authenticated session, as in the baseline.)

---

## Initial Seed Data

No change. New users get nothing extra at setup — milestones and health records are created only
through normal use (adding a milestone, completing a Sunday triage goal step).

---

## Migration notes

Suggested as a single new migration (e.g. `supabase/migrations/00X_release1_goal_health.sql`).
Order within the file:

1. **`alter table goals add column …`** — add the four health columns, **all nullable**. Adding
   nullable columns with no default is a fast metadata-only change in Postgres (no table rewrite,
   negligible lock) — safe even on large tables, and trivial at this single-user scale.
2. **No backfill.** Existing goals keep `NULL` health and render the designed "not yet rated" /
   "set a milestone to track this" state until their first Sunday triage. Do **not** invent a
   default health level — there is no honest objective basis for one (matches the lens's rejection
   of auto-drift).
3. **`create table milestones`** then its three indexes.
4. **`create table goal_health_records`** then its two indexes + the `unique (goal_id,
   week_start_date)` constraint (already inline in the `create table`).
5. **Enable RLS + create policies** for both new tables (see above). Easy to forget — without it,
   the tables are readable across users.
6. The two new CHECK enums (`health_level`, milestone `status`, answer columns) are defined inline
   in the table/column definitions — no separate enum type to create or later `ALTER TYPE`.

Lock/downtime risk: **none meaningful.** Two `CREATE TABLE`s plus nullable column adds; no data
migration, no rewrite of `goals`.
