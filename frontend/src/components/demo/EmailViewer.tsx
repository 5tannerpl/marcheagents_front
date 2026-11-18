import { Mail } from 'lucide-react';
import type { ScenarioEmail } from '../../types/scenario';

interface EmailViewerProps {
  email: ScenarioEmail;
}

export function EmailViewer({ email }: EmailViewerProps) {
  return (
    <div
      data-testid="email-viewer"
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
    >
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-5 py-3">
        <Mail className="h-4 w-4 text-brand-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">
          Incoming Email · {email.emailId}
        </h3>
      </div>
      <dl className="grid gap-x-6 gap-y-1.5 border-b border-slate-800 px-5 py-4 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-slate-500">From</dt>
          <dd className="font-mono text-slate-200">{email.from}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-slate-500">To</dt>
          <dd className="font-mono text-slate-200">{email.to}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-slate-500">Subject</dt>
          <dd className="text-slate-200">{email.subject}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-slate-500">Received</dt>
          <dd className="text-slate-200">
            {new Date(email.receivedAt).toUTCString()}
          </dd>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <dt className="w-24 shrink-0 text-slate-500">Message-ID</dt>
          <dd className="break-all font-mono text-xs text-slate-400">
            {email.messageIdHeader}
          </dd>
        </div>
      </dl>
      <p className="px-5 py-5 leading-relaxed text-slate-200">{email.body}</p>
    </div>
  );
}
