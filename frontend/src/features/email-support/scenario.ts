import { publicScenario } from '../../data/publicScenario';
import type {
  AuditEvent,
  DemoIdentity,
  EvidenceCard,
  ReplyDraftSection,
  SimulatedPolicyDecision,
  SimulationResult,
} from '../../types/scenario';

/**
 * SIMULATED POLICY — this module mimics a server-side policy decision for the
 * public demo only. It filters evidence BEFORE anything reaches the UI so that
 * rendering components only ever receive the authorized list. It must never be
 * treated as real authorization: the protected Live mode is enforced by the BFF.
 */
export function simulateScenario(identityId: DemoIdentity): SimulationResult {
  const identity = publicScenario.identities.find((i) => i.id === identityId);
  if (!identity) {
    throw new Error(`Unknown demo identity: ${identityId}`);
  }

  const allowed = new Set(identity.allowedProjects);
  const traceId = `trace-sim-${publicScenario.scenarioId}-${identity.id}`;

  const authorizedEvidence: EvidenceCard[] = publicScenario.history
    .filter((record) => allowed.has(record.projectId))
    .map((record) => ({
      evidenceId: record.evidenceId,
      caseId: record.caseId,
      projectLabel: record.projectLabel,
      excerpt: record.excerpt,
      citation: record.citation,
    }));

  const withheldCount = publicScenario.history.length - authorizedEvidence.length;

  const policyDecisions: SimulatedPolicyDecision[] =
    publicScenario.projects.map((project) =>
      allowed.has(project.projectId)
        ? {
            decision: 'allow' as const,
            reasonCode: 'PROJECT_MEMBERSHIP_VALID',
            resourceCategory: 'project_scope',
            resourceLabel: `Project ${project.projectId} · ${project.name}`,
          }
        : {
            decision: 'deny' as const,
            reasonCode: 'PROJECT_MEMBERSHIP_REQUIRED',
            resourceCategory: 'project_scope',
            // Denied resources are shown as synthetic aggregates only.
            resourceLabel: 'Restricted project (simulated placeholder)',
          },
    );

  const auditEvents: AuditEvent[] = [
    event(traceId, 'email-support.email_received', 'system', 'info', 0, 'E-5001 ingested with Message-ID header'),
    event(traceId, 'email-support.classified', 'model (simulated)', 'info', 180, 'Two intents proposed: CLEANING_COMPLAINT, STAFFING_ISSUE'),
    event(traceId, 'email-support.project_resolved', 'policy (simulated)', 'info', 260, 'Segments mapped to Project A and Project B'),
    event(traceId, 'email-support.case_linked', 'system', 'info', 320, 'E-5001 linked to cases A-101 and B-201'),
    event(
      traceId,
      'email-support.retrieval_authorized',
      `policy (simulated) · ${identity.displayName}`,
      authorizedEvidence.length > 0 ? 'allow' : 'deny',
      410,
      `${authorizedEvidence.length} evidence item(s) authorized, ${withheldCount} withheld by simulated policy v${publicScenario.policyVersion}`,
    ),
    event(
      traceId,
      'email-support.draft_generated',
      'model (simulated)',
      'info',
      560,
      'Reply draft generated from authorized evidence only',
    ),
  ];

  const replySections: ReplyDraftSection[] = publicScenario.cases
    .filter((c) => allowed.has(c.projectId))
    .map((c) => {
      const cited = authorizedEvidence.filter((e) => e.caseId === c.caseId);
      return {
        caseId: c.caseId,
        projectLabel: c.projectLabel,
        paragraph:
          c.projectId === 'A'
            ? 'Thank you for flagging the cleaning issue at the Sydney office. Our records show the complaint was logged and the contractor has scheduled a re-clean with a follow-up inspection. We will confirm completion within the agreed SLA.'
            : 'Regarding the staffing concern at the Melbourne warehouse, two shift vacancies were identified and a roster revision has been proposed to cover them. The operations team will confirm the updated roster shortly.',
        citedEvidenceIds: cited.map((e) => e.evidenceId),
      };
    });

  return {
    identity,
    authorizedEvidence,
    policyDecisions,
    withheldCount,
    auditEvents,
    replySections,
    traceId,
    policyVersion: publicScenario.policyVersion,
  };
}

function event(
  traceId: string,
  eventType: string,
  actor: string,
  decision: AuditEvent['decision'],
  offsetMs: number,
  detail: string,
): AuditEvent {
  return { traceId, eventType, actor, decision, offsetMs, detail };
}

export { publicScenario };
