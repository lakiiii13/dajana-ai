/**
 * Popuni dajana-ai-app/.env (Supabase URL + sync iz admin .env.local).
 *
 *   node scripts/merge-env.js
 *   node scripts/merge-env.js --anon eyJ... --ios appl_...
 */
const fs = require('fs');
const path = require('path');

const APP_ENV = path.join(__dirname, '..', '.env');
const ADMIN_ENV = path.join(__dirname, '..', '..', 'dajana-ai-admin', '.env.local');
const PROJECT_REF = 'nepzlplasrbnpfgkemwr';
const DEFAULT_URL = `https://${PROJECT_REF}.supabase.co`;

function parseEnv(content) {
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) vars[m[1]] = (m[2] || '').trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return parseEnv(fs.readFileSync(filePath, 'utf8'));
}

function writeEnv(vars) {
  const lines = [
    '# DAJANA AI – auto-generated / merged (ne commituj)',
    '',
    '# Supabase',
    `EXPO_PUBLIC_SUPABASE_URL=${vars.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_URL}`,
    `EXPO_PUBLIC_SUPABASE_ANON_KEY=${vars.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}`,
    '',
    '# RevenueCat (Play / App Store)',
    `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=${vars.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || ''}`,
    `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=${vars.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || ''}`,
    '',
    '# Opciono',
    vars.EXPO_PUBLIC_R2_PUBLIC_URL ? `EXPO_PUBLIC_R2_PUBLIC_URL=${vars.EXPO_PUBLIC_R2_PUBLIC_URL}` : '# EXPO_PUBLIC_R2_PUBLIC_URL=',
    '',
  ];
  fs.writeFileSync(APP_ENV, lines.join('\n'), 'utf8');
}

const existing = readEnvFile(APP_ENV);
const admin = readEnvFile(ADMIN_ENV);
const args = process.argv.slice(2);
const cli = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--anon' && args[i + 1]) cli.EXPO_PUBLIC_SUPABASE_ANON_KEY = args[++i];
  if (args[i] === '--ios' && args[i + 1]) cli.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS = args[++i];
  if (args[i] === '--android' && args[i + 1]) cli.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID = args[++i];
}

const merged = {
  EXPO_PUBLIC_SUPABASE_URL:
    cli.EXPO_PUBLIC_SUPABASE_URL ||
    existing.EXPO_PUBLIC_SUPABASE_URL ||
    admin.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    cli.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    existing.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    admin.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '',
  EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID:
    cli.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ||
    existing.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ||
    'goog_HhgEUSgAFLTNdkryreUudfRSaje',
  EXPO_PUBLIC_REVENUECAT_API_KEY_IOS:
    cli.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || existing.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '',
  EXPO_PUBLIC_R2_PUBLIC_URL:
    existing.EXPO_PUBLIC_R2_PUBLIC_URL || admin.EXPO_PUBLIC_R2_PUBLIC_URL || admin.R2_PUBLIC_URL || '',
};

writeEnv(merged);

const missing = [];
if (!merged.EXPO_PUBLIC_SUPABASE_ANON_KEY || merged.EXPO_PUBLIC_SUPABASE_ANON_KEY.length < 20) {
  missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
}
if (!merged.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || !merged.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS.startsWith('appl_')) {
  missing.push('EXPO_PUBLIC_REVENUECAT_API_KEY_IOS');
}

console.log('Upisano:', APP_ENV);
console.log('Supabase URL:', merged.EXPO_PUBLIC_SUPABASE_URL);
console.log('RC Android:', merged.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ? 'SET' : 'MISSING');

if (admin.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('Anon key: uzet iz dajana-ai-admin/.env.local');
} else if (merged.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('Anon key: SET');
} else {
  console.log('Anon key: MISSING – Supabase Dashboard → API → anon public');
}

if (missing.length) {
  console.log('Još treba:', missing.join(', '));
  console.log('Dopuni:');
  console.log('  node scripts/merge-env.js --anon "eyJ..." --ios "appl_..."');
  console.log('Ili kopiraj iz https://supabase.com/dashboard/project/nepzlplasrbnpfgkemwr/settings/api');
  process.exit(1);
}

console.log('Sve obavezno je SET.');
process.exit(0);
