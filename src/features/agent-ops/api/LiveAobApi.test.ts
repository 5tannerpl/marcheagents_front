import { afterEach, describe, expect, it, vi } from 'vitest';
import { LiveAobApi } from './LiveAobApi';

afterEach(() => vi.restoreAllMocks());

describe('LiveAobApi supported BFF routes', () => {
  it('uses state.summary and never requests the unsupported summary route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          run_id: 'run-8192a3b4c5d6e7f8',
          status: 'complete',
          kaggle_status: 'complete',
          error_code: null,
          mode: 'high_concurrency',
          units: 100,
          created_at: 1,
          updated_at: 2,
          finished_at: 3,
          scaling_status: 'passed',
          live: false,
          scaling_state: 'BASELINE',
          snapshot: null,
          snapshot_received_at: null,
          seconds_since_last_event: null,
          telemetry_delayed: false,
          plan: null,
          summary: { status: 'passed' },
          failure: null,
          timeline: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const api = new LiveAobApi('https://aob-api.example');
    const state = await api.getState('run-8192a3b4c5d6e7f8');

    expect(state.summary).toEqual({ status: 'passed' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://aob-api.example/bff/aob/demo/run-8192a3b4c5d6e7f8/state',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/summary'))).toBe(false);
  });
});
