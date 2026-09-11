import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Session storage for Supabase auth.
 *
 * Tokens are kept in the platform keystore (Keychain / EncryptedSharedPreferences)
 * rather than plain async storage. SecureStore rejects values above ~2 KB on
 * iOS, and a Supabase session comfortably exceeds that once refresh tokens and
 * user metadata are included, so values are transparently chunked.
 *
 * Web builds (used for automated checks and the future management console) fall
 * back to AsyncStorage, which is backed by localStorage there — the platform
 * keystore does not exist in a browser.
 */

/** Comfortably under the 2048-byte SecureStore ceiling, allowing for UTF-8. */
const CHUNK_SIZE = 1500;

const manifestKey = (key: string) => `${key}.manifest`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

const useSecureStore = Platform.OS === 'ios' || Platform.OS === 'android';

type Manifest = { readonly chunks: number };

function parseManifest(raw: string | null): Manifest | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as { chunks?: unknown }).chunks === 'number'
    ) {
      return { chunks: (parsed as { chunks: number }).chunks };
    }
  } catch {
    // Fall through — a corrupt manifest is treated as "nothing stored".
  }
  return null;
}

function splitIntoChunks(value: string): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += CHUNK_SIZE) {
    chunks.push(value.slice(index, index + CHUNK_SIZE));
  }
  return chunks.length > 0 ? chunks : [''];
}

async function readRaw(key: string): Promise<string | null> {
  return useSecureStore ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key);
}

async function writeRaw(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function deleteRaw(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

export type SupportedStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export const secureSessionStorage: SupportedStorage = {
  async getItem(key) {
    const manifest = parseManifest(await readRaw(manifestKey(key)));
    if (!manifest) return null;

    const parts: string[] = [];
    for (let index = 0; index < manifest.chunks; index += 1) {
      const part = await readRaw(chunkKey(key, index));
      // A missing chunk means the stored value is unusable; treat the whole
      // session as absent so the user is asked to sign in again.
      if (part === null) return null;
      parts.push(part);
    }

    return parts.join('');
  },

  async setItem(key, value) {
    // Clear first so a shorter session never leaves stale trailing chunks.
    await secureSessionStorage.removeItem(key);

    const chunks = splitIntoChunks(value);
    for (const [index, chunk] of chunks.entries()) {
      await writeRaw(chunkKey(key, index), chunk);
    }
    await writeRaw(manifestKey(key), JSON.stringify({ chunks: chunks.length }));
  },

  async removeItem(key) {
    const manifest = parseManifest(await readRaw(manifestKey(key)));
    if (manifest) {
      for (let index = 0; index < manifest.chunks; index += 1) {
        await deleteRaw(chunkKey(key, index));
      }
    }
    await deleteRaw(manifestKey(key));
  },
};

/** Test seam: exposes the chunk size used by the adapter. */
export const SECURE_STORAGE_CHUNK_SIZE = CHUNK_SIZE;
