import { forwardRef, useState } from 'react';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/theme';

export type AppInputProps = TextInputProps & {
  readonly label: string;
  /** Supporting copy shown under the field when there is no error. */
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly trailingAction?: { readonly label: string; readonly onPress: () => void };
  readonly containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Single-line text field.
 *
 * Errors are announced to screen readers and shown with an icon-free text
 * message, so state is never communicated by colour alone (§62).
 */
export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  {
    label,
    hint,
    error,
    required = false,
    trailingAction,
    containerStyle,
    onFocus,
    onBlur,
    editable = true,
    style,
    ...rest
  },
  ref
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.statusDanger
    : focused
      ? theme.colors.borderFocus
      : theme.colors.borderSubtle;

  return (
    <View style={[styles.container, { gap: theme.spacing.xs }, containerStyle]}>
      <View style={styles.labelRow}>
        <AppText variant="label" color="secondary">
          {label}
        </AppText>
        {required ? (
          <AppText variant="label" color="muted">
            {' '}
            (required)
          </AppText>
        ) : null}
      </View>

      <View
        style={[
          styles.field,
          {
            backgroundColor: editable
              ? theme.colors.surfaceElevated
              : theme.colors.surfaceSecondary,
            borderColor,
            borderRadius: theme.radius.md,
            borderWidth: theme.borderWidth.hairline,
            minHeight: theme.touchTarget.min,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          editable={editable}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accentPrimary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            theme.typography.bodyLarge,
            { color: editable ? theme.colors.textPrimary : theme.colors.textMuted },
            style,
          ]}
          {...rest}
        />
        {trailingAction ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={trailingAction.onPress}
            style={{ paddingLeft: theme.spacing.sm }}
          >
            <AppText variant="label" color="accent">
              {trailingAction.label}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <AppText accessibilityRole="alert" variant="bodySmall" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="bodySmall" color="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  field: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  labelRow: {
    flexDirection: 'row',
  },
});
