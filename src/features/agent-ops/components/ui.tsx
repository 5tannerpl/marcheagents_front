/** Small presentational equivalents of the Streamlit primitives the Live Demo panel uses. */
import type { ReactNode } from 'react';

type AlertKind = 'error' | 'warning' | 'info' | 'success';

const ALERT_STYLES: Record<AlertKind, string> = {
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
};

/** st.error / st.warning / st.info / st.success */
export function Alert({ kind, children, testId }: { kind: AlertKind; children: ReactNode; testId?: string }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      data-testid={testId}
      className={`rounded-lg border px-4 py-3 text-sm ${ALERT_STYLES[kind]}`}
    >
      {children}
    </div>
  );
}

/** st.caption */
export function Caption({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-slate-400 ${className}`}>{children}</p>;
}

/** `#### Heading` */
export function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-3 text-lg font-semibold text-white">{children}</h3>;
}

/** st.container(border=True) */
export function BorderedBox({ children, className = '', testId }: { children: ReactNode; className?: string; testId?: string }) {
  return (
    <div data-testid={testId} className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

/** st.metric */
export function Metric({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div data-testid={testId} className="min-w-0">
      <p className="text-sm break-words text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold break-words text-white tabular-nums sm:text-2xl xl:text-3xl">
        {value}
      </p>
    </div>
  );
}

/** st.dataframe(hide_index=True, width="stretch") — scrolls inside a fixed max height like Streamlit. */
export function DataTable({
  columns,
  rows,
  testId,
  caption,
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
  testId?: string;
  caption?: string;
}) {
  return (
    <div data-testid={testId} className="max-h-96 overflow-auto rounded-lg border border-slate-800">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="sticky top-0 bg-slate-900">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="border-b border-slate-800 px-3 py-2 font-medium text-slate-400">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="odd:bg-slate-950/40">
              {row.map((cell, j) => (
                <td key={j} className="border-b border-slate-800/60 px-3 py-1.5 align-top text-slate-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
