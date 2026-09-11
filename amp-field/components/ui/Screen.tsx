import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from './OfflineBanner';
import { useTheme } from '@/theme';

export type ScreenProps = {
  readonly children: ReactNode;
  /** Wraps content in a ScrollView. Disable for full-height list screens. */
  readonly scrollable?: boolean;
  readonly edges?: readonly Edge[];
  readonly showOfflineBanner?: boolean;
  readonly contentPadding?: boolean;
  readonly testID?: string;
};

/**
 * Base screen container: safe areas, keyboard handling and the offline banner.
 *
 * Every AMP Field screen renders inside this so field devices with notches,
 * gesture bars and on-screen keyboards behave consistently.
 */
export function Screen({
  children,
  scrollable = true,
  edges = ['top', 'bottom', 'left', 'right'],
  showOfflineBanner = true,
  contentPadding = true,
  testID,
}: ScreenProps) {
  const theme = useTheme();

  const body = (
    <View
      style={[
        styles.body,
        contentPadding && {
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges as Edge[]}
      style={[styles.safeArea, { backgroundColor: theme.colors.surfacePrimary }]}
      testID={testID}
    >
      {showOfflineBanner ? <OfflineBanner /> : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
