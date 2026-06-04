// Expo config – extra.eas.projectId za push notifikacije, ikona notifikacija = tvoj logo.
const appJson = require('./app.json');

const isEasBuild = process.env.EAS_BUILD === 'true' || process.env.EAS_BUILD === '1';
function warnIfMissing(name) {
  const v = (process.env[name] ?? '').trim();
  if (!v || v.includes('XXXXX') || v.includes('YOUR_')) {
    console.warn(`[app.config] ${name} nije podešen – IAP/Supabase neće raditi u buildu.`);
  }
}
if (isEasBuild) {
  warnIfMissing('EXPO_PUBLIC_SUPABASE_URL');
  warnIfMissing('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  warnIfMissing('EXPO_PUBLIC_REVENUECAT_API_KEY_IOS');
  warnIfMissing('EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID');
}

const EAS_PROJECT_ID = '3632c1d7-3fab-4aa9-85a4-f776e77b6fb4';

// Plugin expo-notifications sa tvojim logom (assets) i zlatnom bojom
let plugins = (appJson.expo?.plugins || []).map((p) => {
  if (Array.isArray(p) && p[0] === 'expo-notifications') {
    return ['expo-notifications', { icon: './assets/images/icon.png', color: '#CF8F5A', ...p[1] }];
  }
  return p;
});
// Dozvole za kameru i galeriju (Try-On, izbor slika)
if (!plugins.some((p) => Array.isArray(p) && p[0] === 'expo-image-picker')) {
  plugins = [
    ...plugins,
    [
      'expo-image-picker',
      {
        photosPermission: 'Dajana koristi galeriju za izbor slika i Try-On.',
        cameraPermission: 'Dajana koristi kameru za fotografisanje u Try-On.',
      },
    ],
  ];
}

module.exports = {
  ...appJson.expo,
  plugins,
  extra: {
    ...(appJson.expo?.extra || {}),
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || appJson.expo?.extra?.eas?.projectId || EAS_PROJECT_ID,
    },
  },
};
