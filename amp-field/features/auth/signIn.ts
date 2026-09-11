/**
 * Sign-in transport.
 *
 * PR #1 delivers the shell: branding, form, validation, loading and error
 * states. The Supabase call itself is introduced in PR #2 ("Secure
 * Authentication and Tenant Shell") together with session storage, membership
 * loading and protected routing.
 *
 * Keeping the seam here — rather than a stub inside the screen — means PR #2
 * replaces one function and the screen is unchanged.
 */

export type SignInOutcome =
  | { readonly status: 'signed_in' }
  | { readonly status: 'invalid_credentials' }
  | { readonly status: 'not_available'; readonly message: string }
  | { readonly status: 'error'; readonly message: string };

export async function submitSignIn(_credentials: {
  readonly email: string;
  readonly password: string;
}): Promise<SignInOutcome> {
  return {
    status: 'not_available',
    message:
      'Sign-in is not connected in this build. Authentication, session storage and ' +
      'organisation membership arrive in the next foundation release.',
  };
}
