-- 004_carryover_ai.sql
-- carry_over_rituals, carry_over_task_decisions, ai_capture_logs

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
