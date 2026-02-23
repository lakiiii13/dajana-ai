/**
 * Provera .env za dajana-ai-app – da li su obavezne varijable postavljene.
 * Ne ispisuje vrednosti. Pokretanje: node scripts/check-env.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('ENV: Fajl .env ne postoji. Kopiraj .env.example u .env i popuni vrednosti.');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split(/\r?\n/);
const vars = {};
for (const line of lines) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) {
    const key = m[1];
    const value = (m[2] || '').trim().replace(/^["']|["']$/g, '');
    vars[key] = value;
  }
}

const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((k) => !vars[k] || vars[k].length === 0 || vars[k].includes('YOUR_') || vars[k].includes('your_'));

if (missing.length > 0) {
  console.log('ENV: Nedostaje ili nije popunjeno:', missing.join(', '));
  console.log('U .env postavi prave vrednosti iz Supabase Dashboard (Project Settings → API).');
  process.exit(1);
}

console.log('ENV OK – EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY su postavljeni.');
process.exit(0);
