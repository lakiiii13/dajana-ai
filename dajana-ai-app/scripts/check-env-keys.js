/**
 * Status env ključeva (bez ispisa vrednosti).
 * node scripts/check-env-keys.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const keys = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID',
  'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS',
];

function isPlaceholder(v) {
  if (!v || v.length < 8) return true;
  const bad = ['XXXXX', 'YOUR_', 'your_', 'goog_XXXXX', 'appl_XXXXX'];
  return bad.some((b) => v.includes(b));
}

if (!fs.existsSync(envPath)) {
  console.log('MISSING:.env');
  process.exit(1);
}

const vars = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) vars[m[1]] = (m[2] || '').trim().replace(/^["']|["']$/g, '');
}

let ok = true;
for (const k of keys) {
  const set = !isPlaceholder(vars[k]);
  console.log(`${k}: ${set ? 'SET' : 'MISSING_OR_PLACEHOLDER'}`);
  if (!set) ok = false;
}
process.exit(ok ? 0 : 1);
