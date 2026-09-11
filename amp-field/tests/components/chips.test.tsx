import { PriorityChip, StatusChip, initialsFromName, UserAvatar } from '@/components/ui';
import { renderWithProviders, screen } from '../test-utils';

describe('StatusChip', () => {
  it('always renders the status as words, never colour alone (§62)', () => {
    renderWithProviders(<StatusChip label="Submitted" tone="success" />);
    expect(screen.getByText('Submitted')).toBeOnTheScreen();
    expect(screen.getByLabelText('Status: Submitted')).toBeOnTheScreen();
  });
});

describe('PriorityChip', () => {
  it.each([
    ['normal', 'Normal'],
    ['high', 'High'],
    ['urgent', 'Urgent'],
  ] as const)('labels %s priority as %s', (priority, label) => {
    renderWithProviders(<PriorityChip priority={priority} />);
    expect(screen.getByLabelText(`Priority: ${label}`)).toBeOnTheScreen();
  });
});

describe('initialsFromName', () => {
  it.each([
    ['Alex Bennett', 'AB'],
    ['alex', 'AL'],
    ['  Sarah   Jane   Okafor  ', 'SO'],
    ['', '?'],
  ])('derives initials for %s', (name, expected) => {
    expect(initialsFromName(name)).toBe(expected);
  });
});

describe('UserAvatar', () => {
  it('falls back to initials when no image is available', () => {
    renderWithProviders(<UserAvatar name="Alex Bennett" />);
    expect(screen.getByText('AB')).toBeOnTheScreen();
    expect(screen.getByLabelText('Profile picture for Alex Bennett')).toBeOnTheScreen();
  });
});
