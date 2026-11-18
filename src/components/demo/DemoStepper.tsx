import { Check } from 'lucide-react';
import { DEMO_STEPS, type DemoStep } from '../../types/scenario';
import { STEP_LABELS } from './stepLabels';

interface DemoStepperProps {
  currentStep: DemoStep;
  onSelect: (step: DemoStep) => void;
  orientation?: 'vertical' | 'horizontal';
}

export function DemoStepper({
  currentStep,
  onSelect,
  orientation = 'vertical',
}: DemoStepperProps) {
  const currentIndex = DEMO_STEPS.indexOf(currentStep);

  if (orientation === 'horizontal') {
    return (
      <ol className="flex items-center gap-1" aria-label="Demo steps">
        {DEMO_STEPS.map((step, i) => (
          <li key={step} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onSelect(step)}
              aria-current={step === currentStep ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${STEP_LABELS[step]}`}
              className={`flex h-8 w-full items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                step === currentStep
                  ? 'bg-brand-600 text-white'
                  : i < currentIndex
                    ? 'bg-brand-900/60 text-brand-300'
                    : 'bg-slate-800 text-slate-400'
              }`}
            >
              {i < currentIndex ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </button>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="space-y-1" aria-label="Demo steps">
      {DEMO_STEPS.map((step, i) => (
        <li key={step}>
          <button
            type="button"
            onClick={() => onSelect(step)}
            aria-current={step === currentStep ? 'step' : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              step === currentStep
                ? 'bg-brand-600/20 font-semibold text-brand-200'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step === currentStep
                  ? 'bg-brand-500 text-white'
                  : i < currentIndex
                    ? 'bg-brand-900 text-brand-300'
                    : 'bg-slate-800 text-slate-400'
              }`}
            >
              {i < currentIndex ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            {STEP_LABELS[step]}
          </button>
        </li>
      ))}
    </ol>
  );
}
