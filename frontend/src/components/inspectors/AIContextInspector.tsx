import { FileSearch } from 'lucide-react';
import type { EvidenceCard } from '../../types/scenario';

interface AIContextInspectorProps {
  /** Only the evidence actually sent to the (simulated) LLM. */
  evidence: EvidenceCard[];
}

export function AIContextInspector({ evidence }: AIContextInspectorProps) {
  return (
    <div data-testid="context-inspector" className="space-y-3">
      <div className="flex items-center gap-2">
        <FileSearch className="h-4 w-4 text-brand-300" aria-hidden />
        <h4 className="text-sm font-semibold text-white">
          Evidence Sent to LLM
        </h4>
      </div>
      <p className="text-xs text-slate-500">
        Exactly what enters the model context for the current identity —
        nothing more.
      </p>
      {evidence.length === 0 ? (
        <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs italic text-slate-500">
          No evidence in context for this identity.
        </p>
      ) : (
        <ul className="space-y-2">
          {evidence.map((item) => (
            <li
              key={item.evidenceId}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-mono text-xs font-semibold text-brand-300">
                  {item.evidenceId}
                </span>
                <span className="text-[11px] text-slate-500">
                  {item.projectLabel}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {item.excerpt}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Why relevant: linked to case {item.caseId} ·{' '}
                <span className="font-mono">{item.citation}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
