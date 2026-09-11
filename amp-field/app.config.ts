import fs from 'node:fs';
import path from 'node:path';

import { config as loadEnvFile } from 'dotenv';
import type { ConfigContext, ExpoConfig } from 'expo/config';

import environments from './constants/environments.json';

type AppEnvironment = keyof typeof environments;

const DEFAULT_APP_ENVIRONMENT: AppEnvironment = 'local';

/**
 * Resolved here rather than imported from `constants/environments.ts` because
 * the Expo CLI loads this file as plain JavaScript and cannot require a
 * TypeScript module. The JSON above is the single source of truth shared with
 * the app.
 */
function resolveAppEnvironment(value: unknown): AppEnvironment {
  return typeof value === 'string' && value in environments
    ? (value as AppEnvironment)
    : DEFAULT_APP_ENVIRONMENT;
}

/**
 * AMP Field Expo configuration.
 *
 * The target environment is selected with `APP_ENV` (local | development |
 * staging | production). Static per-environment metadata lives in
 * `constants/environments.ts`; endpoints and the Supabase anon key are supplied
 * through `.env.<app-env>` files (git-ignored) or CI/EAS secrets.
 */

const appEnv = resolveAppEnvironment(process.env.APP_ENV);
const metadata = environments[appEnv];

// Later files win so a developer's `.local` overrides remain private.
for (const file of ['.env', `.env.${appEnv}`, `.env.${appEnv}.local`]) {
  const absolute = path.resolve(__dirname, file);
  if (fs.existsSync(absolute)) {
    loadEnvFile({ path: absolute, override: true });
  }
}

function requiredPublicVar(name: string): string {
  // Returned as-is (including empty) so validation reports a single, readable
  // error rather than throwing here with a partial picture.
  return process.env[name] ?? '';
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: metadata.appName,
  slug: 'amp-field',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: metadata.scheme,
  userInterfaceStyle: 'dark',
  backgroundColor: '#0A0B0D',
  icon: './assets/brand/icon.png',
  primaryColor: '#D93A2E',
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: metadata.bundleIdentifier,
    supportsTablet: true,
    infoPlist: {
      // Field users routinely work in low-signal areas; keep the UI legible.
      UIViewControllerBasedStatusBarAppearance: false,
    },
  },
  android: {
    package: metadata.bundleIdentifier,
    adaptiveIcon: {
      foregroundImage: './assets/brand/adaptive-icon.png',
      backgroundColor: '#0A0B0D',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/brand/favicon.png',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/brand/splash-icon.png',
        backgroundColor: '#0A0B0D',
        imageWidth: 180,
        resizeMode: 'contain',
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    ...config.extra,
    ampField: {
      appEnv,
      label: metadata.label,
      appName: metadata.appName,
      scheme: metadata.scheme,
      updateChannel: metadata.updateChannel,
      showEnvironmentBadge: metadata.showEnvironmentBadge,
      logLevel: metadata.logLevel,
      supabaseUrl: requiredPublicVar('EXPO_PUBLIC_SUPABASE_URL'),
      supabaseAnonKey: requiredPublicVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    },
  },
});
