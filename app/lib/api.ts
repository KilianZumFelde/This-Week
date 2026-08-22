import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getHeaders(hasBody: boolean): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// The backend hibernates when idle. The first request after a spin-down wakes
// it, but is itself rejected by the host's router with an instant 502/503/504
// — the app is not yet listening. Waking takes ~20-30s, so a single attempt
// fails long before the backend is ready.
const WAKE_STATUSES = [502, 503, 504];
// 1s + 2s + 4s + 8s + 16s = 31s of waiting across 6 attempts.
const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A wake status comes from the router, so the request never reached our app and
// cannot have had a side effect — safe to replay for any method. A thrown
// fetch error is ambiguous: the request may have been delivered and only the
// response lost, so replaying a write could duplicate it. Only replay reads.
const isIdempotent = (method: string) => method === 'GET';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers = await getHeaders(body !== undefined);

  for (let attempt = 0; ; attempt++) {
    const canRetry = attempt < BACKOFF_MS.length;
    let res: Response;

    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      if (canRetry && isIdempotent(method)) {
        await sleep(BACKOFF_MS[attempt]);
        continue;
      }
      throw e;
    }

    if (WAKE_STATUSES.includes(res.status) && canRetry) {
      await sleep(BACKOFF_MS[attempt]);
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err?.error ?? `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: (path: string) => request<void>('DELETE', path),
};
