/**
 * Deterministic SIMULATION of a Kaggle live-demo batch. It produces the raw event stream the
 * notebook would POST to `/api/events`, following the documented demo policy
 * (scaling/policy.py, scaling/settings.py on OCI_Phase1): worker ladder 2 → 4 → 8 with a 4 s
 * cooldown (pending ≥ 10 → 4, ≥ 25 → 8), GPU 1 start after a sustained backlog, scale-in to 2
 * and GPU 1 drain/stop after 15 s idle, a snapshot every 3 s. None of this is real telemetry.
 */
import type { DemoMode } from '../types';
import { MODEL_NAME, type RawPayload } from './serverModel';

export type ScenarioVariant =
  /** Full pass. */
  | 'passed'
  /** Worker 4 → 8 never confirmed (runtime `timeout` → label "updated"); degraded verdict. */
  | 'worker_timeout'
  /** GPU 1 fails to start twice; failed verdict whose raw reasons are all dropped (G9). */
  | 'gpu1_failed'
  /** `scaling_demo_failed` (ROUTER_TIMEOUT during `router`). */
  | 'scaling_failed'
  /** Failure event rejected by ingress (G14): scaling stops reporting, batch ends → incomplete. */
  | 'scaling_incomplete'
  /** Model validation fails; Kaggle reports an error; no scaling phase. */
  | 'validation_failed'
  /** The batch never gets past model loading and the run times out (KAGGLE_RUN_TIMEOUT). */
  | 'kaggle_timeout'
  /** Push fails before Kaggle accepts the batch (surfaces as UNKNOWN_ERROR, G15). */
  | 'submission_failed';

export interface ScheduledEvent {
  /** Seconds after the run was created. */
  at: number;
  event_type: string;
  payload: RawPayload;
}

export interface ScenarioPlan {
  events: ScheduledEvent[];
  queuedAt: number | null;
  runningAt: number | null;
  /** When the run leaves the active set, and how. */
  finishedAt: number;
  finalStatus: 'complete' | 'failed';
  finalKaggleStatus: 'complete' | 'failed' | null;
  /** Free-text error stored on the run (mapped to `error_code` on read). */
  error: string | null;
}

const QUEUED_AT = 5;
const RUNNING_AT = 16;
const SNAPSHOT_EVERY = 3;
const TICK = 2;
const WORKER_COOLDOWN = 4;
const WORKER_SPAWN_SECONDS = 3;
const WORKER_CONFIRM_TIMEOUT = 60;
const IDLE_BEFORE_SCALE_IN = 15;
const GPU1_BACKLOG_SECONDS = 10;
const GPU1_LOAD_SECONDS = 36.4;
const GPU1_FAIL_AFTER = 20;
const GPU1_COOLDOWN = 30;
const UNIT_RATE_PER_WORKER = 0.25;
const UNIT_RATE_PER_GPU = 0.55;
const REQUESTS_PER_UNIT = 3;
const INCOMPLETE_STOP_AT = 70;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

interface GpuSim {
  state: 'STOPPED' | 'STARTING' | 'READY' | 'DRAINING' | 'FAILED';
  port: number;
  memory: number;
  units: number;
  requests: number;
}

function validationEvents(variant: ScenarioVariant): ScheduledEvent[] {
  const ev: ScheduledEvent[] = [
    { at: 18, event_type: 'notebook_started', payload: { status: 'running', gpu_count: 2, gpus: ['Tesla T4', 'Tesla T4'] } },
    { at: 24, event_type: 'environment_ready', payload: { status: 'ready', seconds: 5.8 } },
    { at: 31, event_type: 'model_located', payload: { status: 'found', seconds: 1.2 } },
  ];
  if (variant === 'kaggle_timeout') return ev;
  ev.push(
    { at: 52, event_type: 'model_ready', payload: { api_health: 200, backend: 'llama.cpp', status: 'ready', seconds: 21.4 } },
    { at: 55, event_type: 'model_validation_started', payload: { status: 'running', test_runs: 3, model: MODEL_NAME } },
    {
      at: 78,
      event_type: 'worker_validation_completed',
      payload: { status: 'passed', test_runs: 3, duration_seconds: 22.6, exit_code: 0 },
    },
  );
  const ok = variant !== 'validation_failed';
  ev.push(
    {
      at: 86,
      event_type: 'modelcheck_completed',
      payload: { status: ok ? 'passed' : 'failed', duration_seconds: 7.9, exit_code: ok ? 0 : 1 },
    },
    {
      at: 88,
      event_type: 'model_validation_completed',
      payload: { status: ok ? 'passed' : 'failed', model: MODEL_NAME, backend: 'llama.cpp', api_health: 200 },
    },
  );
  return ev;
}

export function planScenario(
  mode: DemoMode,
  units: number,
  variant: ScenarioVariant = 'passed',
  seed = 7,
): ScenarioPlan {
  if (variant === 'submission_failed') {
    return {
      events: [],
      queuedAt: null,
      runningAt: null,
      finishedAt: 9,
      finalStatus: 'failed',
      finalKaggleStatus: null,
      error: 'Kaggle push failed: 401 Unauthorized',
    };
  }
  const events = validationEvents(variant);
  if (variant === 'kaggle_timeout') {
    return {
      events,
      queuedAt: QUEUED_AT,
      runningAt: RUNNING_AT,
      finishedAt: 10800,
      finalStatus: 'failed',
      finalKaggleStatus: null,
      error: 'Timed out waiting for the Kaggle batch',
    };
  }
  if (variant === 'validation_failed') {
    return {
      events,
      queuedAt: QUEUED_AT,
      runningAt: RUNNING_AT,
      finishedAt: 96,
      finalStatus: 'failed',
      finalKaggleStatus: 'failed',
      error: 'Kaggle reported an error',
    };
  }
  const scaling = simulateScaling(mode, units, variant, 92, mulberry32(seed));
  return {
    events: [...events, ...scaling.events],
    queuedAt: QUEUED_AT,
    runningAt: RUNNING_AT,
    finishedAt: scaling.endAt + 8,
    finalStatus: 'complete',
    finalKaggleStatus: 'complete',
    error: null,
  };
}

function simulateScaling(
  mode: DemoMode,
  units: number,
  variant: ScenarioVariant,
  start: number,
  rand: () => number,
): { events: ScheduledEvent[]; endAt: number } {
  const high = mode === 'high_concurrency';
  const ev: ScheduledEvent[] = [];
  const emit = (at: number, event_type: string, payload: RawPayload) => ev.push({ at: round1(at), event_type, payload });

  emit(start, 'scaling_demo_started', {
    mode,
    planned_units: units,
    min_workers: 2,
    max_workers: high ? 8 : 2,
    initial_gpu_instances: 1,
    target_gpu_instances: high ? 2 : 1,
    arrival_window_seconds: high ? 0 : 60,
    gpu_count: 2,
    gpu1_available: true,
    model: MODEL_NAME,
  });
  emit(start + 0.6, 'gpu_instance_ready', { gpu_id: 0, port: 8080, model: MODEL_NAME, status: 'ready', adopted: true });
  emit(start + 1.2, 'inference_route_changed', { active_backends: ['gpu0'], reason: 'gpu0 ready' });

  if (variant === 'scaling_failed') {
    emit(start + 32, 'scaling_demo_failed', {
      status: 'failed',
      mode,
      error_code: 'ROUTER_TIMEOUT',
      phase: 'router',
      message: 'router health check did not pass within 30 s',
    });
    return { events: ev, endAt: start + 34 };
  }

  const gpu0: GpuSim = { state: 'READY', port: 8080, memory: 5648, units: 0, requests: 0 };
  const gpu1: GpuSim = { state: 'STOPPED', port: 8081, memory: 0, units: 0, requests: 0 };
  let arrived = 0;
  let completed = 0;
  let acc = 0;
  let actual = 2;
  let desired = 2;
  let pendingRequest: { from: number; to: number; at: number; reachAt: number } | null = null;
  let lastRequestAt = -Infinity;
  let backlogSince: number | null = null;
  let gpu1Attempts = 0;
  let gpu1LastAttempt = -Infinity;
  let gpu1ReadyAt: number | null = null;
  let gpu1FailAt: number | null = null;
  let idleSince: number | null = null;
  let gpu1Stopped = false;
  let peakWorkers = 2;
  let peakGpus = 1;
  const confirmedLevels = [2];
  const latencies: number[] = [];
  let scaleOutSeconds: number | null = null;
  let scaleInSeconds: number | null = null;
  let firstRequestAt: number | null = null;
  let stuckWorkers = false;

  const counts = () => {
    const inSystem = arrived - completed;
    const running = Math.min(actual, inSystem);
    return { pending: inSystem - running, running };
  };
  const readyGpus = () => (gpu0.state === 'READY' ? 1 : 0) + (gpu1.state === 'READY' ? 1 : 0);
  const scalingState = () => {
    if (gpu1.state === 'DRAINING' || (desired < actual && actual > 2)) return 'DRAINING';
    if (desired > actual || gpu1.state === 'STARTING') return 'SCALE_OUT';
    if (actual > 2 || gpu1.state === 'READY') return 'SCALED_OUT';
    return 'BASELINE';
  };

  const snapshot = (t: number) => {
    const { pending, running } = counts();
    const both = gpu1.state === 'READY';
    const in0 = both ? Math.ceil(running / 2) : running;
    const in1 = both ? running - in0 : 0;
    const util = (inflight: number, state: string) =>
      state !== 'READY' && state !== 'DRAINING' ? 0 : inflight > 0 ? round1(84 + rand() * 13) : round1(rand() * 3);
    const mem = (g: GpuSim) => (g.memory ? round1(g.memory + rand() * 40) : 0);
    emit(start + t, 'scaling_metrics_snapshot', {
      mode,
      pending,
      running,
      completed,
      failed: 0,
      total: units,
      actual_workers: actual,
      desired_workers: desired,
      gpu_instances_ready: readyGpus(),
      scaling_state: scalingState(),
      gpu0: { state: gpu0.state, port: gpu0.port, memory_used_mb: mem(gpu0), utilization_pct: util(in0, gpu0.state) },
      gpu1: { state: gpu1.state, port: gpu1.port, memory_used_mb: mem(gpu1), utilization_pct: util(in1, gpu1.state) },
      requests_by_gpu: { gpu0: gpu0.requests, gpu1: gpu1.requests },
      inflight_by_gpu: { gpu0: in0, gpu1: in1 },
      units_by_gpu: { gpu0: gpu0.units, gpu1: gpu1.units },
      unattributed_units: 0,
      // Dropped by _safe_snapshot; kept so the mock exercises server-side sanitisation.
      oldest_pending_seconds: pending ? round1(t) : 0,
      estimated_drain_seconds: round1(pending / Math.max(0.1, readyGpus() * UNIT_RATE_PER_GPU)),
    });
  };

  const requestWorkers = (t: number, to: number, reason: string) => {
    const { pending } = counts();
    emit(start + t, 'worker_scaling_requested', { from: actual, to, reason, queue_depth: pending });
    const stuck = variant === 'worker_timeout' && to === 8;
    pendingRequest = { from: actual, to, at: t, reachAt: t + (stuck ? WORKER_CONFIRM_TIMEOUT : WORKER_SPAWN_SECONDS) };
    desired = to;
    lastRequestAt = t;
    if (to > 2 && firstRequestAt === null) firstRequestAt = t;
  };

  let t = 2;
  const limit = high ? 600 : 300;
  for (; t <= limit; t += 1) {
    // Arrivals: burst at t=0 for high concurrency, spread over 60 s for light.
    arrived = high ? units : Math.min(units, Math.floor((t / 60) * units) + 1);

    // Worker spawn/confirm.
    if (pendingRequest) {
      const req: { from: number; to: number; at: number; reachAt: number } = pendingRequest;
      if (variant === 'worker_timeout' && req.to === 8) {
        actual = Math.min(6, req.from + Math.floor((t - req.at) / 2));
      }
      if (t >= req.reachAt) {
        const timedOut = variant === 'worker_timeout' && req.to === 8;
        if (!timedOut) actual = req.to;
        else stuckWorkers = true;
        emit(start + t, 'worker_scaling_completed', {
          from: req.from,
          to: req.to,
          status: timedOut ? 'timeout' : 'confirmed',
          desired_workers: desired,
          actual_workers: actual,
          duration_seconds: round1(t - req.at),
        });
        if (!timedOut) confirmedLevels.push(req.to);
        if (req.to === 8 && !timedOut) scaleOutSeconds = round1(t - (firstRequestAt ?? req.at));
        if (req.to === 2) scaleInSeconds = round1(t - req.at);
        pendingRequest = null;
        if (timedOut) desired = actual;
      }
    }
    peakWorkers = Math.max(peakWorkers, actual);

    // Service.
    const rate = Math.min(actual * UNIT_RATE_PER_WORKER, readyGpus() * UNIT_RATE_PER_GPU);
    const before = completed;
    acc += rate;
    completed = Math.min(arrived, Math.floor(acc));
    acc = Math.min(acc, arrived);
    const done = completed - before;
    for (let i = 0; i < done; i += 1) {
      const onGpu1 = gpu1.state === 'READY' && (completed - i) % 2 === 0;
      const g = onGpu1 ? gpu1 : gpu0;
      g.units += 1;
      g.requests += REQUESTS_PER_UNIT;
      latencies.push(round1(4 + rand() * 3 + (counts().pending > 20 ? 6 : 0)));
    }

    const { pending, running } = counts();

    // GPU 1 lifecycle.
    if (gpu1.state === 'STARTING') {
      gpu1.memory = Math.min(5612, gpu1.memory + 160);
      if (gpu1ReadyAt !== null && t >= gpu1ReadyAt) {
        gpu1.state = 'READY';
        gpu1.memory = 5612;
        peakGpus = 2;
        emit(start + t, 'gpu_instance_ready', {
          gpu_id: 1,
          port: 8081,
          model: MODEL_NAME,
          status: 'ready',
          load_duration_seconds: GPU1_LOAD_SECONDS,
          memory_used_mb: 5612.0,
          memory_delta_mb: 5609.0,
          device_binding: 'CUDA_VISIBLE_DEVICES=1',
          device_binding_verified: true,
          adopted: false,
        });
        emit(start + t + 0.3, 'inference_route_changed', { active_backends: ['gpu0', 'gpu1'], reason: 'gpu1 ready' });
      } else if (gpu1FailAt !== null && t >= gpu1FailAt) {
        gpu1.state = 'FAILED';
        gpu1.memory = 0;
        emit(start + t, 'gpu_instance_failed', {
          gpu_id: 1,
          port: 8081,
          error_code: 'GPU1_START_FAILED',
          message: 'llama-server exited during startup',
          attempt: gpu1Attempts,
          status: 'failed',
        });
        gpu1FailAt = null;
      }
    }

    // Autoscaler tick.
    if (t % TICK === 0) {
      backlogSince = pending >= 10 ? (backlogSince ?? t) : null;
      const canRequest = !pendingRequest && t - lastRequestAt >= WORKER_COOLDOWN && high && !stuckWorkers;
      if (canRequest && actual === 2 && pending >= 10) requestWorkers(t, 4, `pending=${pending}`);
      else if (canRequest && actual === 4 && pending >= 25) requestWorkers(t, 8, `pending=${pending}`);

      const gpu1Startable = gpu1.state === 'STOPPED' || gpu1.state === 'FAILED';
      const drain = pending / Math.max(0.1, readyGpus() * UNIT_RATE_PER_GPU);
      if (
        high &&
        gpu1Startable &&
        gpu1Attempts < 2 &&
        t - gpu1LastAttempt >= GPU1_COOLDOWN &&
        actual >= 4 &&
        backlogSince !== null &&
        t - backlogSince >= GPU1_BACKLOG_SECONDS &&
        drain > 30
      ) {
        gpu1Attempts += 1;
        gpu1LastAttempt = t;
        gpu1.state = 'STARTING';
        gpu1.memory = 0;
        emit(start + t, 'gpu_instance_starting', { gpu_id: 1, port: 8081, reason: 'sustained backlog' });
        if (variant === 'gpu1_failed') gpu1FailAt = t + GPU1_FAIL_AFTER;
        else gpu1ReadyAt = t + Math.ceil(GPU1_LOAD_SECONDS);
      }

      idleSince = pending === 0 && running === 0 && arrived === units ? (idleSince ?? t) : null;
      if (idleSince !== null && t - idleSince >= IDLE_BEFORE_SCALE_IN) {
        if (gpu1.state === 'READY') {
          emit(start + t, 'inference_route_changed', { active_backends: ['gpu0'], reason: 'scale in' });
          gpu1.state = 'DRAINING';
          emit(start + t + 0.4, 'gpu_instance_draining', { gpu_id: 1, inflight_requests: 0 });
        } else if (gpu1.state === 'DRAINING') {
          gpu1.state = 'STOPPED';
          gpu1.memory = 0;
          gpu1Stopped = true;
          emit(start + t, 'gpu_instance_stopped', {
            gpu_id: 1,
            port: 8081,
            exit_code: 0,
            reason: 'idle',
            inflight_requests: 0,
            port_released: true,
            memory_released: true,
            clean: true,
            status: 'stopped',
          });
        }
        if (actual > 2 && !pendingRequest && gpu1.state !== 'DRAINING') requestWorkers(t, 2, 'idle');
      }
    }

    if (t % SNAPSHOT_EVERY === 0) snapshot(t);

    if (variant === 'scaling_incomplete' && t >= INCOMPLETE_STOP_AT) {
      // Everything after this point was rejected by the ingress, so AOB never receives it.
      return { events: ev.filter((e) => e.at <= start + INCOMPLETE_STOP_AT), endAt: start + INCOMPLETE_STOP_AT + 40 };
    }
    const gpu1Busy = gpu1.state === 'READY' || gpu1.state === 'DRAINING' || gpu1.state === 'STARTING';
    if (completed === units && actual === 2 && !pendingRequest && !gpu1Busy) break;
  }

  snapshot(t + 1);
  const sorted = [...latencies].sort((a, b) => a - b);
  const pct = (p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0);
  const reasons: string[] = [];
  let status: 'passed' | 'degraded' | 'failed' = 'passed';
  if (variant === 'worker_timeout') {
    status = 'degraded';
    reasons.push('WORKERS_8_NOT_CONFIRMED');
  }
  if (variant === 'gpu1_failed') {
    status = 'failed';
    // Runtime reasons that `_safe_reasons` drops (G9): the UI receives no reasons at all.
    reasons.push('GPU1_START_FAILED', 'GPU1_INSUFFICIENT_MEMORY');
  }
  const duration = t + 1;
  emit(start + t + 2, 'scaling_demo_completed', {
    status,
    completed,
    total: units,
    failed: 0,
    retries: variant === 'worker_timeout' ? 2 : 0,
    p50_seconds: pct(0.5),
    p95_seconds: pct(0.95),
    throughput_per_min: round1((completed / duration) * 60),
    peak_workers: peakWorkers,
    final_workers: actual,
    confirmed_worker_levels: confirmedLevels,
    peak_gpu_instances: peakGpus,
    final_gpu_instances: readyGpus(),
    gpu0_units_completed: gpu0.units,
    gpu1_units_completed: gpu1.units,
    unattributed_units: 0,
    ...(peakGpus === 2 ? { gpu1_load_seconds: GPU1_LOAD_SECONDS, gpu1_stopped_cleanly: gpu1Stopped } : {}),
    ...(scaleOutSeconds !== null ? { scale_out_seconds: scaleOutSeconds } : {}),
    ...(scaleInSeconds !== null ? { scale_in_seconds: scaleInSeconds } : {}),
    telemetry_failed_events: 0,
    reasons,
    // Dropped by _safe_summary.
    mode,
    duration_seconds: duration,
  });
  return { events: ev, endAt: start + t + 2 };
}
