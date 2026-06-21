// Mock supabase (requires EXPO_PUBLIC_SUPABASE_URL at init which isn't set in Jest)
jest.mock('../supabase', () => ({ supabase: {} }));
// Mock react-query hooks imported by goals.tsx (PastGoalCard itself uses no hooks)
jest.mock('../hooks/useGoals', () => ({
  useGoals: jest.fn(() => ({ data: [] })),
  useNearestMilestones: jest.fn(() => ({ data: {} })),
}));
jest.mock('../hooks/useThemes', () => ({ useThemes: jest.fn(() => ({ data: [] })) }));

import { render, fireEvent } from '@testing-library/react-native';
import { PastGoalCard } from '../../app/(tabs)/goals';
import type { Goal } from '../hooks/useGoals';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    user_id: 'u1',
    theme_id: null,
    title: 'Old goal',
    why: null,
    goal_type: 'primary',
    status: 'completed',
    target_date: '2026-01-01',
    completed_at: '2026-03-15T00:00:00Z',
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

describe('PastGoalCard', () => {
  it('renders result label, title, and date as a card', async () => {
    const goal = makeGoal({ status: 'completed', title: 'Ship v1' });
    const { getByText, toJSON } = await render(<PastGoalCard goal={goal} onPress={() => {}} />);
    expect(getByText('Hit')).toBeTruthy();
    expect(getByText('Ship v1')).toBeTruthy();
    // Card styling: rounded surface background, not a hairline border
    const json = JSON.stringify(toJSON());
    expect(json).toContain('borderRadius');
    expect(json).not.toContain('borderBottomWidth');
  });

  it('labels an abandoned goal "Abandoned" and a missed goal "Missed"', async () => {
    const abandoned = await render(
      <PastGoalCard goal={makeGoal({ status: 'archived', completed_at: null, archived_at: '2026-04-01T00:00:00Z' })} onPress={() => {}} />,
    );
    expect(abandoned.getByText('Abandoned')).toBeTruthy();

    const missed = await render(
      <PastGoalCard goal={makeGoal({ status: 'missed' as Goal['status'], completed_at: null })} onPress={() => {}} />,
    );
    expect(missed.getByText('Missed')).toBeTruthy();
  });

  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<PastGoalCard goal={makeGoal({ title: 'Tap me' })} onPress={onPress} />);
    await fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
