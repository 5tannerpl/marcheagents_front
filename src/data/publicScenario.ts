import type { PublicScenario } from '../types/scenario';

/**
 * Fully synthetic public demo scenario (ABC Group / Sydney / Melbourne / Brisbane).
 * No real customer data, mailboxes, or credentials. Everything here is safe to ship
 * in a public browser bundle.
 */
export const publicScenario: PublicScenario = {
  scenarioId: 'abc-multiproject-001',
  customerName: 'ABC Group',
  policyVersion: 7,
  projects: [
    { projectId: 'A', name: 'Sydney Office', siteCode: 'SYD-01' },
    { projectId: 'B', name: 'Melbourne Warehouse', siteCode: 'MEL-02' },
    { projectId: 'C', name: 'Brisbane Retail', siteCode: 'BNE-03' },
  ],
  identities: [
    {
      id: 'alice',
      displayName: 'Alice',
      role: 'Site Supervisor',
      allowedProjects: ['A'],
    },
    {
      id: 'carol',
      displayName: 'Carol',
      role: 'Regional Manager',
      allowedProjects: ['A', 'B'],
    },
    {
      id: 'david',
      displayName: 'David',
      role: 'Account Director',
      allowedProjects: ['A', 'B', 'C'],
    },
  ],
  incomingEmail: {
    emailId: 'E-5001',
    messageIdHeader: '<e5001.demo@abc.example>',
    from: 'manager@abc.example',
    to: 'support@marcheagents.example',
    subject: 'Cleaning and Staffing Concerns',
    receivedAt: '2026-11-17T08:42:00Z',
    body: 'Our Sydney office cleaning was unsatisfactory yesterday. We also have a staffing issue at our Melbourne warehouse. Please investigate both issues.',
  },
  intents: [
    {
      intentId: 'intent-cleaning',
      label: 'Cleaning Complaint',
      classification: 'CLEANING_COMPLAINT',
      projectId: 'A',
      projectLabel: 'Project A · Sydney Office',
      confidence: 0.94,
      excerpt: 'Our Sydney office cleaning was unsatisfactory yesterday.',
    },
    {
      intentId: 'intent-staffing',
      label: 'Staffing Issue',
      classification: 'STAFFING_ISSUE',
      projectId: 'B',
      projectLabel: 'Project B · Melbourne Warehouse',
      confidence: 0.91,
      excerpt: 'We also have a staffing issue at our Melbourne warehouse.',
    },
  ],
  cases: [
    {
      caseId: 'A-101',
      projectId: 'A',
      projectLabel: 'Project A · Sydney Office',
      title: 'Cleaning Complaint — Sydney Office',
      sla: 'Respond within 4 business hours',
      owner: 'Sydney Facilities Team',
      segmentId: 'SEG-A',
      segmentSummary: 'Sydney cleaning complaint segment of E-5001',
    },
    {
      caseId: 'B-201',
      projectId: 'B',
      projectLabel: 'Project B · Melbourne Warehouse',
      title: 'Staffing Issue — Melbourne Warehouse',
      sla: 'Respond within 8 business hours',
      owner: 'Melbourne Operations Team',
      segmentId: 'SEG-B',
      segmentSummary: 'Melbourne staffing segment of E-5001',
    },
  ],
  history: [
    {
      evidenceId: 'evidence-a-100',
      emailRef: 'E-100',
      projectId: 'A',
      caseId: 'A-101',
      projectLabel: 'Project A · Sydney Office',
      excerpt:
        'Cleaning quality concern reported for Sydney office level 3 on 12 Nov.',
      citation: 'E-100 / approved segment',
    },
    {
      evidenceId: 'evidence-a-101',
      emailRef: 'E-101',
      projectId: 'A',
      caseId: 'A-101',
      projectLabel: 'Project A · Sydney Office',
      excerpt:
        'Investigation update: contractor scheduled a re-clean and inspection.',
      citation: 'E-101 / approved segment',
    },
    {
      evidenceId: 'evidence-b-200',
      emailRef: 'E-200',
      projectId: 'B',
      caseId: 'B-201',
      projectLabel: 'Project B · Melbourne Warehouse',
      excerpt:
        'Staffing incident logged: two shift vacancies at Melbourne warehouse.',
      citation: 'E-200 / approved segment',
    },
    {
      evidenceId: 'evidence-b-201',
      emailRef: 'E-201',
      projectId: 'B',
      caseId: 'B-201',
      projectLabel: 'Project B · Melbourne Warehouse',
      excerpt: 'Roster revision proposed to cover the vacant warehouse shifts.',
      citation: 'E-201 / approved segment',
    },
    {
      evidenceId: 'evidence-c-300',
      emailRef: 'E-300',
      projectId: 'C',
      caseId: 'C-301',
      projectLabel: 'Project C · Brisbane Retail',
      excerpt: 'Invoice query raised for Brisbane retail October services.',
      citation: 'E-300 / approved segment',
    },
  ],
};
