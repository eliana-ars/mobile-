const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  defaultConfig.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif');
  return defaultConfig;
})();
