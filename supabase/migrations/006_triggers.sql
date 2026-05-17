-- 006_triggers.sql
-- updated_at trigger function and attach to all tables that have updated_at

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on profiles
  for each row execute function set_updated_at();

create trigger set_updated_at_user_settings
  before update on user_settings
  for each row execute function set_updated_at();

create trigger set_updated_at_themes
  before update on themes
  for each row execute function set_updated_at();

create trigger set_updated_at_goals
  before update on goals
  for each row execute function set_updated_at();

create trigger set_updated_at_tasks
  before update on tasks
  for each row execute function set_updated_at();

create trigger set_updated_at_habits
  before update on habits
  for each row execute function set_updated_at();

create trigger set_updated_at_habit_week_records
  before update on habit_week_records
  for each row execute function set_updated_at();

create trigger set_updated_at_week_records
  before update on week_records
  for each row execute function set_updated_at();

create trigger set_updated_at_reminders
  before update on reminders
  for each row execute function set_updated_at();

create trigger set_updated_at_notification_tokens
  before update on notification_tokens
  for each row execute function set_updated_at();

create trigger set_updated_at_carry_over_rituals
  before update on carry_over_rituals
  for each row execute function set_updated_at();

create trigger set_updated_at_carry_over_task_decisions
  before update on carry_over_task_decisions
  for each row execute function set_updated_at();
