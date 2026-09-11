/**
 * The shell must fail loudly and readably when a build is misconfigured,
 * rather than rendering a blank screen (§33, §61, §68).
 */
import RootLayout from '@/app/_layout';
import { resetEnvCacheForTests } from '@/lib/env';
import { renderWithProviders, screen, waitFor } from '../test-utils';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { ampField: { appEnv: 'local', supabaseUrl: '' } } } },
}));

jest.mock('expo-router', () => ({
  Stack: Object.assign(({ children }: { children?: React.ReactNode }) => <>{children}</>, {
    Screen: () => null,
  }),
  Redirect: () => null,
  router: { replace: jest.fn() },
}));

describe('RootLayout with invalid configuration', () => {
  beforeEach(() => resetEnvCacheForTests());

  it('renders a readable fatal error instead of a blank screen', async () => {
    renderWithProviders(<RootLayout />);

    await waitFor(() => {
      expect(screen.getByTestId('fatal-config-error')).toBeOnTheScreen();
    });

    expect(screen.getByText(/isn't configured correctly/)).toBeOnTheScreen();
    expect(screen.getByText(/Nothing you have entered has been lost/)).toBeOnTheScreen();
  });

  it('lists the specific configuration problems so support can act on them', async () => {
    renderWithProviders(<RootLayout />);

    await waitFor(() => {
      expect(screen.getByText(/supabaseUrl/)).toBeOnTheScreen();
    });
  });
});
