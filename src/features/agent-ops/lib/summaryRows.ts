import type { ScalingSummary } from '../api/types';
import { na } from './format';

/** The 13 Measure/Value rows of live_demo._summary, same labels and formats. */
export function summaryRows(s: ScalingSummary): [string, string][] {
  return [
    ['Tasks completed / total', `${na(s.completed)} / ${na(s.total)}`],
    ['Failed tasks · retries', `${na(s.failed)} · ${na(s.retries)}`],
    ['P50 / P95 latency', `${na(s.p50_seconds, 'fixed1', ' s')} / ${na(s.p95_seconds, 'fixed1', ' s')}`],
    ['Throughput', na(s.throughput_per_min, 'fixed1', ' tasks/min')],
    ['Peak workers → final workers', `${na(s.peak_workers)} → ${na(s.final_workers)}`],
    ['Confirmed worker levels', (s.confirmed_worker_levels ?? []).join(', ') || 'N/A'],
    ['Peak GPU instances → final', `${na(s.peak_gpu_instances)} → ${na(s.final_gpu_instances)}`],
    ['Completed units GPU 0 / GPU 1', `${na(s.gpu0_units_completed)} / ${na(s.gpu1_units_completed)}`],
    ['Unattributed completed units', na(s.unattributed_units)],
    ['GPU 1 load time', na(s.gpu1_load_seconds, 'fixed1', ' s')],
    ['GPU 1 stopped cleanly', na(s.gpu1_stopped_cleanly)],
    ['Worker scale-out / scale-in', `${na(s.scale_out_seconds, 'fixed1', ' s')} / ${na(s.scale_in_seconds, 'fixed1', ' s')}`],
    ['Undelivered telemetry events', na(s.telemetry_failed_events)],
  ];
}
