-- 001_core_tables.sql
-- profiles, user_settings, themes, goals, tasks, habits

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
