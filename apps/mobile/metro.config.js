const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Inject DOMException polyfill before any module runs — Hermes doesn't define
// it globally but react-native's New Arch setUpPerformance requires it.
const _originalGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (options) => {
  const defaults = _originalGetPolyfills ? _originalGetPolyfills(options) : [];
  return [
    path.resolve(projectRoot, 'hermes-polyfills.js'),
    ...(Array.isArray(defaults) ? defaults : []),
  ];
};

// Include root node_modules so Metro can resolve hoisted workspace packages
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Use react-native/main package.json fields instead of ESM exports,
// ensuring reanimated resolves to its transformable source
config.resolver.unstable_enablePackageExports = false;

// Intercept react-native's setUpPerformance to avoid the Hermes bytecode TDZ
// bug (RN 0.81) where export class declarations in module factories don't
// initialize their environment slots, causing 'Property X doesn't exist' crashes.
// The require is a relative path from within react-native, so we match on the
// tail of the module name AND verify the origin is inside react-native.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.endsWith('/setUpPerformance') &&
    (context.originModulePath || '').includes('/node_modules/react-native/')
  ) {
    return {
      filePath: path.resolve(projectRoot, 'patches/setUpPerformance.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Force Babel to transform packages that ship private class fields (#field),
// which Hermes cannot parse natively.
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg)/)',
];

module.exports = config;
