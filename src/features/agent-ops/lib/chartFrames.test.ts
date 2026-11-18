import { describe, expect, it } from 'vitest';
import type { MetricsPoint } from '../api/types';
import { chartFrames, MAX_METRIC_POINTS, normalizeMetricPoints } from './chartFrames';
import { segments } from './chartGeometry';

function point(i: number, overrides: Partial<MetricsPoint> = {}): MetricsPoint {
  return {
    id: i + 1,
    t: i * 3,
    received_at: 1_800_000_000 + i * 3,
    pending: 10,
    running: 2,
    completed: i,
    failed: 0,
    actual_workers: 2,
    desired_workers: 2,
    gpu_instances_ready: 1,
    gpu0_requests: i,
    gpu1_requests: null,
    gpu0_utilization_pct: 90,
    gpu1_utilization_pct: null,
    gpu0_memory_mb: 5600,
    gpu1_memory_mb: null,
    ...overrides,
  };
}

describe('chartFrames', () => {
  it('builds the four Streamlit charts with their series names and t as x', () => {
    const frames = chartFrames([point(0, { gpu1_utilization_pct: 0, gpu1_memory_mb: 0 }), point(1)]);
    expect(frames.map((f) => f.name)).toEqual(['Queue depth', 'Workers', 'GPU utilization %', 'GPU memory used (MB)']);
    expect(frames[1].series.map((s) => s.label)).toEqual(['Actual workers', 'Desired workers']);
    expect(frames[0].x).toEqual([0, 3]);
    expect(frames[3].series.map((s) => s.values)).toEqual([[5600, 5600], [0, null]]);
  });

  it('hides all-null series and charts without any series', () => {
    const frames = chartFrames([
      point(0, { gpu0_utilization_pct: null, gpu0_memory_mb: null, desired_workers: null }),
      point(1, { gpu0_utilization_pct: null, gpu0_memory_mb: null, desired_workers: null }),
    ]);
    expect(frames.map((f) => f.name)).toEqual(['Queue depth', 'Workers']);
    expect(frames[1].series.map((s) => s.label)).toEqual(['Actual workers']);
    expect(chartFrames([])).toEqual([]);
  });

  it('keeps null readings as gaps', () => {
    expect(segments([0, 3, 6, 9, 12], [1, 2, null, 4, 5])).toEqual([
      [[0, 1], [3, 2]],
      [[9, 4], [12, 5]],
    ]);
  });
});

describe('normalizeMetricPoints (600-point retention window)', () => {
  it('passes server responses through unchanged', () => {
    const points = [point(0), point(1)];
    expect(normalizeMetricPoints(points)).toBe(points);
  });

  it('keeps only the last 600 points and rebases t on the first retained receive time', () => {
    const points = Array.from({ length: 650 }, (_, i) => point(i));
    const out = normalizeMetricPoints(points);
    expect(out).toHaveLength(MAX_METRIC_POINTS);
    expect(out[0]).toMatchObject({ id: 51, t: 0 });
    expect(out.at(-1)?.t).toBe(599 * 3);
  });

  it('rebases a stale t origin using server receive time', () => {
    const out = normalizeMetricPoints([point(5, { t: 15 }), point(6, { t: 18.04, received_at: 1_800_000_018.04 })]);
    expect(out.map((p) => p.t)).toEqual([0, 3]);
  });
});
