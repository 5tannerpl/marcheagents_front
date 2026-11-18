export type DemoStep =
  | 'incoming-email'
  | 'classification'
  | 'case-routing'
  | 'secure-retrieval'
  | 'ai-reply';

export type DemoIdentity = 'alice' | 'carol' | 'david';

export type RuntimeMode = 'public-simulation' | 'protected-live';

export const DEMO_STEPS: DemoStep[] = [
  'incoming-email',
  'classification',
  'case-routing',
  'secure-retrieval',
  'ai-reply',
];

export interface EvidenceCard {
  evidenceId: string; // only authorized evidence may carry a real ID
  caseId: string;
  projectLabel: string;
  excerpt: string;
  citation: string;
}

export interface PolicyTrace {
  traceId: string;
  policyVersion: number;
  decision: 'allow' | 'deny';
  reasonCode: string;
  // anonymous responses never carry real denied resource names/IDs
}

export interface ScenarioEmail {
  emailId: string;
  messageIdHeader: string;
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
  body: string;
}

export interface IntentCard {
  intentId: string;
  label: string;
  classification: string;
  projectId: string;
  projectLabel: string;
  confidence: number;
  excerpt: string;
}

export interface ScenarioCase {
  caseId: string;
  projectId: string;
  projectLabel: string;
  title: string;
  sla: string;
  owner: string;
  segmentId: string;
  segmentSummary: string;
}

export interface ScenarioProject {
  projectId: string;
  name: string;
  siteCode: string;
}

export interface ScenarioIdentity {
  id: DemoIdentity;
  displayName: string;
  role: string;
  /** Projects this simulated identity may read. Simulation only — never real authorization. */
  allowedProjects: string[];
}

export interface HistoryRecord {
  evidenceId: string;
  emailRef: string;
  projectId: string;
  caseId: string;
  projectLabel: string;
  excerpt: string;
  citation: string;
}

export interface SimulatedPolicyDecision {
  decision: 'allow' | 'deny';
  reasonCode: string;
  resourceCategory: string;
  /** For denied resources only an aggregate label is shown, never real IDs. */
  resourceLabel: string;
}

export interface AuditEvent {
  traceId: string;
  eventType: string;
  actor: string;
  decision: 'allow' | 'deny' | 'info';
  offsetMs: number;
  detail: string;
}

export interface ReplyDraftSection {
  caseId: string;
  projectLabel: string;
  paragraph: string;
  citedEvidenceIds: string[];
}

export interface PublicScenario {
  scenarioId: string;
  customerName: string;
  projects: ScenarioProject[];
  identities: ScenarioIdentity[];
  incomingEmail: ScenarioEmail;
  intents: IntentCard[];
  cases: ScenarioCase[];
  history: HistoryRecord[];
  policyVersion: number;
}

export interface SimulationResult {
  identity: ScenarioIdentity;
  /** Only evidence the simulated identity is allowed to see. Never full list + hiding. */
  authorizedEvidence: EvidenceCard[];
  policyDecisions: SimulatedPolicyDecision[];
  withheldCount: number;
  auditEvents: AuditEvent[];
  replySections: ReplyDraftSection[];
  traceId: string;
  policyVersion: number;
}
