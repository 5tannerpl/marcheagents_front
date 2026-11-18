import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-4 text-slate-400">
        The page you requested does not exist on MarcheAgents.
      </p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500"
      >
        Back to Home
      </Link>
    </div>
  );
}
