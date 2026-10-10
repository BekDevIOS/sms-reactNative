module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        // CI/dev-release can select a separate endpoint without modifying the
        // normal local .env file: ENVFILE=.env.dev ./gradlew assembleDevRelease
        path: process.env.ENVFILE || '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
    // react-native-reanimated/plugin MUST be listed last.
    'react-native-reanimated/plugin',
  ],
};
