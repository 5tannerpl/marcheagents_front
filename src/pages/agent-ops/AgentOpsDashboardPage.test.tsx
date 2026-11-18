import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MockAobApi } from '../../features/agent-ops/api/mock/MockAobApi';
import { AgentOpsDashboardPage } from './AgentOpsDashboardPage';

describe('AgentOpsDashboardPage', () => {
  it('renders the Streamlit header, a simulation notice and the production notice', async () => {
    render(<AgentOpsDashboardPage api={new MockAobApi()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Agent Ops Board' })).toBeInTheDocument();
    expect(screen.getByText(/synthetic, non-confidential content/)).toBeInTheDocument();
    expect(screen.getByTestId('simulation-banner')).toHaveTextContent('SIMULATED DATA');
    expect(screen.getByTestId('simulation-banner')).toHaveTextContent('nothing on this page is live telemetry');
    expect(screen.getByTestId('production-gate')).toHaveTextContent(
      'Phase 1 production mode: only the private live demo panel is available.',
    );
    expect(await screen.findByTestId('live-run-panel')).toBeInTheDocument();
  });
});
