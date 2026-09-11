import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type ScreenHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly right?: React.ReactNode;
};

/** Consistent screen title block used above scrollable content. */
export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: theme.spacing.lg, paddingHorizontal: theme.spacing.lg },
      ]}
    >
      {onBack ? (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={16}
          onPress={onBack}
          style={{
            marginBottom: theme.spacing.sm,
            minHeight: theme.touchTarget.min,
            justifyContent: 'center',
          }}
        >
          <AppText variant="label" color="accent">
            Back
          </AppText>
        </Pressable>
      ) : null}

      <View style={styles.row}>
        <View style={styles.text}>
          <AppText accessibilityRole="header" variant="titleLarge">
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              variant="bodyMedium"
              color="secondary"
              style={{ marginTop: theme.spacing.xxs }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right ? <View style={{ marginLeft: theme.spacing.md }}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
  },
});
