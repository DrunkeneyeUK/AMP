import {
  assertClientSafeSupabaseKey,
  inspectSupabaseKey,
  PrivilegedSupabaseKeyError,
} from '@/lib/supabase/key-guard';

/** Builds an unsigned JWT with the given payload — signature is irrelevant here. */
function jwtWithRole(role: string): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, iss: 'supabase' })}.signature`;
}

describe('inspectSupabaseKey', () => {
  it('accepts a legacy anon JWT', () => {
    expect(inspectSupabaseKey(jwtWithRole('anon'))).toEqual({
      kind: 'anon',
      isPrivileged: false,
    });
  });

  it('accepts a publishable key', () => {
    expect(inspectSupabaseKey('sb_publishable_abc123')).toEqual({
      kind: 'publishable',
      isPrivileged: false,
    });
  });

  it('flags a service-role JWT as privileged', () => {
    expect(inspectSupabaseKey(jwtWithRole('service_role'))).toEqual({
      kind: 'service_role',
      isPrivileged: true,
    });
  });

  it('flags a secret key as privileged', () => {
    expect(inspectSupabaseKey('sb_secret_abc123')).toEqual({
      kind: 'secret',
      isPrivileged: true,
    });
  });

  it('treats an unrecognised value as unknown rather than privileged', () => {
    expect(inspectSupabaseKey('not-a-key')).toEqual({ kind: 'unknown', isPrivileged: false });
  });

  it('ignores surrounding whitespace', () => {
    expect(inspectSupabaseKey('  sb_secret_abc  ').isPrivileged).toBe(true);
  });
});

describe('assertClientSafeSupabaseKey', () => {
  it('throws for a service-role key', () => {
    expect(() => assertClientSafeSupabaseKey(jwtWithRole('service_role'))).toThrow(
      PrivilegedSupabaseKeyError
    );
  });

  it('does not throw for an anon key', () => {
    expect(() => assertClientSafeSupabaseKey(jwtWithRole('anon'))).not.toThrow();
  });
});
