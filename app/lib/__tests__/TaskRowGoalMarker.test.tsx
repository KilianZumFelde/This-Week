// TaskRow → TapFeedback → react-native-reanimated/worklets, which doesn't load
// under Jest. Stub TapFeedback with a plain passthrough (it only wraps children
// with a press handler); the goal-marker logic under test is unaffected.
jest.mock('../../app/components/TapFeedback', () => ({
  TapFeedback: ({ children }: { children: unknown }) => children,
}));

import { render } from '@testing-library/react-native';
import { TaskRow } from '../../app/components/TaskRow';

type RowTask = {
  id: string;
  title: string;
  status: 'open' | 'done' | 'archived_done';
  effort_level: string;
  return_level: string;
  theme_id: string;
  goal_id: string | null;
};

function makeTask(overrides: Partial<RowTask> = {}): RowTask {
  return {
    id: 't1',
    title: 'Draft chapter outline',
    status: 'open',
    effort_level: 'medium',
    return_level: 'high',
    theme_id: 'th1',
    goal_id: null,
    ...overrides,
  };
}

const theme = { id: 'th1', name: 'Writing', color: '#8ea076' } as never;

describe('TaskRow — subtle goal marker', () => {
  it('shows the goal marker when the task is linked to a goal', async () => {
    const { queryByTestId } = await render(
      <TaskRow task={makeTask({ goal_id: 'g1' })} theme={theme} onToggle={() => {}} />,
    );
    expect(queryByTestId('goal-marker')).not.toBeNull();
  });

  it('hides the marker when the task has no goal', async () => {
    const { queryByTestId } = await render(
      <TaskRow task={makeTask({ goal_id: null })} theme={theme} onToggle={() => {}} />,
    );
    expect(queryByTestId('goal-marker')).toBeNull();
  });

  it('suppresses the marker when hideGoalMarker is set (e.g. inside Goal Detail)', async () => {
    const { queryByTestId } = await render(
      <TaskRow task={makeTask({ goal_id: 'g1' })} theme={theme} onToggle={() => {}} hideGoalMarker />,
    );
    expect(queryByTestId('goal-marker')).toBeNull();
  });
});
