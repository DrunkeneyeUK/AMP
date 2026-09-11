import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type AppButtonSize = 'medium' | 'large';

export type AppButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  readonly label: string;
  readonly variant?: AppButtonVariant;
  readonly size?: AppButtonSize;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  /** Explains why the action is unavailable — surfaced to screen readers. */
  readonly disabledReason?: string;
  readonly leadingIcon?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function AppButton({
  label,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  fullWidth = true,
  disabledReason,
  leadingIcon,
  style,
  onPress,
  ...rest
}: AppButtonProps) {
  const theme = useTheme();
  const isInoperable = disabled || loading;

  const background = useCallback(
    (pressed: boolean): string => {
      if (variant === 'ghost') {
        return pressed ? theme.colors.surfaceInteractive : theme.colors.surfacePrimary;
      }
      if (variant === 'secondary') {
        return pressed ? theme.colors.surfaceInteractive : theme.colors.surfaceElevated;
      }
      if (disabled) return theme.colors.accentPrimaryDisabled;
      return pressed ? theme.colors.accentPrimaryPressed : theme.colors.accentPrimary;
    },
    [disabled, theme, variant]
  );

  const borderColor =
    variant === 'secondary' || variant === 'ghost' ? theme.colors.borderSubtle : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger' ? 'onAccent' : disabled ? 'muted' : 'primary';

  const height = size === 'large' ? theme.touchTarget.comfortable : theme.touchTarget.min;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInoperable, busy: loading }}
      accessibilityHint={isInoperable ? disabledReason : undefined}
      disabled={isInoperable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          minHeight: height,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.radius.md,
          borderWidth: theme.borderWidth.hairline,
          borderColor,
          backgroundColor: background(pressed),
          opacity: disabled ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        variant === 'danger' && { backgroundColor: theme.colors.statusDanger },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? theme.colors.textOnAccent
              : theme.colors.textPrimary
          }
          testID="app-button-spinner"
        />
      ) : (
        <View style={styles.content}>
          {leadingIcon ? (
            <View style={{ marginRight: theme.spacing.sm }}>{leadingIcon}</View>
          ) : null}
          <AppText variant="button" color={textColor} numberOfLines={1}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
