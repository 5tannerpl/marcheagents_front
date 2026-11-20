import { ApiError, RUN_ID_RE, type AobApi } from './AobApi';
import type {
  ApiErrorBody,
  LiveState,
  MetricsResponse,
  RunList,
  RunStatus,
  RunView,
  ScalingSummary,
  StartDemoBody,
  ValidationList,
} from './types';

const BFF_ORIGIN = (import.meta.env.VITE_AOB_BFF_ORIGIN || 'https://aob-api.marcheagents.com').replace(/\/+$/, '');
const CSRF_HEADER = 'X-CSRF-Token';

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNumberOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value));

const isRunView = (value: unknown): value is RunView => {
  if (!isRecord(value)) return false;
  return (
    typeof value.run_id === 'string' &&
    RUN_ID_RE.test(value.run_id) &&
    typeof value.status === 'string' &&
    isNumberOrNull(value.created_at) &&
    isNumberOrNull(value.updated_at)
  );
};

const isRunList = (value: unknown): value is RunList =>
  isRecord(value) && Array.isArray(value.items) && value.items.every(isRunView);

const isRunStatus = (value: unknown): value is RunStatus =>
  isRecord(value) &&
  isRunView(value) &&
  typeof (value as JsonRecord).result === 'string' &&
  typeof (value as JsonRecord).model === 'string' &&
  typeof (value as JsonRecord).event_count === 'number';

const isSummary = (value: unknown): value is ScalingSummary => {
  if (!isRecord(value) || typeof value.status !== 'string') return false;
  return ['passed', 'degraded', 'failed'].includes(value.status);
};

const isLiveState = (value: unknown): value is LiveState =>
  isRecord(value) &&
  isRunView(value) &&
  typeof (value as JsonRecord).live === 'boolean' &&
  Array.isArray((value as JsonRecord).timeline) &&
  ((value as JsonRecord).summary === null || isSummary((value as JsonRecord).summary));

const isMetrics = (value: unknown): value is MetricsResponse =>
  isRecord(value) && Array.isArray(value.points);

const isValidation = (value: unknown): value is ValidationList =>
  isRecord(value) && Array.isArray(value.items);

function parseErrorBody(body: unknown): ApiErrorBody | string {
  if (typeof body === 'string') return body;
  if (isRecord(body) && ('detail' in body)) return { detail: body.detail as string | unknown[] };
  return 'The AOB service returned an invalid error response.';
}

export class LiveAobApi implements AobApi {
  private csrfToken: string | null = null;
  public readonly origin: string;

  constructor(origin = BFF_ORIGIN) {
    this.origin = origin;
  }

  setCsrfToken(token: string | null) {
    this.csrfToken = token;
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    validate: (value: unknown) => value is T,
    signal?: AbortSignal,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.method === 'POST') {
      if (!this.csrfToken) throw new ApiError('Your session is missing CSRF protection.', 403);
      headers.set(CSRF_HEADER, this.csrfToken);
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(`${this.origin}${path}`, {
        ...init,
        headers,
        credentials: 'include',
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiError('The AOB service is unavailable.');
    }

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    if (!response.ok) {
      throw ApiError.fromBody(response.status, parseErrorBody(body), response.headers.get('Retry-After'));
    }
    if (!validate(body)) throw new ApiError('The AOB service returned an invalid response.', response.status);
    return body;
  }

  listRuns(signal?: AbortSignal) {
    return this.request('/bff/aob/demo/runs', { method: 'GET' }, isRunList, signal);
  }

  startDemo(body: StartDemoBody, signal?: AbortSignal) {
    return this.request('/bff/aob/demo/start', { method: 'POST', body: JSON.stringify(body) }, isRunView, signal);
  }

  getStatus(runId: string, signal?: AbortSignal) {
    return this.request(`/bff/aob/demo/${encodeURIComponent(runId)}/status`, { method: 'GET' }, isRunStatus, signal);
  }

  getState(runId: string, signal?: AbortSignal) {
    return this.request(`/bff/aob/demo/${encodeURIComponent(runId)}/state`, { method: 'GET' }, isLiveState, signal);
  }

  getMetrics(runId: string, signal?: AbortSignal) {
    return this.request(`/bff/aob/demo/${encodeURIComponent(runId)}/metrics`, { method: 'GET' }, isMetrics, signal);
  }

  getValidation(runId: string, signal?: AbortSignal) {
    return this.request(`/bff/aob/demo/${encodeURIComponent(runId)}/validation`, { method: 'GET' }, isValidation, signal);
  }

}
