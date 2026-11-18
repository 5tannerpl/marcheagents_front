/**
 * Port of the run-selection rules in live_demo.render: a run requested by Start is selected as
 * soon as it appears in the list; if the 202 body had no run id, the first new id is used; an
 * existing selection is kept while it is still listed; otherwise the newest run is selected.
 */
export interface RunSelectionState {
  selected: string | null;
  /** run_id returned by POST /start, waiting to appear in /runs. */
  requestedId: string | null;
  /** Run ids listed before a start whose response carried no run id. */
  previousIds: string[] | null;
}

export const INITIAL_SELECTION: RunSelectionState = { selected: null, requestedId: null, previousIds: null };

export function resolveSelection(state: RunSelectionState, runIds: string[]): RunSelectionState {
  if (!runIds.length) return { ...state, selected: null };
  let { selected, requestedId, previousIds } = state;
  if (requestedId && runIds.includes(requestedId)) {
    selected = requestedId;
    requestedId = null;
    previousIds = null;
  } else if (previousIds) {
    const fresh = runIds.filter((id) => !previousIds!.includes(id));
    if (fresh.length) {
      selected = fresh[0];
      previousIds = null;
    }
  }
  if (!selected || !runIds.includes(selected)) selected = runIds[0];
  return { selected, requestedId, previousIds };
}
