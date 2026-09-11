import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

import { useTheme } from '@/theme';

export type LoadingSkeletonProps = {
  readonly width?: number | `${number}%`;
  readonly height?: number;
  readonly radius?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * Placeholder block shown while data loads.
 *
 * Uses the core `Animated` API (no Reanimated dependency) and is hidden from
 * screen readers — the surrounding container announces the busy state.
 */
export function LoadingSkeleton({
  width = '100%',
  height = 16,
  radius,
  style,
  testID,
}: LoadingSkeletonProps) {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Driven natively so the pulse never blocks the JS thread on a mid-range
    // Android handset, which is what most field users carry.
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID ?? 'loading-skeleton'}
      style={[
        {
          backgroundColor: theme.colors.skeletonHighlight,
          borderRadius: radius ?? theme.radius.sm,
          height,
          opacity,
          width,
        },
        style,
      ]}
    />
  );
}

export type SkeletonCardProps = {
  readonly lines?: number;
  readonly testID?: string;
};

/** Convenience skeleton matching the shape of an operational card. */
export function SkeletonCard({ lines = 3, testID }: SkeletonCardProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      testID={testID ?? 'skeleton-card'}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderColor: theme.colors.borderSubtle,
          borderRadius: theme.radius.lg,
          borderWidth: theme.borderWidth.hairline,
          gap: theme.spacing.sm,
          padding: theme.spacing.lg,
        },
      ]}
    >
      <LoadingSkeleton height={20} width="60%" />
      {Array.from({ length: lines }).map((_, index) => (
        <LoadingSkeleton key={index} height={12} width={index === lines - 1 ? '40%' : '100%'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
