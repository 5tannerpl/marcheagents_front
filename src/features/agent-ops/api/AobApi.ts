import type {
  ApiErrorBody,
  LiveState,
  MetricsResponse,
  RunList,
  RunStatus,
  RunView,
  StartDemoBody,
  ValidationList,
} from './types';

/**
 * The seven `/api/*` reads/writes the Live Demo panel uses, one method per
 * endpoint. A production implementation will call the AOB BFF
 * (`/bff/aob/demo/*`), never the private API directly.
 */
export interface AobApi {
  /** GET /api/demo/runs */
  listRuns(signal?: AbortSignal): Promise<RunList>;
  /** POST /api/demo/start → 202 RunView */
  startDemo(body: StartDemoBody, signal?: AbortSignal): Promise<RunView>;
  /** GET /api/demo/{run_id}/status */
  getStatus(runId: string, signal?: AbortSignal): Promise<RunStatus>;
  /** GET /api/demo/{run_id}/state */
  getState(runId: string, signal?: AbortSignal): Promise<LiveState>;
  /** GET /api/demo/{run_id}/metrics */
  getMetrics(runId: string, signal?: AbortSignal): Promise<MetricsResponse>;
  /** GET /api/demo/{run_id}/validation */
  getValidation(runId: string, signal?: AbortSignal): Promise<ValidationList>;
}

const MAX_MESSAGE_LENGTH = 300;

/**
 * Mirrors dashboard/api_client.ApiError: the message is the FastAPI `detail`
 * (stringified when Pydantic returns an array), truncated to 300 characters.
 * `status` is null when the API could not be reached at all.
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly retryAfterSeconds: number | null;

  constructor(message: string, status: number | null = null, retryAfterSeconds: number | null = null) {
    super(message.slice(0, MAX_MESSAGE_LENGTH));
    this.name = 'ApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  static fromBody(status: number, body: ApiErrorBody | string, retryAfter?: string | null): ApiError {
    const detail = typeof body === 'string' ? body : body.detail;
    const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    const parsed = retryAfter == null ? NaN : Number(retryAfter);
    return new ApiError(message, status, Number.isFinite(parsed) ? parsed : null);
  }
}

export const RUN_ID_RE = /^run-[0-9a-f]{16}$/;
