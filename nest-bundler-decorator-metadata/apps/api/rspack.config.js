const { composePlugins, withNx } = require('@nx/rspack');
const rspack = require('@rspack/core');

module.exports = composePlugins(withNx({ target: 'node' }), (config) => {
  // Nest resolves providers by class name, so minification must not rename
  // classes or functions.
  config.optimization = {
    ...config.optimization,
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin({
        minimizerOptions: {
          compress: { keep_classnames: true, keep_fnames: true },
          mangle: { keep_classnames: true, keep_fnames: true },
        },
      }),
    ],
  };
  return config;
});
