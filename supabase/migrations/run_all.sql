-- run_all.sql
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run

-- ============================================================
-- 001: Core tables
-- ============================================================

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Europe/Berlin',
  danger_zone_nudges_enabled boolean not null default true,
  theme_mode text not null default 'dark',
  accent_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index themes_user_id_idx on themes(user_id);
create index themes_user_active_idx on themes(user_id, is_archived);

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_id_idx on goals(user_id);
create index goals_user_status_idx on goals(user_id, status);
create index goals_user_type_status_idx on goals(user_id, goal_type, status);
create index goals_theme_id_idx on goals(theme_id);

create unique index goals_one_active_primary_per_user_idx
  on goals(user_id)
  where goal_type = 'primary' and status = 'active';

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

create index habits_user_id_idx on habits(user_id);
create index habits_user_status_idx on habits(user_id, status);
create index habits_theme_id_idx on habits(theme_id);
create index habits_goal_id_idx on habits(goal_id);

-- ============================================================
-- 002: Weekly records
-- ============================================================

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

-- ============================================================
-- 003: Notifications
-- ============================================================

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

create index reminders_user_id_idx on reminders(user_id);
create index reminders_task_id_idx on reminders(task_id);
create index reminders_due_idx on reminders(status, next_run_at);
create index reminders_scheduled_for_idx on reminders(status, scheduled_for);

create table habit_nudge_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  week_start_date date not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (habit_id, week_start_date)
);

create index habit_nudge_log_user_week_idx on habit_nudge_log(user_id, week_start_date);

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

create index notification_tokens_user_active_idx on notification_tokens(user_id, is_active);

-- ============================================================
-- 004: Carry-over + AI logs
-- ============================================================

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

create index carry_over_rituals_user_status_idx on carry_over_rituals(user_id, status);

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

create index carry_over_task_decisions_ritual_idx on carry_over_task_decisions(ritual_id);
create index carry_over_task_decisions_user_idx on carry_over_task_decisions(user_id);

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

create index ai_capture_logs_user_created_idx on ai_capture_logs(user_id, created_at desc);

-- ============================================================
-- 005: Row-Level Security
-- ============================================================

alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table themes enable row level security;
alter table goals enable row level security;
alter table tasks enable row level security;
alter table habits enable row level security;
alter table habit_week_records enable row level security;
alter table week_records enable row level security;
alter table reminders enable row level security;
alter table habit_nudge_log enable row level security;
alter table notification_tokens enable row level security;
alter table carry_over_rituals enable row level security;
alter table carry_over_task_decisions enable row level security;
alter table ai_capture_logs enable row level security;

create policy "profiles: own rows only" on profiles for all using (user_id = auth.uid());
create policy "user_settings: own rows only" on user_settings for all using (user_id = auth.uid());
create policy "themes: own rows only" on themes for all using (user_id = auth.uid());
create policy "goals: own rows only" on goals for all using (user_id = auth.uid());
create policy "tasks: own rows only" on tasks for all using (user_id = auth.uid());
create policy "habits: own rows only" on habits for all using (user_id = auth.uid());
create policy "habit_week_records: own rows only" on habit_week_records for all using (user_id = auth.uid());
create policy "week_records: own rows only" on week_records for all using (user_id = auth.uid());
create policy "reminders: own rows only" on reminders for all using (user_id = auth.uid());
create policy "habit_nudge_log: own rows only" on habit_nudge_log for all using (user_id = auth.uid());
create policy "notification_tokens: own rows only" on notification_tokens for all using (user_id = auth.uid());
create policy "carry_over_rituals: own rows only" on carry_over_rituals for all using (user_id = auth.uid());
create policy "carry_over_task_decisions: own rows only" on carry_over_task_decisions for all using (user_id = auth.uid());
create policy "ai_capture_logs: own rows only" on ai_capture_logs for all using (user_id = auth.uid());

-- ============================================================
-- 006: updated_at triggers
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on profiles for each row execute function set_updated_at();
create trigger set_updated_at_user_settings before update on user_settings for each row execute function set_updated_at();
create trigger set_updated_at_themes before update on themes for each row execute function set_updated_at();
create trigger set_updated_at_goals before update on goals for each row execute function set_updated_at();
create trigger set_updated_at_tasks before update on tasks for each row execute function set_updated_at();
create trigger set_updated_at_habits before update on habits for each row execute function set_updated_at();
create trigger set_updated_at_habit_week_records before update on habit_week_records for each row execute function set_updated_at();
create trigger set_updated_at_week_records before update on week_records for each row execute function set_updated_at();
create trigger set_updated_at_reminders before update on reminders for each row execute function set_updated_at();
create trigger set_updated_at_notification_tokens before update on notification_tokens for each row execute function set_updated_at();
create trigger set_updated_at_carry_over_rituals before update on carry_over_rituals for each row execute function set_updated_at();
create trigger set_updated_at_carry_over_task_decisions before update on carry_over_task_decisions for each row execute function set_updated_at();

-- ============================================================
-- 007: Habit soft-delete
-- ============================================================

alter table habits add column if not exists deleted_at timestamptz;

create index if not exists habits_deleted_at_idx on habits (deleted_at)
  where deleted_at is not null;

-- ============================================================
-- 008: Release 1 — goal health columns, milestones, goal_health_records
-- ============================================================

alter table goals
  add column if not exists health_level text
    check (health_level in ('behind', 'slightly_behind', 'on_track', 'ahead', 'well_ahead')),
  add column if not exists progress_answer text
    check (progress_answer in ('a_lot', 'some', 'barely', 'nothing')),
  add column if not exists confidence_answer text
    check (confidence_answer in ('yes', 'maybe', 'no')),
  add column if not exists health_set_date date;

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

alter table milestones enable row level security;
alter table goal_health_records enable row level security;

create policy milestones_owner on milestones
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy goal_health_records_owner on goal_health_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
