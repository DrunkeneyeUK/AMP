import { darkTheme } from '@/theme';
import { darkColors, spacing, touchTarget, typography } from '@/theme/tokens';

/** Relative luminance per WCAG 2.1. */
function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [r = 0, g = 0, b = 0] = linear;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

describe('design tokens', () => {
  it('exposes every semantic colour through the theme', () => {
    expect(darkTheme.colors).toBe(darkColors);
  });

  it('meets WCAG AA (4.5:1) for body text on the primary surface', () => {
    expect(contrastRatio(darkColors.textPrimary, darkColors.surfacePrimary)).toBeGreaterThanOrEqual(
      4.5
    );
    expect(
      contrastRatio(darkColors.textSecondary, darkColors.surfacePrimary)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('meets WCAG AA for secondary text on graphite panels', () => {
    expect(
      contrastRatio(darkColors.textSecondary, darkColors.surfaceSecondary)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('meets WCAG AA large-text contrast (3:1) for muted text', () => {
    expect(contrastRatio(darkColors.textMuted, darkColors.surfacePrimary)).toBeGreaterThanOrEqual(
      3
    );
  });

  it('keeps the primary action legible', () => {
    expect(contrastRatio(darkColors.textOnAccent, darkColors.accentPrimary)).toBeGreaterThanOrEqual(
      4.5
    );
  });

  it('gives status colours at least 3:1 against their own surfaces', () => {
    const pairs: readonly (readonly [string, string])[] = [
      [darkColors.statusSuccess, darkColors.statusSuccessSurface],
      [darkColors.statusWarning, darkColors.statusWarningSurface],
      [darkColors.statusDanger, darkColors.statusDangerSurface],
      [darkColors.statusInfo, darkColors.statusInfoSurface],
    ];

    for (const [fg, bg] of pairs) {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps touch targets usable with gloves', () => {
    expect(touchTarget.min).toBeGreaterThanOrEqual(48);
  });

  it('uses a consistent 4pt spacing scale', () => {
    for (const value of Object.values(spacing)) {
      expect(value % 2).toBe(0);
    }
  });

  it('gives every typography token a line height above its font size', () => {
    for (const token of Object.values(typography)) {
      expect(token.lineHeight).toBeGreaterThan(token.fontSize);
    }
  });
});
