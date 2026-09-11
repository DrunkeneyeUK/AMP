import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type StatusChipProps = {
  readonly label: string;
  readonly tone?: StatusTone;
  /**
   * Optional short prefix (for example "Draft") used so status is never
   * communicated by colour alone.
   */
  readonly accessibilityLabel?: string;
  readonly testID?: string;
};

/** Compact state pill used across reports, requests and blockers. */
export function StatusChip({
  label,
  tone = 'neutral',
  accessibilityLabel,
  testID,
}: StatusChipProps) {
  const theme = useTheme();

  const tones: Record<StatusTone, { readonly fg: string; readonly bg: string }> = {
    neutral: { fg: theme.colors.statusNeutral, bg: theme.colors.statusNeutralSurface },
    info: { fg: theme.colors.statusInfo, bg: theme.colors.statusInfoSurface },
    success: { fg: theme.colors.statusSuccess, bg: theme.colors.statusSuccessSurface },
    warning: { fg: theme.colors.statusWarning, bg: theme.colors.statusWarningSurface },
    danger: { fg: theme.colors.statusDanger, bg: theme.colors.statusDangerSurface },
  };

  const { fg, bg } = tones[tone];

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `Status: ${label}`}
      testID={testID}
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: fg,
          borderRadius: theme.radius.pill,
          borderWidth: theme.borderWidth.hairline,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
        },
      ]}
    >
      <AppText variant="overline" style={{ color: fg }} maxFontSizeMultiplier={1.3}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
});
