const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Flipper'ı devre dışı bırak.
 * EAS Build sunucularıyla uyumsuzluk sorunlarını önler.
 */
const withDisableFlipper = (config) => {
  return withGradleProperties(config, (mod) => {
    mod.modResults = mod.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'FLIPPER_VERSION')
    );
    mod.modResults.push({
      type: 'property',
      key: 'FLIPPER_VERSION',
      value: 'false',
    });
    return mod;
  });
};

module.exports = withDisableFlipper;
