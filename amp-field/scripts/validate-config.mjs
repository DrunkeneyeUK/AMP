#!/usr/bin/env node
/**
 * Config validation for CI.
 *
 * Evaluates the Expo config for every environment and asserts the invariants
 * the Phase 0 acceptance criteria depend on:
 *   * each environment resolves to a distinct bundle identifier and scheme
 *   * no privileged Supabase key is embedded in a client build
 *   * required public variables are declared
 *
 * Runs without network access and without a populated `.env`, so it is safe on
 * a fresh checkout: missing values are reported as warnings, privileged values
 * are hard failures.
 */

import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENVIRONMENTS = ['local', 'development', 'staging', 'production'];

const failures = [];
const warnings = [];
const seen = new Map();

// `expo config` performs the real evaluation, including plugin resolution.
function readExpoConfig(appEnv) {
  const result = spawnSync(
    'npx',
    ['--no-install', 'expo', 'config', '--type', 'prebuild', '--json'],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, APP_ENV: appEnv, CI: '1', EXPO_NO_TELEMETRY: '1' },
      maxBuffer: 32 * 1024 * 1024,
    }
  );

  if (result.status !== 0) {
    throw new Error(
      `expo config failed for APP_ENV=${appEnv}:\n${result.stderr || result.stdout}`.trim()
    );
  }

  // Expo may print warnings before the JSON document.
  const start = result.stdout.indexOf('{');
  if (start < 0) {
    throw new Error(`expo config produced no JSON for APP_ENV=${appEnv}`);
  }
  return JSON.parse(result.stdout.slice(start));
}

function isPrivilegedKey(key) {
  if (typeof key !== 'string' || key.length === 0) return false;
  if (key.startsWith('sb_secret_')) return true;

  const segments = key.split('.');
  if (segments.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

for (const appEnv of ENVIRONMENTS) {
  let config;
  try {
    config = readExpoConfig(appEnv);
  } catch (error) {
    failures.push(error.message);
    continue;
  }

  const amp = config?.extra?.ampField;
  if (!amp) {
    failures.push(`${appEnv}: extra.ampField is missing from the resolved Expo config`);
    continue;
  }

  if (amp.appEnv !== appEnv) {
    failures.push(`${appEnv}: resolved appEnv is "${amp.appEnv}"`);
  }

  for (const [field, value] of [
    ['scheme', config.scheme],
    ['ios.bundleIdentifier', config.ios?.bundleIdentifier],
    ['android.package', config.android?.package],
  ]) {
    const key = `${field}:${value}`;
    if (seen.has(key)) {
      failures.push(
        `${appEnv}: ${field} "${value}" collides with ${seen.get(key)} — environments must install side by side`
      );
    } else {
      seen.set(key, appEnv);
    }
  }

  if (isPrivilegedKey(amp.supabaseAnonKey)) {
    failures.push(
      `${appEnv}: a privileged Supabase key is embedded in the client bundle. Rotate it immediately.`
    );
  }

  for (const field of ['supabaseUrl', 'supabaseAnonKey']) {
    if (!amp[field]) {
      warnings.push(
        `${appEnv}: ${field} is empty (expected on a fresh checkout without .env.${appEnv})`
      );
    }
  }

  const forbidden = Object.keys(config.extra ?? {}).filter((key) =>
    /service_role|serviceRole|SERVICE_ROLE|secret/i.test(key)
  );
  if (forbidden.length > 0) {
    failures.push(`${appEnv}: forbidden keys present in extra: ${forbidden.join(', ')}`);
  }
}

for (const warning of warnings) {
  console.warn(`warning  ${warning}`);
}

if (failures.length > 0) {
  console.error('\nConfiguration validation failed:');
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log(`✓ Expo configuration valid for: ${ENVIRONMENTS.join(', ')}`);
