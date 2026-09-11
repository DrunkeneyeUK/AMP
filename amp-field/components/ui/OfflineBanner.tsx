import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useConnectivity } from '@/lib/sync';
import { useTheme } from '@/theme';

export type OfflineBannerProps = {
  /** Overrides the live connectivity value; used by tests and Storybook. */
  readonly forceOffline?: boolean;
  /** Number of records waiting to reach the server, when known. */
  readonly queuedCount?: number;
};

/**
 * Persistent, non-dismissible notice shown whenever the device is offline.
 *
 * Never implies that queued work has been delivered (§59).
 */
export function OfflineBanner({ forceOffline, queuedCount }: OfflineBannerProps) {
  const theme = useTheme();
  const { isOnline, hasResolved } = useConnectivity();

  const offline = forceOffline ?? (hasResolved && !isOnline);
  if (!offline) return null;

  const message =
    queuedCount && queuedCount > 0
      ? `You're offline. ${queuedCount} ${queuedCount === 1 ? 'item is' : 'items are'} waiting to sync.`
      : "You're offline. You can keep working — changes are saved on this phone.";

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={message}
      testID="offline-banner"
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.statusWarningSurface,
          borderBottomColor: theme.colors.statusWarning,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      <AppText variant="bodySmall" style={{ color: theme.colors.statusWarning }}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
