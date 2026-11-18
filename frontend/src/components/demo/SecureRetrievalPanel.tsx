import { ShieldCheck, ShieldX } from 'lucide-react';
import type { EvidenceCard, ScenarioIdentity } from '../../types/scenario';

interface SecureRetrievalPanelProps {
  identity: ScenarioIdentity;
  /** Pre-filtered: this component only ever receives authorized evidence. */
  authorizedEvidence: EvidenceCard[];
  withheldCount: number;
}

export function SecureRetrievalPanel({
  identity,
  authorizedEvidence,
  withheldCount,
}: SecureRetrievalPanelProps) {
  return (
    <div data-testid="retrieval-panel" className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">Secure Retrieval</h3>
      </div>
      <p className="text-sm text-slate-400">
        Retrieval scope for{' '}
        <span className="font-semibold text-slate-200">
          {identity.displayName}
        </span>{' '}
        ({identity.role}) is computed before the search runs. Only evidence
        within the allowed projects is ever returned.
      </p>

      <ul className="space-y-3" data-testid="evidence-list">
        {authorizedEvidence.map((evidence) => (
          <li
            key={evidence.evidenceId}
            data-testid={`evidence-${evidence.evidenceId}`}
            className="rounded-xl border border-emerald-800/40 bg-slate-900 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-emerald-300">
                {evidence.evidenceId}
              </span>
              <span className="text-xs text-slate-500">
                Case {evidence.caseId} · {evidence.projectLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-200">{evidence.excerpt}</p>
            <p className="mt-2 font-mono text-xs text-slate-500">
              {evidence.citation}
            </p>
          </li>
        ))}
      </ul>

      {withheldCount > 0 && (
        <div
          data-testid="withheld-summary"
          className="flex items-start gap-3 rounded-xl border border-dashed border-rose-800/50 bg-rose-950/20 p-4"
        >
          <ShieldX className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-rose-300">
              {withheldCount} record{withheldCount === 1 ? '' : 's'} withheld by
              simulated policy
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Synthetic visualization only: titles, excerpts and IDs of denied
              resources are never shown. A real deployment would reveal nothing
              about their existence to unauthorized users.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
