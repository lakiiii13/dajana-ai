// Expo config – extra.eas.projectId za push notifikacije, ikona notifikacija = tvoj logo.
const appJson = require('./app.json');

const EAS_PROJECT_ID = '3632c1d7-3fab-4aa9-85a4-f776e77b6fb4';

// Plugin expo-notifications sa tvojim logom (assets) i zlatnom bojom
const plugins = (appJson.expo?.plugins || []).map((p) => {
  if (Array.isArray(p) && p[0] === 'expo-notifications') {
    return ['expo-notifications', { icon: './assets/images/icon.png', color: '#CF8F5A', ...p[1] }];
  }
  return p;
});

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
