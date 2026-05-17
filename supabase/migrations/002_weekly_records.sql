-- 002_weekly_records.sql
-- habit_week_records, week_records

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

create index habit_week_records_user_week_idx on habit_week_records(user_id, week_start_date);
create index habit_week_records_habit_idx on habit_week_records(habit_id);

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

create index week_records_user_week_idx on week_records(user_id, week_start_date desc);
