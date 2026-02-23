/**
 * Workaround for Expo CLI bug: getFile(easProjectId) passes null/object to path.join().
 * Patches: node_modules/expo/node_modules/@expo/cli/build/src/utils/codesigning.js
 * Run after npm install. See: ERR_INVALID_ARG_TYPE path must be string, Received Object
 */
const fs = require('fs');
const path = require('path');

const exactPath = path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'build', 'src', 'utils', 'codesigning.js');

if (!fs.existsSync(exactPath)) {
  console.log('patch-expo-codesigning: File not found at', exactPath, '- run npm install first.');
  process.exit(0);
}

let content = fs.readFileSync(exactPath, 'utf8');

if (!content.includes('getFile(easProjectId)')) {
  console.log('patch-expo-codesigning: codesigning.js format changed, manual fix may be needed.');
  process.exit(0);
}

// Patch 1: Ensure home dir passed to path.join is always a string.
const hadHomePatch = !content.includes("return _path().default.join((0, _UserSettings.getExpoHomeDirectory)(), 'codesigning');");
content = content.replace(
  "return _path().default.join((0, _UserSettings.getExpoHomeDirectory)(), 'codesigning');",
  "const home = (0, _UserSettings.getExpoHomeDirectory)();\n    const homePath = typeof home === 'string' ? home : home && typeof home === 'object' && (home.path || home.homeDir || home.dir || home.directory) ? (home.path || home.homeDir || home.dir || home.directory) : typeof process !== 'undefined' && process.cwd && process.cwd ? process.cwd() : '.';\n    return _path().default.join(homePath, 'codesigning');"
);

// Patch 2: Ensure easProjectId passed to path.join is always a string.
const hadIdPatch = content.includes("const safeId = typeof easProjectId === 'string'");
content = content.replace(
  'const filePath = _path().default.join(getDevelopmentCodeSigningDirectory(), easProjectId, DEVELOPMENT_CODE_SIGNING_SETTINGS_FILE_NAME);',
  'const safeId = typeof easProjectId === \'string\' ? easProjectId : (easProjectId && typeof easProjectId === \'object\' && easProjectId.extra && easProjectId.extra.eas && typeof easProjectId.extra.eas.projectId === \'string\') ? easProjectId.extra.eas.projectId : (easProjectId && typeof easProjectId === \'object\' && typeof easProjectId.projectId === \'string\') ? easProjectId.projectId : (easProjectId == null || typeof easProjectId !== \'string\') ? \'default\' : String(easProjectId);\n        const filePath = _path().default.join(getDevelopmentCodeSigningDirectory(), safeId, DEVELOPMENT_CODE_SIGNING_SETTINGS_FILE_NAME);'
);

fs.writeFileSync(exactPath, content);
if (hadHomePatch && hadIdPatch) {
  console.log('patch-expo-codesigning: Already patched.');
} else {
  console.log('patch-expo-codesigning: Patched codesigning.js (codesigning path.join fixes).');
}
