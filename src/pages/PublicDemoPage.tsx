import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import {
  DEMO_STEPS,
  type DemoIdentity,
  type DemoStep,
} from '../types/scenario';
import {
  publicScenario,
  simulateScenario,
} from '../features/email-support/scenario';
import { ModeBadge } from '../components/common/ModeBadge';
import { DemoStepper } from '../components/demo/DemoStepper';
import { STEP_LABELS } from '../components/demo/stepLabels';
import { EmailViewer } from '../components/demo/EmailViewer';
import { IntentClassificationPanel } from '../components/demo/IntentClassificationPanel';
import { CaseSplitVisualizer } from '../components/demo/CaseSplitVisualizer';
import { IdentitySwitcher } from '../components/demo/IdentitySwitcher';
import { SecureRetrievalPanel } from '../components/demo/SecureRetrievalPanel';
import { AIReplyDraftPanel } from '../components/demo/AIReplyDraftPanel';
import { AIContextInspector } from '../components/inspectors/AIContextInspector';
import { PolicyDecisionInspector } from '../components/inspectors/PolicyDecisionInspector';
import { AuditTimeline } from '../components/inspectors/AuditTimeline';

type InspectorTab = 'context' | 'policy' | 'audit';

const IDENTITIES: DemoIdentity[] = ['alice', 'carol', 'david'];

function parseStep(value: string | null): DemoStep {
  return DEMO_STEPS.includes(value as DemoStep)
    ? (value as DemoStep)
    : 'incoming-email';
}

function parseIdentity(value: string | null): DemoIdentity {
  return IDENTITIES.includes(value as DemoIdentity)
    ? (value as DemoIdentity)
    : 'alice';
}

export function PublicDemoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const step = parseStep(searchParams.get('step'));
  const identityId = parseIdentity(searchParams.get('identity'));
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('context');

  // Simulation recomputes immediately on identity change; only authorized
  // evidence ever reaches the rendering components below.
  const simulation = useMemo(() => simulateScenario(identityId), [identityId]);

  const stepIndex = DEMO_STEPS.indexOf(step);

  const setStep = (next: DemoStep) => {
    setSearchParams(
      (prev) => {
        prev.set('step', next);
        return prev;
      },
      { replace: true },
    );
  };

  const setIdentity = (next: DemoIdentity) => {
    setSearchParams(
      (prev) => {
        prev.set('identity', next);
        return prev;
      },
      { replace: true },
    );
  };

  const stepContent = () => {
    switch (step) {
      case 'incoming-email':
        return <EmailViewer email={publicScenario.incomingEmail} />;
      case 'classification':
        return <IntentClassificationPanel intents={publicScenario.intents} />;
      case 'case-routing':
        return (
          <CaseSplitVisualizer
            email={publicScenario.incomingEmail}
            cases={publicScenario.cases}
          />
        );
      case 'secure-retrieval':
        return (
          <SecureRetrievalPanel
            identity={simulation.identity}
            authorizedEvidence={simulation.authorizedEvidence}
            withheldCount={simulation.withheldCount}
          />
        );
      case 'ai-reply':
        return (
          <AIReplyDraftPanel
            identity={simulation.identity}
            sections={simulation.replySections}
            traceId={simulation.traceId}
          />
        );
    }
  };

  const inspectorTabs: Array<{ id: InspectorTab; label: string }> = [
    { id: 'context', label: 'Evidence Sent to LLM' },
    { id: 'policy', label: 'Policy Evaluation' },
    { id: 'audit', label: 'Audit Events' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Email Support Agent · Interactive Demo
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Scenario {publicScenario.scenarioId} · all data is synthetic
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ModeBadge mode="public-simulation" />
        </div>
      </div>

      {/* Horizontal stepper for narrow screens */}
      <div className="mt-6 lg:hidden">
        <DemoStepper currentStep={step} onSelect={setStep} orientation="horizontal" />
        <p className="mt-2 text-center text-sm font-semibold text-brand-200">
          Step {stepIndex + 1}: {STEP_LABELS[step]}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[25%_minmax(0,1fr)_30%] lg:gap-6">
        {/* Left column */}
        <aside className="space-y-6">
          <div className="hidden rounded-xl border border-slate-800 bg-slate-900/50 p-4 lg:block">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Workflow Steps
            </h2>
            <DemoStepper currentStep={step} onSelect={setStep} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <IdentitySwitcher
              identities={publicScenario.identities}
              currentIdentity={identityId}
              onSelect={setIdentity}
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {publicScenario.customerName}
            </h2>
            <ul className="space-y-1.5 text-sm">
              {publicScenario.projects.map((project) => {
                const allowed = simulation.identity.allowedProjects.includes(
                  project.projectId,
                );
                return (
                  <li
                    key={project.projectId}
                    className="flex items-center justify-between gap-2 rounded-md bg-slate-900 px-3 py-1.5"
                  >
                    <span className={allowed ? 'text-slate-200' : 'text-slate-500'}>
                      <span className="font-mono font-bold">
                        {project.projectId}
                      </span>{' '}
                      · {project.name}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        allowed ? 'text-emerald-300' : 'text-slate-600'
                      }`}
                    >
                      {allowed ? 'in scope' : 'out of scope'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Center column */}
        <section
          aria-label={`Step ${stepIndex + 1}: ${STEP_LABELS[step]}`}
          className="min-w-0"
        >
          {stepContent()}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(DEMO_STEPS[Math.max(0, stepIndex - 1)])}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setStep(DEMO_STEPS[Math.min(DEMO_STEPS.length - 1, stepIndex + 1)])
              }
              disabled={stepIndex === DEMO_STEPS.length - 1}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>

        {/* Right column: inspectors */}
        <aside className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div
            className="mb-4 flex gap-1 rounded-lg bg-slate-900 p-1"
            role="tablist"
            aria-label="Inspectors"
          >
            {inspectorTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={inspectorTab === tab.id}
                onClick={() => setInspectorTab(tab.id)}
                className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                  inspectorTab === tab.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {inspectorTab === 'context' && (
            <AIContextInspector evidence={simulation.authorizedEvidence} />
          )}
          {inspectorTab === 'policy' && (
            <PolicyDecisionInspector
              decisions={simulation.policyDecisions}
              policyVersion={simulation.policyVersion}
              authorizedCount={simulation.authorizedEvidence.length}
              withheldCount={simulation.withheldCount}
            />
          )}
          {inspectorTab === 'audit' && (
            <AuditTimeline
              events={simulation.auditEvents}
              traceId={simulation.traceId}
            />
          )}

          <p className="mt-4 border-t border-slate-800 pt-3 text-[11px] text-slate-600">
            Inspector data is generated by the in-browser simulation. In the
            protected Live mode, all of this comes from the server-side audit
            store.
          </p>
        </aside>
      </div>
    </div>
  );
}
