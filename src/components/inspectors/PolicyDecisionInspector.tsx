import { Scale } from 'lucide-react';
import type { SimulatedPolicyDecision } from '../../types/scenario';

interface PolicyDecisionInspectorProps {
  decisions: SimulatedPolicyDecision[];
  policyVersion: number;
  authorizedCount: number;
  withheldCount: number;
}

export function PolicyDecisionInspector({
  decisions,
  policyVersion,
  authorizedCount,
  withheldCount,
}: PolicyDecisionInspectorProps) {
  return (
    <div data-testid="policy-inspector" className="space-y-3">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-brand-300" aria-hidden />
        <h4 className="text-sm font-semibold text-white">Policy Evaluation</h4>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
          <p className="text-lg font-bold text-white">{policyVersion}</p>
          <p className="text-[11px] text-slate-500">policy version</p>
        </div>
        <div className="rounded-lg border border-emerald-800/40 bg-slate-900/60 p-2">
          <p className="text-lg font-bold text-emerald-300">{authorizedCount}</p>
          <p className="text-[11px] text-slate-500">authorized</p>
        </div>
        <div className="rounded-lg border border-rose-800/40 bg-slate-900/60 p-2">
          <p className="text-lg font-bold text-rose-300">{withheldCount}</p>
          <p className="text-[11px] text-slate-500">withheld</p>
        </div>
      </div>

      <ul className="space-y-2">
        {decisions.map((decision, index) => (
          <li
            key={`${decision.reasonCode}-${index}`}
            className={`rounded-lg border p-3 ${
              decision.decision === 'allow'
                ? 'border-emerald-800/40 bg-emerald-950/20'
                : 'border-rose-800/40 bg-rose-950/20'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`font-mono text-xs font-bold uppercase ${
                  decision.decision === 'allow'
                    ? 'text-emerald-300'
                    : 'text-rose-300'
                }`}
              >
                {decision.decision}
              </span>
              <span className="text-[11px] text-slate-500">
                {decision.resourceCategory}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-300">
              {decision.reasonCode}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {decision.resourceLabel}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-slate-600">
        Denied resources only appear as aggregates — real IDs and content are
        never exposed to unauthorized viewers.
      </p>
    </div>
  );
}
