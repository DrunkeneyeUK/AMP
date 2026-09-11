import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { StatusChip, type StatusTone } from './StatusChip';
import { useTheme } from '@/theme';

export type SiteCardProps = {
  readonly siteName: string;
  readonly addressSummary: string;
  readonly projectName?: string;
  readonly customerName?: string;
  readonly workAreaName?: string;
  readonly imageUrl?: string | null;
  readonly status?: { readonly label: string; readonly tone?: StatusTone };
  readonly onPress?: () => void;
  readonly testID?: string;
};

/**
 * Compact operational card for a site.
 *
 * Purely presentational: it takes already-resolved values so it can be reused
 * by the Today screen, site lists and manager views alike.
 */
export function SiteCard({
  siteName,
  addressSummary,
  projectName,
  customerName,
  workAreaName,
  imageUrl,
  status,
  onPress,
  testID,
}: SiteCardProps) {
  const theme = useTheme();

  const meta = [projectName, customerName].filter(Boolean).join(' · ');

  return (
    <AppCard
      accessibilityLabel={`${siteName}, ${addressSummary}`}
      onPress={onPress}
      padded={false}
      testID={testID ?? 'site-card'}
    >
      {imageUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={styles.image}
          transition={160}
        />
      ) : null}

      <View style={{ gap: theme.spacing.xs, padding: theme.spacing.lg }}>
        <View style={styles.titleRow}>
          <AppText variant="titleSmall" numberOfLines={2} style={styles.title}>
            {siteName}
          </AppText>
          {status ? <StatusChip label={status.label} tone={status.tone} /> : null}
        </View>

        <AppText variant="bodySmall" color="secondary" numberOfLines={2}>
          {addressSummary}
        </AppText>

        {meta ? (
          <AppText variant="bodySmall" color="muted" numberOfLines={1}>
            {meta}
          </AppText>
        ) : null}

        {workAreaName ? (
          <AppText variant="label" color="accent" numberOfLines={1}>
            {workAreaName}
          </AppText>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 148,
    width: '100%',
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
