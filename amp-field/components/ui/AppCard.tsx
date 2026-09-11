import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';
import type { ElevationVariant } from '@/theme';

export type AppCardProps = ViewProps & {
  readonly children: React.ReactNode;
  readonly elevated?: ElevationVariant;
  readonly padded?: boolean;
  /** Renders a subtle top-edge highlight for modest material depth. */
  readonly edgeHighlight?: boolean;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
};

/** Graphite operational panel — the base surface for every AMP Field card. */
export function AppCard({
  children,
  elevated = 'card',
  padded = true,
  edgeHighlight = true,
  onPress,
  style,
  accessibilityLabel,
  ...rest
}: AppCardProps) {
  const theme = useTheme();

  const base: StyleProp<ViewStyle> = [
    styles.card,
    theme.elevation[elevated],
    {
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: theme.radius.lg,
      borderWidth: theme.borderWidth.hairline,
      borderColor: theme.colors.borderSubtle,
      padding: padded ? theme.spacing.lg : 0,
    },
    style,
  ];

  const content = (
    <>
      {edgeHighlight ? (
        <View
          pointerEvents="none"
          style={[
            styles.edge,
            {
              backgroundColor: theme.colors.edgeHighlight,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
            },
          ]}
        />
      ) : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          base,
          pressed && { backgroundColor: theme.colors.surfaceInteractive },
        ]}
        {...rest}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} style={base} {...rest}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  edge: {
    height: StyleSheet.hairlineWidth * 2,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
