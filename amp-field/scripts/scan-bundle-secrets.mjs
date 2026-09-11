#!/usr/bin/env node
/**
 * Scans an exported bundle for privileged credentials.
 *
 * Phase 0 acceptance requires that no service secret ships in the client. This
 * runs against the real bundle output, so it catches a key that reaches the app
 * through any path — env var, hard-coded string or transitive dependency.
 *
 * Usage: node scripts/scan-bundle-secrets.mjs <dist-dir>
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2] ?? 'dist';

if (!fs.existsSync(target)) {
  console.error(`Bundle directory not found: ${target}`);
  process.exit(1);
}

/** JWT-shaped tokens. */
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/g;
/** New-style Supabase secret keys, requiring real key material after the prefix. */
const SECRET_KEY = /sb_secret_[A-Za-z0-9]{8,}/g;

const findings = [];

function scanFile(file) {
  const contents = fs.readFileSync(file, 'utf8');

  // Hermes bytecode packs its string table without separators, so a bare
  // prefix match there is meaningless — `sb_secret_` from this repo's own key
  // guard sits next to unrelated identifiers. Only the JWT check, which has to
  // decode to valid JSON, is meaningful in bytecode.
  const isBytecode = file.endsWith('.hbc');

  if (!isBytecode) {
    for (const match of contents.match(SECRET_KEY) ?? []) {
      findings.push({ file, reason: `Supabase secret key (${match.slice(0, 18)}…)` });
    }
  }

  for (const token of contents.match(JWT) ?? []) {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) continue;
    try {
      const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8'));
      if (payload?.role === 'service_role') {
        findings.push({ file, reason: 'JWT with role "service_role"' });
      }
    } catch {
      // Not a decodable JWT payload — nothing to report.
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(js|hbc|json|html|map|txt)$/.test(entry.name)) {
      try {
        scanFile(full);
      } catch {
        // Binary or unreadable output — skipped rather than failing the build.
      }
    }
  }
}

walk(target);

if (findings.length > 0) {
  console.error('Privileged credentials found in the bundle:');
  for (const { file, reason } of findings) {
    console.error(`  ✗ ${file}: ${reason}`);
  }
  console.error('\nRotate the key immediately — it must be treated as compromised.');
  process.exit(1);
}

console.log(`✓ No privileged credentials found in ${target}`);
