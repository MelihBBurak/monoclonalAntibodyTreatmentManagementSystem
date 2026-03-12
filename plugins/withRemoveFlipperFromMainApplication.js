const { withMainApplication } = require('@expo/config-plugins');

/**
 * MainApplication.java'dan Flipper başlatma kodunu kaldır.
 */
const withRemoveFlipperFromMainApplication = (config) => {
  return withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;

    // Flipper import satırlarını kaldır
    contents = contents.replace(
      /\n.*ReactNativeFlipper\.initializeFlipper.*\n/g,
      '\n'
    );

    // if (BuildConfig.DEBUG) { ReactNativeFlipper... } bloğunu kaldır
    contents = contents.replace(
      /\s*if \(BuildConfig\.DEBUG\) \{\s*\n\s*ReactNativeFlipper\.initializeFlipper\(this, getReactNativeHost\(\)\.getReactInstanceManager\(\)\);\s*\n\s*\}/g,
      ''
    );

    mod.modResults.contents = contents;
    return mod;
  });
};

module.exports = withRemoveFlipperFromMainApplication;
