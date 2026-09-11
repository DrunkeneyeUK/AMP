import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConnectivityProvider } from '@/lib/sync';
import { ThemeProvider } from '@/theme';

/** Single place where every cross-cutting provider is composed. */
export function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ConnectivityProvider>{children}</ConnectivityProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
