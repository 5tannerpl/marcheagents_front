import { createContext, useContext } from 'react';
import type { AobApi } from './api/AobApi';

export interface AgentOpsDataSource {
  api: AobApi;
  /** True while the dashboard runs on synthetic fixtures; copy must never claim live telemetry. */
  simulated: boolean;
}

export const AgentOpsContext = createContext<AgentOpsDataSource | null>(null);

export function useAgentOps(): AgentOpsDataSource {
  const ctx = useContext(AgentOpsContext);
  if (!ctx) throw new Error('useAgentOps must be used inside <AgentOpsContext.Provider>');
  return ctx;
}
