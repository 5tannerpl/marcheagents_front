import type { AobSessionState } from '../hooks/useAobSession';
import { Alert } from './ui';
import type { ReactNode } from 'react';

const BFF_ORIGIN = (import.meta.env.VITE_AOB_BFF_ORIGIN || 'https://aob-api.marcheagents.com').replace(/\/+$/, '');

export function loginToAob() {
  const returnTo = `${window.location.origin}/app/agent-ops`;
  window.location.assign(`${BFF_ORIGIN}/auth/login?return_to=${encodeURIComponent(returnTo)}`);
}

export function AobAuthGate({ state, children }: { state: AobSessionState; children: ReactNode }) {
  if (state.status === 'loading') {
    return <p role="status" aria-busy="true" className="mt-8 text-sm text-slate-400">Checking Agent Ops access…</p>;
  }
  if (state.status === 'authorised') return <>{children}</>;
  if (state.status === 'signed-out') {
    return (
      <Alert kind="info" testId="aob-auth-signed-out">
        Private demo: invited users only. There is no public sign-up.
        <button type="button" className="ml-3 underline" onClick={loginToAob}>Log in</button>
      </Alert>
    );
  }
  if (state.status === 'denied') {
    return <Alert kind="error" testId="aob-auth-denied">{state.message}</Alert>;
  }
  return <Alert kind={state.status === 'expired' ? 'warning' : 'error'} testId={`aob-auth-${state.status}`}>{state.message}</Alert>;
}
