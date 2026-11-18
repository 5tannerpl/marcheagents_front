import type { LiveState } from '../api/types';
import { useAgentOps } from '../context';
import { na } from '../lib/format';
import { GpuCard } from './GpuCard';
import { Alert, Metric, SectionHeading } from './ui';

/** live_demo._scaling_overview */
export function ScalingOverview({ state }: { state: LiveState }) {
  const { simulated } = useAgentOps();
  const snap = state.snapshot ?? { gpu0: null, gpu1: null };
  const byGpu = snap.units_by_gpu ?? {};
  const inflight = snap.inflight_by_gpu ?? {};
  return (
    <section aria-labelledby="scaling-overview-heading" data-testid="scaling-overview">
      <SectionHeading>
        <span id="scaling-overview-heading">Scaling overview</span>
      </SectionHeading>
      {state.telemetry_delayed && (
        <div className="mb-3">
          <Alert kind="warning" testId="telemetry-delayed">
            Telemetry delayed — last event {(state.seconds_since_last_event ?? 0).toFixed(0)}s ago. Values below may be
            stale.
          </Alert>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Metric
          testId="metric-workers"
          label="Actual / desired workers"
          value={`${na(snap.actual_workers)} / ${na(snap.desired_workers)}`}
        />
        <Metric label="Pending" value={na(snap.pending)} />
        <Metric label="Running" value={na(snap.running)} />
        <Metric
          label="Completed"
          value={`${na(snap.completed)} / ${na(snap.total || state.units)}`}
        />
        <Metric label="Failed" value={na(snap.failed)} />
      </div>
      <p className="mt-4 text-sm text-slate-200" data-testid="scaling-state">
        Scaling state: <strong className="text-white">{state.scaling_state || 'N/A'}</strong>
        {state.live && (
          <span data-testid="live-indicator">
            {' '}
            · 🔴 LIVE{simulated && <span className="text-amber-300"> (simulated)</span>}
          </span>
        )}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <GpuCard title="GPU 0" gpu={snap.gpu0} units={byGpu.gpu0} inflight={inflight.gpu0} />
        <GpuCard title="GPU 1" gpu={snap.gpu1} units={byGpu.gpu1} inflight={inflight.gpu1} />
      </div>
      {(snap.unattributed_units ?? 0) > 0 && (
        <div className="mt-3">
          <Alert kind="warning" testId="unattributed-units">
            {snap.unattributed_units} completed units have no confirmed GPU attribution.
          </Alert>
        </div>
      )}
    </section>
  );
}
