import { describe, expect, it } from 'vitest';
import { publicScenario, simulateScenario } from './scenario';

describe('simulateScenario (simulated policy)', () => {
  it('gives Alice only Project A evidence', () => {
    const result = simulateScenario('alice');
    expect(result.authorizedEvidence.length).toBeGreaterThan(0);
    expect(
      result.authorizedEvidence.every((e) => e.caseId.startsWith('A-')),
    ).toBe(true);
    expect(result.withheldCount).toBe(3); // B-200, B-201, C-300
  });

  it('gives Carol Project A and B evidence but not C', () => {
    const result = simulateScenario('carol');
    const caseIds = result.authorizedEvidence.map((e) => e.caseId);
    expect(caseIds).toContain('A-101');
    expect(caseIds).toContain('B-201');
    expect(caseIds.some((id) => id.startsWith('C-'))).toBe(false);
    expect(result.withheldCount).toBe(1);
  });

  it('gives David evidence from all three projects with nothing withheld', () => {
    const result = simulateScenario('david');
    expect(result.authorizedEvidence).toHaveLength(
      publicScenario.history.length,
    );
    expect(result.withheldCount).toBe(0);
  });

  it('never leaks denied project text or evidence IDs to Alice', () => {
    const result = simulateScenario('alice');
    const serialized = JSON.stringify(result.authorizedEvidence);
    expect(serialized).not.toContain('Melbourne');
    expect(serialized).not.toContain('Brisbane');
    expect(serialized).not.toContain('evidence-b-');
    expect(serialized).not.toContain('evidence-c-');
    // denied policy decisions carry only synthetic placeholder labels
    const denied = result.policyDecisions.filter((d) => d.decision === 'deny');
    expect(denied).toHaveLength(2);
    for (const decision of denied) {
      expect(decision.reasonCode).toBe('PROJECT_MEMBERSHIP_REQUIRED');
      expect(decision.resourceLabel).not.toMatch(/Melbourne|Brisbane|B-|C-/);
    }
  });

  it('limits reply draft sections and citations to authorized cases', () => {
    const alice = simulateScenario('alice');
    expect(alice.replySections).toHaveLength(1);
    expect(alice.replySections[0].caseId).toBe('A-101');
    expect(
      alice.replySections[0].citedEvidenceIds.every((id) =>
        id.startsWith('evidence-a-'),
      ),
    ).toBe(true);

    const carol = simulateScenario('carol');
    expect(carol.replySections.map((s) => s.caseId)).toEqual([
      'A-101',
      'B-201',
    ]);
  });

  it('produces a per-identity trace id and the scenario policy version', () => {
    const result = simulateScenario('carol');
    expect(result.traceId).toContain('carol');
    expect(result.policyVersion).toBe(publicScenario.policyVersion);
    expect(result.auditEvents.length).toBeGreaterThanOrEqual(6);
    expect(result.auditEvents.every((e) => e.traceId === result.traceId)).toBe(
      true,
    );
  });

  it('rejects unknown identities', () => {
    expect(() =>
      simulateScenario('mallory' as Parameters<typeof simulateScenario>[0]),
    ).toThrow(/Unknown demo identity/);
  });
});
