import type { LiveState } from '../api/types';
import { scalingVerdict } from '../lib/liveDemoText';
import { summaryRows } from '../lib/summaryRows';
import { Alert, Caption, DataTable, SectionHeading } from './ui';

/** live_demo._summary */
export function RunSummary({ state }: { state: LiveState }) {
  const { failure, summary } = state;
  return (
    <section data-testid="run-summary">
      <SectionHeading>Run summary and evidence</SectionHeading>
      <p className="mb-3 text-sm text-slate-200" data-testid="scaling-verdict">
        Scaling verdict: <strong className="text-white">{scalingVerdict(state.scaling_status)}</strong> — separate from
        the model validation result above.
      </p>
      <div className="space-y-3">
        {failure && (
          <Alert kind="error" testId="scaling-failure">
            {failure.error_code} during{' '}
            <code className="rounded bg-red-950/60 px-1 py-0.5 text-xs">{failure.phase}</code>: {failure.message || ''}
          </Alert>
        )}
        {!summary ? (
          <Caption>The summary appears once the scaling experiment finishes.</Caption>
        ) : (
          <>
            {summary.reasons?.length ? (
              <Alert kind="warning" testId="summary-reasons">
                Not a full pass: {summary.reasons.join(', ')}
              </Alert>
            ) : null}
            <DataTable
              testId="summary-table"
              caption="Run summary"
              columns={['Measure', 'Value']}
              rows={summaryRows(summary)}
            />
          </>
        )}
      </div>
    </section>
  );
}
