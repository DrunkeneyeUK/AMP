import { collectFieldErrors, newPasswordSchema, signInSchema } from '@/lib/validation';

describe('signInSchema', () => {
  it('accepts a well-formed email and password', () => {
    const { values, errors } = collectFieldErrors(signInSchema, {
      email: '  alex@contractor.co.uk ',
      password: 'correct horse',
    });

    expect(errors).toEqual({});
    expect(values?.email).toBe('alex@contractor.co.uk');
  });

  it('reports a missing email', () => {
    const { errors } = collectFieldErrors(signInSchema, { email: '', password: 'x' });
    expect(errors.email).toBe('Enter your email address');
  });

  it('reports a malformed email', () => {
    const { errors } = collectFieldErrors(signInSchema, { email: 'alex', password: 'x' });
    expect(errors.email).toContain('valid email address');
  });

  it('reports a missing password', () => {
    const { errors } = collectFieldErrors(signInSchema, {
      email: 'alex@contractor.co.uk',
      password: '',
    });
    expect(errors.password).toBe('Enter your password');
  });

  it('reports one message per field', () => {
    const { errors } = collectFieldErrors(signInSchema, { email: '', password: '' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'password']);
  });
});

describe('newPasswordSchema', () => {
  it.each([
    ['short1', 'too short'],
    ['abcdefghijkl', 'no number'],
    ['123456789012', 'no letter'],
  ])('rejects %s (%s)', (value) => {
    expect(newPasswordSchema.safeParse(value).success).toBe(false);
  });

  it('accepts a password with letters, numbers and enough length', () => {
    expect(newPasswordSchema.safeParse('zoneB-cabling-2026').success).toBe(true);
  });
});
