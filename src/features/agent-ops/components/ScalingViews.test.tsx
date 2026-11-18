import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AobApi } from '../api/AobApi';
import type { LiveState, MetricsPoint } from '../api/types';
import { AgentOpsContext } from '../context';
import { LineChart } from './LineChart';
import { LiveMetricsCharts } from './LiveMetricsCharts';
import { ScalingOverview } from './ScalingOverview';

const wrap = (ui: ReactNode, simulated = false) =>
  render(<AgentOpsContext.Provider value={{ api: {} as AobApi, simulated }}>{ui}</AgentOpsContext.Provider>);

const baseState: LiveState = {
  run_id: 'run-0000000000000001',
  status: 'running',
  kaggle_status: 'running',
  error_code: null,
  mode: 'high_concurrency',
  units: 100,
  created_at: 1,
  updated_at: 1,
  finished_at: null,
  scaling_status: 'running',
  live: true,
  scaling_state: 'SCALED_OUT',
  snapshot: {
    pending: 40,
    running: 8,
    completed: 52,
    failed: 0,
    actual_workers: 8,
    desired_workers: 8,
    unattributed_units: 3,
    units_by_gpu: { gpu0: 30, gpu1: 19 },
    inflight_by_gpu: { gpu0: 4, gpu1: 4 },
    gpu0: { state: 'READY', memory_used_mb: 5648.3, utilization_pct: 93.1 },
    gpu1: null,
  },
  snapshot_received_at: 1,
  seconds_since_last_event: 41.6,
  telemetry_delayed: true,
  plan: { mode: 'high_concurrency', planned_units: 100 },
  summary: null,
  failure: null,
  timeline: [],
};

describe('ScalingOverview', () => {
  it('renders metrics, GPU cards and the delayed / unattributed warnings', () => {
    wrap(<ScalingOverview state={baseState} />);
    expect(screen.getByTestId('telemetry-delayed')).toHaveTextContent(
      'Telemetry delayed — last event 42s ago. Values below may be stale.',
    );
    expect(screen.getByTestId('metric-workers')).toHaveTextContent('8 / 8');
    expect(screen.getByText('52 / 100')).toBeInTheDocument();
    expect(screen.getByTestId('scaling-state')).toHaveTextContent('Scaling state: SCALED_OUT · 🔴 LIVE');
    expect(screen.getByTestId('gpu-card-GPU 0')).toHaveTextContent('5,648.3 MB');
    expect(screen.getByTestId('gpu-card-GPU 0')).toHaveTextContent('93.1%');
    expect(screen.getByTestId('gpu-card-GPU 1')).toHaveTextContent('GPU 1 · N/A · port N/A');
    expect(screen.getByTestId('unattributed-units')).toHaveTextContent(
      '3 completed units have no confirmed GPU attribution.',
    );
  });

  it('renders unknown states verbatim and labels LIVE as simulated in mock mode', () => {
    wrap(
      <ScalingOverview
        state={{ ...baseState, scaling_state: 'REBALANCING', telemetry_delayed: false, snapshot: { gpu0: { state: 'WARMING' }, gpu1: null } }}
      />,
      true,
    );
    expect(screen.getByTestId('scaling-state')).toHaveTextContent('REBALANCING · 🔴 LIVE (simulated)');
    expect(screen.getByTestId('gpu-card-GPU 0')).toHaveTextContent('WARMING');
    expect(screen.queryByTestId('telemetry-delayed')).not.toBeInTheDocument();
  });
});

describe('scaling charts', () => {
  it('draws one polyline per contiguous segment, so null readings stay gaps', () => {
    render(
      <LineChart
        title="Workers"
        x={[0, 3, 6, 9, 12]}
        series={[
          { key: 'actual_workers', label: 'Actual workers', values: [2, 4, null, 8, 2] },
          { key: 'desired_workers', label: 'Desired workers', values: [2, 4, 8, 8, 2] },
        ]}
      />,
    );
    expect(screen.getAllByTestId('series-Actual workers')).toHaveLength(2);
    expect(screen.getAllByTestId('series-Desired workers')).toHaveLength(1);
    expect(screen.getByRole('img', { name: /Workers line chart/ })).toHaveAttribute('height', '310');
    expect(screen.getByRole('list', { name: 'Workers legend' })).toHaveTextContent('Actual workersDesired workers');
  });

  it('plots the 2 → 8 → 2 worker scaling on the Workers chart', () => {
    const levels = [2, 2, 4, 8, 8, 8, 2, 2];
    const points: MetricsPoint[] = levels.map((w, i) => ({
      id: i + 1, t: i * 3, received_at: 100 + i * 3, pending: 0, running: 0, completed: i, failed: 0,
      actual_workers: w, desired_workers: w, gpu_instances_ready: 1, gpu0_requests: null, gpu1_requests: null,
      gpu0_utilization_pct: null, gpu1_utilization_pct: null, gpu0_memory_mb: null, gpu1_memory_mb: null,
    }));
    wrap(<LiveMetricsCharts points={points} />);
    expect(screen.getAllByRole('img', { name: /line chart/ }).map((el) => el.getAttribute('aria-label'))).toEqual([
      'Queue depth line chart: Pending, Running over t (seconds)',
      'Workers line chart: Actual workers, Desired workers over t (seconds)',
    ]);
    const line = screen.getAllByTestId('series-Actual workers')[0].getAttribute('points')!.split(' ');
    const ys = line.map((p) => Number(p.split(',')[1]));
    expect(ys[0]).toBe(ys.at(-1));
    expect(Math.min(...ys)).toBe(ys[3]);
  });

  it('renders nothing when there are no points', () => {
    wrap(<LiveMetricsCharts points={[]} />);
    expect(screen.queryByTestId('live-metrics')).not.toBeInTheDocument();
  });
});
