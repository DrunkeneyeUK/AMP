import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type UserAvatarProps = {
  readonly name: string;
  readonly imageUrl?: string | null;
  readonly size?: number;
  readonly testID?: string;
};

export function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '?').slice(0, 2).toUpperCase();

  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function UserAvatar({ name, imageUrl, size = 40, testID }: UserAvatarProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`Profile picture for ${name}`}
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceInteractive,
          borderColor: theme.colors.borderSubtle,
          borderRadius: size / 2,
          borderWidth: theme.borderWidth.hairline,
          height: size,
          width: size,
        },
      ]}
    >
      {imageUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={{ height: size, width: size }}
          transition={120}
        />
      ) : (
        <AppText variant="label" color="secondary" maxFontSizeMultiplier={1.2}>
          {initialsFromName(name)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
