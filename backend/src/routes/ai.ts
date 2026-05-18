import { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';

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

export async function aiRoutes(fastify: FastifyInstance) {
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
}
