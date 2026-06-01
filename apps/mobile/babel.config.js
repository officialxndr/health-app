module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
    overrides: [
      {
        // Strip TypeScript types before the class-properties plugin runs for
        // packages that ship typed private fields (#field: Type).
        include: /node_modules\/(react-native-reanimated|react-native-worklets)/,
        plugins: [
          ['@babel/plugin-transform-typescript', { allowDeclareFields: true, isTSX: false }],
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-private-methods', { loose: true }],
        ],
      },
    ],
  };
};
