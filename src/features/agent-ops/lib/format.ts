/** Ports of dashboard/ui.fmt_ts and live_demo.na. */

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * `YYYY-MM-DD HH:MM:SS` in the browser's local time zone (Streamlit used the server's zone;
 * see migration doc §3.2 / B0). Falsy timestamps render as an em dash, as in Python.
 */
export function fmtTs(ts: number | null | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** Python `str()` of a scalar: booleans as True/False. */
function pyStr(value: number | boolean | string): string {
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return String(value);
}

export type NaFormat = 'plain' | 'thousands' | 'fixed1';

/**
 * live_demo.na: "N/A" for missing values, otherwise the formatted value plus suffix.
 * `thousands` = Python "{:,}", `fixed1` = "{:.1f}".
 */
export function na(
  value: number | boolean | string | null | undefined,
  format: NaFormat = 'plain',
  suffix = '',
): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    if (format === 'thousands') return value.toLocaleString('en-US', { maximumFractionDigits: 20 }) + suffix;
    if (format === 'fixed1') return value.toFixed(1) + suffix;
  }
  return pyStr(value) + suffix;
}
