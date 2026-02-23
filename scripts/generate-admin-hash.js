/**
 * DAJANA AI - Generate Admin Password Hash
 * 
 * Ovaj script generiše bcrypt hash za admin lozinku.
 * 
 * Korišćenje:
 *   node scripts/generate-admin-hash.js <lozinka>
 * 
 * Primer:
 *   node scripts/generate-admin-hash.js MojaSigurnaLozinka123
 * 
 * Zatim kopiraj dobijeni hash u SQL:
 *   INSERT INTO admin_users (email, password_hash, name, role)
 *   VALUES ('admin@dajanaai.com', '<hash>', 'Admin', 'superadmin');
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Korišćenje: node generate-admin-hash.js <lozinka>');
  console.log('Primer: node generate-admin-hash.js MojaSigurnaLozinka123');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n========================================');
console.log('DAJANA AI - Admin Password Generator');
console.log('========================================\n');
console.log('Lozinka:', password);
console.log('Hash:', hash);
console.log('\nSQL za insert:\n');
console.log(`INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES (
  'admin@dajanaai.com',
  '${hash}',
  'Admin',
  'superadmin',
  true
);`);
console.log('\n========================================\n');
