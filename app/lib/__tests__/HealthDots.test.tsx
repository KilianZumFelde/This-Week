import { render } from '@testing-library/react-native';
import { HealthDots } from '../../app/components/HealthTrack';

// 8 oldest→newest slots; the last is the highlighted "now" bar.
const weeksEndingBehind = [null, null, null, 'on_track', 'on_track', 'slightly_behind', 'slightly_behind', 'behind'];

describe('HealthDots — current bar label + level', () => {
  it('shows the now bar level matching the last (newest) week — 9.1 single-source', async () => {
    const { getByText } = await render(<HealthDots weeks={weeksEndingBehind} />);
    // The header level reflects weeks[last] = 'behind'
    expect(getByText('Behind')).toBeTruthy();
  });

  it('defaults the now label to "This week"', async () => {
    const { getByText } = await render(<HealthDots weeks={weeksEndingBehind} />);
    expect(getByText('This week')).toBeTruthy();
  });

  it('renders a dated now label when the newest rating is not the current week — 9.2 honesty', async () => {
    const { getByText, queryByText } = await render(
      <HealthDots weeks={weeksEndingBehind} nowLabel="Wk of Jun 8" />,
    );
    expect(getByText('Wk of Jun 8')).toBeTruthy();
    expect(queryByText('This week')).toBeNull();
  });

  it('renders no header when there is no current rating (all-null trend)', async () => {
    const { queryByText } = await render(<HealthDots weeks={[null, null, null, null, null, null, null, null]} />);
    expect(queryByText('This week')).toBeNull();
  });
});
