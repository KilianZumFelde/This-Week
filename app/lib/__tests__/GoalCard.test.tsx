// Mock supabase (requires EXPO_PUBLIC_SUPABASE_URL at init which isn't set in Jest)
jest.mock('../supabase', () => ({ supabase: {} }));
// Mock react-query hooks used in goals.tsx (GoalCardBody itself uses no hooks)
jest.mock('../hooks/useGoals', () => ({
  useGoals: jest.fn(() => ({ data: [] })),
  useNearestMilestones: jest.fn(() => ({ data: {} })),
}));
jest.mock('../hooks/useThemes', () => ({ useThemes: jest.fn(() => ({ data: [] })) }));

import { render } from '@testing-library/react-native';
import { GoalCardBody } from '../../app/(tabs)/goals';
import type { Goal, NearestMilestone } from '../hooks/useGoals';

// Minimal Goal factory
function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    user_id: 'u1',
    theme_id: null,
    title: 'Ship v1',
    why: null,
    goal_type: 'primary',
    status: 'active',
    target_date: '2027-01-01',
    completed_at: null,
    archived_at: null,
    sort_order: 0,
    health_level: null,
    progress_answer: null,
    confidence_answer: null,
    health_set_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const baseProps = { themeColor: '#8ea076', themeName: 'Career', isPrimary: true };

describe('GoalCardBody — health track variants', () => {
  it('renders a real (non-muted) track when health_level is set', async () => {
    const goal = makeGoal({ health_level: 'on_track' });
    const ms: NearestMilestone = { id: 'm1', title: 'Cut demo', target_date: '2026-09-01', is_overdue: false };
    const { toJSON } = await render(<GoalCardBody goal={goal} nearestMs={ms} {...baseProps} />);
    const json = JSON.stringify(toJSON());
    // Muted track uses 0.4 opacity — real track does not; accent marker (#c87856) should appear
    expect(json).toContain('#c87856');
  });

  it('renders a muted track when health_level is null (not yet rated)', async () => {
    const goal = makeGoal({ health_level: null });
    const ms: NearestMilestone = { id: 'm1', title: 'Cut demo', target_date: '2026-09-01', is_overdue: false };
    const { toJSON } = await render(<GoalCardBody goal={goal} nearestMs={ms} {...baseProps} />);
    const json = JSON.stringify(toJSON());
    // Muted track suppresses the accent marker color
    expect(json).not.toContain('#c87856');
  });

  it('shows no-milestone hint text when nearestMs is null', async () => {
    const goal = makeGoal({ health_level: null });
    const { getByText } = await render(<GoalCardBody goal={goal} nearestMs={null} {...baseProps} />);
    expect(getByText('+ Add milestone to track progress')).toBeTruthy();
  });

  it('shows milestone title when nearestMs is provided', async () => {
    const goal = makeGoal({ health_level: 'ahead' });
    const ms: NearestMilestone = { id: 'm2', title: 'Launch beta', target_date: '2026-10-01', is_overdue: false };
    const { getByText } = await render(<GoalCardBody goal={goal} nearestMs={ms} {...baseProps} />);
    expect(getByText(/Launch beta/)).toBeTruthy();
  });

  it('applies overdue (brick-red) tone on the milestone line when is_overdue', async () => {
    const goal = makeGoal({ health_level: 'slightly_behind' });
    const ms: NearestMilestone = { id: 'm3', title: 'Overdue milestone', target_date: '2026-01-01', is_overdue: true };
    const { toJSON } = await render(<GoalCardBody goal={goal} nearestMs={ms} {...baseProps} />);
    const json = JSON.stringify(toJSON());
    // brick color (#a86b5e) appears on the overdue line
    expect(json).toContain('#a86b5e');
  });
});
