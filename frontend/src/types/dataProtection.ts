export type DataProtectionTestStatus = 'idle' | 'running' | 'completed';

/** Business-friendly outcome shown to enterprise customers. */
export type AccessStatus =
  | 'access-granted'
  | 'additional-access-required'
  | 'information-protected'
  | 'access-updated'
  | 'sensitive-information-protected';

export interface DataProtectionTestCase {
  /** Stable internal test ID — kept unchanged for backend/audit mapping. */
  id: string;
  /** Display number, e.g. '01'. */
  number: string;
  title: string;
  /** What situation the customer encountered. */
  scenario: string;
  /** How the system protects the information (plain-language explanation). */
  protection: string;
  /** Deterministic simulated outcome for the synthetic-data demonstration. */
  simulatedOutcome: {
    accessStatus: AccessStatus;
  };
}

export interface DataProtectionTestRun {
  testId: string;
  status: DataProtectionTestStatus;
  accessStatus?: AccessStatus;
}
