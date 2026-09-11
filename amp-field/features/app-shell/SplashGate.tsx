import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BrandMark } from './BrandMark';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Branded loading screen shown while the shell resolves configuration, the
 * stored session and organisation membership.
 *
 * Rendering this (instead of nothing) is what stops protected screens flashing
 * before authentication has resolved.
 */
export function SplashGate({ message = 'Starting AMP Field' }: { readonly message?: string }) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      testID="splash-gate"
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfacePrimary, gap: theme.spacing.xxl },
      ]}
    >
      <BrandMark showTagline />
      <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
        <ActivityIndicator color={theme.colors.accentPrimary} />
        <AppText variant="bodySmall" color="muted">
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
