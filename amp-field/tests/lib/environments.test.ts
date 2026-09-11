import {
  APP_ENVIRONMENTS,
  ENVIRONMENT_METADATA,
  isAppEnvironment,
  resolveAppEnvironment,
} from '@/constants/environments';

describe('environment metadata', () => {
  it('defines metadata for every environment', () => {
    for (const appEnv of APP_ENVIRONMENTS) {
      expect(ENVIRONMENT_METADATA[appEnv]).toBeDefined();
    }
  });

  it('gives every environment a unique bundle identifier so builds install side by side', () => {
    const identifiers = APP_ENVIRONMENTS.map((env) => ENVIRONMENT_METADATA[env].bundleIdentifier);
    expect(new Set(identifiers).size).toBe(identifiers.length);
  });

  it('gives every environment a unique deep-link scheme', () => {
    const schemes = APP_ENVIRONMENTS.map((env) => ENVIRONMENT_METADATA[env].scheme);
    expect(new Set(schemes).size).toBe(schemes.length);
  });

  it('only shows the environment ribbon outside production', () => {
    expect(ENVIRONMENT_METADATA.production.showEnvironmentBadge).toBe(false);
    expect(ENVIRONMENT_METADATA.staging.showEnvironmentBadge).toBe(true);
  });

  it('falls back to local for unknown values', () => {
    expect(resolveAppEnvironment('qa')).toBe('local');
    expect(resolveAppEnvironment(undefined)).toBe('local');
    expect(resolveAppEnvironment('production')).toBe('production');
  });

  it('narrows unknown values', () => {
    expect(isAppEnvironment('staging')).toBe(true);
    expect(isAppEnvironment('nope')).toBe(false);
  });
});
