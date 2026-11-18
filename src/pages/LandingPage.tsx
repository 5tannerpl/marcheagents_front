import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  FileSearch,
  Mail,
  ScrollText,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { featureRegistry } from '../features/registry';
import { FeatureCard } from '../components/platform/FeatureCard';

const capabilities = [
  {
    icon: Eye,
    title: 'Explainability',
    description:
      'Every answer shows the exact evidence sent to the model, with citations and relevance reasons — nothing hidden behind the output.',
  },
  {
    icon: ScrollText,
    title: 'Auditability',
    description:
      'Each retrieval, policy decision and draft carries a trace ID so the full timeline can be reconstructed and reviewed.',
  },
  {
    icon: ShieldCheck,
    title: 'Permission-Aware Retrieval',
    description:
      'Access rules are applied before retrieval and re-checked per evidence item. The model only ever sees what the user is allowed to see.',
  },
  {
    icon: UserCheck,
    title: 'Human-in-the-Loop',
    description:
      'Agents produce reviewable drafts, never autonomous outbound actions. People stay in control of what leaves the system.',
  },
];

export function LandingPage() {
  const featured = featureRegistry.find((f) => f.id === 'email-support');

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="/hero-bg.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.35),rgba(2,6,23,0.75))]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-300">
              Enterprise AI Agent Showcase Platform
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              <span className="block text-brand-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]">
                Your Business,
              </span>
              <span className="block text-white">Already One Step Ahead.</span>
            </h1>
            <h2 className="mt-6 text-xl font-semibold text-slate-200 sm:text-2xl">
              Hundreds of Emails. Zero Chaos. Already Taken Care Of.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
              From incoming messages to prioritised actions — MarcheAgent will
              classify, organise, connect related projects, escalate urgent
              issues, and prepare every follow-up. So your team can focus on
              what matters most.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link
                to="/features/email-support/demo"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-500"
              >
                <Mail className="h-5 w-5" aria-hidden />
                Email Support Agent · Interactive Demo
              </Link>
              <Link
                to="/features/email-support"
                className="text-base font-semibold text-white hover:text-brand-300"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured agent */}
      {featured && (
        <section className="border-t border-slate-800/70">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Featured Agent
                </h2>
                <p className="mt-2 max-w-2xl text-slate-400">
                  The Email Support Agent is the first available feature. More
                  agents join the catalog as they pass security review.
                </p>
              </div>
              <Link
                to="/features"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-300 hover:text-brand-200"
              >
                View full catalog <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <FeatureCard feature={featured} />
              <div className="flex flex-col justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8">
                <FileSearch className="h-6 w-6 text-slate-500" aria-hidden />
                <h3 className="mt-3 font-semibold text-slate-300">
                  Explainable five-step walkthrough
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Incoming email → AI classification → case routing → secure
                  retrieval → reviewable AI reply. Switch simulated identities
                  to see how permission-aware retrieval changes the evidence an
                  agent can use — all with fully synthetic data.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Capabilities */}
      <section className="border-t border-slate-800/70 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-white">
            Platform Capabilities
          </h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            Shared capabilities every MarcheAgents feature builds on —
            independent of any single business workflow.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <cap.icon className="h-6 w-6 text-brand-300" aria-hidden />
                <h3 className="mt-3 font-semibold text-white">{cap.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
