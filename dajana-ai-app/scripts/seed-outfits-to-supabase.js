/**
 * Seed outfit slike u Supabase: učitava manifest, uploaduje slike u Storage,
 * unosi redove u tabelu outfits. Pokretanje: node scripts/seed-outfits-to-supabase.js
 *
 * Zahtevi u .env:
 *   EXPO_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (iz Supabase Dashboard → Settings → API)
 */

const fs = require('fs');
const path = require('path');

// Učitaj .env iz korena projekta
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

const BUCKET = 'outfits';
const OUTFITS_DIR = path.join(__dirname, '..', 'assets', 'images', 'outfits');
const MANIFEST_PATH = path.join(__dirname, 'seed-outfits-manifest.json');

const VALID_SEASONS = [
  'light_spring', 'warm_spring', 'clear_spring',
  'light_summer', 'cool_summer', 'soft_summer',
  'soft_autumn', 'warm_autumn', 'deep_autumn',
  'deep_winter', 'cool_winter', 'clear_winter',
];
const VALID_BODY_TYPES = ['hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle'];

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets && buckets.some((b) => b.name === BUCKET)) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error) {
    console.error('Greška pri kreiranju bucketa:', error.message);
    throw error;
  }
  console.log('Bucket "' + BUCKET + '" kreiran.');
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error('Manifest nije pronađen: ' + MANIFEST_PATH);
  }
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error('Manifest mora biti niz objekata.');
  list.forEach((entry, i) => {
    if (!entry.path || !entry.title || !Array.isArray(entry.seasons) || !Array.isArray(entry.body_types)) {
      throw new Error('Manifest[' + i + ']: potrebni path, title, seasons[], body_types[]');
    }
    entry.seasons.forEach((s) => {
      if (!VALID_SEASONS.includes(s)) throw new Error('Manifest[' + i + ']: nepoznata sezona: ' + s);
    });
    entry.body_types.forEach((b) => {
      if (!VALID_BODY_TYPES.includes(b)) throw new Error('Manifest[' + i + ']: nepoznat body_type: ' + b);
    });
  });
  return list;
}

async function run() {
  const manifest = loadManifest();
  console.log('Učitano', manifest.length, 'outfita iz manifesta.');

  await ensureBucket();

  let displayOrder = 0;
  for (const entry of manifest) {
    const fullPath = path.join(OUTFITS_DIR, entry.path.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) {
      console.warn('Preskačem (fajl ne postoji):', entry.path);
      continue;
    }

    const ext = path.extname(entry.path).toLowerCase();
    const safeName = entry.path.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = 'seed/' + Date.now() + '-' + displayOrder + '-' + safeName;

    const buffer = fs.readFileSync(fullPath);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload failed za', entry.path, uploadError.message);
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const imageUrl = urlData?.publicUrl || '';

    const row = {
      image_url: imageUrl,
      title: entry.title,
      description: entry.description || null,
      body_types: entry.body_types,
      seasons: entry.seasons,
      tags: entry.tags && entry.tags.length ? entry.tags : ['complete_look'],
      is_active: true,
      display_order: displayOrder,
    };

    const { error: insertError } = await supabase.from('outfits').insert(row);
    if (insertError) {
      console.error('Insert failed za', entry.title, insertError.message);
      continue;
    }

    console.log('OK:', entry.title, '→', imageUrl.substring(0, 60) + '...');
    displayOrder += 1;
  }

  console.log('Završeno.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
