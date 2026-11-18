import type { RunStatus } from '../api/types';
import { statusLine } from '../lib/liveDemoText';
import { Alert } from './ui';

/** live_demo._run_panel status line plus the raw `error_code` box. */
export function RunStatusLine({ status }: { status: RunStatus }) {
  const { icon, label, description } = statusLine(status.status, status.phase, status.result);
  return (
    <div className="space-y-3">
      <p data-testid="run-status-line" className="text-base text-slate-200">
        <span aria-hidden>{icon}</span> <strong className="text-white">{label}</strong> · {description}
      </p>
      {status.error_code && (
        <Alert kind="error" testId="run-error-code">
          {status.error_code}
        </Alert>
      )}
    </div>
  );
}
