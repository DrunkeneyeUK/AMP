/**
 * Guards against shipping a privileged Supabase key inside the mobile client.
 *
 * Phase 0 acceptance criteria require that "no service secret is present in the
 * client", so every key that reaches the app is classified before use.
 */

export type SupabaseKeyKind = 'anon' | 'publishable' | 'service_role' | 'secret' | 'unknown';

export type SupabaseKeyInspection = {
  readonly kind: SupabaseKeyKind;
  readonly isPrivileged: boolean;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;

  const payload = segments[1];
  if (!payload) return null;

  const normalised = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=');

  try {
    // `atob` is available in Hermes, Node 16+ and every supported browser.
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function inspectSupabaseKey(key: string): SupabaseKeyInspection {
  const trimmed = key.trim();

  if (trimmed.startsWith('sb_secret_')) {
    return { kind: 'secret', isPrivileged: true };
  }

  if (trimmed.startsWith('sb_publishable_')) {
    return { kind: 'publishable', isPrivileged: false };
  }

  const payload = decodeJwtPayload(trimmed);
  const role = payload?.role;

  if (role === 'service_role') {
    return { kind: 'service_role', isPrivileged: true };
  }

  if (role === 'anon') {
    return { kind: 'anon', isPrivileged: false };
  }

  return { kind: 'unknown', isPrivileged: false };
}

export class PrivilegedSupabaseKeyError extends Error {
  readonly kind: SupabaseKeyKind;

  constructor(kind: SupabaseKeyKind) {
    super(
      `A privileged Supabase key (${kind}) was supplied to the AMP Field mobile client. ` +
        'Only the anon/publishable key may ship in the app. Remove the key from your ' +
        'environment configuration and rotate it — it must be treated as compromised.'
    );
    this.name = 'PrivilegedSupabaseKeyError';
    this.kind = kind;
  }
}

/** Throws when the supplied key would grant privileged access from a device. */
export function assertClientSafeSupabaseKey(key: string): void {
  const { kind, isPrivileged } = inspectSupabaseKey(key);
  if (isPrivileged) {
    throw new PrivilegedSupabaseKeyError(kind);
  }
}
