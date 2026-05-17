-- 005_rls.sql
-- Enable RLS and add user_id = auth.uid() policies on all user-owned tables

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

-- profiles
create policy "profiles: own rows only" on profiles
  for all using (user_id = auth.uid());

-- user_settings
create policy "user_settings: own rows only" on user_settings
  for all using (user_id = auth.uid());

-- themes
create policy "themes: own rows only" on themes
  for all using (user_id = auth.uid());

-- goals
create policy "goals: own rows only" on goals
  for all using (user_id = auth.uid());

-- tasks
create policy "tasks: own rows only" on tasks
  for all using (user_id = auth.uid());

-- habits
create policy "habits: own rows only" on habits
  for all using (user_id = auth.uid());

-- habit_week_records
create policy "habit_week_records: own rows only" on habit_week_records
  for all using (user_id = auth.uid());

-- week_records
create policy "week_records: own rows only" on week_records
  for all using (user_id = auth.uid());

-- reminders
create policy "reminders: own rows only" on reminders
  for all using (user_id = auth.uid());

-- habit_nudge_log
create policy "habit_nudge_log: own rows only" on habit_nudge_log
  for all using (user_id = auth.uid());

-- notification_tokens
create policy "notification_tokens: own rows only" on notification_tokens
  for all using (user_id = auth.uid());

-- carry_over_rituals
create policy "carry_over_rituals: own rows only" on carry_over_rituals
  for all using (user_id = auth.uid());

-- carry_over_task_decisions
create policy "carry_over_task_decisions: own rows only" on carry_over_task_decisions
  for all using (user_id = auth.uid());

-- ai_capture_logs
create policy "ai_capture_logs: own rows only" on ai_capture_logs
  for all using (user_id = auth.uid());
