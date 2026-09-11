import { StyleSheet, View } from 'react-native';

import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type ErrorStateProps = {
  /** What the user was trying to do, e.g. "We couldn't load your sites". */
  readonly title: string;
  /** What happened, what is safe, and what to try next (§61). */
  readonly message: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  /** `fatal` states offer no retry and indicate the app cannot continue. */
  readonly severity?: 'recoverable' | 'fatal';
  /** Technical detail shown in non-production builds only. */
  readonly detail?: string;
  /** Expands to fill its parent so the content is vertically centred. */
  readonly fill?: boolean;
  readonly testID?: string;
};

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  severity = 'recoverable',
  detail,
  fill = false,
  testID,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${message}`}
      testID={testID ?? 'error-state'}
      style={[
        styles.container,
        fill && styles.fill,
        { gap: theme.spacing.sm, padding: theme.spacing.xxl },
      ]}
    >
      <AppText variant="overline" color={severity === 'fatal' ? 'danger' : 'warning'}>
        {severity === 'fatal' ? 'Cannot continue' : 'Something needs attention'}
      </AppText>
      <AppText variant="titleSmall" align="center">
        {title}
      </AppText>
      <AppText variant="bodyMedium" color="secondary" align="center">
        {message}
      </AppText>
      {detail ? (
        <AppText variant="bodySmall" color="muted" align="center" selectable>
          {detail}
        </AppText>
      ) : null}
      {onRetry ? (
        <View style={{ marginTop: theme.spacing.md, alignSelf: 'stretch' }}>
          <AppButton label={retryLabel} onPress={onRetry} />
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
