import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  FlaskConical,
  GitBranch,
  Mail,
  ShieldCheck,
  SplitSquareHorizontal,
} from 'lucide-react';
import { getFeatureById } from '../features/registry';
import { NotFoundPage } from './NotFoundPage';

const steps = [
  {
    icon: Mail,
    title: '1 · Incoming Email',
    text: 'A single customer email arrives with its Message-ID, sender and timestamps preserved as the trusted source record.',
  },
  {
    icon: GitBranch,
    title: '2 · AI Classification',
    text: 'The agent proposes intents (e.g. CLEANING_COMPLAINT, STAFFING_ISSUE). Model suggestions are never authorization decisions.',
  },
  {
    icon: SplitSquareHorizontal,
    title: '3 · Case Routing',
    text: 'One email links to multiple project cases, each with its own SLA, owner and separately permissioned retrieval segments.',
  },
  {
    icon: ShieldCheck,
    title: '4 · Secure Retrieval',
    text: 'Retrieval is filtered by the user’s project permissions before the search runs, then every evidence item is re-authorized.',
  },
  {
    icon: FlaskConical,
    title: '5 · AI Response & Evidence',
    text: 'A reviewable reply draft is generated from authorized evidence only, with policy decisions and an audit timeline alongside.',
  },
];

export function FeatureOverviewPage() {
  const { featureId } = useParams();
  const feature = getFeatureById(featureId ?? '');

  if (!feature || feature.status !== 'available') {
    return <NotFoundPage />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">
        MarcheAgents Feature
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
        {feature.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-400">
        {feature.shortDescription}
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to={feature.publicRoute}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500"
        >
          Try the Interactive Demo <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
        <Link
          to="/features/email-support/data-protection"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800/60"
        >
          Data Protection
        </Link>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-bold text-white">How the demo works</h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          A five-step walkthrough of one synthetic email from ABC Group that
          touches two different projects — and how permissions shape what each
          simulated identity can see.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <step.icon className="h-6 w-6 text-brand-300" aria-hidden />
              <h3 className="mt-3 font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {step.text}
              </p>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6">
            <h3 className="font-semibold text-slate-300">
              Everything is synthetic
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              All customers, contacts, emails and permissions in the public
              demo are synthetic test data
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
