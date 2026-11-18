/** Port of live_demo.chart_frames plus the client-side guard for the 600-point retention window. */
import type { MetricsPoint } from '../api/types';

export const MAX_METRIC_POINTS = 600;

type NumericKey = {
  [K in keyof MetricsPoint]: MetricsPoint[K] extends number | null ? K : never;
}[keyof MetricsPoint];

export interface ChartSeries {
  key: NumericKey;
  label: string;
  values: (number | null)[];
}

export interface ChartFrame {
  name: string;
  /** Seconds since the first retained snapshot. */
  x: number[];
  series: ChartSeries[];
}

const CHARTS: { name: string; columns: [NumericKey, string][] }[] = [
  { name: 'Queue depth', columns: [['pending', 'Pending'], ['running', 'Running']] },
  { name: 'Workers', columns: [['actual_workers', 'Actual workers'], ['desired_workers', 'Desired workers']] },
  { name: 'GPU utilization %', columns: [['gpu0_utilization_pct', 'GPU 0'], ['gpu1_utilization_pct', 'GPU 1']] },
  { name: 'GPU memory used (MB)', columns: [['gpu0_memory_mb', 'GPU 0'], ['gpu1_memory_mb', 'GPU 1']] },
];

/**
 * The server keeps the last 600 snapshots and measures `t` from the first *retained* one, so the
 * axis restarts at 0 once older points are cut. If a response ever carries more points (or a
 * stale `t` base), keep the last 600 and rebase `t` on server receive time, never client time.
 */
export function normalizeMetricPoints(points: MetricsPoint[]): MetricsPoint[] {
  if (!points.length) return points;
  const kept = points.length > MAX_METRIC_POINTS ? points.slice(-MAX_METRIC_POINTS) : points;
  if (kept === points && kept[0].t === 0) return points;
  const t0 = kept[0].received_at;
  return kept.map((p) => ({ ...p, t: Math.round((p.received_at - t0) * 10) / 10 }));
}

/** One frame per chart. All-null series are dropped, empty charts are dropped, nulls stay gaps. */
export function chartFrames(points: MetricsPoint[]): ChartFrame[] {
  const rows = normalizeMetricPoints(points);
  if (!rows.length) return [];
  const x = rows.map((p) => p.t);
  return CHARTS.map(({ name, columns }) => ({
    name,
    x,
    series: columns
      .map(([key, label]) => ({ key, label, values: rows.map((p) => p[key] ?? null) }))
      .filter((s) => s.values.some((v) => v !== null)),
  })).filter((frame) => frame.series.length > 0);
}
