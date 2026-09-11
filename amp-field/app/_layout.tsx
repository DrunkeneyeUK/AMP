import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { ErrorState, Screen } from '@/components/ui';
import { AppProviders, SplashGate, useAppBootstrap } from '@/features/app-shell';
import { BRAND } from '@/constants/brand';
import { darkTheme, useTheme } from '@/theme';

// Keep the native splash on screen until the shell knows what to render, so no
// protected surface can flash before it has resolved.
void SplashScreen.preventAutoHideAsync();
void SystemUI.setBackgroundColorAsync(darkTheme.colors.surfacePrimary);

function RootNavigator() {
  const theme = useTheme();
  const bootstrap = useAppBootstrap();

  useEffect(() => {
    if (bootstrap.status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [bootstrap.status]);

  if (bootstrap.status === 'loading') {
    return <SplashGate />;
  }

  if (bootstrap.status === 'fatal') {
    return (
      <Screen scrollable={false} showOfflineBanner={false}>
        <ErrorState
          fill
          severity="fatal"
          title={`${BRAND.productName} isn't configured correctly`}
          message={
            `This build is missing the settings it needs to reach the server. ` +
            `Nothing you have entered has been lost. Please reinstall the latest build, ` +
            `or contact ${BRAND.supportEmail} with the details below.`
          }
          detail={bootstrap.issues.join('\n')}
          testID="fatal-config-error"
        />
      </Screen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.surfacePrimary },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProviders>
  );
}
