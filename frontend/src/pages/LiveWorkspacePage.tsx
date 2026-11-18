import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { ModeBadge } from '../components/common/ModeBadge';

export function LiveWorkspacePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900">
        <Lock className="h-6 w-6 text-slate-400" aria-hidden />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-white">
        Protected Live Workspace
      </h1>
      <div className="mt-4 flex justify-center">
        <ModeBadge mode="protected-live" />
      </div>
      <p className="mx-auto mt-6 max-w-xl text-slate-400">
        The Live workspace requires a real OIDC sign-in with server-enforced
        authorization, retrieval and auditing. It is not enabled in this
        deployment yet — only the public simulation is available. Browser-side
        identity switching never grants real access.
      </p>
      <Link
        to="/features/email-support/demo"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500"
      >
        Open the Public Demo instead
      </Link>
    </div>
  );
}
