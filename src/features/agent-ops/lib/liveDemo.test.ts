import { describe, expect, it } from 'vitest';
import { fmtTs, na } from './format';
import { scalingVerdict, startErrorMessage, statusLine } from './liveDemoText';
import { INITIAL_SELECTION, resolveSelection } from './runSelection';

describe('resolveSelection', () => {
  const ids = ['run-c', 'run-b', 'run-a'];

  it('defaults to the newest run and keeps an existing selection', () => {
    const first = resolveSelection(INITIAL_SELECTION, ids);
    expect(first.selected).toBe('run-c');
    expect(resolveSelection({ ...first, selected: 'run-a' }, ids).selected).toBe('run-a');
  });

  it('falls back to the newest run when the selection disappears', () => {
    expect(resolveSelection({ ...INITIAL_SELECTION, selected: 'run-gone' }, ids).selected).toBe('run-c');
  });

  it('selects the started run once it is listed, and waits while it is not', () => {
    const waiting = resolveSelection({ selected: 'run-a', requestedId: 'run-new', previousIds: null }, ids);
    expect(waiting).toEqual({ selected: 'run-a', requestedId: 'run-new', previousIds: null });
    expect(resolveSelection(waiting, ['run-new', ...ids])).toEqual({
      selected: 'run-new',
      requestedId: null,
      previousIds: null,
    });
  });

  it('selects the first new id when the start response had no run id', () => {
    const state = { selected: 'run-c', requestedId: null, previousIds: ids };
    expect(resolveSelection(state, ['run-d', ...ids])).toEqual({ selected: 'run-d', requestedId: null, previousIds: null });
  });
});

describe('statusLine', () => {
  it('uses the phase text while running and the result text when complete', () => {
    expect(statusLine('running', null, 'pending')).toEqual({
      icon: '🔵',
      label: 'RUNNING',
      description: 'Initializing — no detailed progress reported yet',
    });
    expect(statusLine('running', 'model_ready', 'pending').description).toBe('Model server ready (/health 200)');
    expect(statusLine('complete', 'validated', 'incomplete').description).toBe(
      '⚠️ Incomplete — Kaggle finished but no passing validation event was received',
    );
    expect(statusLine('failed', 'validated', 'failed')).toMatchObject({ icon: '🔴', description: 'Validation failed' });
    expect(statusLine('weird', null, null)).toEqual({ icon: '⚪', label: 'WEIRD', description: 'Status unknown' });
  });

  it('maps scaling verdicts and falls back to the raw value', () => {
    expect(scalingVerdict(null)).toBe('⏳ Not started');
    expect(scalingVerdict('degraded')).toBe('🟠 DEGRADED');
    expect(scalingVerdict('something_new')).toBe('something_new');
  });
});

describe('startErrorMessage', () => {
  it('maps 409, passes 429 detail through and prefixes everything else', () => {
    expect(startErrorMessage(409, 'A demo is already queued or running')).toBe('A demo is already queued or running.');
    expect(startErrorMessage(429, 'Daily demo limit reached.')).toBe('Daily demo limit reached.');
    expect(startErrorMessage(422, 'units can only be chosen for high_concurrency')).toBe(
      'Start failed: units can only be chosen for high_concurrency',
    );
    expect(startErrorMessage(null, 'API unreachable')).toBe('Start failed: API unreachable');
  });
});

describe('formatters', () => {
  it('formats like live_demo.na', () => {
    expect(na(null)).toBe('N/A');
    expect(na(0)).toBe('0');
    expect(na(5648.3, 'thousands', ' MB')).toBe('5,648.3 MB');
    expect(na(91.4, 'plain', '%')).toBe('91.4%');
    expect(na(10.94, 'fixed1', ' s')).toBe('10.9 s');
    expect(na(true)).toBe('True');
  });

  it('formats timestamps as local YYYY-MM-DD HH:MM:SS and falsy values as a dash', () => {
    expect(fmtTs(null)).toBe('—');
    expect(fmtTs(0)).toBe('—');
    expect(fmtTs(1_800_000_000)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
