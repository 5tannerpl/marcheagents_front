/**
 * Dependency-free SVG line chart standing in for `st.line_chart(height=310)`: shared x axis
 * (seconds since the first retained snapshot), one line per series, null readings kept as gaps,
 * legend and a hover crosshair with the values at the nearest sample.
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { ChartSeries } from '../lib/chartFrames';
import { SERIES_COLORS, segments } from '../lib/chartGeometry';


const MARGIN = { top: 12, right: 16, bottom: 34, left: 52 };
const DEFAULT_WIDTH = 560;

function niceStep(span: number, target: number): number {
  const raw = span / Math.max(1, target);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
}

function ticks(min: number, max: number, target: number): number[] {
  if (max <= min) return [min];
  const step = niceStep(max - min, target);
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

const fmtTick = (v: number) => (Math.abs(v) >= 1000 ? v.toLocaleString('en-US') : String(Number(v.toFixed(2))));

function nearestIndex(x: number[], target: number): number {
  let lo = 0;
  let hi = x.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (x[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(x[lo - 1] - target) <= Math.abs(x[lo] - target)) return lo - 1;
  return lo;
}

export function LineChart({
  title,
  x,
  series,
  height = 310,
}: {
  title: string;
  x: number[];
  series: ChartSeries[];
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotH = height - MARGIN.top - MARGIN.bottom;
  const plotW = Math.max(40, width - MARGIN.left - MARGIN.right);

  const scale = useMemo(() => {
    const xs = x.length ? x : [0];
    const xMin = xs[0];
    const xMax = xs[xs.length - 1] > xMin ? xs[xs.length - 1] : xMin + 1;
    const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
    const yMin = Math.min(0, ...all);
    const rawMax = Math.max(...all, 0);
    const yMax = rawMax > yMin ? rawMax * 1.05 : yMin + 1;
    return {
      xMin,
      xMax,
      yMin,
      yMax,
      sx: (v: number) => MARGIN.left + ((v - xMin) / (xMax - xMin)) * plotW,
      sy: (v: number) => MARGIN.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH,
    };
  }, [x, series, plotW, plotH]);

  const xTicks = ticks(scale.xMin, scale.xMax, Math.max(2, Math.floor(plotW / 80)));
  const yTicks = ticks(scale.yMin, scale.yMax, 5);

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    if (!x.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / Math.max(1, rect.width)) * plotW;
    const value = scale.xMin + (px / plotW) * (scale.xMax - scale.xMin);
    setHover(nearestIndex(x, value));
  };

  const hoverX = hover !== null ? scale.sx(x[hover]) : null;

  return (
    <div ref={ref} className="relative w-full" data-testid={`chart-${title}`}>
      <svg
        role="img"
        aria-label={`${title} line chart: ${series.map((s) => s.label).join(', ')} over t (seconds)`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto max-w-full"
      >
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line x1={MARGIN.left} x2={MARGIN.left + plotW} y1={scale.sy(v)} y2={scale.sy(v)} className="stroke-slate-800" />
            <text x={MARGIN.left - 6} y={scale.sy(v)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[11px]">
              {fmtTick(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text
            key={`x${v}`}
            x={scale.sx(v)}
            y={MARGIN.top + plotH + 16}
            textAnchor="middle"
            className="fill-slate-400 text-[11px]"
          >
            {fmtTick(v)}
          </text>
        ))}
        <text x={MARGIN.left + plotW / 2} y={height - 2} textAnchor="middle" className="fill-slate-500 text-[11px]">
          t
        </text>
        {series.map((s, si) =>
          segments(x, s.values).map((seg, k) =>
            seg.length === 1 ? (
              <circle
                key={`${s.key}-${k}`}
                cx={scale.sx(seg[0][0])}
                cy={scale.sy(seg[0][1])}
                r={2}
                fill={SERIES_COLORS[si % SERIES_COLORS.length]}
              />
            ) : (
              <polyline
                key={`${s.key}-${k}`}
                data-testid={`series-${s.label}`}
                points={seg.map(([a, b]) => `${scale.sx(a)},${scale.sy(b)}`).join(' ')}
                fill="none"
                stroke={SERIES_COLORS[si % SERIES_COLORS.length]}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            ),
          ),
        )}
        {hoverX !== null && (
          <line x1={hoverX} x2={hoverX} y1={MARGIN.top} y2={MARGIN.top + plotH} className="stroke-slate-500" strokeDasharray="3 3" />
        )}
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 pl-12 text-xs text-slate-300" aria-label={`${title} legend`}>
        {series.map((s, si) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: SERIES_COLORS[si % SERIES_COLORS.length] }} />
            {s.label}
          </li>
        ))}
      </ul>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-slate-700 bg-slate-950/95 px-2.5 py-1.5 text-xs text-slate-200 shadow-lg"
          style={{ left: Math.min(Math.max(0, (hoverX ?? 0) + 8), Math.max(0, width - 150)) }}
        >
          <p className="text-slate-400">t = {x[hover]}</p>
          {series.map((s, si) => (
            <p key={s.key}>
              <span style={{ color: SERIES_COLORS[si % SERIES_COLORS.length] }}>●</span> {s.label}:{' '}
              {s.values[hover] ?? '—'}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
