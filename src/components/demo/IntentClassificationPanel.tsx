import { Brain } from 'lucide-react';
import type { IntentCard } from '../../types/scenario';

interface IntentClassificationPanelProps {
  intents: IntentCard[];
}

export function IntentClassificationPanel({
  intents,
}: IntentClassificationPanelProps) {
  return (
    <div data-testid="intent-panel" className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-brand-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">AI Classification</h3>
      </div>
      <p className="text-sm text-slate-400">
        The model proposes intents and target projects. These are suggestions —
        authorization decisions are always made separately by policy.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {intents.map((intent) => (
          <div
            key={intent.intentId}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md bg-brand-500/15 px-2 py-0.5 font-mono text-xs font-semibold text-brand-300">
                {intent.classification}
              </span>
              <span className="text-xs text-slate-500">
                confidence {(intent.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <h4 className="mt-3 font-semibold text-white">{intent.label}</h4>
            <p className="mt-1 text-sm text-slate-400">{intent.projectLabel}</p>
            <blockquote className="mt-3 border-l-2 border-slate-700 pl-3 text-sm italic text-slate-300">
              “{intent.excerpt}”
            </blockquote>
          </div>
        ))}
      </div>
    </div>
  );
}
