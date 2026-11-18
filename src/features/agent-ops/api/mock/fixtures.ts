import type { DemoMode } from '../types';
import type { ScenarioVariant } from './simulation';

export interface HistoricalRunFixture {
  /** Fixed ids keep fixtures stable across reloads and tests. */
  run_id: string;
  mode: DemoMode;
  units: number;
  variant: ScenarioVariant;
  /** Creation time relative to the mock's start. */
  hoursAgo: number;
}

/**
 * SIMULATED run history for the signed-in demo user, oldest first. Together they cover every
 * state the panel must render: passed, degraded (worker timeout → "updated" label), failed
 * verdict without reasons (G9), scaling failure, incomplete (G14), validation failure, Kaggle
 * timeout and a submission failure surfacing as UNKNOWN_ERROR (G15).
 */
export const HISTORICAL_RUNS: HistoricalRunFixture[] = [
  { run_id: 'run-0f1e2d3c4b5a6978', mode: 'high_concurrency', units: 50, variant: 'submission_failed', hoursAgo: 30 },
  { run_id: 'run-1a2b3c4d5e6f7081', mode: 'light', units: 10, variant: 'kaggle_timeout', hoursAgo: 28 },
  { run_id: 'run-2b3c4d5e6f708192', mode: 'high_concurrency', units: 100, variant: 'validation_failed', hoursAgo: 22 },
  { run_id: 'run-3c4d5e6f708192a3', mode: 'high_concurrency', units: 100, variant: 'scaling_failed', hoursAgo: 20 },
  { run_id: 'run-4d5e6f708192a3b4', mode: 'high_concurrency', units: 150, variant: 'scaling_incomplete', hoursAgo: 9 },
  { run_id: 'run-5e6f708192a3b4c5', mode: 'high_concurrency', units: 100, variant: 'gpu1_failed', hoursAgo: 7 },
  { run_id: 'run-6f708192a3b4c5d6', mode: 'high_concurrency', units: 100, variant: 'worker_timeout', hoursAgo: 5 },
  { run_id: 'run-708192a3b4c5d6e7', mode: 'light', units: 10, variant: 'passed', hoursAgo: 3 },
  { run_id: 'run-8192a3b4c5d6e7f8', mode: 'high_concurrency', units: 150, variant: 'passed', hoursAgo: 1 },
];
