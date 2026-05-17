import { z } from 'zod';

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoTimestamp = z.string().datetime({ offset: true });

// ─── Themes ──────────────────────────────────────────────────────────────────

export const CreateThemeRequestSchema = z.object({
  name: z.string().min(1),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});
export type CreateThemeRequest = z.infer<typeof CreateThemeRequestSchema>;

export const UpdateThemeRequestSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_archived: z.boolean().optional(),
});
export type UpdateThemeRequest = z.infer<typeof UpdateThemeRequestSchema>;

// ─── Goals ───────────────────────────────────────────────────────────────────

export const CreateGoalRequestSchema = z.object({
  theme_id: uuid.nullable().optional(),
  title: z.string().min(1),
  why: z.string().nullable().optional(),
  goal_type: z.enum(['primary', 'secondary']),
  target_date: isoDate,
  sort_order: z.number().int().optional(),
});
export type CreateGoalRequest = z.infer<typeof CreateGoalRequestSchema>;

export const UpdateGoalRequestSchema = z.object({
  theme_id: uuid.nullable().optional(),
  title: z.string().min(1).optional(),
  why: z.string().nullable().optional(),
  goal_type: z.enum(['primary', 'secondary']).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  target_date: isoDate.optional(),
  sort_order: z.number().int().optional(),
});
export type UpdateGoalRequest = z.infer<typeof UpdateGoalRequestSchema>;

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const CreateTaskRequestSchema = z.object({
  theme_id: uuid,
  goal_id: uuid.nullable().optional(),
  title: z.string().min(1),
  notes: z.string().nullable().optional(),
  week_assignment: z.enum(['this_week', 'backlog']).optional(),
  week_start_date: isoDate.nullable().optional(),
  effort_level: z.enum(['low', 'medium', 'high', 'unknown']).optional(),
  return_level: z.enum(['low', 'medium', 'high', 'unknown']).optional(),
  sort_order: z.number().int().optional(),
});
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

export const UpdateTaskRequestSchema = z.object({
  theme_id: uuid.optional(),
  goal_id: uuid.nullable().optional(),
  title: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  week_assignment: z.enum(['this_week', 'backlog']).optional(),
  week_start_date: isoDate.nullable().optional(),
  effort_level: z.enum(['low', 'medium', 'high', 'unknown']).optional(),
  return_level: z.enum(['low', 'medium', 'high', 'unknown']).optional(),
  sort_order: z.number().int().optional(),
});
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

export const ListTasksQuerySchema = z.object({
  week_assignment: z.enum(['this_week', 'backlog']).optional(),
  week_start_date: isoDate.optional(),
  status: z.enum(['open', 'done', 'archived_done']).optional(),
});
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;

// ─── Habits ──────────────────────────────────────────────────────────────────

export const CreateHabitRequestSchema = z.object({
  theme_id: uuid,
  goal_id: uuid.nullable().optional(),
  title: z.string().min(1),
  notes: z.string().nullable().optional(),
  weekly_target: z.number().int().positive(),
  danger_zone_nudge_enabled: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});
export type CreateHabitRequest = z.infer<typeof CreateHabitRequestSchema>;

export const UpdateHabitRequestSchema = z.object({
  theme_id: uuid.optional(),
  goal_id: uuid.nullable().optional(),
  title: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  weekly_target: z.number().int().positive().optional(),
  danger_zone_nudge_enabled: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});
export type UpdateHabitRequest = z.infer<typeof UpdateHabitRequestSchema>;

// ─── Reminders ───────────────────────────────────────────────────────────────

export const CreateReminderRequestSchema = z.object({
  task_id: uuid,
  kind: z.enum(['one_shot', 'recurring_until_done']),
  scheduled_for: isoTimestamp,
  recurrence_rule: z.string().nullable().optional(),
});
export type CreateReminderRequest = z.infer<typeof CreateReminderRequestSchema>;

export const UpdateReminderRequestSchema = z.object({
  kind: z.enum(['one_shot', 'recurring_until_done']).optional(),
  scheduled_for: isoTimestamp.optional(),
  recurrence_rule: z.string().nullable().optional(),
  status: z.enum(['scheduled', 'sent', 'cancelled', 'expired', 'failed']).optional(),
});
export type UpdateReminderRequest = z.infer<typeof UpdateReminderRequestSchema>;

// ─── Carry-Over ──────────────────────────────────────────────────────────────

export const SubmitCarryOverDecisionRequestSchema = z.object({
  decision: z.enum(['keep_this_week', 'send_to_backlog', 'drop']),
});
export type SubmitCarryOverDecisionRequest = z.infer<typeof SubmitCarryOverDecisionRequestSchema>;

// ─── User Settings ───────────────────────────────────────────────────────────

export const UpdateUserSettingsRequestSchema = z.object({
  timezone: z.string().optional(),
  danger_zone_nudges_enabled: z.boolean().optional(),
  theme_mode: z.string().optional(),
  accent_color: z.string().nullable().optional(),
});
export type UpdateUserSettingsRequest = z.infer<typeof UpdateUserSettingsRequestSchema>;

// ─── Notification Tokens ─────────────────────────────────────────────────────

export const RegisterNotificationTokenRequestSchema = z.object({
  expo_push_token: z.string().min(1),
  platform: z.enum(['android', 'ios', 'web', 'unknown']).optional(),
  device_name: z.string().nullable().optional(),
});
export type RegisterNotificationTokenRequest = z.infer<typeof RegisterNotificationTokenRequestSchema>;
