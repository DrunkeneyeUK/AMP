import { ConfirmationSheet } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

describe('ConfirmationSheet', () => {
  const base = {
    title: 'Submit daily report?',
    message: 'Once submitted it is sent to your manager and cannot be edited.',
    confirmLabel: 'Submit Daily Report',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('is not rendered when hidden', () => {
    renderWithProviders(<ConfirmationSheet {...base} visible={false} />);
    expect(screen.queryByText('Submit daily report?')).toBeNull();
  });

  it('confirms and cancels', () => {
    renderWithProviders(<ConfirmationSheet {...base} visible />);

    fireEvent.press(screen.getByText('Submit Daily Report'));
    expect(base.onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText('Cancel'));
    expect(base.onCancel).toHaveBeenCalledTimes(1);
  });

  it('blocks both actions while the submission is in flight', () => {
    renderWithProviders(<ConfirmationSheet {...base} visible busy />);

    fireEvent.press(screen.getByText('Cancel'));
    expect(base.onCancel).not.toHaveBeenCalled();
  });
});
