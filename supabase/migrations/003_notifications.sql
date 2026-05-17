-- 003_notifications.sql
-- reminders, habit_nudge_log, notification_tokens

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
