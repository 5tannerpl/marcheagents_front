import type { ValidationEvent } from '../api/types';
import { fmtTs } from '../lib/format';
import { Caption, DataTable } from './ui';

/** live_demo._events_table */
export function ValidationEventsTable({ events }: { events: ValidationEvent[] }) {
  if (!events.length) return <Caption>No events received yet.</Caption>;
  return (
    <DataTable
      testId="validation-events"
      caption="Validation events"
      columns={['Received', 'Event', 'Status']}
      rows={events.map((e) => [fmtTs(e.received_at), e.event_type, e.status || '—'])}
    />
  );
}
