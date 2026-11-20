import { useMemo, useState } from 'react';
import { MockAobApi, type MockFailureMode } from '../../features/agent-ops/api/mock/MockAobApi';
import type { ScenarioVariant } from '../../features/agent-ops/api/mock/simulation';
import type { AobApi } from '../../features/agent-ops/api/AobApi';
import { LiveDemoPanel } from '../../features/agent-ops/components/LiveDemoPanel';
import { SimulationBanner } from '../../features/agent-ops/components/SimulationBanner';
import { Alert } from '../../features/agent-ops/components/ui';
import { AgentOpsContext } from '../../features/agent-ops/context';
import { LiveAobApi } from '../../features/agent-ops/api/LiveAobApi';
import { AobAuthGate } from '../../features/agent-ops/components/AobAuthGate';
import { useAobSession } from '../../features/agent-ops/hooks/useAobSession';

const DEFAULT_SPEED = 5;
const MOCK_LATENCY_MS = 250;

/**
 * /app/agent-ops — React port of the AOB Streamlit dashboard as it renders with
 * AOB_ENV=production: page header, Live GPU demo panel, production notice. Phase B2 runs on the
 * simulated adapter only; the BFF-backed adapter is a later step.
 */
export function AgentOpsDashboardPage({ api: injected }: { api?: AobApi }) {
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [outcome, setOutcome] = useState<ScenarioVariant>('passed');
  const [behaviour, setBehaviour] = useState<MockFailureMode>('none');
  const [reloadKey, setReloadKey] = useState(0);

  const api = useMemo<AobApi>(
    () => injected ?? (import.meta.env.DEV || import.meta.env.VITE_AOB_DASHBOARD_MOCK === '1'
      ? new MockAobApi({ speed, latencyMs: MOCK_LATENCY_MS })
      : new LiveAobApi()),
    [injected, speed],
  );
  const mock = api instanceof MockAobApi ? api : null;
  const simulated = mock !== null;
  const liveApi = api instanceof LiveAobApi ? api : null;
  const session = useAobSession(liveApi);


  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Agent Ops Board</h1>
        <p className="mt-2 text-sm text-slate-400">
          🧪 <strong className="text-slate-200">Synthetic Demo</strong> — synthetic, non-confidential content. No
          account updates or external replies.
        </p>
      </header>

      <AgentOpsContext.Provider value={{ api, simulated }}>
        <div className="mt-6 space-y-6">
          {mock && (
            <SimulationBanner
              outcome={outcome}
              behaviour={behaviour}
              speed={speed}
              onOutcome={(v) => {
                setOutcome(v);
                mock.setNextVariant(v);
              }}
              onBehaviour={(v) => {
                setBehaviour(v);
                mock.setFailureMode(v);
                setReloadKey((k) => k + 1);
              }}
              onSpeed={(v) => {
                setSpeed(v);
                setOutcome('passed');
                setBehaviour('none');
              }}
            />
          )}
          {liveApi ? (
            <AobAuthGate state={session}>
              <p className="mb-4 text-sm text-slate-400">Signed in as <strong className="text-slate-200">{session.status === 'authorised' ? session.session.user.display_name : 'user'}</strong></p>
              <LiveDemoPanel key={`${speed}:${reloadKey}`} />
              <Alert kind="info" testId="production-gate">
                Phase 1 production mode: only the private live demo panel is available.
              </Alert>
            </AobAuthGate>
          ) : (
            <>
              <LiveDemoPanel key={`${speed}:${reloadKey}`} />
              <Alert kind="info" testId="production-gate">
                Phase 1 production mode: only the private live demo panel is available.
              </Alert>
            </>
          )}
        </div>
      </AgentOpsContext.Provider>
    </div>
  );
}
