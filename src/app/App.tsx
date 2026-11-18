import { Outlet, Link } from 'react-router-dom';
import { PlatformHeader } from '../components/platform/PlatformHeader';

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <PlatformHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            <span className="font-semibold text-slate-300">MarcheAgents</span>{' '}
            · marcheagents.com · Serving Australia · USA · UK · Europe
          </p>
          <p>
            
            <Link to="/contact" className="text-slate-400 hover:text-slate-200">
              Contact
            </Link>{' '}
            ·{' '}
            <Link
              to="/contact"
              className="text-slate-400 hover:text-slate-200"
            >
              info@marcheagents.com
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
