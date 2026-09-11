import SignInScreen from '@/app/(auth)/sign-in';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

describe('Sign In shell', () => {
  it('shows AMP Field branding and the environment ribbon', () => {
    renderWithProviders(<SignInScreen />);

    expect(screen.getByText('AMP')).toBeOnTheScreen();
    expect(screen.getByText('Field')).toBeOnTheScreen();
    expect(screen.getByTestId('environment-badge')).toBeOnTheScreen();
  });

  it('states that accounts are provisioned, not self-registered', () => {
    renderWithProviders(<SignInScreen />);
    expect(screen.getByText(/no public sign-up/i)).toBeOnTheScreen();
  });

  it('validates both fields before attempting to sign in', async () => {
    renderWithProviders(<SignInScreen />);

    fireEvent.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => {
      expect(screen.getByText('Enter your email address')).toBeOnTheScreen();
    });
    expect(screen.getByText('Enter your password')).toBeOnTheScreen();
    expect(screen.queryByTestId('sign-in-message')).toBeNull();
  });

  it('rejects a malformed email without contacting the server', async () => {
    renderWithProviders(<SignInScreen />);

    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'alex');
    fireEvent.changeText(screen.getByTestId('sign-in-password'), 'hunter22');
    fireEvent.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => {
      expect(screen.getByText(/valid email address/)).toBeOnTheScreen();
    });
  });

  it('reports honestly that authentication is not wired in this build', async () => {
    renderWithProviders(<SignInScreen />);

    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'alex@contractor.co.uk');
    fireEvent.changeText(screen.getByTestId('sign-in-password'), 'hunter22');
    fireEvent.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('sign-in-message')).toHaveTextContent(
        /not connected in this build/i
      );
    });
  });

  it('explains how to recover a password until the flow ships', async () => {
    renderWithProviders(<SignInScreen />);

    fireEvent.press(screen.getByTestId('sign-in-forgot'));

    await waitFor(() => {
      expect(screen.getByTestId('sign-in-message')).toHaveTextContent(/Password recovery/i);
    });
  });
});
