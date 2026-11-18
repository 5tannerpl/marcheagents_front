import { Link } from 'react-router-dom';
import { Activity, Cpu, Network } from 'lucide-react';
import { ModeBadge } from '../components/common/ModeBadge';

const highlights = [
  {
    title: 'Dual-GPU AI Workstation',
    description:
      'Run AI workloads across two GPUs with real-time resource monitoring.',
  },
  {
    title: 'Live Operations Dashboard',
    description:
      'Monitor GPU utilisation, worker activity, agent execution status and task progress in real time.',
  },
  {
    title: 'Intelligent Auto-Scaling',
    description:
      'See workers automatically scale from 2 to 8 as workload increases, then scale back down when demand decreases.',
  },
  {
    title: 'GPU & Worker Management',
    description:
      'Visualise how workloads are distributed across GPUs and workers.',
  },
  {
    title: 'Execution Monitoring',
    description:
      'Track running agents, completed tasks, processing performance and execution events.',
  },
];

const previewStats = [
  { icon: Cpu, value: '2 GPUs', label: 'AI Compute' },
  { icon: Network, value: '2 → 8 → 2', label: 'Auto-Scaling' },
  { icon: Activity, value: 'Real-Time', label: 'Agent Status' },
];

export function LiveWorkspacePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          Live AI Agent Operations Demo
        </h1>
        <div className="mt-4 flex justify-center">
          <ModeBadge mode="protected-live" />
        </div>
        <p className="mx-auto mt-6 max-w-xl text-slate-400">
          Explore how AI agents run on a real AI workstation equipped with{' '}
          <strong className="text-slate-200">2 GPUs</strong>, monitored through
          a live Agent Operations Dashboard.
        </p>
      </div>

      {/* Live demo preview card */}
      <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Live Demo Card — Preview
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">
          AI Agent Operations — Live Demo
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          2-GPU AI Workstation · Real-Time Monitoring · Intelligent
          Auto-Scaling
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {previewStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon
                className="mx-auto h-6 w-6 text-brand-300"
                aria-hidden
              />
              <p className="mt-2 font-semibold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-12 text-lg font-semibold text-white">
        Watch the system in action:
      </h2>
      <ul className="mt-4 space-y-4">
        {highlights.map((item) => (
          <li
            key={item.title}
            className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
          >
            <p className="font-semibold text-slate-200">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {item.description}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center font-semibold text-slate-200">
        Experience real AI agent orchestration, resource management and
        auto-scaling in action.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500"
        >
          Request Live Demo Access
        </Link>
        <Link
          to="/features/email-support/demo"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800/60"
        >
          Try the Public Demo
        </Link>
      </div>

      <p className="mt-6 text-center text-xs italic text-slate-500">
        Live demo access is subject to availability and authentication.
      </p>
    </div>
  );
}
