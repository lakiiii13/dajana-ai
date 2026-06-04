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

const checkIap = process.argv.includes('--iap');

const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((k) => !vars[k] || vars[k].length === 0 || vars[k].includes('YOUR_') || vars[k].includes('your_'));

if (missing.length > 0) {
  console.log('ENV: Nedostaje ili nije popunjeno:', missing.join(', '));
  console.log('U .env postavi prave vrednosti iz Supabase Dashboard (Project Settings → API).');
  process.exit(1);
}

console.log('ENV OK – EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY su postavljeni.');

const iapKeys = ['EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID', 'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS'];
const iapMissing = iapKeys.filter(
  (k) => !vars[k] || vars[k].length === 0 || vars[k].includes('XXXXX') || vars[k].includes('goog_XXXXX')
);

if (checkIap) {
  if (iapMissing.length > 0) {
    console.log('IAP: Nedostaju RevenueCat ključevi:', iapMissing.join(', '));
    console.log('RevenueCat → Project → API keys. Vodič: IAP-NAMESTANJE.md');
    process.exit(1);
  }
  console.log('IAP OK – RevenueCat API ključevi su u .env.');
  console.log('Sledeće: Play + Apple proizvodi + RevenueCat Offering (vidi IAP-NAMESTANJE.md).');
} else if (iapMissing.length > 0) {
  console.log('Napomena: za Shop/IAP dodaj RevenueCat ključeve u .env (ili pokreni: node scripts/check-env.js --iap)');
}

process.exit(0);
