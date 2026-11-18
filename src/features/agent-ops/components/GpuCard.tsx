import type { GpuView } from '../api/types';
import { na } from '../lib/format';
import { BorderedBox, Metric } from './ui';

/**
 * live_demo._gpu_card. The port is always N/A because the server's `_safe_gpu` drops it (G9);
 * it is kept in the header for layout parity.
 */
export function GpuCard({
  title,
  gpu,
  units,
  inflight,
}: {
  title: string;
  gpu: GpuView | null | undefined;
  units: number | undefined;
  inflight: number | undefined;
}) {
  const g = gpu ?? {};
  const port = (g as { port?: number }).port;
  return (
    <BorderedBox testId={`gpu-card-${title}`}>
      <p className="text-sm text-slate-200">
        <strong className="text-white">{title}</strong> ·{' '}
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-emerald-300">{g.state || 'N/A'}</code> · port{' '}
        {na(port)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <Metric label="Memory used" value={na(g.memory_used_mb, 'thousands', ' MB')} />
        <Metric label="Utilization" value={na(g.utilization_pct, 'plain', '%')} />
        <Metric label="Units processed" value={na(units)} />
        <Metric label="In flight" value={na(inflight)} />
      </div>
    </BorderedBox>
  );
}
