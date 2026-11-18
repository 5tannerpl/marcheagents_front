/** Copy and state maps ported verbatim from agent-ops-board dashboard/live_demo.py (OCI_Phase1). */
import type { DemoMode, RunPhase, RunStatusValue, ScalingStatus, ValidationResult } from '../api/types';

export const ACTIVE: readonly RunStatusValue[] = ['submitting', 'queued', 'running'];

export const isActiveStatus = (status: string | null | undefined): boolean =>
  ACTIVE.includes(status as RunStatusValue);

export const PHASE_TEXT: Record<RunPhase | 'null', string> = {
  null: 'Initializing — no detailed progress reported yet',
  initializing: 'Initializing notebook',
  loading_model: 'Loading model',
  model_ready: 'Model server ready (/health 200)',
  validating: 'Running real model validation',
  validated: 'Validation finished',
};

export const RESULT_TEXT: Record<ValidationResult, string> = {
  pending: '⏳ Pending',
  passed: '✅ Passed',
  failed: '❌ Failed',
  incomplete: '⚠️ Incomplete — Kaggle finished but no passing validation event was received',
};

export const SCALING_TEXT: Record<Exclude<ScalingStatus, null> | 'null', string> = {
  null: '⏳ Not started',
  running: '🔵 Running',
  passed: '✅ PASSED',
  degraded: '🟠 DEGRADED',
  failed: '❌ FAILED',
  incomplete: '⚠️ Incomplete — the batch ended without a scaling result',
};

export const MODES: Record<DemoMode, string> = {
  light: 'Light — 2 workers / 1 GPU',
  high_concurrency: 'High Concurrency — 2→8→2 workers / 1→2→1 GPU',
};

export const UNIT_OPTIONS = [50, 100, 150] as const;
export const DEFAULT_UNITS = 100;

export const STATUS_CONFIG: Record<RunStatusValue, [icon: string, description: string]> = {
  submitting: ['🟡', 'Submitting demo request'],
  queued: ['🟠', 'Waiting for Kaggle GPU allocation'],
  running: ['🔵', 'Validation in progress'],
  complete: ['🟢', 'Validation completed'],
  failed: ['🔴', 'Validation failed'],
  cancelled: ['⚫', 'Validation cancelled'],
};

/** live_demo._run_panel status line: icon, upper-cased status and the phase/result description. */
export function statusLine(
  status: string | null | undefined,
  phase: RunPhase | null | undefined,
  result: ValidationResult | null | undefined,
): { icon: string; label: string; description: string } {
  const current = status || 'unknown';
  let [icon, description] = STATUS_CONFIG[current as RunStatusValue] ?? ['⚪', 'Status unknown'];
  if (current === 'running') {
    description = PHASE_TEXT[(phase ?? 'null') as RunPhase | 'null'] ?? description;
  }
  if (current === 'complete' && result) {
    description = RESULT_TEXT[result] ?? description;
  }
  return { icon, label: current.toUpperCase(), description };
}

export function scalingVerdict(status: ScalingStatus | string): string {
  return SCALING_TEXT[(status ?? 'null') as keyof typeof SCALING_TEXT] ?? String(status);
}

/** Start errors, as live_demo.render maps ApiError.status. */
export function startErrorMessage(status: number | null, message: string): string {
  if (status === 409) return 'A demo is already queued or running.';
  if (status === 429) return message;
  return `Start failed: ${message}`;
}
