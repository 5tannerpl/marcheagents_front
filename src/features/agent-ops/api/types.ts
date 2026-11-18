/**
 * DTOs returned by the AOB private API (`/api/demo/*`), as documented in
 * docs/phase-b-aob-react-migration.md Appendix A and verified against
 * agent-ops-board `OCI_Phase1` @ 523c0e1 (demo_api.py, demo_service.py,
 * demo_scaling.py, api/response_models.py).
 *
 * Closed enums mirror the server allowlists. GPU and scaling states are only
 * length-checked on the server, so unknown strings must still render.
 */

/** Seconds since the Unix epoch (float), as returned by the server. */
export type Epoch = number;

export type RunStatusValue =
  | 'submitting'
  | 'queued'
  | 'running'
  | 'complete'
  | 'failed'
  | 'cancelled';

export type KaggleStatus = 'queued' | 'running' | 'complete' | 'failed' | 'cancelled';

export type RunErrorCode =
  | 'KAGGLE_SUBMISSION_FAILED'
  | 'KAGGLE_RUN_TIMEOUT'
  | 'KAGGLE_SUBMISSION_TIMEOUT'
  | 'KAGGLE_REPORTED_FAILURE'
  | 'LAUNCHER_ERROR'
  | 'UNKNOWN_ERROR';

export type DemoMode = 'light' | 'high_concurrency';
export type DemoUnits = 50 | 100 | 150;

/** POST /api/demo/start body. `units` is only allowed for high_concurrency (422 otherwise). */
export interface StartDemoBody {
  mode: DemoMode;
  units?: DemoUnits;
}

/** demo_api.run_view — /start (202) and /runs.items[]. */
export interface RunView {
  /** ^run-[0-9a-f]{16}$ */
  run_id: string;
  status: RunStatusValue;
  kaggle_status: KaggleStatus | null;
  error_code: RunErrorCode | null;
  mode: DemoMode | null;
  units: number | null;
  created_at: Epoch;
  updated_at: Epoch;
  finished_at: Epoch | null;
}

/** GET /api/demo/runs — the owner's newest 20 runs, newest first. */
export interface RunList {
  items: RunView[];
}

export type RunPhase =
  | 'initializing'
  | 'loading_model'
  | 'model_ready'
  | 'validating'
  | 'validated';

export type ValidationResult = 'pending' | 'passed' | 'failed' | 'incomplete';

export type ScalingStatus = 'running' | 'passed' | 'degraded' | 'failed' | 'incomplete' | null;

/** GET /api/demo/{run_id}/status */
export interface RunStatus extends RunView {
  phase: RunPhase | null;
  last_event_type: string | null;
  last_event_at: Epoch | null;
  result: ValidationResult;
  /** Constant "Qwen3-4B-Instruct-2507". */
  model: string;
  event_count: number;
  scaling_status: ScalingStatus;
}

export type GpuState = 'STOPPED' | 'STARTING' | 'READY' | 'DRAINING' | 'FAILED';
export type ScalingStateValue = 'BASELINE' | 'SCALE_OUT' | 'SCALED_OUT' | 'DRAINING';

/** `_safe_gpu`: the port is dropped server-side. */
export interface GpuView {
  state?: GpuState | (string & {});
  memory_used_mb?: number;
  utilization_pct?: number;
}

export type GpuKey = 'gpu0' | 'gpu1';
export type PerGpu = Partial<Record<GpuKey, number>>;

/** `_safe_snapshot`: keys are omitted when absent, except gpu0/gpu1 which are always present. */
export interface Snapshot {
  pending?: number;
  running?: number;
  completed?: number;
  failed?: number;
  total?: number;
  actual_workers?: number;
  desired_workers?: number;
  gpu_instances_ready?: number;
  unattributed_units?: number;
  scaling_state?: ScalingStateValue | (string & {});
  requests_by_gpu?: PerGpu;
  inflight_by_gpu?: PerGpu;
  units_by_gpu?: PerGpu;
  gpu0: GpuView | null;
  gpu1: GpuView | null;
}

export type FailureCode =
  | 'GPU_UNAVAILABLE'
  | 'ROUTER_TIMEOUT'
  | 'SCALING_TIMEOUT'
  | 'LOAD_TEST_TIMEOUT'
  | 'ENVIRONMENT_ERROR'
  | 'SCENARIO_ERROR'
  | 'WORKER_SCALING_FAILED'
  | 'SCALING_FAILED';

export type FailurePhase =
  | 'environment'
  | 'setup'
  | 'gpu0'
  | 'router'
  | 'workers'
  | 'scenario'
  | 'load'
  | 'scale_in'
  | 'summary';

export interface ScalingFailure {
  error_code: FailureCode;
  phase: FailurePhase;
  /** Fixed server-side message per error code; never raw exception text. */
  message: string;
}

export type TimelineEventType =
  | 'scaling_demo_started'
  | 'worker_scaling_requested'
  | 'worker_scaling_completed'
  | 'gpu_instance_starting'
  | 'gpu_instance_ready'
  | 'gpu_instance_failed'
  | 'inference_route_changed'
  | 'gpu_instance_draining'
  | 'gpu_instance_stopped'
  | 'scaling_controller_error'
  | 'scaling_demo_completed'
  | 'scaling_demo_failed';

export interface TimelineEntry {
  id: number;
  received_at: Epoch;
  event_type: TimelineEventType;
  /** Already sanitised server-side. */
  label: string;
}

export type ReasonCode =
  | 'TASKS_NOT_TERMINAL'
  | 'TASKS_FAILED'
  | 'WORKERS_NOT_AT_BASELINE'
  | 'TELEMETRY_DELIVERY_FAILED'
  | 'GPU_UNAVAILABLE'
  | 'GPU1_NEVER_READY'
  | 'GPU0_NO_INFERENCE_REQUESTS'
  | 'GPU1_NO_INFERENCE_REQUESTS'
  | 'GPU1_NOT_STOPPED_CLEANLY'
  | 'FINAL_GPU_INSTANCES_NOT_1'
  | 'UNEXPECTED_WORKER_SCALING'
  | 'UNEXPECTED_GPU1'
  | `WORKERS_${number}_NOT_CONFIRMED`;

/** `_safe_summary`; `reasons` is omitted when empty. */
export interface ScalingSummary {
  status: 'passed' | 'degraded' | 'failed';
  completed?: number;
  total?: number;
  failed?: number;
  retries?: number;
  p50_seconds?: number;
  p95_seconds?: number;
  throughput_per_min?: number;
  peak_workers?: number;
  final_workers?: number;
  confirmed_worker_levels?: number[];
  peak_gpu_instances?: number;
  final_gpu_instances?: number;
  gpu0_units_completed?: number;
  gpu1_units_completed?: number;
  unattributed_units?: number;
  gpu1_load_seconds?: number;
  gpu1_stopped_cleanly?: boolean;
  scale_out_seconds?: number;
  scale_in_seconds?: number;
  telemetry_failed_events?: number;
  reasons?: ReasonCode[];
}

export interface ScalingPlan {
  mode?: DemoMode;
  planned_units?: number;
}

/** GET /api/demo/{run_id}/state */
export interface LiveState extends RunView {
  scaling_status: ScalingStatus;
  live: boolean;
  scaling_state: string | null;
  snapshot: Snapshot | null;
  snapshot_received_at: Epoch | null;
  seconds_since_last_event: number | null;
  telemetry_delayed: boolean;
  plan: ScalingPlan | null;
  summary: ScalingSummary | null;
  failure: ScalingFailure | null;
  timeline: TimelineEntry[];
}

/** GET /api/demo/{run_id}/metrics — points[] (last 600 snapshots). */
export interface MetricsPoint {
  id: number;
  /** Seconds since the first *retained* snapshot, by server receive time (1 decimal). */
  t: number;
  received_at: Epoch;
  pending: number | null;
  running: number | null;
  completed: number | null;
  failed: number | null;
  actual_workers: number | null;
  desired_workers: number | null;
  gpu_instances_ready: number | null;
  gpu0_requests: number | null;
  gpu1_requests: number | null;
  gpu0_utilization_pct: number | null;
  gpu1_utilization_pct: number | null;
  gpu0_memory_mb: number | null;
  gpu1_memory_mb: number | null;
}

export interface MetricsResponse {
  points: MetricsPoint[];
}

export type ValidationEventType =
  | 'notebook_started'
  | 'environment_ready'
  | 'model_located'
  | 'model_ready'
  | 'model_validation_started'
  | 'worker_validation_completed'
  | 'modelcheck_completed'
  | 'model_validation_completed';

export interface ValidationEvent {
  id: number;
  received_at: Epoch;
  event_type: ValidationEventType;
  status: 'passed' | 'failed' | null;
}

/** GET /api/demo/{run_id}/validation */
export interface ValidationList {
  items: ValidationEvent[];
}

/** FastAPI error body. Pydantic 422 errors carry an array in `detail`. */
export interface ApiErrorBody {
  detail: string | unknown[];
}
