import { useId } from 'react';

/** live_demo.render "Run" selectbox: raw run ids from /runs, newest first. */
export function RunSelector({
  runIds,
  selected,
  onSelect,
}: {
  runIds: string[];
  selected: string;
  onSelect: (runId: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-slate-400">
        Run
      </label>
      <select
        id={id}
        data-testid="run-selector"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100"
      >
        {runIds.map((runId) => (
          <option key={runId} value={runId}>
            {runId}
          </option>
        ))}
      </select>
    </div>
  );
}
