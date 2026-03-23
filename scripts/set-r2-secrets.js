#!/usr/bin/env node
/**
 * Postavi Supabase Edge Function secrets za R2 iz dajana-ai-admin/.env.local
 * Pokreni iz dajana-ai-main: node scripts/set-r2-secrets.js
 */
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '..', 'dajana-ai-admin', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Nema dajana-ai-admin/.env.local');
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');
const env = {};
raw.split('\n').forEach((line) => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const i = line.indexOf('=');
  if (i < 0) return;
  const key = line.slice(0, i).trim();
  let val = line.slice(i + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (key.startsWith('R2_')) env[key] = val;
});

const required = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_S3_ENDPOINT', 'R2_PUBLIC_URL'];
for (const k of required) {
  if (!env[k] || env[k].includes('REPLACE')) {
    console.error('U dajana-ai-admin/.env.local postavi sve R2_* vrednosti, uklj. R2_PUBLIC_URL (nakon Public access na bucketu).');
    process.exit(1);
  }
}

const args = ['supabase', 'secrets', 'set', ...required.map((k) => `${k}=${env[k]}`)];
console.log('Postavljam Supabase secrets za R2...');
const r = spawnSync('npx', args, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  shell: true,
});
process.exit(r.status || 0);
