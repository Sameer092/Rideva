module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['./src'],
          alias: {
            '@src': './src',
            '@store': './src/store',
            '@library': './src/library',
            '@config': './src/config',
            '@utils': './src/utils',
            '@components': './src/components',
            '@routes': './src/routes',
            '@stacks': './src/stacks',
            '@assets': './assets',
            '@colors': './src/colors',
            '@fonts': './src/fonts',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
