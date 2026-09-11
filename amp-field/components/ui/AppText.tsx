import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme';
import type { TypographyVariant } from '@/theme';

export type AppTextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'onAccent'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type AppTextProps = TextProps & {
  readonly variant?: TypographyVariant;
  readonly color?: AppTextColor;
  readonly align?: 'auto' | 'left' | 'right' | 'center';
};

/**
 * The only sanctioned way to render text in AMP Field.
 *
 * Supports dynamic type by default (`allowFontScaling`), capped so a very large
 * system font cannot destroy a dense operational card.
 */
export function AppText({
  variant = 'bodyMedium',
  color = 'primary',
  align,
  style,
  maxFontSizeMultiplier = 1.6,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const token = theme.typography[variant];

  const colorMap: Record<AppTextColor, string> = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    accent: theme.colors.accentPrimary,
    onAccent: theme.colors.textOnAccent,
    inverse: theme.colors.textInverse,
    success: theme.colors.statusSuccess,
    warning: theme.colors.statusWarning,
    danger: theme.colors.statusDanger,
    info: theme.colors.statusInfo,
  };

  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[token, { color: colorMap[color], textAlign: align }, style]}
      {...rest}
    />
  );
}
