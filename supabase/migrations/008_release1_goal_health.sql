-- Release 1: Goal health columns, milestones table, goal_health_records table

-- ============================================================
-- Step 1: Add health columns to goals (nullable, no backfill)
-- ============================================================

alter table goals
  add column if not exists health_level text
    check (health_level in ('behind', 'slightly_behind', 'on_track', 'ahead', 'well_ahead')),
  add column if not exists progress_answer text
    check (progress_answer in ('a_lot', 'some', 'barely', 'nothing')),
  add column if not exists confidence_answer text
    check (confidence_answer in ('yes', 'maybe', 'no')),
  add column if not exists health_set_date date;

-- ============================================================
-- Step 2: milestones table
-- ============================================================

create table if not exists milestones (
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

create index if not exists milestones_goal_id_idx on milestones(goal_id);
create index if not exists milestones_goal_active_due_idx on milestones(goal_id, target_date)
  where status = 'active';
create index if not exists milestones_user_id_idx on milestones(user_id);

-- ============================================================
-- Step 3: goal_health_records table
-- ============================================================

create table if not exists goal_health_records (
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

create index if not exists goal_health_records_goal_week_idx
  on goal_health_records(goal_id, week_start_date desc);
create index if not exists goal_health_records_user_week_idx
  on goal_health_records(user_id, week_start_date);

-- ============================================================
-- Step 4: RLS on new tables
-- ============================================================

alter table milestones enable row level security;
alter table goal_health_records enable row level security;

create policy milestones_owner on milestones
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy goal_health_records_owner on goal_health_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
