import { api } from '../api';

jest.mock('../supabase', () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: { access_token: 't' } } }) },
  },
}));

const ok = (bodyJson: unknown) =>
  ({ ok: true, status: 200, json: async () => bodyJson }) as Response;
const status = (code: number, bodyJson?: unknown) =>
  ({
    ok: false,
    status: code,
    statusText: `HTTP ${code}`,
    json: async () => {
      if (bodyJson === undefined) throw new Error('no body');
      return bodyJson;
    },
  }) as Response;

describe('api request wake-retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  // Advance timers as the retry loop schedules them.
  async function settle<T>(p: Promise<T>): Promise<T> {
    const done = p.then(
      (v) => ({ v, err: null as unknown }),
      (err) => ({ v: undefined as unknown, err }),
    );
    for (let i = 0; i < 60; i++) {
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    }
    const { v, err } = await done;
    if (err) throw err;
    return v as T;
  }

  it('retries a 503 wake response and returns data once awake', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(ok({ hello: 'world' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await settle(api.get<{ hello: string }>('/tasks'));

    expect(result).toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a POST on a wake status, since the router never reached the app', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(ok({ id: 1 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await settle(api.post<{ id: number }>('/tasks', { title: 'x' }));

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry a real error status, and surfaces the server message', async () => {
    const fetchMock = jest.fn().mockResolvedValue(status(400, { error: 'Goal cap reached' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(settle(api.get('/goals'))).rejects.toThrow('Goal cap reached');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry a 401, so auth failures still fail fast', async () => {
    const fetchMock = jest.fn().mockResolvedValue(status(401, { error: 'Unauthorized' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(settle(api.get('/me'))).rejects.toThrow('Unauthorized');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT replay a POST that threw, to avoid duplicate writes', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('Network request failed'));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(settle(api.post('/tasks', { title: 'x' }))).rejects.toThrow(
      'Network request failed',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a GET that threw, then succeeds', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValueOnce(ok({ ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await settle(api.get<{ ok: boolean }>('/tasks'));

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting retries so the error screen still appears', async () => {
    const fetchMock = jest.fn().mockResolvedValue(status(503));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(settle(api.get('/tasks'))).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(6); // initial + 5 backoff attempts
  });
});
