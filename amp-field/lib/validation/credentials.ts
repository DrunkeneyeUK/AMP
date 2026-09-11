import { z } from 'zod';

/**
 * Client-side credential validation.
 *
 * Deliberately permissive: the server is the authority on whether an account
 * exists. These checks only stop obviously malformed submissions so a field
 * user is not left waiting on a round trip for a missing "@".
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .email('Enter a valid email address, for example alex@contractor.co.uk');

export const passwordSchema = z.string().min(1, 'Enter your password');

/** Applied when a user chooses a new password (recovery and invitation setup). */
export const newPasswordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .refine((value) => /[a-zA-Z]/.test(value), { message: 'Include at least one letter' })
  .refine((value) => /[0-9]/.test(value), { message: 'Include at least one number' });

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type SignInValues = z.infer<typeof signInSchema>;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Flattens a zod result into `{ field: message }` for form rendering. */
export function collectFieldErrors<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  values: unknown
): { readonly values: T | null; readonly errors: FieldErrors<T> } {
  const result = schema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  }

  const errors: FieldErrors<T> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field as keyof T] = issue.message;
    }
  }
  return { values: null, errors };
}
