import environments from './environments.json';

/**
 * Static, non-secret metadata for each deployable AMP Field environment.
 *
 * The values live in `environments.json` because `app.config.ts` is loaded by
 * the Expo CLI as plain JavaScript and cannot import a TypeScript module — JSON
 * keeps a single source of truth for both the build config and the app.
 *
 * Secrets (Supabase URL / anon key) never live here. They are supplied per
 * environment through `.env.<app-env>` files or CI/EAS secrets, and validated
 * at runtime by `lib/env`.
 */

export const APP_ENVIRONMENTS = ['local', 'development', 'staging', 'production'] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export const DEFAULT_APP_ENVIRONMENT: AppEnvironment = 'local';

export type EnvironmentMetadata = {
  /** Human readable label shown in diagnostics and non-production builds. */
  readonly label: string;
  /** Display name of the installed application. */
  readonly appName: string;
  /** Deep-link scheme used for password recovery and invitation links. */
  readonly scheme: string;
  /** iOS bundle identifier / Android application id. */
  readonly bundleIdentifier: string;
  /** EAS Update channel this environment ships from. */
  readonly updateChannel: string;
  /** Whether an environment ribbon should be shown in the UI. */
  readonly showEnvironmentBadge: boolean;
  /** Minimum log level emitted by the app logger. */
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
};

export const ENVIRONMENT_METADATA = environments as Record<AppEnvironment, EnvironmentMetadata>;

export function isAppEnvironment(value: unknown): value is AppEnvironment {
  return typeof value === 'string' && (APP_ENVIRONMENTS as readonly string[]).includes(value);
}

export function resolveAppEnvironment(value: unknown): AppEnvironment {
  return isAppEnvironment(value) ? value : DEFAULT_APP_ENVIRONMENT;
}
