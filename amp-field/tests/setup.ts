/**
 * Shared test bootstrap.
 *
 * Native modules are mocked here rather than per-test so every suite sees the
 * same deterministic environment.
 */

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        ampField: {
          appEnv: 'local',
          label: 'Local',
          appName: 'AMP Field (Local)',
          scheme: 'ampfield-local',
          updateChannel: 'local',
          showEnvironmentBadge: true,
          logLevel: 'debug',
          supabaseUrl: 'https://test-project.supabase.co',
          // Decodes to { "role": "anon" }.
          supabaseAnonKey:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.test-signature-value',
        },
      },
    },
  },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() =>
      Promise.resolve({ isConnected: true, isInternetReachable: true, type: 'wifi' })
    ),
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));
