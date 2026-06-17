import { describe, it, expect } from 'vitest';
import { parseSuggestToolResult } from '../lib/aiUtils.js';

// Minimal valid item shape
const validItem = { title: 'Write a draft', theme_id: null };

describe('parseSuggestToolResult — AI soft-fail', () => {
  it('returns { items: [] } when content has no tool_use block', () => {
    expect(parseSuggestToolResult([{ type: 'text', text: 'hello' }])).toEqual({ items: [] });
  });

  it('returns { items: [] } when content is empty', () => {
    expect(parseSuggestToolResult([])).toEqual({ items: [] });
  });

  it('returns { items: [] } when tool_use input fails Zod validation', () => {
    const block = { type: 'tool_use', input: { items: [{ title: '' }] } }; // title min(1) fails
    expect(parseSuggestToolResult([block])).toEqual({ items: [] });
  });

  it('returns { items: [] } when tool_use items array is empty', () => {
    const block = { type: 'tool_use', input: { items: [] } };
    expect(parseSuggestToolResult([block])).toEqual({ items: [] });
  });

  it('returns { items: [] } when tool_use input is completely malformed', () => {
    const block = { type: 'tool_use', input: 'not-an-object' };
    expect(parseSuggestToolResult([block])).toEqual({ items: [] });
  });

  it('returns parsed items on a valid tool_use block', () => {
    const block = { type: 'tool_use', input: { items: [validItem] } };
    const result = parseSuggestToolResult([block]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Write a draft');
  });

  it('accepts all optional fields when present', () => {
    const item = { title: 'Research ETFs', theme_id: 'theme-1', effort_level: 'low', return_level: 'high' };
    const block = { type: 'tool_use', input: { items: [item] } };
    const result = parseSuggestToolResult([block]);
    expect(result.items[0].effort_level).toBe('low');
    expect(result.items[0].return_level).toBe('high');
  });

  it('returns the first tool_use block when multiple blocks are present', () => {
    const blocks = [
      { type: 'text', text: 'thinking...' },
      { type: 'tool_use', input: { items: [validItem, { title: 'Second task' }] } },
    ];
    expect(parseSuggestToolResult(blocks).items).toHaveLength(2);
  });
});
