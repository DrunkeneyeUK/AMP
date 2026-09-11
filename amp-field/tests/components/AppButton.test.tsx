import { AppButton } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

describe('AppButton', () => {
  it('calls onPress when enabled', () => {
    const onPress = jest.fn();
    renderWithProviders(<AppButton label="Submit Daily Report" onPress={onPress} />);

    fireEvent.press(screen.getByText('Submit Daily Report'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress while loading', () => {
    const onPress = jest.fn();
    renderWithProviders(<AppButton label="Submit" loading onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('app-button-spinner')).toBeOnTheScreen();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    renderWithProviders(<AppButton label="Submit" disabled onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes disabled state and the reason to assistive technology', () => {
    renderWithProviders(
      <AppButton label="Submit" disabled disabledReason="Add at least one work area first" />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.props.accessibilityHint).toBe('Add at least one work area first');
  });

  it('announces the busy state while loading', () => {
    renderWithProviders(<AppButton label="Submit" loading />);
    expect(screen.getByRole('button').props.accessibilityState.busy).toBe(true);
  });
});
