import { GitBranch } from 'lucide-react';
import type { ScenarioCase, ScenarioEmail } from '../../types/scenario';

interface CaseSplitVisualizerProps {
  email: ScenarioEmail;
  cases: ScenarioCase[];
}

export function CaseSplitVisualizer({ email, cases }: CaseSplitVisualizerProps) {
  return (
    <div data-testid="case-split" className="space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-brand-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">Case Routing</h3>
      </div>
      <p className="text-sm text-slate-400">
        One email, multiple cases. {email.emailId} stays a single trusted
        source record; permissioned segments link it to each project case.
      </p>

      <div className="flex flex-col items-center gap-3">
        <div className="w-full max-w-sm rounded-xl border border-brand-700/50 bg-slate-900 px-5 py-3 text-center">
          <p className="font-mono text-sm font-semibold text-brand-300">
            {email.emailId}
          </p>
          <p className="text-xs text-slate-400">{email.subject}</p>
        </div>
        <div className="h-6 w-px bg-slate-700" aria-hidden />
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {cases.map((c) => (
            <div
              key={c.caseId}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-white">
                  {c.caseId}
                </span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                  {c.segmentId}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-semibold text-slate-200">
                {c.title}
              </h4>
              <dl className="mt-3 space-y-1 text-xs text-slate-400">
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-slate-500">Project</dt>
                  <dd>{c.projectLabel}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-slate-500">SLA</dt>
                  <dd>{c.sla}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-slate-500">Owner</dt>
                  <dd>{c.owner}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
