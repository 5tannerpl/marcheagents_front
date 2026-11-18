import type { TimelineEntry } from '../api/types';
import { fmtTs } from '../lib/format';
import { Caption, DataTable, SectionHeading } from './ui';

/** live_demo._timeline — labels are already sanitised server-side and shown unchanged. */
export function ScalingTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  return (
    <section data-testid="scaling-timeline">
      <SectionHeading>Scaling event timeline</SectionHeading>
      {timeline.length ? (
        <DataTable
          caption="Scaling event timeline"
          columns={['Time', 'Event', 'What happened']}
          rows={timeline.map((e) => [fmtTs(e.received_at), e.event_type, e.label])}
        />
      ) : (
        <Caption>No scaling events yet.</Caption>
      )}
    </section>
  );
}
