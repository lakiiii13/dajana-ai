/**
 * Skenira assets/images/outfits/ foldere i generiše manifest sa stvarnim imenima slika.
 * Ne moraš ručno menjati imena – stavi slike u odgovarajući folder i pokreni:
 *   node scripts/seed-outfits-discover.js
 * Zatim: npm run seed:outfits
 */

const fs = require('fs');
const path = require('path');

const OUTFITS_DIR = path.join(__dirname, '..', 'assets', 'images', 'outfits');
const MANIFEST_PATH = path.join(__dirname, 'seed-outfits-manifest.json');

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

// 12 foldera: ime foldera → body_types, seasons, title (za manifest)
const FOLDER_CONFIG = {
  hourglass_warm_autumn:    { body_types: ['hourglass'], seasons: ['warm_autumn'], title: 'Peščani sat + prava jesen' },
  hourglass_cool_winter:    { body_types: ['hourglass'], seasons: ['cool_winter'], title: 'Peščani sat + prava zima' },
  hourglass_cool_summer:    { body_types: ['hourglass'], seasons: ['cool_summer'], title: 'Peščani sat + pravo ljeto' },
  hourglass_clear_winter:   { body_types: ['hourglass'], seasons: ['clear_winter'], title: 'Peščani sat + sjajna zima' },
  pear_soft_autumn:         { body_types: ['pear'], seasons: ['soft_autumn'], title: 'Kašika + meka jesen' },
  pear_warm_autumn_kasika:  { body_types: ['pear'], seasons: ['warm_autumn'], title: 'Kašika + prava jesen' },
  pear_warm_autumn:         { body_types: ['pear'], seasons: ['warm_autumn'], title: 'Kruška + prava jesen' },
  pear_warm_spring:         { body_types: ['pear'], seasons: ['warm_spring'], title: 'Kruška + pravo proljeće' },
  rectangle_cool_summer:    { body_types: ['rectangle'], seasons: ['cool_summer'], title: 'Pravougaoni + pravo ljeto' },
  rectangle_warm_autumn:    { body_types: ['rectangle'], seasons: ['warm_autumn'], title: 'Pravougaoni + prava jesen' },
  rectangle_cool_winter:    { body_types: ['rectangle'], seasons: ['cool_winter'], title: 'Pravougaoni + prava zima' },
  rectangle_deep_autumn:    { body_types: ['rectangle'], seasons: ['deep_autumn'], title: 'Pravougaoni + tamna jesen' },
};

function discover() {
  const manifest = [];
  let totalImages = 0;

  for (const [folderName, config] of Object.entries(FOLDER_CONFIG)) {
    const dirPath = path.join(OUTFITS_DIR, folderName);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      console.log('Preskačem (nema foldera):', folderName);
      continue;
    }

    const files = fs.readdirSync(dirPath);
    const images = files.filter((f) => IMAGE_EXT.includes(path.extname(f).toLowerCase()));

    if (images.length === 0) {
      console.log('Nema slika:', folderName);
      continue;
    }

    for (const filename of images) {
      const relPath = folderName + '/' + filename;
      manifest.push({
        path: relPath,
        title: config.title + (images.length > 1 ? ' – ' + filename : ''),
        seasons: [...config.seasons],
        body_types: [...config.body_types],
        description: 'Test outfit',
      });
      totalImages += 1;
      console.log('  ✓', relPath);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('\nUpisano', manifest.length, 'unosa u', MANIFEST_PATH);
  console.log('Pokreni: npm run seed:outfits');
  return { manifest, totalImages };
}

discover();
