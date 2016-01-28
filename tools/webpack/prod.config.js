import webpack from 'webpack';
import { cssLoader } from './loaders';

export default {
  plugins: [
    // Javascript Minification
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        /**
         * Tons of warning messages seem to appear from this plugin within a
         * React environment so we disable the warnings output.
         */
        warnings: false
      },
      exclude: /\.css/i
    }),

    // Adds the following text to the top of all of our output files.
    new webpack.BannerPlugin([
      '/**',
      ' * comickult Holding Page.',
      ' *',
      ' * Copyright 2016, Sean Matheson.',
      ' * All rights reserved.',
      ' *',
      ' */'
    ].join('\n'), { raw: true }),

    /**
     * We can use these as "precompiler flags" to ignore/compile blocks of code
     * surrounded by these flags.  Useful for debugging/logging etc based on our
     * target mode/environment.
     *
     * @example
     *   if (__DEVELOPMENT__) import perfMonitor from './utils/perfMonitor.js'
     */
    new webpack.DefinePlugin({
      __PRODUCTION__: true,

      /**
       * This is a production build so we want to add this additional parameter
       * to the DefinePlugin which will allow for further output optimisation.
       */
      'process.env': {
        // This has effect on the react lib size
        NODE_ENV: JSON.stringify('production'),
      }
    })
  ],
  module: {
    loaders: [
      cssLoader(false)
    ]
  }
};
