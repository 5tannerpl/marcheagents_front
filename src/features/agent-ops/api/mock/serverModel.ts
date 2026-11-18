/**
 * Simulation-only port of the AOB read models (agent-ops-board `OCI_Phase1` @ 523c0e1):
 * demo_api.run_view, demo_service.summarize_run, demo_scaling.{status_of,label,state,metrics,_safe_*},
 * api/response_models.error_code. The mock server stores raw Kaggle-style payloads and derives
 * every response through these functions, so fixtures carry the same sanitisation as production.
 */
import type {
  DemoMode,
  FailureCode,
  FailurePhase,
  GpuView,
  KaggleStatus,
  LiveState,
  MetricsPoint,
  MetricsResponse,
  PerGpu,
  ReasonCode,
  RunErrorCode,
  RunPhase,
  RunStatus,
  RunStatusValue,
  RunView,
  ScalingPlan,
  ScalingStatus,
  ScalingSummary,
  Snapshot,
  TimelineEventType,
  ValidationEvent,
  ValidationEventType,
  ValidationList,
  ValidationResult,
} from '../types';

export type RawPayload = Record<string, unknown>;

export interface StoredEvent {
  id: number;
  event_type: string;
  payload: RawPayload;
  received_at: number;
}

export interface StoredRun {
  run_id: string;
  owner_sub: string;
  status: RunStatusValue;
  kaggle_status: KaggleStatus | null;
  /** Free-text launcher/sync error, mapped to `error_code` on read. */
  error: string | null;
  mode: DemoMode | null;
  units: number | null;
  created_at: number;
  updated_at: number;
  finished_at: number | null;
}

export const ACTIVE_STATUSES: readonly RunStatusValue[] = ['submitting', 'queued', 'running'];
export const MODEL_NAME = 'Qwen3-4B-Instruct-2507';
export const EVENT_MAX_PER_RUN = 1000;
export const MAX_METRIC_POINTS = 600;
export const TELEMETRY_DELAY_SECONDS = 30;

const SNAPSHOT = 'scaling_metrics_snapshot';
const STARTED = 'scaling_demo_started';
const COMPLETED = 'scaling_demo_completed';
const FAILED = 'scaling_demo_failed';

export const TIMELINE_TYPES: readonly TimelineEventType[] = [
  STARTED,
  'worker_scaling_requested',
  'worker_scaling_completed',
  'gpu_instance_starting',
  'gpu_instance_ready',
  'gpu_instance_failed',
  'inference_route_changed',
  'gpu_instance_draining',
  'gpu_instance_stopped',
  'scaling_controller_error',
  COMPLETED,
  FAILED,
];

export const VALIDATION_TYPES: readonly ValidationEventType[] = [
  'notebook_started',
  'environment_ready',
  'model_located',
  'model_ready',
  'model_validation_started',
  'worker_validation_completed',
  'modelcheck_completed',
  'model_validation_completed',
];

const PHASES: Record<ValidationEventType, RunPhase> = {
  notebook_started: 'initializing',
  environment_ready: 'initializing',
  model_located: 'loading_model',
  model_ready: 'model_ready',
  model_validation_started: 'validating',
  worker_validation_completed: 'validating',
  modelcheck_completed: 'validating',
  model_validation_completed: 'validated',
};

// ---- api/response_models.error_code ---------------------------------------------------------

const ERROR_NEEDLES: [string, RunErrorCode][] = [
  ['kaggle kernels push failed', 'KAGGLE_SUBMISSION_FAILED'],
  ['timed out waiting for the kaggle batch', 'KAGGLE_RUN_TIMEOUT'],
  ['submission did not complete', 'KAGGLE_SUBMISSION_TIMEOUT'],
  ['kaggle reported an error', 'KAGGLE_REPORTED_FAILURE'],
  ['unexpected launcher error', 'LAUNCHER_ERROR'],
];
const ALLOWED_ERROR_CODES = new Set<string>([...ERROR_NEEDLES.map(([, c]) => c), 'UNKNOWN_ERROR']);

export function errorCode(error: string | null): RunErrorCode | null {
  if (!error) return null;
  if (ALLOWED_ERROR_CODES.has(error)) return error as RunErrorCode;
  const lowered = error.toLowerCase();
  for (const [needle, code] of ERROR_NEEDLES) if (lowered.includes(needle)) return code;
  return 'UNKNOWN_ERROR';
}

export function runView(run: StoredRun): RunView {
  return {
    run_id: run.run_id,
    status: run.status,
    kaggle_status: run.kaggle_status,
    error_code: errorCode(run.error),
    mode: run.mode,
    units: run.units,
    created_at: run.created_at,
    updated_at: run.updated_at,
    finished_at: run.finished_at,
  };
}

// ---- demo_scaling sanitisers ----------------------------------------------------------------

const GPU_KEYS = ['gpu0', 'gpu1'] as const;
const ALLOWED_MODES = new Set(['light', 'high_concurrency']);
const ALLOWED_FAILURE_CODES = new Set<string>([
  'GPU_UNAVAILABLE', 'ROUTER_TIMEOUT', 'SCALING_TIMEOUT', 'LOAD_TEST_TIMEOUT', 'ENVIRONMENT_ERROR',
  'SCENARIO_ERROR', 'WORKER_SCALING_FAILED', 'SCALING_FAILED',
]);
const ALLOWED_FAILURE_PHASES = new Set<string>([
  'environment', 'setup', 'gpu0', 'router', 'workers', 'scenario', 'load', 'scale_in', 'summary',
]);
const ALLOWED_REASON_CODES = new Set<string>([
  'TASKS_NOT_TERMINAL', 'TASKS_FAILED', 'WORKERS_NOT_AT_BASELINE', 'TELEMETRY_DELIVERY_FAILED', 'GPU_UNAVAILABLE',
  'GPU1_NEVER_READY', 'GPU0_NO_INFERENCE_REQUESTS', 'GPU1_NO_INFERENCE_REQUESTS', 'GPU1_NOT_STOPPED_CLEANLY',
  'FINAL_GPU_INSTANCES_NOT_1', 'UNEXPECTED_WORKER_SCALING', 'UNEXPECTED_GPU1',
]);
const ALLOWED_SUMMARY_STATUSES = new Set(['passed', 'degraded', 'failed']);
const ALLOWED_WORKER_EVENT_STATUSES = new Set(['applied', 'confirmed', 'skipped', 'failed']);
export const SAFE_FAILURE_MESSAGES: Record<FailureCode, string> = {
  GPU_UNAVAILABLE: 'GPU capacity was unavailable during the scaling run.',
  ROUTER_TIMEOUT: 'The inference router did not stabilize within the allowed time.',
  SCALING_TIMEOUT: 'Worker/GPU scaling did not complete in time.',
  LOAD_TEST_TIMEOUT: 'Synthetic workload did not finish in time.',
  ENVIRONMENT_ERROR: 'The runtime environment could not be prepared.',
  SCENARIO_ERROR: 'The scaling scenario failed to complete.',
  WORKER_SCALING_FAILED: 'Worker scaling failed.',
  SCALING_FAILED: 'Scaling execution failed.',
};

const asDict = (value: unknown): RawPayload =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as RawPayload) : {};

function nonNegInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  return value >= 0 ? value : null;
}

function nonNegNumber(value: unknown, upper?: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  if (upper !== undefined && value > upper) return null;
  return value;
}

function safeGpuLabelId(value: unknown): 0 | 1 | null {
  if (value === 0 || value === '0' || value === 'gpu0') return 0;
  if (value === 1 || value === '1' || value === 'gpu1') return 1;
  return null;
}

function safeGpuMap(value: unknown): PerGpu {
  const data = asDict(value);
  const out: PerGpu = {};
  for (const key of GPU_KEYS) {
    const num = nonNegInt(data[key]);
    if (num !== null) out[key] = num;
  }
  return out;
}

const safeMode = (value: unknown): DemoMode | null =>
  typeof value === 'string' && ALLOWED_MODES.has(value) ? (value as DemoMode) : null;
const safeFailureCode = (value: unknown): FailureCode =>
  typeof value === 'string' && ALLOWED_FAILURE_CODES.has(value) ? (value as FailureCode) : 'SCALING_FAILED';
const safeFailurePhase = (value: unknown): FailurePhase =>
  typeof value === 'string' && ALLOWED_FAILURE_PHASES.has(value) ? (value as FailurePhase) : 'summary';
const safeSummaryStatus = (value: unknown): ScalingSummary['status'] =>
  typeof value === 'string' && ALLOWED_SUMMARY_STATUSES.has(value)
    ? (value as ScalingSummary['status'])
    : 'failed';
const safeWorkerEventStatus = (value: unknown): string =>
  typeof value === 'string' && ALLOWED_WORKER_EVENT_STATUSES.has(value) ? value : 'updated';

function safeBackends(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if ((item === 'gpu0' || item === 'gpu1') && !out.includes(item)) out.push(item);
  }
  return out;
}

function safeReasons(value: unknown): ReasonCode[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (r): r is ReasonCode =>
      typeof r === 'string' &&
      (ALLOWED_REASON_CODES.has(r) || (r.startsWith('WORKERS_') && r.endsWith('_NOT_CONFIRMED'))),
  );
}

function safeGpu(value: unknown): GpuView | null {
  const gpu = asDict(value);
  const out: GpuView = {};
  if (typeof gpu.state === 'string') out.state = gpu.state.slice(0, 32);
  const mem = nonNegNumber(gpu.memory_used_mb);
  if (mem !== null) out.memory_used_mb = mem;
  const util = nonNegNumber(gpu.utilization_pct, 100);
  if (util !== null) out.utilization_pct = util;
  return Object.keys(out).length ? out : null;
}

const SNAPSHOT_INT_KEYS = [
  'pending', 'running', 'completed', 'failed', 'total', 'actual_workers', 'desired_workers',
  'gpu_instances_ready', 'unattributed_units',
] as const;

export function safeSnapshot(value: unknown): Snapshot | null {
  const snap = asDict(value);
  if (!Object.keys(snap).length) return null;
  const clean: Snapshot = { gpu0: null, gpu1: null };
  for (const key of SNAPSHOT_INT_KEYS) {
    const v = nonNegInt(snap[key]);
    if (v !== null) clean[key] = v;
  }
  if (typeof snap.scaling_state === 'string') clean.scaling_state = snap.scaling_state.slice(0, 32);
  for (const key of ['requests_by_gpu', 'inflight_by_gpu', 'units_by_gpu'] as const) {
    const m = safeGpuMap(snap[key]);
    if (Object.keys(m).length) clean[key] = m;
  }
  clean.gpu0 = safeGpu(snap.gpu0);
  clean.gpu1 = safeGpu(snap.gpu1);
  return clean;
}

function safePlan(value: unknown): ScalingPlan | null {
  const d = asDict(value);
  const out: ScalingPlan = {};
  const mode = safeMode(d.mode);
  const units = nonNegInt(d.planned_units);
  if (mode) out.mode = mode;
  if (units !== null) out.planned_units = units;
  return Object.keys(out).length ? out : null;
}

const SUMMARY_INT_KEYS = [
  'completed', 'total', 'failed', 'retries', 'peak_workers', 'final_workers', 'peak_gpu_instances',
  'final_gpu_instances', 'gpu0_units_completed', 'gpu1_units_completed', 'unattributed_units',
  'telemetry_failed_events',
] as const;
const SUMMARY_NUM_KEYS = [
  'p50_seconds', 'p95_seconds', 'throughput_per_min', 'gpu1_load_seconds', 'scale_out_seconds',
  'scale_in_seconds',
] as const;

export function safeSummary(value: unknown): ScalingSummary | null {
  const d = asDict(value);
  if (!Object.keys(d).length) return null;
  const clean: ScalingSummary = { status: safeSummaryStatus(d.status) };
  for (const key of SUMMARY_INT_KEYS) {
    const v = nonNegInt(d[key]);
    if (v !== null) clean[key] = v;
  }
  for (const key of SUMMARY_NUM_KEYS) {
    const v = nonNegNumber(d[key]);
    if (v !== null) clean[key] = v;
  }
  if (typeof d.gpu1_stopped_cleanly === 'boolean') clean.gpu1_stopped_cleanly = d.gpu1_stopped_cleanly;
  if (Array.isArray(d.confirmed_worker_levels)) {
    clean.confirmed_worker_levels = d.confirmed_worker_levels
      .map(nonNegInt)
      .filter((v): v is number => v !== null);
  }
  const reasons = safeReasons(d.reasons);
  if (reasons.length) clean.reasons = reasons;
  return clean;
}

export function safeFailure(value: unknown): LiveState['failure'] {
  const d = asDict(value);
  if (!Object.keys(d).length) return null;
  const code = safeFailureCode(d.error_code);
  return { error_code: code, phase: safeFailurePhase(d.phase), message: SAFE_FAILURE_MESSAGES[code] };
}

/** demo_scaling.label — Python `x or '?'` treats 0 as falsy, which is kept for parity. */
export function label(eventType: string, payload: RawPayload): string {
  const d = asDict(payload);
  const gpuId = safeGpuLabelId(d.gpu_id);
  const gpu = gpuId !== null ? `GPU ${gpuId}` : 'GPU';
  const orQ = (v: number | null) => (v ? String(v) : '?');
  const ready = nonNegNumber(d.load_duration_seconds);
  const inflight = nonNegInt(d.inflight_requests);
  const exit = nonNegInt(d.exit_code);
  switch (eventType) {
    case STARTED:
      return `Scaling demo started · ${safeMode(d.mode) ?? 'unknown'} · ${orQ(nonNegInt(d.planned_units))} units`;
    case 'worker_scaling_requested':
      return `Workers ${orQ(nonNegInt(d.from))} → ${orQ(nonNegInt(d.to))} requested`;
    case 'worker_scaling_completed':
      return (
        `Workers ${orQ(nonNegInt(d.from))} → ${orQ(nonNegInt(d.to))} ` +
        `${safeWorkerEventStatus(d.status)} · actual ${orQ(nonNegInt(d.actual_workers))}`
      );
    case 'gpu_instance_starting':
      return `${gpu} instance starting`;
    case 'gpu_instance_ready':
      return `${gpu} instance ready` + (ready !== null ? ` in ${pyFloat(ready)}s` : '');
    case 'gpu_instance_failed':
      return `${gpu} instance failed: ${safeFailureCode(d.error_code ?? d.error)}`;
    case 'inference_route_changed':
      return `Router backends: ${safeBackends(d.active_backends).join(', ') || 'none'}`;
    case 'gpu_instance_draining':
      return `${gpu} draining · ${inflight ?? '?'} in flight`;
    case 'gpu_instance_stopped':
      return `${gpu} instance stopped · exit ${exit ?? '?'}`;
    case 'scaling_controller_error':
      return `Controller error: ${safeFailureCode(d.error_code ?? d.error)}`;
    case COMPLETED:
      return `Scaling demo finished: ${safeSummaryStatus(d.status).toUpperCase()}`;
    case FAILED:
      return `Scaling demo failed: ${safeFailureCode(d.error_code)} (${safeFailurePhase(d.phase)})`;
    default:
      return eventType;
  }
}

/** Python renders floats with at least one decimal (36.0), integers without. */
function pyFloat(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

// ---- read models ----------------------------------------------------------------------------

const lastOf = (events: StoredEvent[], type: string) =>
  [...events].reverse().find((e) => e.event_type === type);

const isActive = (run: StoredRun) => ACTIVE_STATUSES.includes(run.status);

const ofTypes = (events: StoredEvent[], types: readonly string[]) =>
  events.slice(0, EVENT_MAX_PER_RUN).filter((e) => types.includes(e.event_type));

export function statusOf(run: StoredRun, events: StoredEvent[]): ScalingStatus {
  const scaling = ofTypes(events, TIMELINE_TYPES);
  const done = lastOf(scaling, COMPLETED);
  if (done) {
    const s = done.payload.status;
    return s === 'passed' || s === 'degraded' || s === 'failed' ? s : 'failed';
  }
  if (lastOf(scaling, FAILED)) return 'failed';
  if (lastOf(scaling, STARTED)) {
    if (isActive(run)) return 'running';
    return run.status === 'failed' || run.status === 'cancelled' ? 'failed' : 'incomplete';
  }
  return run.mode && run.status === 'complete' ? 'incomplete' : null;
}

export function runStatus(run: StoredRun, events: StoredEvent[]): RunStatus {
  const all = events.slice(0, EVENT_MAX_PER_RUN);
  const seen = new Map<string, RawPayload>();
  for (const e of all) seen.set(e.event_type, e.payload);
  const known = VALIDATION_TYPES.filter((t) => seen.has(t));
  const phase = known.length ? PHASES[known[known.length - 1]] : null;
  const failed = (['worker_validation_completed', 'modelcheck_completed', 'model_validation_completed'] as const).some(
    (t) => seen.get(t)?.status === 'failed',
  );
  let result: ValidationResult;
  if (failed) result = 'failed';
  else if (seen.get('model_validation_completed')?.status === 'passed') result = 'passed';
  else if (run.status === 'failed' || run.status === 'cancelled') result = 'failed';
  else if (run.status === 'complete') result = 'incomplete';
  else result = 'pending';
  const last = all[all.length - 1];
  return {
    ...runView(run),
    phase,
    last_event_type: last?.event_type ?? null,
    last_event_at: last?.received_at ?? null,
    result,
    model: MODEL_NAME,
    event_count: all.length,
    mode: run.mode,
    units: run.units,
    scaling_status: statusOf(run, events),
  };
}

export function liveState(run: StoredRun, events: StoredEvent[], now: number): LiveState {
  const scaling = ofTypes(events, TIMELINE_TYPES);
  const latest = lastOf(events, SNAPSHOT);
  const lastAny = events.length ? Math.max(...events.map((e) => e.received_at)) : null;
  const status = statusOf(run, events);
  const age = lastAny !== null ? Math.round((now - lastAny) * 10) / 10 : null;
  const active = isActive(run);
  const started = lastOf(scaling, STARTED);
  const completed = lastOf(scaling, COMPLETED);
  const failure = lastOf(scaling, FAILED);
  const snapshot = latest ? safeSnapshot(latest.payload) : null;
  const plan = started ? safePlan(started.payload) : null;
  return {
    ...runView(run),
    mode: plan?.mode ?? run.mode,
    units: plan?.planned_units || run.units,
    scaling_status: status,
    live: active && status === 'running',
    scaling_state: snapshot?.scaling_state ?? null,
    snapshot,
    snapshot_received_at: latest?.received_at ?? null,
    seconds_since_last_event: age,
    telemetry_delayed: Boolean(active && status === 'running' && age !== null && age > TELEMETRY_DELAY_SECONDS),
    plan,
    summary: completed ? safeSummary(completed.payload) : null,
    failure: failure ? safeFailure(failure.payload) : null,
    timeline: scaling.map((e) => ({
      id: e.id,
      received_at: e.received_at,
      event_type: e.event_type as TimelineEventType,
      label: label(e.event_type, e.payload),
    })),
  };
}

/** demo_scaling.metrics: last 600 snapshots in receive order; `t` from the first retained point. */
export function metrics(events: StoredEvent[]): MetricsResponse {
  const rows = ofTypes(events, [SNAPSHOT]).slice(-MAX_METRIC_POINTS);
  const t0 = rows[0]?.received_at ?? 0;
  const points: MetricsPoint[] = rows.map((e) => {
    const d = safeSnapshot(e.payload) ?? { gpu0: null, gpu1: null };
    const byGpu = d.requests_by_gpu ?? {};
    return {
      id: e.id,
      t: Math.round((e.received_at - t0) * 10) / 10,
      received_at: e.received_at,
      pending: d.pending ?? null,
      running: d.running ?? null,
      completed: d.completed ?? null,
      failed: d.failed ?? null,
      actual_workers: d.actual_workers ?? null,
      desired_workers: d.desired_workers ?? null,
      gpu_instances_ready: d.gpu_instances_ready ?? null,
      gpu0_requests: byGpu.gpu0 ?? null,
      gpu1_requests: byGpu.gpu1 ?? null,
      gpu0_utilization_pct: d.gpu0?.utilization_pct ?? null,
      gpu1_utilization_pct: d.gpu1?.utilization_pct ?? null,
      gpu0_memory_mb: d.gpu0?.memory_used_mb ?? null,
      gpu1_memory_mb: d.gpu1?.memory_used_mb ?? null,
    };
  });
  return { points };
}

export function validation(events: StoredEvent[]): ValidationList {
  const items: ValidationEvent[] = ofTypes(events, VALIDATION_TYPES).map((e) => {
    const s = e.payload.status;
    return {
      id: e.id,
      received_at: e.received_at,
      event_type: e.event_type as ValidationEventType,
      status: s === 'passed' || s === 'failed' ? s : null,
    };
  });
  return { items };
}
