import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { assertClientSafeSupabaseKey } from './key-guard';
import { secureSessionStorage } from './secure-storage';
import { getEnv } from '@/lib/env';
import type { Database } from '@/types/database';

export type AmpFieldSupabaseClient = SupabaseClient<Database>;

let client: AmpFieldSupabaseClient | null = null;

/**
 * Creates the AMP Field Supabase client.
 *
 * Exported separately from the singleton so tests can build an isolated client
 * without touching module state.
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  storage = secureSessionStorage
): AmpFieldSupabaseClient {
  // Belt and braces: `lib/env` validates the key too, but a client is also
  // built directly in tests and scripts.
  assertClientSafeSupabaseKey(anonKey);

  return createClient<Database>(url, anonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      // React Native has no URL bar; recovery and invitation links are handled
      // explicitly by the deep-link handler.
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
    global: {
      headers: { 'x-amp-client': 'amp-field-mobile' },
    },
  });
}

/** Lazily-created singleton used by the app. */
export function getSupabaseClient(): AmpFieldSupabaseClient {
  if (!client) {
    const env = getEnv();
    client = createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
}

/** Test-only: drops the memoised client. */
export function resetSupabaseClientForTests(): void {
  client = null;
}

/**
 * Keeps the access token fresh while the app is in the foreground and stops the
 * timer in the background, which is the behaviour Supabase recommends for React
 * Native. Returns an unsubscribe function.
 */
export function registerSupabaseAutoRefresh(
  supabase: AmpFieldSupabaseClient = getSupabaseClient()
): () => void {
  const handle = (status: AppStateStatus) => {
    if (status === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  };

  handle(AppState.currentState);
  const subscription = AppState.addEventListener('change', handle);

  return () => {
    subscription.remove();
    void supabase.auth.stopAutoRefresh();
  };
}
