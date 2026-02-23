/**
 * Postavlja tag 'complete_look' na outfite iz manifesta (one sa Screenshot slikama).
 * Pokreni jednom ako si već ranije seedovao: node scripts/update-outfits-complete-look-tag.js
 *
 * Zahtevi u .env: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Potrebni EXPO_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY u .env');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, serviceRoleKey);

const MANIFEST_PATH = path.join(__dirname, 'seed-outfits-manifest.json');

const TITLES = [
  'Peščani sat + prava jesen',
  'Peščani sat + prava zima',
  'Peščani sat + pravo ljeto',
  'Peščani sat + sjajna zima',
  'Kašika + meka jesen',
  'Kašika + prava jesen',
  'Kruška + prava jesen',
  'Kruška + pravo proljeće',
  'Pravougaoni + pravo ljeto',
  'Pravougaoni + prava jesen',
  'Pravougaoni + prava zima',
  'Pravougaoni + tamna jesen',
];

async function run() {
  const { data: rows, error } = await supabase
    .from('outfits')
    .select('id, title, tags')
    .in('title', TITLES);

  if (error) {
    console.error('Greška pri čitanju:', error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('Nema outfit redova sa tim naslovima. Prvo pokreni: npm run seed:outfits');
    return;
  }

  for (const row of rows) {
    const newTags = Array.isArray(row.tags) && row.tags.includes('complete_look')
      ? row.tags
      : [...(Array.isArray(row.tags) ? row.tags : []), 'complete_look'];
    const { error: updateError } = await supabase
      .from('outfits')
      .update({ tags: newTags })
      .eq('id', row.id);
    if (updateError) {
      console.error('Update failed za', row.title, updateError.message);
    } else {
      console.log('OK:', row.title);
    }
  }

  console.log('Završeno. Sada pri izboru "Kompletni outfiti" treba da vidiš sve te slike.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
