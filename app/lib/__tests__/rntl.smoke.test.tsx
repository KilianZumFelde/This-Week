// Component-render smoke test for RNTL 14.
// NOTE: RNTL 14's `render` is ASYNC — you must `await` it (and `await` the
// user-event / fireEvent helpers). Calling it synchronously returns a Promise
// with no query methods.
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('RNTL harness', () => {
  it('renders and queries an RN component', async () => {
    const { getByText } = await render(<Text>hello weekly focus</Text>);
    expect(getByText('hello weekly focus')).toBeTruthy();
  });
});
