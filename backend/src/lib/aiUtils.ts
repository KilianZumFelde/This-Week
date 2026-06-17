import { z } from 'zod';

const SuggestGoalTaskItemSchema = z.object({
  title: z.string().min(1),
  theme_id: z.string().nullable().optional(),
  effort_level: z.enum(['low', 'medium', 'high', 'unknown']).nullable().optional(),
  return_level: z.enum(['low', 'medium', 'high', 'unknown']).nullable().optional(),
});

const SuggestGoalTasksOutputSchema = z.object({
  items: z.array(SuggestGoalTaskItemSchema),
});

export type SuggestItem = z.infer<typeof SuggestGoalTaskItemSchema>;

/** Pure function — extracts and Zod-validates the suggest_goal_tasks tool-use block. Soft-fails to { items: [] } on any error. */
export function parseSuggestToolResult(content: unknown[]): { items: SuggestItem[] } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolUse = (content as any[]).find((b: any) => b.type === 'tool_use');
  if (!toolUse) return { items: [] };
  const validated = SuggestGoalTasksOutputSchema.safeParse(toolUse.input);
  if (!validated.success || validated.data.items.length === 0) return { items: [] };
  return { items: validated.data.items };
}
