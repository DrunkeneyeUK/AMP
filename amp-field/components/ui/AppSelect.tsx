import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type AppSelectOption<TValue extends string> = {
  readonly value: TValue;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
};

export type AppSelectProps<TValue extends string> = {
  readonly label: string;
  readonly value: TValue | null;
  readonly options: readonly AppSelectOption<TValue>[];
  readonly onChange: (value: TValue) => void;
  readonly placeholder?: string;
  readonly error?: string;
  readonly hint?: string;
  readonly disabled?: boolean;
  readonly testID?: string;
};

/**
 * Accessible option picker.
 *
 * Uses a full-screen modal list rather than a platform picker so the field
 * experience is identical on iOS and Android and works with large text.
 */
export function AppSelect<TValue extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  error,
  hint,
  disabled = false,
  testID,
}: AppSelectProps<TValue>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  return (
    <View style={{ gap: theme.spacing.xs, width: '100%' }}>
      <AppText variant="label" color="secondary">
        {label}
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        testID={testID}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: pressed
              ? theme.colors.surfaceInteractive
              : theme.colors.surfaceElevated,
            borderColor: error ? theme.colors.statusDanger : theme.colors.borderSubtle,
            borderRadius: theme.radius.md,
            borderWidth: theme.borderWidth.hairline,
            minHeight: theme.touchTarget.min,
            opacity: disabled ? 0.6 : 1,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <AppText
          color={selected ? 'primary' : 'muted'}
          numberOfLines={1}
          style={styles.triggerText}
        >
          {selected?.label ?? placeholder}
        </AppText>
        <AppText color="muted" variant="label">
          Change
        </AppText>
      </Pressable>

      {error ? (
        <AppText accessibilityRole="alert" variant="bodySmall" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="bodySmall" color="muted">
          {hint}
        </AppText>
      ) : null}

      <Modal
        animationType="slide"
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}
        accessibilityViewIsModal
      >
        <Pressable
          accessibilityLabel="Close options"
          accessibilityRole="button"
          onPress={() => setOpen(false)}
          style={[styles.backdrop, { backgroundColor: theme.colors.surfaceOverlay }]}
        />
        <View
          style={[
            styles.sheet,
            theme.elevation.sheet,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              paddingBottom: theme.spacing.xxxl,
              paddingTop: theme.spacing.lg,
            },
          ]}
        >
          <AppText variant="titleSmall" style={{ paddingHorizontal: theme.spacing.lg }}>
            {label}
          </AppText>
          <ScrollView style={{ marginTop: theme.spacing.md }}>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, disabled: option.disabled }}
                  disabled={option.disabled}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: pressed ? theme.colors.surfaceInteractive : 'transparent',
                      minHeight: theme.touchTarget.comfortable,
                      opacity: option.disabled ? 0.5 : 1,
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.md,
                    },
                  ]}
                >
                  <View style={styles.optionText}>
                    <AppText color={isSelected ? 'accent' : 'primary'}>{option.label}</AppText>
                    {option.description ? (
                      <AppText variant="bodySmall" color="muted">
                        {option.description}
                      </AppText>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <AppText variant="label" color="accent">
                      Selected
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: {
    flex: 1,
  },
  sheet: {
    bottom: 0,
    left: 0,
    maxHeight: '70%',
    position: 'absolute',
    right: 0,
  },
  trigger: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  triggerText: {
    flex: 1,
    marginRight: 12,
  },
});
