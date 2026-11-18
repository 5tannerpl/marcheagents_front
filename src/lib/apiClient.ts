/**
 * Minimal API client stub for Phase 0/1.
 *
 * The public demo is fully static and never calls a backend. This client only
 * exposes the health check used to verify a BFF once one is deployed; all
 * other endpoints arrive in later phases. No secrets or tokens live here.
 */
export interface HealthStatus {
  status: 'ok' | 'unreachable';
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthStatus> {
  try {
    const res = await fetch('/api/healthz', { signal });
    return res.ok ? { status: 'ok' } : { status: 'unreachable' };
  } catch {
    return { status: 'unreachable' };
  }
}
