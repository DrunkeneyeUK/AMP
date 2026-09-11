import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type ConfirmationSheetProps = {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
  readonly busy?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly testID?: string;
};

/** Bottom sheet used to confirm submissions and destructive actions. */
export function ConfirmationSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmationSheetProps) {
  const theme = useTheme();

  return (
    <Modal
      accessibilityViewIsModal
      animationType="slide"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel={cancelLabel}
        accessibilityRole="button"
        onPress={busy ? undefined : onCancel}
        style={[styles.backdrop, { backgroundColor: theme.colors.surfaceOverlay }]}
      />
      <View
        testID={testID ?? 'confirmation-sheet'}
        style={[
          styles.sheet,
          theme.elevation.sheet,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            gap: theme.spacing.md,
            padding: theme.spacing.xl,
            paddingBottom: theme.spacing.huge,
          },
        ]}
      >
        <AppText accessibilityRole="header" variant="titleMedium">
          {title}
        </AppText>
        <AppText color="secondary">{message}</AppText>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <AppButton
            label={confirmLabel}
            loading={busy}
            onPress={onConfirm}
            variant={destructive ? 'danger' : 'primary'}
          />
          <AppButton label={cancelLabel} disabled={busy} onPress={onCancel} variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
