import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PublicDemoPage } from './PublicDemoPage';

function renderDemo(initialEntry = '/features/email-support/demo') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PublicDemoPage />
    </MemoryRouter>,
  );
}

describe('PublicDemoPage', () => {
  it('starts on the incoming email step with the simulated badge', () => {
    renderDemo();
    expect(screen.getByTestId('email-viewer')).toBeInTheDocument();
    expect(screen.getAllByTestId('mode-badge')[0]).toHaveTextContent(
      'SIMULATED DATA',
    );
  });

  it('restores the step from the URL query parameter', () => {
    renderDemo('/features/email-support/demo?step=case-routing');
    expect(screen.getByTestId('case-split')).toBeInTheDocument();
  });

  it('falls back to the first step for an invalid step parameter', () => {
    renderDemo('/features/email-support/demo?step=hack-the-planet');
    expect(screen.getByTestId('email-viewer')).toBeInTheDocument();
  });

  it('navigates steps with Next and Previous', async () => {
    const user = userEvent.setup();
    renderDemo();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('intent-panel')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByTestId('email-viewer')).toBeInTheDocument();
  });

  it('shows only Project A evidence for Alice on the retrieval step', () => {
    renderDemo('/features/email-support/demo?step=secure-retrieval');
    const list = screen.getByTestId('evidence-list');
    expect(within(list).getByTestId('evidence-evidence-a-100')).toBeInTheDocument();
    expect(
      within(list).queryByTestId('evidence-evidence-b-200'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('withheld-summary')).toHaveTextContent(
      '3 records withheld',
    );
    // denied content must not be rendered anywhere in the DOM
    expect(screen.queryByText(/Melbourne warehouse\./)).not.toBeInTheDocument();
  });

  it('recomputes evidence immediately when switching to Carol', async () => {
    const user = userEvent.setup();
    renderDemo('/features/email-support/demo?step=secure-retrieval');
    await user.click(screen.getByRole('radio', { name: /carol/i }));
    const list = screen.getByTestId('evidence-list');
    expect(within(list).getByTestId('evidence-evidence-b-200')).toBeInTheDocument();
    expect(
      within(list).queryByTestId('evidence-evidence-c-300'),
    ).not.toBeInTheDocument();
  });

  it('restores identity from the URL and shows all evidence for David', () => {
    renderDemo('/features/email-support/demo?step=secure-retrieval&identity=david');
    const list = screen.getByTestId('evidence-list');
    expect(within(list).getByTestId('evidence-evidence-c-300')).toBeInTheDocument();
    expect(screen.queryByTestId('withheld-summary')).not.toBeInTheDocument();
  });

  it('switches inspector tabs', async () => {
    const user = userEvent.setup();
    renderDemo();
    expect(screen.getByTestId('context-inspector')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /policy evaluation/i }));
    expect(screen.getByTestId('policy-inspector')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /audit events/i }));
    expect(screen.getByTestId('audit-timeline')).toBeInTheDocument();
  });
});
