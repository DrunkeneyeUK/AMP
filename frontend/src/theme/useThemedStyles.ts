import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import type { Palette } from "@/src/constants/theme";

/**
 * Hook that produces memoized StyleSheet styles from a factory function.
 * The factory receives the current theme colors and is re-invoked when the
 * theme mode changes.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: Palette) => T
): T {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
