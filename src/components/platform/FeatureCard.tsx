import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';
import type { AgentFeatureDefinition } from '../../features/registry';

const capabilityLabels: Record<string, string> = {
  explainable: 'Explainability',
  auditable: 'Auditability',
  'permission-aware': 'Permission-Aware Retrieval',
  'human-review': 'Human-in-the-Loop',
};

interface FeatureCardProps {
  feature: AgentFeatureDefinition;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const available = feature.status === 'available';
  const Icon = feature.icon === 'mail' ? Mail : Sparkles;

  return (
    <article
      data-testid={`feature-card-${feature.id}`}
      className={`flex h-full flex-col rounded-xl border p-6 ${
        available
          ? 'border-brand-700/50 bg-slate-900'
          : 'border-slate-800 bg-slate-900/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`rounded-lg p-2.5 ${
            available ? 'bg-brand-500/15 text-brand-300' : 'bg-slate-800 text-slate-500'
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {available ? (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
            Available
          </span>
        ) : (
          <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
            Coming Soon
          </span>
        )}
      </div>

      <h3
        className={`mt-4 text-lg font-semibold ${
          available ? 'text-white' : 'text-slate-400'
        }`}
      >
        {feature.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
        {feature.shortDescription}
      </p>

      {feature.capabilities.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {feature.capabilities.map((cap) => (
            <li
              key={cap}
              className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
            >
              {capabilityLabels[cap] ?? cap}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        {available ? (
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/features/${feature.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Learn More
            </Link>
            <Link
              to={feature.publicRoute}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700/60 px-4 py-2 text-sm font-semibold text-brand-300 hover:bg-brand-500/10"
            >
              Try Demo <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Not yet launchable — no demo or API behind this card.
          </p>
        )}
      </div>
    </article>
  );
}
