import { StyleSheet, View } from 'react-native';

import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type EmptyStateProps = {
  readonly title: string;
  /** Explain what will appear here and what the user can do about it. */
  readonly message: string;
  readonly action?: { readonly label: string; readonly onPress: () => void };
  /** Expands to fill its parent so the content is vertically centred. */
  readonly fill?: boolean;
  readonly testID?: string;
};

export function EmptyState({ title, message, action, fill = false, testID }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${message}`}
      testID={testID ?? 'empty-state'}
      style={[
        styles.container,
        fill && styles.fill,
        { gap: theme.spacing.sm, padding: theme.spacing.xxl },
      ]}
    >
      <AppText variant="titleSmall" align="center">
        {title}
      </AppText>
      <AppText variant="bodyMedium" color="secondary" align="center">
        {message}
      </AppText>
      {action ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <AppButton
            label={action.label}
            onPress={action.onPress}
            variant="secondary"
            fullWidth={false}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
  },
});
