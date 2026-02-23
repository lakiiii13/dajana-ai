/**
 * Generiše bcrypt hash za admin lozinku.
 * Pokretanje: node scripts/generate-admin-hash.js admin123
 */
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.log('Korišćenje: node scripts/generate-admin-hash.js <lozinka>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nHash za', password, ':\n', hash);
console.log('\nSQL (Supabase → SQL Editor):\n');
console.log(`INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES (
  'admin@dajanaai.com',
  '${hash}',
  'Admin',
  'superadmin',
  true
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;\n`);
