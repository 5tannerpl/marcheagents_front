import { UserRound } from 'lucide-react';
import type { DemoIdentity, ScenarioIdentity } from '../../types/scenario';

interface IdentitySwitcherProps {
  identities: ScenarioIdentity[];
  currentIdentity: DemoIdentity;
  onSelect: (identity: DemoIdentity) => void;
}

export function IdentitySwitcher({
  identities,
  currentIdentity,
  onSelect,
}: IdentitySwitcherProps) {
  return (
    <div data-testid="identity-switcher">
      <h3 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <UserRound className="h-3.5 w-3.5" aria-hidden /> Simulated Identity
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        Switching identities only changes the simulation — it is never real
        authentication.
      </p>
      <div className="space-y-1.5" role="radiogroup" aria-label="Simulated identity">
        {identities.map((identity) => {
          const selected = identity.id === currentIdentity;
          return (
            <button
              key={identity.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(identity.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                selected
                  ? 'border-brand-500/60 bg-brand-500/10 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>
                <span className="block font-semibold">
                  {identity.displayName}
                </span>
                <span className="block text-xs text-slate-400">
                  {identity.role}
                </span>
              </span>
              <span className="flex gap-1" aria-label={`Projects: ${identity.allowedProjects.join(', ')}`}>
                {identity.allowedProjects.map((p) => (
                  <span
                    key={p}
                    className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 font-mono text-[10px] font-bold text-brand-300"
                  >
                    {p}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
