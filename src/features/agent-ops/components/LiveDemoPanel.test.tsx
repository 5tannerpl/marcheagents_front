import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/AobApi';
import { MockAobApi, type MockAobApiOptions } from '../api/mock/MockAobApi';
import { AgentOpsContext } from '../context';
import { LiveDemoPanel } from './LiveDemoPanel';

const T0 = 1_800_000_000;

function setup(options: MockAobApiOptions = {}) {
  const clock = { now: T0 };
  const api = new MockAobApi({ now: () => clock.now, ...options });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <AgentOpsContext.Provider value={{ api, simulated: true }}>
      <LiveDemoPanel />
    </AgentOpsContext.Provider>,
  );
  return { api, clock, user };
}

const tick = (ms = 3000) => act(() => vi.advanceTimersByTimeAsync(ms));
const startButton = () => screen.getByRole('button', { name: '▶ Start Live Demo' });
const statusLine = () => screen.getByTestId('run-status-line');

async function selectRun(user: ReturnType<typeof userEvent.setup>, runId: string) {
  await user.selectOptions(await screen.findByTestId('run-selector'), runId);
  await screen.findByTestId('live-run-panel');
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('LiveDemoPanel states', () => {
  it('shows a loading state, then the idle controls when the user has no runs', async () => {
    setup({ withHistory: false });
    expect(screen.getByTestId('runs-loading')).toBeInTheDocument();
    expect(await screen.findByText('No runs yet.')).toBeInTheDocument();
    expect(startButton()).toBeEnabled();
    expect(screen.queryByTestId('run-selector')).not.toBeInTheDocument();
  });

  it('shows only the error when the run list is unavailable', async () => {
    setup({ failureMode: 'unavailable' });
    expect(await screen.findByTestId('runs-error')).toHaveTextContent('API unreachable');
    expect(screen.queryByRole('button', { name: /start live demo/i })).not.toBeInTheDocument();
  });

  it('selects the newest run and renders a completed high-concurrency run without polling', async () => {
    const { api } = setup();
    const statusSpy = vi.spyOn(api, 'getStatus');
    await screen.findByTestId('live-run-panel');

    expect(screen.getByTestId('run-selector')).toHaveValue('run-8192a3b4c5d6e7f8');
    expect(statusLine()).toHaveTextContent('🟢 COMPLETE · ✅ Passed');
    expect(within(screen.getByTestId('validation-events')).getAllByRole('row')).toHaveLength(9);
    expect(screen.getByTestId('scaling-verdict')).toHaveTextContent('Scaling verdict: ✅ PASSED');
    expect(within(screen.getByTestId('summary-table')).getAllByRole('row')).toHaveLength(14);
    expect(screen.getAllByRole('img', { name: /line chart/i })).toHaveLength(4);
    expect(screen.getByTestId('gpu-card-GPU 1')).toHaveTextContent('port N/A');

    const calls = statusSpy.mock.calls.length;
    await tick(9000);
    expect(statusSpy.mock.calls.length).toBe(calls);
  });

  it('renders a failed run with its error code and no scaling sections', async () => {
    const { user } = setup();
    await selectRun(user, 'run-2b3c4d5e6f708192');
    expect(statusLine()).toHaveTextContent('🔴 FAILED · Validation failed');
    expect(screen.getByTestId('run-error-code')).toHaveTextContent('KAGGLE_REPORTED_FAILURE');
    expect(screen.queryByTestId('scaling-overview')).not.toBeInTheDocument();
  });

  it('renders an incomplete scaling run (failure event lost) without a summary', async () => {
    const { user } = setup();
    await selectRun(user, 'run-4d5e6f708192a3b4');
    expect(screen.getByTestId('scaling-verdict')).toHaveTextContent(
      '⚠️ Incomplete — the batch ended without a scaling result',
    );
    expect(screen.getByText('The summary appears once the scaling experiment finishes.')).toBeInTheDocument();
  });

  it('renders the sanitised scaling failure message', async () => {
    const { user } = setup();
    await selectRun(user, 'run-3c4d5e6f708192a3');
    expect(screen.getByTestId('scaling-failure')).toHaveTextContent(
      'ROUTER_TIMEOUT during router: The inference router did not stabilize within the allowed time.',
    );
  });

  it('renders a failed verdict without reasons (G9) and a degraded run with reasons', async () => {
    const { user } = setup();
    await selectRun(user, 'run-5e6f708192a3b4c5');
    expect(screen.getByTestId('scaling-verdict')).toHaveTextContent('❌ FAILED');
    expect(screen.queryByTestId('summary-reasons')).not.toBeInTheDocument();

    await selectRun(user, 'run-6f708192a3b4c5d6');
    expect(screen.getByTestId('summary-reasons')).toHaveTextContent('Not a full pass: WORKERS_8_NOT_CONFIRMED');
    expect(screen.getByText('Workers 4 → 8 updated · actual 6')).toBeInTheDocument();
  });
});

describe('LiveDemoPanel start and polling', () => {
  it('selects the new run, polls every 3 s while active and stops after it finishes', async () => {
    const { api, clock, user } = setup();
    const startSpy = vi.spyOn(api, 'startDemo');
    await screen.findByTestId('live-run-panel');

    await user.click(screen.getByRole('radio', { name: /high concurrency/i }));
    await user.selectOptions(screen.getByRole('combobox', { name: /synthetic tasks/i }), '150');
    await user.click(startButton());

    expect(startSpy).toHaveBeenCalledWith({ mode: 'high_concurrency', units: 150 });
    const newId = (await startSpy.mock.results[0].value).run_id;
    await vi.waitFor(() => expect(screen.getByTestId('run-selector')).toHaveValue(newId));
    expect(await screen.findByText(/SUBMITTING/)).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
    expect(screen.getByRole('radio', { name: /light/i })).toBeDisabled();

    clock.now += 20;
    await tick();
    expect(statusLine()).toHaveTextContent('🔵 RUNNING · Initializing notebook');

    clock.now += 130;
    await tick();
    expect(screen.getByTestId('live-indicator')).toHaveTextContent('🔴 LIVE (simulated)');
    expect(screen.getByTestId('live-metrics')).toHaveTextContent('SIMULATED reading');

    clock.now += 600;
    await tick();
    await vi.waitFor(() => expect(startButton()).toBeEnabled());
    expect(statusLine()).toHaveTextContent('🟢 COMPLETE · ✅ Passed');

    const statusSpy = vi.spyOn(api, 'getStatus');
    await tick(9000);
    expect(statusSpy.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('never sends units for light mode and disables the units select', async () => {
    const { api, user } = setup({ withHistory: false });
    const startSpy = vi.spyOn(api, 'startDemo');
    await screen.findByText('No runs yet.');
    expect(screen.getByRole('combobox', { name: /synthetic tasks/i })).toBeDisabled();
    await user.click(startButton());
    expect(startSpy).toHaveBeenCalledWith({ mode: 'light' });
  });

  it('keeps the last good data and shows the error when a poll fails', async () => {
    const { api, user } = setup({ withHistory: false });
    await screen.findByText('No runs yet.');
    await user.click(startButton());
    await screen.findByText(/SUBMITTING/);
    api.setFailureMode('unavailable');
    await tick();
    expect(screen.getByTestId('run-panel-error')).toHaveTextContent('API unreachable');
    expect(statusLine()).toHaveTextContent('SUBMITTING');
  });
});

describe('LiveDemoPanel start errors', () => {
  it.each([
    ['other_user_active', 'A demo is already queued or running.'],
    ['cooldown', 'Please wait before starting another demo.'],
    ['daily_limit', 'Daily demo limit reached.'],
  ] as const)('maps %s to the Streamlit message', async (mode, message) => {
    const { api, user } = setup();
    await screen.findByTestId('live-run-panel');
    api.setFailureMode(mode);
    await user.click(startButton());
    expect(await screen.findByTestId('start-error')).toHaveTextContent(message);
    expect(screen.getByTestId('start-error').textContent).toBe(message);
  });

  it('prefixes other errors such as 422 with "Start failed:"', async () => {
    const { api, user } = setup();
    await screen.findByTestId('live-run-panel');
    vi.spyOn(api, 'startDemo').mockRejectedValueOnce(
      ApiError.fromBody(422, { detail: 'units can only be chosen for high_concurrency' }),
    );
    await user.click(startButton());
    expect(await screen.findByTestId('start-error')).toHaveTextContent(
      'Start failed: units can only be chosen for high_concurrency',
    );
  });
});
