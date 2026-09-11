import Constants from 'expo-constants';

import { type ClientEnv, EnvironmentConfigurationError, parseClientEnv } from './schema';

export { EnvironmentConfigurationError, parseClientEnv } from './schema';
export type { ClientEnv } from './schema';

export type EnvResult =
  | { readonly ok: true; readonly env: ClientEnv }
  | { readonly ok: false; readonly issues: readonly string[] };

/** Raw, unvalidated configuration injected by `app.config.ts`. */
export function readRawClientConfig(): unknown {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  return extra?.ampField;
}

let cached: EnvResult | null = null;

/**
 * Validates the embedded configuration once per app session.
 *
 * Returns a result rather than throwing so the shell can render a readable
 * fatal-configuration screen instead of a white screen.
 */
export function getEnvResult(): EnvResult {
  if (cached) return cached;

  try {
    cached = { ok: true, env: parseClientEnv(readRawClientConfig()) };
  } catch (error) {
    cached =
      error instanceof EnvironmentConfigurationError
        ? { ok: false, issues: error.issues }
        : { ok: false, issues: [error instanceof Error ? error.message : String(error)] };
  }

  return cached;
}

/** Typed configuration. Throws when the app is misconfigured. */
export function getEnv(): ClientEnv {
  const result = getEnvResult();
  if (!result.ok) {
    throw new EnvironmentConfigurationError(result.issues);
  }
  return result.env;
}

/** Test-only: clears the memoised result between cases. */
export function resetEnvCacheForTests(): void {
  cached = null;
}
