import { z } from 'zod';

// ─── Base ────────────────────────────────────────────────────────────────────

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoTimestamp = z.string().datetime({ offset: true });

// ─── Profile ─────────────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  user_id: uuid,
  display_name: z.string().nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type Profile = z.infer<typeof ProfileSchema>;

// ─── UserSettings ────────────────────────────────────────────────────────────

export const UserSettingsSchema = z.object({
  user_id: uuid,
  timezone: z.string(),
  danger_zone_nudges_enabled: z.boolean(),
  theme_mode: z.string(),
  accent_color: z.string().nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

// ─── Theme ───────────────────────────────────────────────────────────────────

export const ThemeSchema = z.object({
  id: uuid,
  user_id: uuid,
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  sort_order: z.number().int(),
  is_archived: z.boolean(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type Theme = z.infer<typeof ThemeSchema>;

// ─── Goal ────────────────────────────────────────────────────────────────────

export const GoalSchema = z.object({
  id: uuid,
  user_id: uuid,
  theme_id: uuid.nullable(),
  title: z.string(),
  why: z.string().nullable(),
  goal_type: z.enum(['primary', 'secondary']),
  status: z.enum(['active', 'completed', 'archived']),
  target_date: isoDate,
  completed_at: isoTimestamp.nullable(),
  archived_at: isoTimestamp.nullable(),
  sort_order: z.number().int(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type Goal = z.infer<typeof GoalSchema>;

// ─── Task ────────────────────────────────────────────────────────────────────

export const TaskSchema = z.object({
  id: uuid,
  user_id: uuid,
  theme_id: uuid,
  goal_id: uuid.nullable(),
  title: z.string(),
  notes: z.string().nullable(),
  status: z.enum(['open', 'done', 'archived_done']),
  week_assignment: z.enum(['this_week', 'backlog']),
  week_start_date: isoDate.nullable(),
  effort_level: z.enum(['low', 'medium', 'high', 'unknown']),
  return_level: z.enum(['low', 'medium', 'high', 'unknown']),
  completed_at: isoTimestamp.nullable(),
  archived_at: isoTimestamp.nullable(),
  sort_order: z.number().int(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type Task = z.infer<typeof TaskSchema>;

// ─── Habit ───────────────────────────────────────────────────────────────────

export const HabitSchema = z.object({
  id: uuid,
  user_id: uuid,
  theme_id: uuid,
  goal_id: uuid.nullable(),
  title: z.string(),
  notes: z.string().nullable(),
  status: z.enum(['active', 'paused', 'archived']),
  weekly_target: z.number().int().positive(),
  current_streak: z.number().int().min(0),
  best_streak: z.number().int().min(0),
  danger_zone_nudge_enabled: z.boolean(),
  archived_at: isoTimestamp.nullable(),
  sort_order: z.number().int(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type Habit = z.infer<typeof HabitSchema>;

// ─── HabitWeekRecord ─────────────────────────────────────────────────────────

export const HabitWeekRecordSchema = z.object({
  id: uuid,
  user_id: uuid,
  habit_id: uuid,
  week_start_date: isoDate,
  target_count: z.number().int().positive(),
  completed_count: z.number().int().min(0),
  target_met: z.boolean(),
  archived_at: isoTimestamp.nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type HabitWeekRecord = z.infer<typeof HabitWeekRecordSchema>;

// ─── WeekRecord ──────────────────────────────────────────────────────────────

export const WeekRecordSchema = z.object({
  id: uuid,
  user_id: uuid,
  week_start_date: isoDate,
  tasks_completed_count: z.number().int().min(0),
  tasks_total_count: z.number().int().min(0),
  habits_met_count: z.number().int().min(0),
  habits_total_count: z.number().int().min(0),
  primary_goal_id: uuid.nullable(),
  primary_goal_tasks_completed_count: z.number().int().min(0),
  archived_at: isoTimestamp,
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type WeekRecord = z.infer<typeof WeekRecordSchema>;

// ─── Reminder ────────────────────────────────────────────────────────────────

export const ReminderSchema = z.object({
  id: uuid,
  user_id: uuid,
  task_id: uuid,
  kind: z.enum(['one_shot', 'recurring_until_done']),
  status: z.enum(['scheduled', 'sent', 'cancelled', 'expired', 'failed']),
  scheduled_for: isoTimestamp,
  recurrence_rule: z.string().nullable(),
  last_sent_at: isoTimestamp.nullable(),
  next_run_at: isoTimestamp.nullable(),
  cancelled_at: isoTimestamp.nullable(),
  failure_reason: z.string().nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type Reminder = z.infer<typeof ReminderSchema>;

// ─── CarryOverRitual ─────────────────────────────────────────────────────────

export const CarryOverRitualSchema = z.object({
  id: uuid,
  user_id: uuid,
  from_week_start_date: isoDate,
  to_week_start_date: isoDate,
  status: z.enum(['pending', 'completed']),
  started_at: isoTimestamp.nullable(),
  completed_at: isoTimestamp.nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type CarryOverRitual = z.infer<typeof CarryOverRitualSchema>;

// ─── CarryOverTaskDecision ───────────────────────────────────────────────────

export const CarryOverTaskDecisionSchema = z.object({
  id: uuid,
  ritual_id: uuid,
  user_id: uuid,
  task_id: uuid,
  decision: z.enum(['keep_this_week', 'send_to_backlog', 'drop']).nullable(),
  decided_at: isoTimestamp.nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type CarryOverTaskDecision = z.infer<typeof CarryOverTaskDecisionSchema>;

// ─── NotificationToken ───────────────────────────────────────────────────────

export const NotificationTokenSchema = z.object({
  id: uuid,
  user_id: uuid,
  expo_push_token: z.string(),
  platform: z.enum(['android', 'ios', 'web', 'unknown']),
  device_name: z.string().nullable(),
  is_active: z.boolean(),
  last_seen_at: isoTimestamp,
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type NotificationToken = z.infer<typeof NotificationTokenSchema>;
