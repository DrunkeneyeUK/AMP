/**
 * Raw AMP Field colour ramps.
 *
 * Components must never reference these directly — consume the semantic tokens
 * in `theme/tokens.ts` instead, so a future light theme or brand refresh is a
 * single-file change.
 */

export const palette = {
  /** Near-black through graphite: the AMP Field surface ramp. */
  ink: {
    950: '#07080A',
    900: '#0A0B0D',
    850: '#101216',
    800: '#15181D',
    750: '#1B1F26',
    700: '#232830',
    650: '#2B313B',
    600: '#353C48',
  },
  /** White through slate: the AMP Field typography ramp. */
  slate: {
    50: '#FFFFFF',
    100: '#F2F5F8',
    200: '#DCE2EA',
    300: '#B4BECC',
    400: '#8B96A6',
    500: '#6F7A8A',
    600: '#525B68',
  },
  /** Restrained AMP red. Reserved for primary action and true urgency. */
  red: {
    300: '#F79189',
    400: '#EE6257',
    500: '#D93A2E',
    600: '#B22C22',
    700: '#7A1E17',
    900: '#2A100D',
  },
  green: {
    400: '#5CC98A',
    500: '#3FAE6A',
    700: '#1C5334',
    900: '#0F2A1B',
  },
  amber: {
    400: '#F0BA55',
    500: '#DFA12A',
    700: '#6B4C12',
    900: '#2B1F08',
  },
  blue: {
    400: '#6BA9E4',
    500: '#4A90D9',
    700: '#1F4470',
    900: '#0D1D2E',
  },
  transparent: 'transparent',
} as const;
