import { z } from 'zod';

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ─── Reminders ────────────────────────────────────────────────────────────────

export const ReminderSpecSchema = z.object({
  kind: z.enum(['one_shot', 'recurring_until_done']),
  scheduled_for: z.string().nullable(),
  recurrence_rule: z.string().nullable(),
});
export type ReminderSpec = z.infer<typeof ReminderSpecSchema>;

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
  reminder_spec: ReminderSpecSchema.nullable().optional(),
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
  goal_id: uuid.optional(),
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

// ─── Goal Health ─────────────────────────────────────────────────────────────

export const SetGoalHealthRequestSchema = z.object({
  progress_answer: z.enum(['a_lot', 'some', 'barely', 'nothing']),
  confidence_answer: z.enum(['yes', 'maybe', 'no']),
  week_start_date: isoDate,
});
export type SetGoalHealthRequest = z.infer<typeof SetGoalHealthRequestSchema>;

// ─── Milestones ──────────────────────────────────────────────────────────────

export const CreateMilestoneRequestSchema = z.object({
  title: z.string().min(1),
  target_date: isoDate,
});
export type CreateMilestoneRequest = z.infer<typeof CreateMilestoneRequestSchema>;

export const UpdateMilestoneRequestSchema = z.object({
  title: z.string().min(1).optional(),
  target_date: isoDate.optional(),
});
export type UpdateMilestoneRequest = z.infer<typeof UpdateMilestoneRequestSchema>;
