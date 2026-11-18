import { useId, useState } from 'react';
import type { DemoMode, DemoUnits, StartDemoBody } from '../api/types';
import { DEFAULT_UNITS, MODES, UNIT_OPTIONS } from '../lib/liveDemoText';

/**
 * live_demo.render controls row: Mode radio, "Synthetic tasks" select and the Start button.
 * Everything is disabled while one of the user's own runs is active. Light never sends `units`.
 */
export function LiveDemoControls({
  busy,
  starting,
  onStart,
}: {
  busy: boolean;
  starting: boolean;
  onStart: (body: StartDemoBody) => void;
}) {
  const [mode, setMode] = useState<DemoMode>('light');
  const [units, setUnits] = useState<DemoUnits>(DEFAULT_UNITS);
  const id = useId();

  const start = () => onStart(mode === 'high_concurrency' ? { mode, units } : { mode });

  return (
    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[3fr_1fr_1fr]" data-testid="live-demo-controls">
      <fieldset disabled={busy} className="min-w-0">
        <legend className="mb-2 text-sm text-slate-400">Mode</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
          {(Object.keys(MODES) as DemoMode[]).map((m) => (
            <label
              key={m}
              className={`flex items-center gap-2 text-sm ${busy ? 'cursor-not-allowed text-slate-500' : 'cursor-pointer text-slate-200'}`}
            >
              <input
                type="radio"
                name={`${id}-mode`}
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
                className="h-4 w-4 accent-brand-500"
              />
              {MODES[m]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="min-w-0">
        <label htmlFor={`${id}-units`} className="mb-2 flex items-center gap-1.5 text-sm text-slate-400">
          Synthetic tasks
          <span
            className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-400"
            title="High Concurrency only; Light always uses 10."
            aria-hidden
          >
            ?
          </span>
        </label>
        <select
          id={`${id}-units`}
          value={units}
          disabled={busy || mode === 'light'}
          aria-describedby={`${id}-units-help`}
          onChange={(e) => setUnits(Number(e.target.value) as DemoUnits)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <span id={`${id}-units-help`} className="sr-only">
          High Concurrency only; Light always uses 10.
        </span>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={busy || starting}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        ▶ Start Live Demo
      </button>
    </div>
  );
}
