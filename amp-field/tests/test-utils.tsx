import { render, type RenderOptions, type RenderResult } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConnectivityStateProvider, type ConnectivityState } from '@/lib/sync';
import { ThemeProvider } from '@/theme';

const ONLINE: ConnectivityState = {
  isOnline: true,
  isInternetReachable: true,
  connectionType: 'wifi',
  hasResolved: true,
};

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function AllProviders({ children }: { readonly children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider>
        <ConnectivityStateProvider value={ONLINE}>{children}</ConnectivityStateProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Renders a component inside the same providers the app uses. */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
