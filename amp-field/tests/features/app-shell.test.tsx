import * as SplashScreen from 'expo-splash-screen';

import RootLayout from '@/app/_layout';
import { SplashGate } from '@/features/app-shell';
import { resetEnvCacheForTests } from '@/lib/env';
import { renderWithProviders, screen, waitFor } from '../test-utils';

jest.mock('expo-router', () => ({
  Stack: Object.assign(({ children }: { children?: React.ReactNode }) => <>{children}</>, {
    Screen: () => null,
  }),
  Redirect: () => null,
  router: { replace: jest.fn() },
}));

describe('SplashGate', () => {
  it('announces that the app is starting rather than showing a blank screen', () => {
    renderWithProviders(<SplashGate />);

    const gate = screen.getByTestId('splash-gate');
    expect(gate.props.accessibilityRole).toBe('progressbar');
    expect(gate.props.accessibilityLabel).toBe('Starting AMP Field');
  });
});

describe('RootLayout', () => {
  beforeEach(() => {
    resetEnvCacheForTests();
    jest.mocked(SplashScreen.hideAsync).mockClear();
  });

  it('hides the native splash once the shell has resolved', async () => {
    renderWithProviders(<RootLayout />);
    await waitFor(() => {
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });
  });

  it('keeps the native splash up until bootstrap resolves', () => {
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
  });
});
