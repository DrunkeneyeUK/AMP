import { AppState, type AppStateStatus } from 'react-native';

import { resetEnvCacheForTests } from '@/lib/env';
import {
  createSupabaseClient,
  getSupabaseClient,
  registerSupabaseAutoRefresh,
  resetSupabaseClientForTests,
} from '@/lib/supabase/client';
import { PrivilegedSupabaseKeyError } from '@/lib/supabase/key-guard';

const ANON_KEY = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(
  JSON.stringify({ role: 'anon' })
).toString('base64url')}.sig`;

const SERVICE_KEY = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(
  JSON.stringify({ role: 'service_role' })
).toString('base64url')}.sig`;

describe('createSupabaseClient', () => {
  it('builds a client from an anon key', () => {
    const client = createSupabaseClient('https://project.supabase.co', ANON_KEY);
    expect(client.auth).toBeDefined();
  });

  it('refuses to build a client from a service-role key', () => {
    expect(() => createSupabaseClient('https://project.supabase.co', SERVICE_KEY)).toThrow(
      PrivilegedSupabaseKeyError
    );
  });

  it('persists sessions through the supplied storage adapter', async () => {
    const storage = {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(async () => undefined),
      removeItem: jest.fn(async () => undefined),
    };

    const client = createSupabaseClient('https://project.supabase.co', ANON_KEY, storage);
    await client.auth.getSession();

    expect(storage.getItem).toHaveBeenCalled();
  });
});

describe('getSupabaseClient', () => {
  beforeEach(() => {
    resetSupabaseClientForTests();
    resetEnvCacheForTests();
  });

  it('memoises a single client for the app session', () => {
    expect(getSupabaseClient()).toBe(getSupabaseClient());
  });

  it('builds the client from validated configuration', () => {
    expect(getSupabaseClient().auth).toBeDefined();
  });
});

describe('registerSupabaseAutoRefresh', () => {
  beforeEach(() => resetSupabaseClientForTests());

  it('refreshes the token while the app is in the foreground and stops in the background', () => {
    const startAutoRefresh = jest.fn().mockResolvedValue(undefined);
    const stopAutoRefresh = jest.fn().mockResolvedValue(undefined);
    const remove = jest.fn();
    let listener: ((status: AppStateStatus) => void) | undefined;

    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      handler: (status: AppStateStatus) => void
    ) => {
      listener = handler;
      return { remove } as never;
    }) as never);

    const client = { auth: { startAutoRefresh, stopAutoRefresh } };
    const unregister = registerSupabaseAutoRefresh(client as never);

    listener?.('background');
    expect(stopAutoRefresh).toHaveBeenCalled();

    listener?.('active');
    expect(startAutoRefresh).toHaveBeenCalled();

    unregister();
    expect(remove).toHaveBeenCalled();
  });
});
