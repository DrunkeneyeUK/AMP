import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { BRAND } from '@/constants/brand';
import { useTheme } from '@/theme';

export type BrandMarkProps = {
  readonly size?: 'small' | 'large';
  readonly showTagline?: boolean;
};

/**
 * AMP Field wordmark.
 *
 * Drawn in code rather than shipped as a bitmap so it stays crisp at any
 * density and respects the active theme.
 */
export function BrandMark({ size = 'large', showTagline = false }: BrandMarkProps) {
  const theme = useTheme();
  const isLarge = size === 'large';

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={BRAND.productName}>
      <View style={styles.row}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.accentPrimary,
              borderRadius: theme.radius.sm,
              height: isLarge ? 40 : 28,
              marginRight: theme.spacing.md,
              width: isLarge ? 8 : 6,
            },
          ]}
        />
        <AppText variant={isLarge ? 'displayLarge' : 'titleMedium'}>AMP</AppText>
        <AppText
          variant={isLarge ? 'displayLarge' : 'titleMedium'}
          color="accent"
          style={{ marginLeft: theme.spacing.sm }}
        >
          Field
        </AppText>
      </View>

      {showTagline ? (
        <AppText variant="bodySmall" color="muted" style={{ marginTop: theme.spacing.sm }}>
          {BRAND.tagline}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
