import { forwardRef } from 'react';
import { StyleSheet, type TextInput } from 'react-native';

import { AppInput, type AppInputProps } from './AppInput';

export type AppTextAreaProps = AppInputProps & {
  /** Visible rows before the field scrolls. */
  readonly rows?: number;
};

/** Multi-line field used for work descriptions, impact and comments. */
export const AppTextArea = forwardRef<TextInput, AppTextAreaProps>(function AppTextArea(
  { rows = 4, style, ...rest },
  ref
) {
  return (
    <AppInput
      ref={ref}
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      style={[styles.area, { minHeight: 24 * rows }, style]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  area: {
    paddingTop: 12,
  },
});
