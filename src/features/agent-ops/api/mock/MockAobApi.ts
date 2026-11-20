/**
 * In-browser SIMULATED AOB private API. It never performs network I/O and holds no credentials.
 * It reproduces the documented server behaviour of `/api/demo/*` on OCI_Phase1 @ 523c0e1:
 * one global active run (409), per-user cooldown and rolling 24 h cap (429 + Retry-After),
 * `units` rejected for light (422), owner-scoped run ids (404), newest-20 run list, and every
 * read model derived through the ported sanitisers in ./serverModel.
 */
import { ApiError, RUN_ID_RE, type AobApi } from '../AobApi';
import type {
  DemoMode,
  LiveState,
  MetricsResponse,
  RunList,
  RunStatus,
  RunView,
  StartDemoBody,
  ValidationList,
} from '../types';
import { HISTORICAL_RUNS } from './fixtures';
import {
  ACTIVE_STATUSES,
  EVENT_MAX_PER_RUN,
  liveState,
  metrics,
  runStatus,
  runView,
  validation,
  type StoredEvent,
  type StoredRun,
} from './serverModel';
import { planScenario, type ScenarioPlan, type ScenarioVariant } from './simulation';

/** Config defaults from agent-ops-board config.py (README values differ; config.py is authoritative). */
export const DEMO_MIN_INTERVAL_SECONDS = 100;
export const DEMO_MAX_RUNS_PER_DAY = 35;
const RUN_LIST_LIMIT = 20;
const DEMO_OWNER = 'auth0|simulated-demo-user';
const OTHER_OWNER = 'auth0|simulated-other-user';

export type MockFailureMode =
  /** Normal behaviour. */
  | 'none'
  /** Another user's batch holds the single global run slot → 409 on start. */
  | 'other_user_active'
  /** Per-user cooldown already active → 429 "Please wait…". */
  | 'cooldown'
  /** Rolling 24 h cap reached → 429 "Daily demo limit reached.". */
  | 'daily_limit'
  /** Every call fails as if the API were unreachable. */
  | 'unavailable';

export interface MockAobApiOptions {
  /** Wall clock in epoch seconds. */
  now?: () => number;
  /** Simulated seconds per wall-clock second for runs started in this session. */
  speed?: number;
  /** Artificial response latency in ms. */
  latencyMs?: number;
  /** Seed the signed-in user's run history. */
  withHistory?: boolean;
  failureMode?: MockFailureMode;
  /** Scenario used for runs started through `startDemo`. */
  nextVariant?: ScenarioVariant;
}

interface MockRun {
  row: StoredRun;
  plan: ScenarioPlan;
  /** Event ids/receive times, fixed at creation; visibility depends on the simulated clock. */
  events: StoredEvent[];
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return signal?.aborted ? Promise.reject(abortError()) : Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function randomRunId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `run-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export class MockAobApi implements AobApi {
  private readonly wallNow: () => number;
  private readonly startedAt: number;
  private readonly speed: number;
  private readonly latencyMs: number;
  private readonly runs: MockRun[] = [];
  private nextEventId = 1;
  private failureMode: MockFailureMode;
  private nextVariant: ScenarioVariant;

  constructor(options: MockAobApiOptions = {}) {
    this.wallNow = options.now ?? (() => Date.now() / 1000);
    this.startedAt = this.wallNow();
    this.speed = options.speed ?? 1;
    this.latencyMs = options.latencyMs ?? 0;
    this.failureMode = options.failureMode ?? 'none';
    this.nextVariant = options.nextVariant ?? 'passed';
    if (options.withHistory ?? true) {
      for (const f of HISTORICAL_RUNS) {
        this.addRun(DEMO_OWNER, f.mode, f.units, f.variant, this.startedAt - f.hoursAgo * 3600, f.run_id);
      }
    }
  }

  /** Simulated server time: history is real-time; runs started now advance at `speed`. */
  serverNow(): number {
    const wall = this.wallNow();
    return this.startedAt + (wall - this.startedAt) * this.speed;
  }

  async listRuns(signal?: AbortSignal): Promise<RunList> {
    await this.respond(signal);
    const items = this.owned()
      .map((r) => runView(this.materialise(r)))
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, RUN_LIST_LIMIT);
    return { items };
  }

  async startDemo(body: StartDemoBody, signal?: AbortSignal): Promise<RunView> {
    await this.respond(signal);
    if (body.mode !== 'light' && body.mode !== 'high_concurrency') {
      throw ApiError.fromBody(422, {
        detail: [{ type: 'literal_error', loc: ['body', 'mode'], msg: "Input should be 'light' or 'high_concurrency'" }],
      });
    }
    if (body.units !== undefined && body.units !== null && ![50, 100, 150].includes(body.units)) {
      throw ApiError.fromBody(422, {
        detail: [{ type: 'literal_error', loc: ['body', 'units'], msg: 'Input should be 50, 100 or 150' }],
      });
    }
    if (body.mode === 'light' && body.units != null) {
      throw ApiError.fromBody(422, { detail: 'units can only be chosen for high_concurrency' });
    }
    const now = this.serverNow();
    if (this.failureMode === 'other_user_active' || this.runs.some((r) => this.isActive(r))) {
      throw ApiError.fromBody(409, { detail: 'A demo is already queued or running' });
    }
    const mine = this.owned().map((r) => r.row.created_at);
    const last = mine.length ? Math.max(...mine) : null;
    if (this.failureMode === 'cooldown' || (last !== null && now - last < DEMO_MIN_INTERVAL_SECONDS)) {
      const remaining = last !== null ? DEMO_MIN_INTERVAL_SECONDS - (now - last) : 63.5;
      throw ApiError.fromBody(429, { detail: 'Please wait before starting another demo.' }, String(remaining));
    }
    const today = mine.filter((c) => c > now - 86400).length;
    if (this.failureMode === 'daily_limit' || today >= DEMO_MAX_RUNS_PER_DAY) {
      throw ApiError.fromBody(429, { detail: 'Daily demo limit reached.' }, '3600');
    }
    const units = body.units ?? (body.mode === 'high_concurrency' ? 100 : 10);
    const run = this.addRun(DEMO_OWNER, body.mode, units, this.nextVariant, now);
    return runView(this.materialise(run));
  }

  async getStatus(runId: string, signal?: AbortSignal): Promise<RunStatus> {
    await this.respond(signal);
    const run = this.ownedRun(runId);
    return runStatus(this.materialise(run), this.visibleEvents(run));
  }

  async getState(runId: string, signal?: AbortSignal): Promise<LiveState> {
    await this.respond(signal);
    const run = this.ownedRun(runId);
    return liveState(this.materialise(run), this.visibleEvents(run), this.serverNow());
  }

  async getMetrics(runId: string, signal?: AbortSignal): Promise<MetricsResponse> {
    await this.respond(signal);
    return metrics(this.visibleEvents(this.ownedRun(runId)));
  }

  async getValidation(runId: string, signal?: AbortSignal): Promise<ValidationList> {
    await this.respond(signal);
    return validation(this.visibleEvents(this.ownedRun(runId)));
  }

  async getSummary(runId: string, signal?: AbortSignal) {
    await this.respond(signal);
    return liveState(
      this.materialise(this.ownedRun(runId)),
      this.visibleEvents(this.ownedRun(runId)),
      this.serverNow(),
    ).summary;
  }

  /** Simulation control: how the next API calls misbehave. */
  setFailureMode(mode: MockFailureMode): void {
    this.failureMode = mode;
  }

  /** Simulation control: the scenario used for the next started run. */
  setNextVariant(variant: ScenarioVariant): void {
    this.nextVariant = variant;
  }

  /** Test/demo hook: adds a run owned by another user (never visible in this user's list). */
  addForeignActiveRun(): string {
    return this.addRun(OTHER_OWNER, 'light', 10, 'passed', this.serverNow()).row.run_id;
  }

  private async respond(signal?: AbortSignal) {
    await sleep(this.latencyMs, signal);
    if (this.failureMode === 'unavailable') {
      throw new ApiError('API unreachable (simulated network error)', null);
    }
  }

  private addRun(
    owner: string,
    mode: DemoMode,
    units: number,
    variant: ScenarioVariant,
    createdAt: number,
    runId = randomRunId(),
  ): MockRun {
    const plan = planScenario(mode, units, variant, this.runs.length + 11);
    const events = plan.events
      .slice()
      .sort((a, b) => a.at - b.at)
      .slice(0, EVENT_MAX_PER_RUN)
      .map((e) => ({
        id: this.nextEventId++,
        event_type: e.event_type,
        payload: e.payload,
        received_at: createdAt + e.at,
      }));
    const row: StoredRun = {
      run_id: runId,
      owner_sub: owner,
      status: 'submitting',
      kaggle_status: null,
      error: null,
      mode,
      units,
      created_at: createdAt,
      updated_at: createdAt,
      finished_at: null,
    };
    const run = { row, plan, events };
    this.runs.push(run);
    return run;
  }

  private owned() {
    return this.runs.filter((r) => r.row.owner_sub === DEMO_OWNER);
  }

  private ownedRun(runId: string): MockRun {
    const run = RUN_ID_RE.test(runId) ? this.runs.find((r) => r.row.run_id === runId) : undefined;
    if (!run || run.row.owner_sub !== DEMO_OWNER) throw ApiError.fromBody(404, { detail: 'run not found' });
    return run;
  }

  private isActive(run: MockRun) {
    return ACTIVE_STATUSES.includes(this.materialise(run).status);
  }

  private visibleEvents(run: MockRun): StoredEvent[] {
    const now = this.serverNow();
    return run.events.filter((e) => e.received_at <= now);
  }

  /** The run row as the store would hold it at the current simulated time. */
  private materialise(run: MockRun): StoredRun {
    const { row, plan } = run;
    const elapsed = this.serverNow() - row.created_at;
    const at = (offset: number) => row.created_at + offset;
    if (elapsed >= plan.finishedAt) {
      return {
        ...row,
        status: plan.finalStatus,
        kaggle_status: plan.finalKaggleStatus,
        error: plan.error,
        updated_at: at(plan.finishedAt),
        finished_at: at(plan.finishedAt),
      };
    }
    if (plan.runningAt !== null && elapsed >= plan.runningAt) {
      return { ...row, status: 'running', kaggle_status: 'running', updated_at: at(plan.runningAt) };
    }
    if (plan.queuedAt !== null && elapsed >= plan.queuedAt) {
      return { ...row, status: 'queued', kaggle_status: 'queued', updated_at: at(plan.queuedAt) };
    }
    return row;
  }
}
