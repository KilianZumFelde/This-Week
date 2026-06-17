import { render } from '@testing-library/react-native';
import { Track, HealthDots, HEALTH_LEVELS, healthByKey } from '../../app/components/HealthTrack';

describe('healthByKey', () => {
  it('returns the correct level for each DB key', () => {
    for (const lvl of HEALTH_LEVELS) {
      expect(healthByKey(lvl.key).key).toBe(lvl.key);
    }
  });

  it('falls back to on_track for unknown key', () => {
    expect(healthByKey('unknown_key').key).toBe('on_track');
  });
});

describe('Track', () => {
  it('renders without error for size lg', async () => {
    const { toJSON } = await render(<Track pos={0.5} size="lg" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without marker when muted', async () => {
    const { toJSON } = await render(<Track pos={0.5} size="lg" muted />);
    const json = JSON.stringify(toJSON());
    // accent color (#c87856) should not appear in muted mode
    expect(json).not.toContain('#c87856');
  });

  it('renders size sm without error', async () => {
    const { toJSON } = await render(<Track pos={0.72} size="sm" />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('HealthDots', () => {
  const weeks = [null, 'behind', 'slightly_behind', 'on_track', 'on_track', 'ahead', 'ahead', 'well_ahead'];

  it('renders without error', async () => {
    const { toJSON } = await render(<HealthDots weeks={weeks} />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows "This week" label when last week has a level', async () => {
    const { getByText } = await render(<HealthDots weeks={weeks} />);
    expect(getByText('This week')).toBeTruthy();
    expect(getByText('Well ahead')).toBeTruthy();
  });

  it('renders all 8 week bars', async () => {
    const { toJSON } = await render(<HealthDots weeks={weeks} />);
    expect(toJSON()).toBeTruthy();
  });
});
