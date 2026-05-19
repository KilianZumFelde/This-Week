import { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';
import { getCurrentWeekStartDate } from '../lib/week.js';
import { sendPushNotifications, isValidExpoPushToken } from '../services/push.js';
import { isDangerZone } from '../lib/habitNudge.js';

function checkCronSecret(request: { headers: Record<string, string | string[] | undefined> }): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // If not configured, allow (dev mode)
  return request.headers['x-cron-secret'] === secret;
}

async function getUserTokens(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('notification_tokens')
    .select('expo_push_token')
    .eq('user_id', userId)
    .eq('is_active', true);
  return (data ?? []).map((r) => r.expo_push_token).filter(isValidExpoPushToken);
}

export async function jobsRoutes(fastify: FastifyInstance) {
  // POST /jobs/dispatch-reminders — find due reminders and send push notifications
  // Called by Render Cron every 5 minutes
  fastify.post('/jobs/dispatch-reminders', async (request, reply) => {
    if (!checkCronSecret(request as Parameters<typeof checkCronSecret>[0])) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const now = new Date().toISOString();

    // Find one_shot reminders that are scheduled and past their scheduled_for
    const { data: oneShots, error: e1 } = await supabase
      .from('reminders')
      .select('id, user_id, task_id, kind, scheduled_for, tasks(title)')
      .eq('kind', 'one_shot')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (e1) return reply.status(500).send({ error: e1.message });

    // Find recurring reminders due by next_run_at
    const { data: recurring, error: e2 } = await supabase
      .from('reminders')
      .select('id, user_id, task_id, kind, next_run_at, tasks(title)')
      .eq('kind', 'recurring_until_done')
      .eq('status', 'scheduled')
      .not('next_run_at', 'is', null)
      .lte('next_run_at', now);

    if (e2) return reply.status(500).send({ error: e2.message });

    const allDue = [...(oneShots ?? []), ...(recurring ?? [])];
    let sent = 0;
    let failed = 0;

    for (const reminder of allDue) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const taskTitle = (reminder as any).tasks?.title ?? 'Task reminder';
      const tokens = await getUserTokens(reminder.user_id);

      if (tokens.length === 0) {
        // No tokens — mark as failed
        await supabase
          .from('reminders')
          .update({ status: 'failed', failure_reason: 'no_push_tokens' })
          .eq('id', reminder.id);
        failed++;
        continue;
      }

      try {
        await sendPushNotifications(tokens.map((t) => ({
          to: t,
          title: 'Weekly Focus',
          body: taskTitle,
        })));

        if (reminder.kind === 'one_shot') {
          await supabase
            .from('reminders')
            .update({ status: 'sent', last_sent_at: now })
            .eq('id', reminder.id);
        } else {
          // Recurring: advance next_run_at by 1 day
          const nextRun = new Date(now);
          nextRun.setDate(nextRun.getDate() + 1);
          await supabase
            .from('reminders')
            .update({ last_sent_at: now, next_run_at: nextRun.toISOString() })
            .eq('id', reminder.id);
        }
        sent++;
      } catch {
        await supabase
          .from('reminders')
          .update({ status: 'failed', failure_reason: 'push_api_error' })
          .eq('id', reminder.id);
        failed++;
      }
    }

    return { processed: allDue.length, sent, failed };
  });

  // POST /jobs/habit-nudges — send danger-zone nudges at 09:00 local time
  // Called by Render Cron daily
  fastify.post('/jobs/habit-nudges', async (request, reply) => {
    if (!checkCronSecret(request as Parameters<typeof checkCronSecret>[0])) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Fetch all users with danger_zone_nudges_enabled=true and their timezone
    const { data: settings, error: e1 } = await supabase
      .from('user_settings')
      .select('user_id, timezone')
      .eq('danger_zone_nudges_enabled', true);

    if (e1) return reply.status(500).send({ error: e1.message });

    let nudgesSent = 0;

    for (const { user_id, timezone } of settings ?? []) {
      const weekStart = getCurrentWeekStartDate(timezone ?? 'UTC');

      // Days left in week (Sun=0 through Sat=6; today's day in local tz)
      const localDayStr = new Date().toLocaleDateString('en-US', {
        timeZone: timezone ?? 'UTC',
        weekday: 'short',
      });
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const todayIdx = dayMap[localDayStr] ?? 0;
      const daysLeft = 7 - todayIdx; // days including today

      // Get active habits with nudge enabled for this user
      const { data: habits, error: e2 } = await supabase
        .from('habits')
        .select('id, title, weekly_target, danger_zone_nudge_enabled')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .eq('danger_zone_nudge_enabled', true);

      if (e2 || !habits) continue;

      for (const habit of habits) {
        // Check if already nudged this week
        const { data: existing } = await supabase
          .from('habit_nudge_log')
          .select('id')
          .eq('habit_id', habit.id)
          .eq('week_start_date', weekStart)
          .maybeSingle();

        if (existing) continue;

        // Get current completed count for this week
        const { data: record } = await supabase
          .from('habit_week_records')
          .select('completed_count')
          .eq('habit_id', habit.id)
          .eq('week_start_date', weekStart)
          .maybeSingle();

        const completed = record?.completed_count ?? 0;

        if (!isDangerZone({ weeklyTarget: habit.weekly_target, completedCount: completed, daysLeft })) continue;

        const tokens = await getUserTokens(user_id);
        if (tokens.length === 0) continue;

        const body = `${habit.title} ${completed}/${habit.weekly_target} this week — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to hit your target.`;

        try {
          await sendPushNotifications(tokens.map((t) => ({
            to: t,
            title: 'Weekly Focus',
            body,
          })));

          await supabase.from('habit_nudge_log').insert({
            user_id,
            habit_id: habit.id,
            week_start_date: weekStart,
          });

          nudgesSent++;
        } catch {
          // Non-fatal: continue with other habits
        }
      }
    }

    return { nudges_sent: nudgesSent };
  });
}
