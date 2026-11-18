import { describe, expect, it } from 'vitest';
import { ApiError, RUN_ID_RE } from '../AobApi';
import { DEMO_MAX_RUNS_PER_DAY, DEMO_MIN_INTERVAL_SECONDS, MockAobApi } from './MockAobApi';
import { metrics, type StoredEvent } from './serverModel';

const T0 = 1_800_000_000;

function clockedApi(opts: ConstructorParameters<typeof MockAobApi>[0] = {}) {
  const clock = { now: T0 };
  const api = new MockAobApi({ now: () => clock.now, ...opts });
  return { api, clock };
}

async function rejection(p: Promise<unknown>): Promise<ApiError> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    return e as ApiError;
  }
  throw new Error('expected the call to fail');
}

const sortedKeys = (o: object) => Object.keys(o).sort();

const RUN_VIEW_KEYS = [
  'created_at', 'error_code', 'finished_at', 'kaggle_status', 'mode', 'run_id', 'status', 'units', 'updated_at',
];
const STATUS_KEYS = [
  ...RUN_VIEW_KEYS, 'event_count', 'last_event_at', 'last_event_type', 'model', 'phase', 'result', 'scaling_status',
].sort();
const STATE_KEYS = [
  ...RUN_VIEW_KEYS, 'live', 'plan', 'scaling_state', 'scaling_status', 'seconds_since_last_event', 'snapshot',
  'snapshot_received_at', 'summary', 'failure', 'telemetry_delayed', 'timeline',
].sort();
const POINT_KEYS = [
  'actual_workers', 'completed', 'desired_workers', 'failed', 'gpu0_memory_mb', 'gpu0_requests',
  'gpu0_utilization_pct', 'gpu1_memory_mb', 'gpu1_requests', 'gpu1_utilization_pct', 'gpu_instances_ready', 'id',
  'pending', 'received_at', 'running', 't',
];

describe('MockAobApi contract (Appendix A shapes)', () => {
  it('lists the owner runs newest first with run_view fields only', async () => {
    const { api } = clockedApi();
    const { items } = await api.listRuns();
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(20);
    for (const run of items) {
      expect(sortedKeys(run)).toEqual(RUN_VIEW_KEYS);
      expect(run.run_id).toMatch(RUN_ID_RE);
    }
    const created = items.map((r) => r.created_at);
    expect(created).toEqual([...created].sort((a, b) => b - a));
  });

  it('returns /status, /state, /metrics and /validation with the documented keys', async () => {
    const { api } = clockedApi();
    const [newest] = (await api.listRuns()).items;
    const status = await api.getStatus(newest.run_id);
    const state = await api.getState(newest.run_id);
    const { points } = await api.getMetrics(newest.run_id);
    const { items } = await api.getValidation(newest.run_id);

    expect(sortedKeys(status)).toEqual(STATUS_KEYS);
    expect(status.model).toBe('Qwen3-4B-Instruct-2507');
    expect(sortedKeys(state)).toEqual(STATE_KEYS);
    expect(state.snapshot).toHaveProperty('gpu0');
    expect(state.snapshot).toHaveProperty('gpu1');
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) expect(sortedKeys(p)).toEqual(POINT_KEYS);
    for (const v of items) {
      expect(sortedKeys(v)).toEqual(['event_type', 'id', 'received_at', 'status']);
      expect([null, 'passed', 'failed']).toContain(v.status);
    }
  });

  it('never exposes fields the server sanitisers drop', async () => {
    const { api } = clockedApi();
    for (const { run_id } of (await api.listRuns()).items) {
      const state = await api.getState(run_id);
      const json = JSON.stringify(state);
      expect(json).not.toMatch(/"port"|estimated_drain_seconds|oldest_pending_seconds|duration_seconds|"message":"llama/);
      for (const entry of state.timeline) expect(Object.keys(entry).sort()).toEqual(['event_type', 'id', 'label', 'received_at']);
    }
  });

  it('maps closed allowlists: launcher errors, failure messages, reasons and worker labels', async () => {
    const { api } = clockedApi();
    const runs = (await api.listRuns()).items;
    const byId = (id: string) => runs.find((r) => r.run_id === id)!;

    expect(byId('run-0f1e2d3c4b5a6978').error_code).toBe('UNKNOWN_ERROR');
    expect(byId('run-1a2b3c4d5e6f7081').error_code).toBe('KAGGLE_RUN_TIMEOUT');
    expect(byId('run-2b3c4d5e6f708192').error_code).toBe('KAGGLE_REPORTED_FAILURE');

    const scalingFailed = await api.getState('run-3c4d5e6f708192a3');
    expect(scalingFailed.failure).toEqual({
      error_code: 'ROUTER_TIMEOUT',
      phase: 'router',
      message: 'The inference router did not stabilize within the allowed time.',
    });

    const gpu1Failed = await api.getState('run-5e6f708192a3b4c5');
    expect(gpu1Failed.scaling_status).toBe('failed');
    expect(gpu1Failed.summary?.status).toBe('failed');
    expect(gpu1Failed.summary).not.toHaveProperty('reasons');
    expect(gpu1Failed.timeline.some((e) => e.label === 'GPU 1 instance failed: SCALING_FAILED')).toBe(true);

    const degraded = await api.getState('run-6f708192a3b4c5d6');
    expect(degraded.scaling_status).toBe('degraded');
    expect(degraded.summary?.reasons).toEqual(['WORKERS_8_NOT_CONFIRMED']);
    expect(degraded.timeline.map((e) => e.label)).toContain('Workers 4 → 8 updated · actual 6');

    const incomplete = await api.getStatus('run-4d5e6f708192a3b4');
    expect(incomplete).toMatchObject({ status: 'complete', result: 'passed', scaling_status: 'incomplete' });
  });

  it('simulates the lifecycle and the 2 → 4 → 8 → 2 worker / 1 → 2 → 1 GPU scaling', async () => {
    const { api, clock } = clockedApi({ withHistory: false });
    const started = await api.startDemo({ mode: 'high_concurrency', units: 100 });
    expect(started).toMatchObject({ status: 'submitting', mode: 'high_concurrency', units: 100, kaggle_status: null });

    clock.now += 6;
    expect((await api.getStatus(started.run_id)).status).toBe('queued');
    clock.now += 14;
    expect(await api.getStatus(started.run_id)).toMatchObject({ status: 'running', phase: 'initializing' });
    clock.now += 600;
    const done = await api.getStatus(started.run_id);
    expect(done).toMatchObject({ status: 'complete', result: 'passed', scaling_status: 'passed' });

    const { points } = await api.getMetrics(started.run_id);
    const workerLevels = points
      .map((p) => p.actual_workers)
      .filter((w, i, all) => i === 0 || w !== all[i - 1]);
    expect(workerLevels).toEqual([2, 4, 8, 2]);
    expect(Math.max(...points.map((p) => p.gpu_instances_ready ?? 0))).toBe(2);
    expect(points.at(-1)?.gpu_instances_ready).toBe(1);
    expect(points[0].t).toBe(0);
    const state = await api.getState(started.run_id);
    expect(state.summary).toMatchObject({ status: 'passed', peak_workers: 8, final_workers: 2, confirmed_worker_levels: [2, 4, 8, 2] });
  });
});

describe('MockAobApi start errors', () => {
  it('defaults light to 10 units and rejects units for light with 422', async () => {
    const { api } = clockedApi({ withHistory: false });
    const err = await rejection(api.startDemo({ mode: 'light', units: 50 }));
    expect(err.status).toBe(422);
    expect(err.message).toBe('units can only be chosen for high_concurrency');
    expect((await api.startDemo({ mode: 'light' })).units).toBe(10);
  });

  it('returns Pydantic-style 422 arrays for invalid units', async () => {
    const { api } = clockedApi({ withHistory: false });
    const err = await rejection(api.startDemo({ mode: 'high_concurrency', units: 75 as never }));
    expect(err.status).toBe(422);
    expect(JSON.parse(err.message)[0]).toMatchObject({ loc: ['body', 'units'] });
  });

  it('returns 409 while any run is active, including another user’s run', async () => {
    const { api } = clockedApi({ withHistory: false });
    await api.startDemo({ mode: 'light' });
    expect((await rejection(api.startDemo({ mode: 'light' }))).status).toBe(409);

    const other = clockedApi({ withHistory: false });
    other.api.addForeignActiveRun();
    const err = await rejection(other.api.startDemo({ mode: 'light' }));
    expect(err).toMatchObject({ status: 409, message: 'A demo is already queued or running' });
    expect((await other.api.listRuns()).items).toEqual([]);
  });

  it('returns 429 with Retry-After during the per-user cooldown', async () => {
    const { api, clock } = clockedApi({ withHistory: false, nextVariant: 'submission_failed' });
    await api.startDemo({ mode: 'light' });
    clock.now += 40;
    const err = await rejection(api.startDemo({ mode: 'light' }));
    expect(err).toMatchObject({ status: 429, message: 'Please wait before starting another demo.' });
    expect(err.retryAfterSeconds).toBeCloseTo(DEMO_MIN_INTERVAL_SECONDS - 40);
  });

  it('returns 429 once the rolling 24 h cap is reached', async () => {
    const { api, clock } = clockedApi({ withHistory: false, nextVariant: 'submission_failed' });
    for (let i = 0; i < DEMO_MAX_RUNS_PER_DAY; i += 1) {
      await api.startDemo({ mode: 'light' });
      clock.now += DEMO_MIN_INTERVAL_SECONDS + 1;
    }
    const err = await rejection(api.startDemo({ mode: 'light' }));
    expect(err).toMatchObject({ status: 429, message: 'Daily demo limit reached.', retryAfterSeconds: 3600 });
  });

  it('returns 404 for unknown, malformed or foreign run ids and fails every call when unavailable', async () => {
    const { api } = clockedApi({ withHistory: false });
    const foreign = api.addForeignActiveRun();
    for (const id of ['run-ffffffffffffffff', 'not-a-run', foreign]) {
      expect(await rejection(api.getStatus(id))).toMatchObject({ status: 404, message: 'run not found' });
    }
    api.setFailureMode('unavailable');
    expect((await rejection(api.listRuns())).status).toBeNull();
  });
});

describe('metrics retention window', () => {
  it('keeps the last 600 snapshots and measures t from the first retained point', () => {
    const events: StoredEvent[] = Array.from({ length: 700 }, (_, i) => ({
      id: i + 1,
      event_type: 'scaling_metrics_snapshot',
      payload: { pending: i, actual_workers: 2 },
      received_at: T0 + i * 3,
    }));
    events.splice(350, 0, { id: 9999, event_type: 'gpu_instance_ready', payload: { gpu_id: 1 }, received_at: T0 + 1050.5 });

    const { points } = metrics(events);
    expect(points).toHaveLength(600);
    expect(points[0]).toMatchObject({ id: 101, t: 0, pending: 100 });
    expect(points.at(-1)).toMatchObject({ id: 700, t: 1797 });
    expect(points.every((p, i) => i === 0 || p.t > points[i - 1].t)).toBe(true);
  });
});
