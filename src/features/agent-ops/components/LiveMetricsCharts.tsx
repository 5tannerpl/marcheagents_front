import type { MetricsPoint } from '../api/types';
import { useAgentOps } from '../context';
import { chartFrames } from '../lib/chartFrames';
import { LineChart } from './LineChart';
import { Caption, SectionHeading } from './ui';

/** live_demo._live_metrics: up to four charts in a two-column grid that stacks on narrow screens. */
export function LiveMetricsCharts({ points }: { points: MetricsPoint[] }) {
  const { simulated } = useAgentOps();
  const frames = chartFrames(points);
  if (!frames.length) return null;
  return (
    <section data-testid="live-metrics">
      <SectionHeading>Live metrics</SectionHeading>
      <Caption>
        {simulated
          ? 'Seconds since the first snapshot; every point is a SIMULATED reading generated in the browser, not Kaggle telemetry.'
          : 'Seconds since the first snapshot; every point is a real reading from the Kaggle batch.'}
      </Caption>
      <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
        {frames.map((frame) => (
          <div key={frame.name} className="min-w-0">
            <p className="mb-2 text-sm font-semibold text-white">{frame.name}</p>
            <LineChart title={frame.name} x={frame.x} series={frame.series} height={310} />
          </div>
        ))}
      </div>
    </section>
  );
}
