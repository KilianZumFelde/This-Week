// Phase 13.2 — the Task detail sheet's Goal row can link / change / unlink a goal.
// The sheet is a heavy multi-hook modal, so its data hooks, router and undo store
// are stubbed; what's under test is the Goal row + picker branch only.

const mockUpdate = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../lib/hooks/useTasks', () => ({
  useUpdateTask: () => ({ mutate: mockUpdate }),
  useDeleteTask: () => ({ mutate: jest.fn() }),
  useCreateTask: () => ({ mutate: jest.fn() }),
  useTaskReminder: () => ({ data: null }),
}));

jest.mock('../../lib/hooks/useGoals', () => ({
  useGoals: () => ({ data: mockGoals }),
}));

jest.mock('../../lib/stores/undo-store', () => ({
  useUndoStore: () => jest.fn(),
}));

jest.mock('../../lib/api', () => ({ api: { post: jest.fn(), get: jest.fn() } }));

jest.mock('../../app/components/VoiceReminderModal', () => ({
  VoiceReminderModal: () => null,
}));

import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskDetailSheet } from '../../app/components/TaskDetailSheet';

type MockGoal = {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  goal_type: 'primary' | 'secondary';
};

let mockGoals: MockGoal[] = [];

const ACTIVE_PRIMARY: MockGoal = { id: 'g1', title: 'First paid gig', status: 'active', goal_type: 'primary' };
const ACTIVE_SECONDARY: MockGoal = { id: 'g2', title: 'Ship the album', status: 'active', goal_type: 'secondary' };
const ARCHIVED: MockGoal = { id: 'g9', title: 'Old abandoned goal', status: 'archived', goal_type: 'secondary' };

const themes = [{ id: 'th1', name: 'Music', color: '#8ea076' }] as never;

function makeTask(goal_id: string | null) {
  return {
    id: 't1',
    title: 'Email the venue',
    notes: null,
    status: 'open',
    theme_id: 'th1',
    goal_id,
    effort_level: 'low',
    return_level: 'high',
    week_assignment: 'this_week',
  } as never;
}

function renderSheet(goal_id: string | null) {
  // The sheet calls useQueryClient() directly (reminder invalidation), so it
  // needs a real provider even though every data hook above is stubbed.
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TaskDetailSheet task={makeTask(goal_id)} themes={themes} onClose={() => {}} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGoals = [ACTIVE_PRIMARY, ACTIVE_SECONDARY, ARCHIVED];
  mockUpdate.mockClear();
  mockPush.mockClear();
});

describe('TaskDetailSheet — goal link / change / unlink', () => {
  it('an unlinked task offers "Link a goal" and opens the picker on press', async () => {
    const { getByText, queryByText } = await renderSheet(null);

    expect(queryByText('Link a goal')).not.toBeNull();
    expect(queryByText('Link to a goal')).toBeNull(); // picker closed

    await fireEvent.press(getByText('Link a goal'));
    expect(queryByText('Link to a goal')).not.toBeNull(); // picker open
  });

  it('the picker lists "None" plus active goals only', async () => {
    const { getByText, queryByText } = await renderSheet(null);
    await fireEvent.press(getByText('Link a goal'));

    expect(queryByText('None')).not.toBeNull();
    expect(queryByText('First paid gig')).not.toBeNull();
    expect(queryByText('Ship the album')).not.toBeNull();
    expect(queryByText('Old abandoned goal')).toBeNull(); // archived, not linked
  });

  it('selecting a goal puts it on the Goal row and closes the picker', async () => {
    const { getByText, queryByText } = await renderSheet(null);
    await fireEvent.press(getByText('Link a goal'));
    await fireEvent.press(getByText('First paid gig'));

    expect(queryByText('Link to a goal')).toBeNull(); // picker closed
    expect(queryByText('Link a goal')).toBeNull(); // row is now linked
    expect(queryByText('First paid gig')).not.toBeNull();
    expect(queryByText('CHANGE')).not.toBeNull();
  });

  it('CHANGE on a linked task opens the picker, and "None" unlinks it', async () => {
    const { getByText, queryByText } = await renderSheet('g1');

    expect(queryByText('CHANGE')).not.toBeNull();
    await fireEvent.press(getByText('CHANGE'));
    await fireEvent.press(getByText('None'));

    expect(queryByText('Link a goal')).not.toBeNull();
    expect(queryByText('CHANGE')).toBeNull();
  });

  it('a task linked to a past goal still shows that goal as an option', async () => {
    const { getByText, queryByText, queryAllByText } = await renderSheet('g9');

    // Row shows it even though it is archived (the goal_id pointer survives).
    expect(queryAllByText('Old abandoned goal')).toHaveLength(1);

    await fireEvent.press(getByText('CHANGE'));

    // Now twice: once on the row, once as the selected picker option.
    expect(queryAllByText('Old abandoned goal')).toHaveLength(2);
    expect(queryByText('Past goal')).not.toBeNull();
  });

  it('tapping the linked row navigates to Goal Detail with the staged goal', async () => {
    const { getByText } = await renderSheet(null);
    await fireEvent.press(getByText('Link a goal'));
    await fireEvent.press(getByText('Ship the album'));
    await fireEvent.press(getByText('Ship the album')); // now the row itself

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/goal-detail',
      params: { goalId: 'g2' },
    });
  });

  it('a goal change is saved on dismiss, not on tap', async () => {
    const { getByText } = await renderSheet(null);
    await fireEvent.press(getByText('Link a goal'));
    await fireEvent.press(getByText('First paid gig'));

    expect(mockUpdate).not.toHaveBeenCalled(); // staged only

    await fireEvent.press(getByText('Move to backlog')); // a path that closes the sheet
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't1', goal_id: 'g1' }),
    );
  });
});
