import { z } from 'zod';

import { APP_ENVIRONMENTS } from '@/constants/environments';
import { inspectSupabaseKey } from '@/lib/supabase/key-guard';

/**
 * Shape of the configuration that is embedded in the client bundle.
 *
 * Everything in here is safe to ship to a device. Privileged credentials
 * (service-role keys, database URLs, SMTP credentials) must never be added.
 */
export const clientEnvSchema = z.object({
  appEnv: z.enum(APP_ENVIRONMENTS),
  label: z.string().min(1),
  appName: z.string().min(1),
  scheme: z.string().min(1),
  updateChannel: z.string().min(1),
  showEnvironmentBadge: z.boolean(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  supabaseUrl: z
    .string()
    .url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL, e.g. https://xyz.supabase.co')
    .refine((value) => value.startsWith('https://') || value.startsWith('http://localhost'), {
      message: 'Supabase URL must use https, or http://localhost for local development',
    }),
  supabaseAnonKey: z
    .string()
    .min(20, 'EXPO_PUBLIC_SUPABASE_ANON_KEY looks too short to be a real key')
    .refine((value) => !inspectSupabaseKey(value).isPrivileged, {
      message:
        'A privileged Supabase key was supplied. Only the anon/publishable key may ship in the app.',
    }),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export class EnvironmentConfigurationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`AMP Field environment configuration is invalid:\n - ${issues.join('\n - ')}`);
    this.name = 'EnvironmentConfigurationError';
    this.issues = issues;
  }
}

/** Parses unknown configuration into a typed, validated `ClientEnv`. */
export function parseClientEnv(value: unknown): ClientEnv {
  const result = clientEnvSchema.safeParse(value);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`
    );
    throw new EnvironmentConfigurationError(issues);
  }

  return result.data;
}
