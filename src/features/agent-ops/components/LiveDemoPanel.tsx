import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/AobApi';
import type { RunView, StartDemoBody } from '../api/types';
import { useAgentOps } from '../context';
import { isActiveStatus, startErrorMessage } from '../lib/liveDemoText';
import { INITIAL_SELECTION, resolveSelection, type RunSelectionState } from '../lib/runSelection';
import { LiveDemoControls } from './LiveDemoControls';
import { LiveRunPanel } from './LiveRunPanel';
import { RunSelector } from './RunSelector';
import { Alert, BorderedBox, Caption } from './ui';

/** live_demo.render: the bordered "Live GPU demo" container. */
export function LiveDemoPanel() {
  const { api, simulated } = useAgentOps();
  const [runs, setRuns] = useState<RunView[] | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [selection, setSelection] = useState<RunSelectionState>(INITIAL_SELECTION);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const pendingSelection = useRef<Partial<RunSelectionState>>({});

  /** The Streamlit full-app rerun: refetch /runs and re-resolve the selection. */
  const refreshRuns = useCallback((pending: Partial<RunSelectionState> = {}) => {
    pendingSelection.current = { ...pendingSelection.current, ...pending };
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    api.listRuns(controller.signal).then(
      ({ items }) => {
        if (controller.signal.aborted) return;
        const pending = pendingSelection.current;
        pendingSelection.current = {};
        setRuns(items);
        setRunsError(null);
        setSelection((prev) => resolveSelection({ ...prev, ...pending }, items.map((r) => r.run_id)));
        setStarting(false);
      },
      (e: unknown) => {
        if (controller.signal.aborted) return;
        setRunsError(e instanceof Error ? e.message : String(e));
        setStarting(false);
      },
    );
    return () => controller.abort();
  }, [api, reloadToken]);

  const busy = (runs ?? []).some((r) => isActiveStatus(r.status));

  const start = async (body: StartDemoBody) => {
    setStarting(true);
    setStartError(null);
    try {
      const started = await api.startDemo(body);
      const newId = started?.run_id;
      // Stay in `starting` until the refreshed run list disables the controls.
      refreshRuns(newId ? { requestedId: newId } : { previousIds: (runs ?? []).map((r) => r.run_id) });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : null;
      setStartError(startErrorMessage(status, e instanceof Error ? e.message : String(e)));
      setStarting(false);
    }
  };

  const selected = selection.selected;
  const selectedActive = (runs ?? []).some((r) => r.run_id === selected && isActiveStatus(r.status));

  return (
    <BorderedBox testId="live-demo-panel" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Live GPU demo</h2>
        <Caption className="mt-1">
          Runs a real model check and a Worker/GPU autoscaling experiment as a Kaggle GPU <strong>batch</strong>. Kaggle
          queue time is not guaranteed and the model is not online after the batch ends; events and results stay here.
          {simulated && (
            <span className="text-amber-300"> Simulation mode: no Kaggle batch is started and no GPU is used.</span>
          )}
        </Caption>
      </div>

      {runsError ? (
        <Alert kind="error" testId="runs-error">
          {runsError}
        </Alert>
      ) : runs === null ? (
        <p role="status" aria-busy="true" data-testid="runs-loading" className="animate-pulse text-sm text-slate-400">
          Loading runs…
        </p>
      ) : (
        <>
          <LiveDemoControls busy={busy} starting={starting} onStart={start} />
          {startError && (
            <Alert kind="error" testId="start-error">
              {startError}
            </Alert>
          )}
          {runs.length === 0 || !selected ? (
            <Caption>No runs yet.</Caption>
          ) : (
            <>
              <RunSelector
                runIds={runs.map((r) => r.run_id)}
                selected={selected}
                onSelect={(runId) => setSelection((prev) => ({ ...prev, selected: runId }))}
              />
              <LiveRunPanel
                key={selected}
                runId={selected}
                active={selectedActive}
                onRunFinished={() => refreshRuns()}
              />
            </>
          )}
        </>
      )}
    </BorderedBox>
  );
}
