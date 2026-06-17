import { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import { localToUTC } from '../lib/dateUtils.js';
import { parseSuggestToolResult } from '../lib/aiUtils.js';
export { parseSuggestToolResult } from '../lib/aiUtils.js';

const CaptureRequestSchema = z.object({
  transcript: z.string().min(1),
  context: z.object({
    themes: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().nullable().optional(),
      })
    ),
    active_primary_goal: z
      .object({
        id: z.string(),
        title: z.string(),
        theme_id: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    timezone: z.string().optional(),
  }),
});

const ReminderSpecSchema = z.object({
  kind: z.enum(['one_shot', 'recurring_until_done']),
  scheduled_for: z.string().nullable(),
  recurrence_rule: z.string().nullable(),
});

const CaptureItemSchema = z.object({
  item_type: z.enum(['task', 'habit']),
  title: z.string().min(1),
  theme_id: z.string().nullable(),
  effort_level: z.enum(['low', 'medium', 'high']).nullable().optional(),
  return_level: z.enum(['low', 'medium', 'high']).nullable().optional(),
  week_assignment: z.enum(['this_week', 'backlog']).nullable().optional(),
  weekly_target: z.number().int().min(1).max(14).nullable().optional(),
  goal_id: z.string().nullable().optional(),
  reminder_spec: ReminderSpecSchema.nullable().optional(),
  confidence_flags: z.array(z.string()),
});

const CaptureOutputSchema = z.object({
  items: z.array(CaptureItemSchema).min(1),
});

const CAPTURE_TOOL: Anthropic.Tool = {
  name: 'capture_items',
  description: 'Return the parsed items extracted from the voice transcript',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['item_type', 'title', 'theme_id', 'confidence_flags'],
          properties: {
            item_type: {
              type: 'string',
              enum: ['task', 'habit'],
              description: 'task = one-off to-do; habit = recurring practice tracked weekly',
            },
            title: { type: 'string', description: 'Clean, concise title for the item' },
            theme_id: {
              type: ['string', 'null'],
              description: 'ID of the closest matching theme, or null if no clear match',
            },
            effort_level: {
              type: ['string', 'null'],
              enum: ['low', 'medium', 'high', null],
              description: 'How heavy is this lift? Default to medium if unclear',
            },
            return_level: {
              type: ['string', 'null'],
              enum: ['low', 'medium', 'high', null],
              description: 'How much will this move the goal? Default to medium if unclear',
            },
            week_assignment: {
              type: ['string', 'null'],
              enum: ['this_week', 'backlog', null],
              description: 'Where should this live? Default to this_week',
            },
            weekly_target: {
              type: ['integer', 'null'],
              minimum: 1,
              maximum: 14,
              description: 'Habit only: how many times per week. null if unparseable',
            },
            goal_id: {
              type: ['string', 'null'],
              description: 'ID of the active primary goal if item clearly relates to it, else null',
            },
            reminder_spec: {
              type: ['object', 'null'],
              properties: {
                kind: { type: 'string', enum: ['one_shot', 'recurring_until_done'] },
                scheduled_for: {
                  type: ['string', 'null'],
                  description: 'ISO 8601 datetime string for one_shot reminders, or null',
                },
                recurrence_rule: {
                  type: ['string', 'null'],
                  description: 'RRULE string for recurring_until_done, or null',
                },
              },
              required: ['kind', 'scheduled_for', 'recurrence_rule'],
              description: 'Parsed reminder from natural language, or null if no reminder mentioned',
            },
            confidence_flags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Field names you are uncertain about (e.g. ["theme_id", "return_level"])',
            },
          },
        },
      },
    },
    required: ['items'],
  },
};

function buildSystemPrompt(
  themes: { id: string; name: string }[],
  primaryGoal: { id: string; title: string; theme_id?: string | null } | null | undefined,
  timezone: string
): string {
  const themesText = themes.map((t) => `  - "${t.name}" (id: ${t.id})`).join('\n');
  const goalText = primaryGoal
    ? `Active primary goal: "${primaryGoal.title}" (id: ${primaryGoal.id})`
    : 'No active primary goal.';

  return `You parse voice transcripts into structured task or habit drafts for a weekly productivity app.

User timezone: ${timezone}
Today: ${new Date().toISOString()}

Available themes:
${themesText}

${goalText}

Rules:
- Extract one item per distinct thing mentioned. A transcript can contain multiple items.
- item_type: "task" for one-off to-dos ("call Pedro", "send email"). "habit" for recurring practices ("gym 4x a week", "meditate daily").
- title: clean, concise, actionable. Remove filler words like "add", "remind me to", etc.
- theme_id: match to the closest theme by semantic similarity. If no reasonable match, use null and add "theme_id" to confidence_flags.
- effort_level / return_level: default to "medium" if not mentioned. Add to confidence_flags if inferred.
- week_assignment: default to "this_week". Use "backlog" only if user says "later", "someday", "next week", etc.
- weekly_target: for habits, extract the number (e.g. "4 times" → 4, "daily" → 7, "twice" → 2). If truly unclear, use null and add "weekly_target" to confidence_flags.
- goal_id: set to the primary goal id only if the item clearly relates to it (same theme or explicit mention). Otherwise null.
- reminder_spec: parse natural language time references ("tomorrow", "Thursday 9am", "daily until done"). Default time when no time specified: 09:00 in user's timezone. For recurring reminders, use RRULE format (e.g. "FREQ=DAILY"). If no reminder mentioned, null.
- confidence_flags: list the field names you guessed or are uncertain about.`;
}

// ─── Goal-task suggestion ────────────────────────────────────────────────────

const SuggestGoalTasksRequestSchema = z.object({
  goal: z.object({
    id: z.string(),
    title: z.string(),
    why: z.string().nullable().optional(),
    target_date: z.string(),
    health_level: z.string().nullable().optional(),
  }),
  nearest_milestone: z.object({
    title: z.string(),
    target_date: z.string(),
  }).nullable().optional(),
  existing_task_titles: z.array(z.string()),
  themes: z.array(z.object({ id: z.string(), name: z.string() })),
});

const SuggestGoalTaskItemSchema = z.object({
  title: z.string().min(1),
  theme_id: z.string().nullable().optional(),
  effort_level: z.enum(['low', 'medium', 'high', 'unknown']).nullable().optional(),
  return_level: z.enum(['low', 'medium', 'high', 'unknown']).nullable().optional(),
});

const SuggestGoalTasksOutputSchema = z.object({
  items: z.array(SuggestGoalTaskItemSchema),
});

const SUGGEST_GOAL_TASKS_TOOL: Anthropic.Tool = {
  name: 'suggest_goal_tasks',
  description: 'Return task suggestions that would move this goal forward this week',
  input_schema: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', description: 'Concise, actionable task title' },
            theme_id: { type: ['string', 'null'], description: 'ID of the closest matching theme, or null' },
            effort_level: { type: ['string', 'null'], enum: ['low', 'medium', 'high', 'unknown', null] },
            return_level: { type: ['string', 'null'], enum: ['low', 'medium', 'high', 'unknown', null] },
          },
        },
      },
    },
  },
};

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.post('/ai/suggest-goal-tasks', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = SuggestGoalTasksRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { goal, nearest_milestone, existing_task_titles, themes } = parsed.data;

    const themesText = themes.map((t) => `  - "${t.name}" (id: ${t.id})`).join('\n');
    const milestoneText = nearest_milestone
      ? `Nearest milestone: "${nearest_milestone.title}" (due ${nearest_milestone.target_date})`
      : 'No active milestone yet.';
    const existingText = existing_task_titles.length > 0
      ? `Already planned or in backlog:\n${existing_task_titles.map((t) => `  - ${t}`).join('\n')}`
      : 'No tasks planned yet.';
    const healthText = goal.health_level ? `Current health: ${goal.health_level}` : '';

    const systemPrompt = `You are the task suggestion engine for "This Week", a personal productivity app that connects long-term goals to weekly execution.

The user is in their Sunday planning ritual. They have already reflected on one active goal and planned some work for the week. Your job is to suggest additional concrete weekly actions they may have missed.

Goal: "${goal.title}"${goal.why ? `\nWhy: ${goal.why}` : ''}
Target date: ${goal.target_date}
${healthText}
${milestoneText}

${existingText}

Available themes:
${themesText}

You must call the provided suggestion tool exactly once.

Suggest up to 10 tasks. Fewer is better than weaker suggestions. Return no suggestions if you cannot produce useful, concrete, non-duplicative actions.

Your objective:
Suggest specific, doable actions the user could realistically complete this week that would move the goal forward.

A good suggestion is:
* Concrete: it describes a real action, not a category of work.
* Specific: it includes a clear object, output, recipient, source, place, constraint, or success condition.
* Weekly-sized: it can plausibly be completed this week.
* Goal-relevant: it directly supports the goal, milestone, target date, or existing tasks.
* Non-duplicative: it is not already covered by planned or backlog tasks.
* Immediately actionable: the user should understand exactly what to do without further interpretation.

Do not suggest meta-planning tasks.

Bad examples:
* "Plan next steps"
* "List sub-goals"
* "Define a strategy"
* "Review progress"
* "Think about priorities"
* "Break down the milestone"
* "Create an action plan"
* "Research options"
* "Explore investment strategies"
* "Work on fitness"
* "Improve DJ skills"

Planning-like tasks are only allowed when the output is concrete and useful.

Good examples:
* "Write a 5-item shortlist of Spanish recruiters to contact this week"
* "Compare 3 accumulating MSCI World ETFs by TER, domicile, and replication method"
* "Book two 45-minute practice sessions for the transition routine"
* "Draft the first version of the outreach message to Anna about the referral"
* "Record one 20-minute transition practice using the 3 tracks already selected"
* "Read the Investopedia article on compound ETFs and write down 3 takeaways"
* "Send one referral request to an ex-colleague for the Senior PM role"

Use these internal lenses to generate candidates. Do not expose these categories to the user. Do not force one suggestion per lens.

1. Milestone gap — What concrete weekly action is still missing to complete or de-risk the nearest milestone?
2. Natural follow-up — What action logically follows from the tasks already planned or in the backlog?
3. Enablement — What would make an existing task easier, faster, or more likely to happen this week?
4. Missing input — What feedback, access, decision, example, file, booking, or information is needed to unblock progress?
5. Fallback path — What alternative action would still create progress if the current path stalls?
6. High-leverage small move — What low-effort action could create an outsized result?
7. Execution mode — What specific outreach, creation, practice, testing, submission, booking, comparison, or research should happen this week?
8. Deadline risk reduction — What action would reduce the risk of missing the target date, especially if the goal is behind or slightly behind?
9. Overlooked necessity — What necessary but easy-to-miss action would create a clear gap if skipped?

Use the current health level to calibrate suggestions:
* If the goal is behind or slightly behind, prioritize milestone-critical actions, unblockers, fallback paths, and deadline risk reduction.
* If the goal is on track, prioritize natural next steps, enablement, and compounding progress.
* If the goal is ahead or well ahead, suggest leverage actions, quality improvements, optional stretch actions, or maintenance actions.

Use the nearest milestone:
* If there is an active milestone, most suggestions should help complete, unblock, or de-risk that milestone.
* If there is no active milestone, suggest actions that create visible progress toward the goal without turning into generic planning.

Use existing tasks:
* Do not duplicate tasks already planned or in the backlog.
* Suggest follow-ups, prerequisites, simplifications, support actions, alternatives, or concrete next execution steps.
* If an existing task is broad, you may suggest a sharper concrete version only if it is meaningfully different and more actionable.

Use themes:
* Assign a theme only if one of the available themes clearly fits.
* Do not invent new themes.
* If no available theme clearly fits, leave theme_id as null.

Language and tone:
* Use the same language as the goal and existing task titles.
* Keep task titles short, natural, and user-facing.
* Do not sound like a consultant.
* Do not mention the internal lenses.
* Do not include generic motivational language.

Before calling the tool, silently quality-check every suggestion. Only keep a suggestion if it passes all five checks:
1. Can the user realistically do this this week?
2. Is it concrete enough that the user knows exactly what to do?
3. Does it move the goal, milestone, or target date forward?
4. Is it meaningfully different from existing planned or backlog tasks?
5. Is it not merely planning, reflecting, organizing, or deciding what to do later?

Call the suggestion tool with only the suggestions that pass this quality gate.`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        tools: [SUGGEST_GOAL_TASKS_TOOL],
        tool_choice: { type: 'tool', name: 'suggest_goal_tasks' },
        messages: [{ role: 'user', content: `Suggest tasks toward: ${goal.title}` }],
      });

      return parseSuggestToolResult(msg.content as unknown[]);
    } catch {
      // Soft-fail: AI errors never surface as 5xx
      return { items: [] };
    }
  });

  fastify.post('/ai/capture', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = CaptureRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { transcript, context } = parsed.data;
    const userId = request.userId;
    const timezone = context.timezone ?? 'UTC';

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let success = false;
    let errorCode: string | null = null;
    let result: z.infer<typeof CaptureOutputSchema> | null = null;

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: buildSystemPrompt(context.themes, context.active_primary_goal, timezone),
        tools: [CAPTURE_TOOL],
        tool_choice: { type: 'tool', name: 'capture_items' },
        messages: [{ role: 'user', content: transcript }],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolUse = (msg.content as any[]).find((b: any) => b.type === 'tool_use');
      if (!toolUse) throw new Error('no_tool_use');

      const validated = CaptureOutputSchema.safeParse(toolUse.input);
      if (!validated.success) throw new Error('schema_validation_failed');

      result = validated.data;
      success = true;
    } catch (err: unknown) {
      errorCode = err instanceof Error ? err.message : 'unknown';
    }

    const outputType = result
      ? result.items.length === 1
        ? result.items[0].item_type
        : 'multi'
      : null;

    await supabase.from('ai_capture_logs').insert({
      user_id: userId,
      input_type: 'voice',
      output_type: outputType,
      success,
      error_code: errorCode,
    });

    if (!success || !result) {
      return reply.status(422).send({ error: errorCode ?? 'capture_failed' });
    }

    return result;
  });

  // POST /ai/parse-reminder — parse natural language into a ReminderSpec
  fastify.post('/ai/parse-reminder', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = z.object({
      text: z.string().min(1),
      timezone: z.string().optional(),
    }).safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { text, timezone = 'UTC' } = parsed.data;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Pass the current time in the user's local timezone (no UTC suffix) so Haiku
    // can resolve relative references ("tomorrow", "Friday") without doing offset math.
    const nowLocal = new Date().toLocaleString('sv-SE', { timeZone: timezone }).replace(' ', 'T');

    const REMINDER_TOOL: Anthropic.Tool = {
      name: 'parse_reminder',
      description: 'Return a structured reminder parsed from natural language',
      input_schema: {
        type: 'object',
        required: ['kind', 'scheduled_for', 'recurrence_rule'],
        properties: {
          kind: { type: 'string', enum: ['one_shot', 'recurring_until_done'] },
          scheduled_for: {
            type: ['string', 'null'],
            description: 'Local datetime for one_shot or first occurrence of recurring, formatted as YYYY-MM-DDTHH:MM:SS with no timezone suffix. null if unparseable.',
          },
          recurrence_rule: {
            type: ['string', 'null'],
            description: 'RRULE string for recurring_until_done (e.g. FREQ=DAILY), else null.',
          },
        },
      },
    };

    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: `You parse natural language reminder phrases into structured data.
Current time: ${nowLocal}

Rules:
- "tomorrow", "tomorrow morning" → next day at 09:00
- "tonight", "this evening" → today at 19:00
- "in X hours/minutes" → relative to current time
- "Friday", "next Monday", etc → nearest future occurrence at 09:00 unless a time is specified
- "daily until done", "every day", "nudge me daily" → recurring_until_done, FREQ=DAILY
- "every Monday", "each Wednesday" → recurring_until_done, FREQ=WEEKLY;BYDAY=MO (or TU/WE/TH/FR/SA/SU)
- "Monday and Wednesday", "Monday, Tuesday, Wednesday", "weekdays" → recurring_until_done, FREQ=WEEKLY;BYDAY=MO,WE / MO,TU,WE / MO,TU,WE,TH,FR
- "weekends" → recurring_until_done, FREQ=WEEKLY;BYDAY=SA,SU
- Default time when only a date or day is given: 09:00
- Return scheduled_for as YYYY-MM-DDTHH:MM:SS with no timezone suffix
- If the input is not a time reference at all, return scheduled_for: null`,
        tools: [REMINDER_TOOL],
        tool_choice: { type: 'tool', name: 'parse_reminder' },
        messages: [{ role: 'user', content: text }],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolUse = (msg.content as any[]).find((b: any) => b.type === 'tool_use');
      if (!toolUse) return reply.status(422).send({ error: 'unparseable' });

      const result = toolUse.input as { kind: string; scheduled_for: string | null; recurrence_rule: string | null };
      if (!result.scheduled_for && !result.recurrence_rule) {
        return reply.status(422).send({ error: 'unparseable' });
      }

      // Convert Haiku's local datetime to UTC using the user's timezone
      if (result.scheduled_for) {
        result.scheduled_for = localToUTC(result.scheduled_for, timezone);
      }

      return result;
    } catch {
      return reply.status(422).send({ error: 'parse_failed' });
    }
  });
}
