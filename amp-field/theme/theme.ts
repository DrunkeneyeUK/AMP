import {
  borderWidth,
  type ColorTokens,
  darkColors,
  duration,
  elevation,
  radius,
  spacing,
  touchTarget,
  typography,
} from './tokens';

export type ThemeName = 'dark';

export type Theme = {
  readonly name: ThemeName;
  readonly colors: ColorTokens;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly borderWidth: typeof borderWidth;
  readonly touchTarget: typeof touchTarget;
  readonly typography: typeof typography;
  readonly elevation: typeof elevation;
  readonly duration: typeof duration;
};

/**
 * AMP Field ships a single dark theme in Phase 0. The provider is themed rather
 * than hard-coded so a light/high-contrast variant can be added without
 * touching component code.
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: darkColors,
  spacing,
  radius,
  borderWidth,
  touchTarget,
  typography,
  elevation,
  duration,
};

export const themes: Record<ThemeName, Theme> = {
  dark: darkTheme,
};
