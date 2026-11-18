import { PenLine } from 'lucide-react';
import type { ReplyDraftSection, ScenarioIdentity } from '../../types/scenario';

interface AIReplyDraftPanelProps {
  identity: ScenarioIdentity;
  sections: ReplyDraftSection[];
  traceId: string;
}

export function AIReplyDraftPanel({
  identity,
  sections,
  traceId,
}: AIReplyDraftPanelProps) {
  return (
    <div data-testid="reply-draft" className="space-y-4">
      <div className="flex items-center gap-2">
        <PenLine className="h-4 w-4 text-brand-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">
          AI Reply Draft (review required)
        </h3>
      </div>
      <p className="text-sm text-slate-400">
        Draft generated for{' '}
        <span className="font-semibold text-slate-200">
          {identity.displayName}
        </span>{' '}
        from authorized evidence only. Nothing is sent automatically — a human
        reviews and approves every outbound reply.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-sm text-slate-300">Dear ABC Group team,</p>
        {sections.length === 0 ? (
          <p className="mt-4 text-sm italic text-slate-500">
            No draft content available: the current identity has no authorized
            evidence for the cases in this email.
          </p>
        ) : (
          sections.map((section) => (
            <div key={section.caseId} className="mt-4">
              <p className="text-sm leading-relaxed text-slate-200">
                {section.paragraph}
              </p>
              <p className="mt-1.5 font-mono text-xs text-slate-500">
                Case {section.caseId} · cites{' '}
                {section.citedEvidenceIds.join(', ') || 'no evidence'}
              </p>
            </div>
          ))
        )}
        <p className="mt-4 text-sm text-slate-300">
          Kind regards,
          <br />
          Support Team (draft — not sent)
        </p>
      </div>

      <p className="font-mono text-xs text-slate-500">Trace ID: {traceId}</p>
    </div>
  );
}
