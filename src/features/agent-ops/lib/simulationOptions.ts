import type { MockFailureMode } from '../api/mock/MockAobApi';
import type { ScenarioVariant } from '../api/mock/simulation';

export const OUTCOME_LABELS: Record<ScenarioVariant, string> = {
  passed: 'Passed',
  worker_timeout: 'Degraded (worker 4 → 8 timeout)',
  gpu1_failed: 'Failed verdict, no reasons (GPU 1 start failures)',
  scaling_failed: 'Scaling failed (ROUTER_TIMEOUT)',
  scaling_incomplete: 'Incomplete (failure event rejected by ingress)',
  validation_failed: 'Model validation failed',
  kaggle_timeout: 'Kaggle batch timeout',
  submission_failed: 'Kaggle push failed (UNKNOWN_ERROR)',
};

export const API_BEHAVIOUR_LABELS: Record<MockFailureMode, string> = {
  none: 'Normal',
  other_user_active: "Another user's run is active (409)",
  cooldown: 'Cooldown active (429)',
  daily_limit: 'Daily limit reached (429)',
  unavailable: 'API unavailable',
};

export const SPEEDS = [1, 5, 20] as const;
