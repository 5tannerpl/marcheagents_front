import { History } from 'lucide-react';
import type { AuditEvent } from '../../types/scenario';

interface AuditTimelineProps {
  events: AuditEvent[];
  traceId: string;
}

export function AuditTimeline({ events, traceId }: AuditTimelineProps) {
  return (
    <div data-testid="audit-timeline" className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-brand-300" aria-hidden />
        <h4 className="text-sm font-semibold text-white">Audit Events</h4>
      </div>
      <p className="break-all font-mono text-[11px] text-slate-500">
        trace: {traceId}
      </p>
      <ol className="relative space-y-3 border-l border-slate-800 pl-4">
        {events.map((event) => (
          <li key={event.eventType} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${
                event.decision === 'deny'
                  ? 'bg-rose-400'
                  : event.decision === 'allow'
                    ? 'bg-emerald-400'
                    : 'bg-brand-400'
              }`}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <span className="font-mono text-xs font-semibold text-slate-200">
                {event.eventType}
              </span>
              <span className="text-[11px] text-slate-500">
                +{event.offsetMs} ms
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">{event.detail}</p>
            <p className="mt-0.5 text-[11px] text-slate-600">{event.actor}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
