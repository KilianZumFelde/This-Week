// MilestoneSheet imports the milestone hooks (→ api → supabase, which needs env at init).
// Mock them so we can import the pure resolveChip helper without that chain.
jest.mock('../supabase', () => ({ supabase: {} }));
jest.mock('../hooks/useMilestones', () => ({
  useMilestones: jest.fn(() => ({ data: [] })),
  useCreateMilestone: jest.fn(() => ({ mutate: jest.fn() })),
  useUpdateMilestone: jest.fn(() => ({ mutate: jest.fn() })),
  useDeleteMilestone: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));

import { resolveChip, DATE_CHIPS } from '../../app/components/MilestoneSheet';

// Mirror the helper's own math (local date + N days → UTC date-only) so the
// expectation is deterministic regardless of the run date/timezone.
function expectedPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('milestone date presets', () => {
  it('offers six chips in chronological order: 1w/2w/3w/1m/5w/6w', () => {
    expect(DATE_CHIPS.map((c) => c.key)).toEqual(['1w', '2w', '3w', '1m', '5w', '6w']);
  });

  it('resolves 3 weeks to +21 days', () => {
    expect(resolveChip('3w')).toBe(expectedPlusDays(21));
  });

  it('resolves 5 weeks to +35 days', () => {
    expect(resolveChip('5w')).toBe(expectedPlusDays(35));
  });

  it('keeps the existing presets intact', () => {
    expect(resolveChip('1w')).toBe(expectedPlusDays(7));
    expect(resolveChip('2w')).toBe(expectedPlusDays(14));
    expect(resolveChip('6w')).toBe(expectedPlusDays(42));
  });
});
