import type { MockFailureMode } from '../api/mock/MockAobApi';
import type { ScenarioVariant } from '../api/mock/simulation';
import { API_BEHAVIOUR_LABELS, OUTCOME_LABELS, SPEEDS } from '../lib/simulationOptions';

/**
 * Always-visible marker that the dashboard runs on synthetic fixtures, plus the controls used to
 * reproduce each documented state without a backend.
 */
export function SimulationBanner({
  outcome,
  behaviour,
  speed,
  onOutcome,
  onBehaviour,
  onSpeed,
}: {
  outcome: ScenarioVariant;
  behaviour: MockFailureMode;
  speed: number;
  onOutcome: (v: ScenarioVariant) => void;
  onBehaviour: (v: MockFailureMode) => void;
  onSpeed: (v: number) => void;
}) {
  const selectClass =
    'mt-1 w-full rounded-md border border-amber-500/30 bg-slate-950 px-2 py-1.5 text-sm text-slate-100';
  return (
    <section
      data-testid="simulation-banner"
      aria-label="Simulation notice"
      className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
          SIMULATED DATA
        </span>
        <p className="text-sm text-amber-100">
          Synthetic fixtures generated in your browser. No AOB API, Kaggle batch or GPU is contacted and nothing on
          this page is live telemetry.
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-amber-200/80">
          Next run outcome
          <select
            className={selectClass}
            value={outcome}
            onChange={(e) => onOutcome(e.target.value as ScenarioVariant)}
          >
            {Object.entries(OUTCOME_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-amber-200/80">
          API behaviour
          <select
            className={selectClass}
            value={behaviour}
            onChange={(e) => onBehaviour(e.target.value as MockFailureMode)}
          >
            {Object.entries(API_BEHAVIOUR_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-amber-200/80">
          Simulation speed (resets session runs)
          <select className={selectClass} value={speed} onChange={(e) => onSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
