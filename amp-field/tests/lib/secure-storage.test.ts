import * as SecureStore from 'expo-secure-store';

import { SECURE_STORAGE_CHUNK_SIZE, secureSessionStorage } from '@/lib/supabase/secure-storage';

/** In-memory stand-in for the platform keystore. */
function installFakeKeystore() {
  const store = new Map<string, string>();

  jest
    .mocked(SecureStore.getItemAsync)
    .mockImplementation(async (key: string) =>
      store.has(key) ? (store.get(key) as string) : null
    );
  jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key: string, value: string) => {
    // Mirrors the real iOS limit so a regression in chunking fails here.
    if (value.length > 2048) throw new Error(`SecureStore value too large for key ${key}`);
    store.set(key, value);
  });
  jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key: string) => {
    store.delete(key);
  });

  return store;
}

describe('secureSessionStorage', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = installFakeKeystore();
  });

  it('returns null when nothing is stored', async () => {
    await expect(secureSessionStorage.getItem('sb-session')).resolves.toBeNull();
  });

  it('round-trips a small value', async () => {
    await secureSessionStorage.setItem('sb-session', 'hello');
    await expect(secureSessionStorage.getItem('sb-session')).resolves.toBe('hello');
  });

  it('chunks a session larger than the keystore limit', async () => {
    const session = 'x'.repeat(SECURE_STORAGE_CHUNK_SIZE * 3 + 17);

    await secureSessionStorage.setItem('sb-session', session);

    expect(store.get('sb-session.manifest')).toBe(JSON.stringify({ chunks: 4 }));
    await expect(secureSessionStorage.getItem('sb-session')).resolves.toBe(session);
  });

  it('does not leave stale chunks behind when a shorter session replaces a longer one', async () => {
    await secureSessionStorage.setItem('sb-session', 'y'.repeat(SECURE_STORAGE_CHUNK_SIZE * 3));
    await secureSessionStorage.setItem('sb-session', 'short');

    expect(store.get('sb-session.manifest')).toBe(JSON.stringify({ chunks: 1 }));
    expect(store.has('sb-session.1')).toBe(false);
    await expect(secureSessionStorage.getItem('sb-session')).resolves.toBe('short');
  });

  it('removes every chunk on sign out', async () => {
    await secureSessionStorage.setItem('sb-session', 'z'.repeat(SECURE_STORAGE_CHUNK_SIZE * 2));
    await secureSessionStorage.removeItem('sb-session');

    expect(store.size).toBe(0);
    await expect(secureSessionStorage.getItem('sb-session')).resolves.toBeNull();
  });

  it('treats a partially written session as absent rather than returning a corrupt token', async () => {
    await secureSessionStorage.setItem('sb-session', 'a'.repeat(SECURE_STORAGE_CHUNK_SIZE * 2));
    store.delete('sb-session.1');

    await expect(secureSessionStorage.getItem('sb-session')).resolves.toBeNull();
  });

  it('ignores a corrupt manifest', async () => {
    store.set('sb-session.manifest', 'not json');
    await expect(secureSessionStorage.getItem('sb-session')).resolves.toBeNull();
  });
});
