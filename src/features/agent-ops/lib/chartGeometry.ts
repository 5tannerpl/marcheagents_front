/** Streamlit dark-theme categorical palette (first two entries). */
export const SERIES_COLORS = ['#83c9ff', '#0068c9'];

/** Splits a series into contiguous non-null runs so gaps stay visible. */
export function segments(x: number[], values: (number | null)[]): [number, number][][] {
  const out: [number, number][][] = [];
  let current: [number, number][] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (current.length) out.push(current);
      current = [];
    } else current.push([x[i], v]);
  });
  if (current.length) out.push(current);
  return out;
}
