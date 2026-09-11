import { palette } from './palette';

/**
 * Semantic design tokens for AMP Field.
 *
 * Every colour used by a component must come from here. Hard-coded hex values
 * in components are rejected by lint (`no-restricted-syntax`).
 */

export type ColorTokens = {
  readonly surfacePrimary: string;
  readonly surfaceSecondary: string;
  readonly surfaceElevated: string;
  readonly surfaceInteractive: string;
  readonly surfaceInverse: string;
  readonly surfaceOverlay: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly textInverse: string;
  readonly textOnAccent: string;
  readonly borderSubtle: string;
  readonly borderStrong: string;
  readonly borderFocus: string;
  readonly edgeHighlight: string;
  readonly accentPrimary: string;
  readonly accentPrimaryPressed: string;
  readonly accentPrimaryMuted: string;
  readonly accentPrimaryDisabled: string;
  readonly statusSuccess: string;
  readonly statusSuccessSurface: string;
  readonly statusWarning: string;
  readonly statusWarningSurface: string;
  readonly statusDanger: string;
  readonly statusDangerSurface: string;
  readonly statusInfo: string;
  readonly statusInfoSurface: string;
  readonly statusNeutral: string;
  readonly statusNeutralSurface: string;
  readonly skeletonBase: string;
  readonly skeletonHighlight: string;
};

export const darkColors: ColorTokens = {
  surfacePrimary: palette.ink[900],
  surfaceSecondary: palette.ink[850],
  surfaceElevated: palette.ink[800],
  surfaceInteractive: palette.ink[750],
  surfaceInverse: palette.slate[100],
  surfaceOverlay: 'rgba(7, 8, 10, 0.72)',

  textPrimary: palette.slate[100],
  textSecondary: palette.slate[300],
  textMuted: palette.slate[500],
  textInverse: palette.ink[900],
  textOnAccent: palette.slate[50],

  borderSubtle: palette.ink[700],
  borderStrong: palette.ink[600],
  borderFocus: palette.red[400],
  /** Subtle top-edge highlight that gives panels modest material depth. */
  edgeHighlight: 'rgba(255, 255, 255, 0.06)',

  accentPrimary: palette.red[500],
  accentPrimaryPressed: palette.red[600],
  accentPrimaryMuted: palette.red[900],
  accentPrimaryDisabled: palette.red[700],

  statusSuccess: palette.green[400],
  statusSuccessSurface: palette.green[900],
  statusWarning: palette.amber[400],
  statusWarningSurface: palette.amber[900],
  statusDanger: palette.red[400],
  statusDangerSurface: palette.red[900],
  statusInfo: palette.blue[400],
  statusInfoSurface: palette.blue[900],
  statusNeutral: palette.slate[400],
  statusNeutralSurface: palette.ink[750],

  skeletonBase: palette.ink[800],
  skeletonHighlight: palette.ink[700],
};

/** 4pt base scale — compact enough for operational cards, generous for touch. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const borderWidth = {
  hairline: 1,
  thick: 2,
} as const;

/**
 * Minimum interactive size. Field users wear gloves and work outdoors, so the
 * floor is deliberately above the 44pt platform minimum.
 */
export const touchTarget = {
  min: 48,
  comfortable: 56,
} as const;

export type TypographyToken = {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: '400' | '500' | '600' | '700';
  readonly letterSpacing?: number;
  readonly textTransform?: 'uppercase';
};

export const typography = {
  displayLarge: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.4 },
  titleLarge: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.2 },
  titleMedium: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  titleSmall: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySmall: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600', letterSpacing: 0.2 },
} as const satisfies Record<string, TypographyToken>;

export type ElevationToken = {
  readonly shadowColor: string;
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly shadowOffset: { width: number; height: number };
  readonly elevation: number;
};

/** Modest material depth — never glow. */
export const elevation = {
  none: {
    shadowColor: palette.ink[950],
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  card: {
    shadowColor: palette.ink[950],
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sheet: {
    shadowColor: palette.ink[950],
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
} as const satisfies Record<string, ElevationToken>;

export const duration = {
  instant: 120,
  fast: 180,
  normal: 240,
  slow: 360,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type TypographyVariant = keyof typeof typography;
export type ElevationVariant = keyof typeof elevation;
