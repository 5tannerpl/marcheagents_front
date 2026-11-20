import { useRef, useState } from 'react';
import { ApiError } from '../api/AobApi';
import type { LiveState, MetricsPoint, RunStatus, ValidationEvent } from '../api/types';
import { useAgentOps } from '../context';
import { usePolling } from '../hooks/usePolling';
import { isActiveStatus } from '../lib/liveDemoText';
import { LiveMetricsCharts } from './LiveMetricsCharts';
import { RunStatusLine } from './RunStatusLine';
import { RunSummary } from './RunSummary';
import { ScalingOverview } from './ScalingOverview';
import { ScalingTimeline } from './ScalingTimeline';
import { Alert, Caption, SectionHeading } from './ui';
import { ValidationEventsTable } from './ValidationEventsTable';

export const RUN_POLL_INTERVAL_MS = 3000;

interface PanelData {
  status: RunStatus;
  state: LiveState;
  points: MetricsPoint[];
  summary: LiveState['summary'];
  validation: ValidationEvent[] | null;
  validationError: string | null;
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));
const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

/**
 * live_demo._run_panel. Polls every 3 s only while the selected run was active when the run list
 * was loaded; each tick calls /status, /state, /metrics (only when a snapshot exists) and then
 * /validation. When the run leaves the active set, `onRunFinished` refetches the run list (the
 * Streamlit `st.rerun(scope="app")`), which re-enables the controls and stops polling.
 */
export function LiveRunPanel({
  runId,
  active,
  onRunFinished,
}: {
  runId: string;
  active: boolean;
  onRunFinished: () => void;
}) {
  const { api } = useAgentOps();
  const [data, setData] = useState<PanelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const finishedNotified = useRef(false);

  usePolling(
    async (signal) => {
      try {
        const status = await api.getStatus(runId, signal);
        const state = await api.getState(runId, signal);
        const points = state.snapshot ? (await api.getMetrics(runId, signal)).points : [];
        const summary = await api.getSummary(runId, signal);
        let validation: ValidationEvent[] | null = null;
        let validationError: string | null = null;
        try {
          validation = (await api.getValidation(runId, signal)).items;
        } catch (e) {
          if (isAbort(e)) throw e;
          validationError = errorText(e);
        }
        if (signal.aborted) return;
        setData({ status, state, points, summary, validation, validationError });
        setError(null);
        if (active && !isActiveStatus(status.status) && !finishedNotified.current) {
          finishedNotified.current = true;
          onRunFinished();
        }
      } catch (e) {
        if (isAbort(e) || signal.aborted) return;
        setError(e instanceof ApiError ? e.message : errorText(e));
      }
    },
    active ? RUN_POLL_INTERVAL_MS : null,
    `${runId}|${active}`,
  );

  if (!data) {
    return error ? (
      <Alert kind="error" testId="run-panel-error">
        {error}
      </Alert>
    ) : (
      <p role="status" aria-busy="true" data-testid="run-panel-loading" className="animate-pulse text-sm text-slate-400">
        Loading run {runId}…
      </p>
    );
  }

  const { status, state, points, summary, validation, validationError } = data;
  const showScaling = !(state.scaling_status === null && !state.timeline.length);

  return (
    <div data-testid="live-run-panel" aria-live="polite" className="space-y-1">
      {error && (
        <div className="mb-3">
          <Alert kind="error" testId="run-panel-error">
            {error}
          </Alert>
          <Caption className="mt-1">Showing the last values received.</Caption>
        </div>
      )}
      <RunStatusLine status={status} />

      <SectionHeading>Validation events</SectionHeading>
      {validationError ? (
        <Alert kind="error">{validationError}</Alert>
      ) : (
        <ValidationEventsTable events={validation ?? []} />
      )}

      {showScaling && (
        <>
          <ScalingOverview state={state} />
          <LiveMetricsCharts points={points} />
          <ScalingTimeline timeline={state.timeline} />
          <RunSummary state={{ ...state, summary }} />
        </>
      )}
    </div>
  );
}
