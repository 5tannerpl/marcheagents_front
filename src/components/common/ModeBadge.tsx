import type { RuntimeMode } from '../../types/scenario';

interface ModeBadgeProps {
  mode: RuntimeMode;
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  if (mode === 'public-simulation') {
    return (
      <span
        data-testid="mode-badge"
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-300"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
        SIMULATED DATA / SIMULATED POLICY
      </span>
    );
  }
  return (
    <span
      data-testid="mode-badge"
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
      SERVER-ENFORCED POLICY
    </span>
  );
}
