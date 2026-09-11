import { StatusChip, type StatusTone } from './StatusChip';

export type Priority = 'normal' | 'high' | 'urgent';

const PRIORITY_TONE: Record<Priority, StatusTone> = {
  normal: 'neutral',
  high: 'warning',
  urgent: 'danger',
};

const PRIORITY_LABEL: Record<Priority, string> = {
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export type PriorityChipProps = {
  readonly priority: Priority;
  readonly testID?: string;
};

/** Priority is always rendered with its word, never colour alone (§62). */
export function PriorityChip({ priority, testID }: PriorityChipProps) {
  return (
    <StatusChip
      label={PRIORITY_LABEL[priority]}
      tone={PRIORITY_TONE[priority]}
      accessibilityLabel={`Priority: ${PRIORITY_LABEL[priority]}`}
      testID={testID}
    />
  );
}
