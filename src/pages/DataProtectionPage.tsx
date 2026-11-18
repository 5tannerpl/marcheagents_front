import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Info,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { dataProtectionTestCases } from '../data/dataProtectionTests';
import type {
  AccessStatus,
  DataProtectionTestRun,
} from '../types/dataProtection';
import { ModeBadge } from '../components/common/ModeBadge';

const accessStatusConfig: Record<
  AccessStatus,
  { label: string; badgeClass: string; panelClass: string; Icon: typeof Lock }
> = {
  'access-granted': {
    label: 'Access Granted',
    badgeClass: 'bg-emerald-500/10 text-emerald-300',
    panelClass: 'border-emerald-800/40 bg-emerald-950/20',
    Icon: CheckCircle2,
  },
  'additional-access-required': {
    label: 'Additional Access Required',
    badgeClass: 'bg-amber-500/10 text-amber-300',
    panelClass: 'border-amber-800/40 bg-amber-950/20',
    Icon: Lock,
  },
  'information-protected': {
    label: 'Information Protected',
    badgeClass: 'bg-sky-500/10 text-sky-300',
    panelClass: 'border-sky-800/40 bg-sky-950/20',
    Icon: ShieldCheck,
  },
  'access-updated': {
    label: 'Access Updated',
    badgeClass: 'bg-violet-500/10 text-violet-300',
    panelClass: 'border-violet-800/40 bg-violet-950/20',
    Icon: RefreshCw,
  },
  'sensitive-information-protected': {
    label: 'Sensitive Information Protected',
    badgeClass: 'bg-rose-500/10 text-rose-300',
    panelClass: 'border-rose-800/40 bg-rose-950/20',
    Icon: ShieldCheck,
  },
};

function initialRuns(): DataProtectionTestRun[] {
  return dataProtectionTestCases.map((test) => ({
    testId: test.id,
    status: 'idle',
  }));
}

export function DataProtectionPage() {
  const [runs, setRuns] = useState<DataProtectionTestRun[]>(initialRuns);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const runOne = useCallback((testId: string) => {
    const test = dataProtectionTestCases.find((t) => t.id === testId);
    if (!test) return;
    setRuns((prev) =>
      prev.map((run) =>
        run.testId === testId ? { testId, status: 'running' } : run,
      ),
    );
    const timer = window.setTimeout(() => {
      setRuns((prev) =>
        prev.map((run) =>
          run.testId === testId
            ? {
                testId,
                status: 'completed',
                accessStatus: test.simulatedOutcome.accessStatus,
              }
            : run,
        ),
      );
    }, 900);
    timers.current.push(timer);
  }, []);

  const reset = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setRuns(initialRuns());
  }, []);

  const anyRunning = runs.some((r) => r.status === 'running');
  const completedCount = runs.filter((r) => r.status === 'completed').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Data Protection in Action
          </h1>
          <h2 className="mt-3 text-xl font-semibold text-slate-200">
            Your Business Data. Protected at Every Step.
          </h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            See how MarcheAgents helps protect sensitive business information
            while keeping your teams informed and connected.
          </p>
        </div>
        <ModeBadge mode="public-simulation" />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        <div className="text-sm text-slate-300">
          <p className="font-semibold text-slate-200">
            Interactive Demonstration
          </p>
          <p className="mt-1">
            These examples use fictional customers and sample business
            information to demonstrate how MarcheAgents is designed to protect
            your data. Actual security verification will be available when the
            live system is enabled.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/60"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset
        </button>
        <span className="text-sm text-slate-400" data-testid="pass-count">
          {completedCount}/{dataProtectionTestCases.length} scenarios explored
        </span>
      </div>

      <ul className="mt-8 space-y-4">
        {dataProtectionTestCases.map((test) => {
          const run = runs.find((r) => r.testId === test.id);
          const outcome = run?.accessStatus
            ? accessStatusConfig[run.accessStatus]
            : undefined;
          return (
            <li
              key={test.id}
              data-testid={`security-test-${test.id}`}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-white">
                  <span className="mr-2 font-mono text-sm text-slate-500">
                    {test.number}
                  </span>
                  {test.title}
                </h3>
                <div className="flex items-center gap-2">
                  {run?.status === 'idle' && (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                      Not explored
                    </span>
                  )}
                  {run?.status === 'running' && (
                    <span className="rounded-full bg-brand-900/60 px-2.5 py-0.5 text-xs font-semibold text-brand-300">
                      Checking…
                    </span>
                  )}
                  {run?.status === 'completed' && outcome && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${outcome.badgeClass}`}
                    >
                      <outcome.Icon className="h-3.5 w-3.5" aria-hidden />
                      {outcome.label}
                    </span>
                  )}
                  {run?.status === 'idle' && (
                    <button
                      type="button"
                      onClick={() => runOne(test.id)}
                      disabled={anyRunning}
                      data-testid={`run-test-${test.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden /> Explore
                      scenario
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scenario
                </p>
                <p className="mt-0.5 text-slate-300">{test.scenario}</p>
              </div>
              {run?.status === 'completed' && outcome && (
                <div
                  className={`mt-3 rounded-lg border p-3 ${outcome.panelClass}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Data Protection
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {test.protection}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
