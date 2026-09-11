import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { getEnvResult } from '@/lib/env';
import { useTheme } from '@/theme';

/**
 * Small ribbon identifying non-production builds, so a tester never mistakes
 * the beta app for the live one.
 */
export function EnvironmentBadge() {
  const theme = useTheme();
  const result = getEnvResult();

  if (!result.ok || !result.env.showEnvironmentBadge) return null;

  return (
    <View
      testID="environment-badge"
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.statusInfoSurface,
          borderColor: theme.colors.statusInfo,
          borderRadius: theme.radius.pill,
          borderWidth: theme.borderWidth.hairline,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xxs,
        },
      ]}
    >
      <AppText
        variant="overline"
        style={{ color: theme.colors.statusInfo }}
        maxFontSizeMultiplier={1.2}
      >
        {result.env.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
});
