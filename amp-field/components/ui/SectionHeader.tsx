import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type SectionHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: { readonly label: string; readonly onPress: () => void };
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { marginBottom: theme.spacing.sm }]}>
      <View style={styles.text}>
        <AppText accessibilityRole="header" variant="overline" color="muted">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySmall" color="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" hitSlop={12} onPress={action.onPress}>
          <AppText variant="label" color="accent">
            {action.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
  },
});
