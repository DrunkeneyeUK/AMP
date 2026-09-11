import { EnvironmentConfigurationError, parseClientEnv } from '@/lib/env/schema';

const VALID = {
  appEnv: 'staging' as const,
  label: 'Beta',
  appName: 'AMP Field (Beta)',
  scheme: 'ampfield-beta',
  updateChannel: 'staging',
  showEnvironmentBadge: true,
  logLevel: 'info' as const,
  supabaseUrl: 'https://project.supabase.co',
  supabaseAnonKey: `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString(
    'base64url'
  )}.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.sig`,
};

describe('parseClientEnv', () => {
  it('accepts a complete, client-safe configuration', () => {
    expect(parseClientEnv(VALID).appEnv).toBe('staging');
  });

  it('rejects a missing Supabase URL with a readable issue', () => {
    expect(() => parseClientEnv({ ...VALID, supabaseUrl: '' })).toThrow(
      EnvironmentConfigurationError
    );

    try {
      parseClientEnv({ ...VALID, supabaseUrl: '' });
    } catch (error) {
      expect((error as EnvironmentConfigurationError).issues.join()).toContain('supabaseUrl');
    }
  });

  it('rejects an unknown environment name', () => {
    expect(() => parseClientEnv({ ...VALID, appEnv: 'qa' })).toThrow(EnvironmentConfigurationError);
  });

  it('rejects a plain-http Supabase URL that is not localhost', () => {
    expect(() => parseClientEnv({ ...VALID, supabaseUrl: 'http://project.supabase.co' })).toThrow(
      EnvironmentConfigurationError
    );
  });

  it('allows http://localhost for local development', () => {
    expect(() =>
      parseClientEnv({ ...VALID, appEnv: 'local', supabaseUrl: 'http://localhost:54321' })
    ).not.toThrow();
  });

  it('refuses a service-role key so it can never ship in a build', () => {
    const serviceRole = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(
      JSON.stringify({ role: 'service_role' })
    ).toString('base64url')}.sig`;

    try {
      parseClientEnv({ ...VALID, supabaseAnonKey: serviceRole });
      throw new Error('expected parseClientEnv to reject a service-role key');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);
      expect((error as EnvironmentConfigurationError).issues.join()).toContain('privileged');
    }
  });

  it('reports every problem at once rather than one at a time', () => {
    try {
      parseClientEnv({ ...VALID, supabaseUrl: 'nope', supabaseAnonKey: 'short' });
      throw new Error('expected parseClientEnv to throw');
    } catch (error) {
      const { issues } = error as EnvironmentConfigurationError;
      expect(issues.some((issue) => issue.startsWith('supabaseUrl'))).toBe(true);
      expect(issues.some((issue) => issue.startsWith('supabaseAnonKey'))).toBe(true);
    }
  });
});
