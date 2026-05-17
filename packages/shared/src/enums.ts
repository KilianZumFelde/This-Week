export const GoalType = {
  primary: 'primary',
  secondary: 'secondary',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const GoalStatus = {
  active: 'active',
  completed: 'completed',
  archived: 'archived',
} as const;
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const TaskStatus = {
  open: 'open',
  done: 'done',
  archived_done: 'archived_done',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskWeekAssignment = {
  this_week: 'this_week',
  backlog: 'backlog',
} as const;
export type TaskWeekAssignment = (typeof TaskWeekAssignment)[keyof typeof TaskWeekAssignment];

export const EffortLevel = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  unknown: 'unknown',
} as const;
export type EffortLevel = (typeof EffortLevel)[keyof typeof EffortLevel];

export const ReturnLevel = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  unknown: 'unknown',
} as const;
export type ReturnLevel = (typeof ReturnLevel)[keyof typeof ReturnLevel];

export const HabitStatus = {
  active: 'active',
  paused: 'paused',
  archived: 'archived',
} as const;
export type HabitStatus = (typeof HabitStatus)[keyof typeof HabitStatus];

export const ReminderStatus = {
  scheduled: 'scheduled',
  sent: 'sent',
  cancelled: 'cancelled',
  expired: 'expired',
  failed: 'failed',
} as const;
export type ReminderStatus = (typeof ReminderStatus)[keyof typeof ReminderStatus];

export const ReminderKind = {
  one_shot: 'one_shot',
  recurring_until_done: 'recurring_until_done',
} as const;
export type ReminderKind = (typeof ReminderKind)[keyof typeof ReminderKind];

export const CarryOverRitualStatus = {
  pending: 'pending',
  completed: 'completed',
} as const;
export type CarryOverRitualStatus = (typeof CarryOverRitualStatus)[keyof typeof CarryOverRitualStatus];

export const CarryOverDecision = {
  keep_this_week: 'keep_this_week',
  send_to_backlog: 'send_to_backlog',
  drop: 'drop',
} as const;
export type CarryOverDecision = (typeof CarryOverDecision)[keyof typeof CarryOverDecision];

export const NotificationPlatform = {
  android: 'android',
  ios: 'ios',
  web: 'web',
  unknown: 'unknown',
} as const;
export type NotificationPlatform = (typeof NotificationPlatform)[keyof typeof NotificationPlatform];
