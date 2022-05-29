const webpack = require('webpack');
const { removeModuleScopePlugin, override, babelInclude } = require("customize-cra");
const path = require('path');

module.exports = function override(config) {
  // config.module.rules.push({
  //   test: /\.tsx?$/,
  //   use: ['ts-loader'],
  //   exclude: /node_modules/,
  //   // options: {
  //   //   transpileOnly: true,
  //   //   configFile: 'tsconfig.json',
  //   // },
  // });

  console.log(config.module.rules[1].oneOf[3])

  config.module.rules[1].oneOf[3].include = [config.module.rules[1].oneOf[3].include, path.resolve('../lib')]

  // throw new Error("yo")

  const fallback = config.resolve.fallback || {};

  Object.assign(fallback, {
    'buffer': require.resolve('buffer'),
  });

  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
  ]);

  return config;
}