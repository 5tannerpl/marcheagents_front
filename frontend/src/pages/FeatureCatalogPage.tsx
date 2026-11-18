import { featureRegistry } from '../features/registry';
import { FeatureCard } from '../components/platform/FeatureCard';

export function FeatureCatalogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-white">Agent Feature Catalog</h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        Every MarcheAgents feature shares the same explainability, audit and
        permission infrastructure. The Email Support Agent is currently the
        only available feature; the remaining slots are placeholders with no
        functionality behind them.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featureRegistry.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  );
}
