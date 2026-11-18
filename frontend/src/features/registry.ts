export interface AgentFeatureDefinition {
  id: string; // stable slug: email-support
  title: string;
  shortDescription: string;
  category: 'customer-ops' | 'compliance' | 'operations' | 'other';
  icon: string;
  publicRoute: string; // /features/email-support/demo
  liveRoute?: string; // /app/features/email-support
  status: 'available' | 'coming-soon' | 'disabled';
  capabilities: Array<
    'explainable' | 'auditable' | 'permission-aware' | 'human-review'
  >;
  demoScenarioIds: string[];
}

/**
 * Static feature registry (Phase 0/1). Display only — it carries no security
 * authority. A later phase replaces it with a BFF-served, authorized catalog.
 */
export const featureRegistry: AgentFeatureDefinition[] = [
  {
    id: 'email-support',
    title: 'Email Support Agent',
    shortDescription:
      'Turns a single customer email into multiple project cases with permission-aware retrieval, explainable drafts and a full audit trail.',
    category: 'customer-ops',
    icon: 'mail',
    publicRoute: '/features/email-support/demo',
    liveRoute: '/app/features/email-support',
    status: 'available',
    capabilities: [
      'explainable',
      'auditable',
      'permission-aware',
      'human-review',
    ],
    demoScenarioIds: ['abc-multiproject-001'],
  },
  {
    id: 'coming-soon-1',
    title: 'More Agents Coming Soon',
    shortDescription:
      'Additional agent features will join the catalog once their demos pass security review. No timelines or capabilities are promised yet.',
    category: 'other',
    icon: 'sparkles',
    publicRoute: '/features',
    status: 'coming-soon',
    capabilities: [],
    demoScenarioIds: [],
  },
  {
    id: 'coming-soon-2',
    title: 'More Agents Coming Soon',
    shortDescription:
      'This slot is a placeholder in the feature registry. It cannot be launched and triggers no demo or API.',
    category: 'other',
    icon: 'sparkles',
    publicRoute: '/features',
    status: 'coming-soon',
    capabilities: [],
    demoScenarioIds: [],
  },
];

export function getAvailableFeatures(): AgentFeatureDefinition[] {
  return featureRegistry.filter((f) => f.status === 'available');
}

export function getFeatureById(
  id: string,
): AgentFeatureDefinition | undefined {
  return featureRegistry.find((f) => f.id === id);
}
