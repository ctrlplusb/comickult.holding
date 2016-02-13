import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
  entry: [
    path.resolve(__dirname, '../../src/index.js')
  ],
  output: {
    path: path.resolve(__dirname, '../../dist/assets/js'),
    filename: 'holding.js'
  },
  resolve: {
    extensions: ['', '.css', '.js', '.json']
  },
  plugins: [
    /**
     * We use the ExtractTextPlugin so that we can extract all of our css
     * into a single file for usage in the browser.  This is much more
     * optimal for our users.
     */
    new ExtractTextPlugin('holding.css', { allChunks: true }),
    new webpack.optimize.OccurenceOrderPlugin()
  ],
  postcss: () => [
    require('autoprefixer')({ browsers: ['last 3 versions'] })
  ],
  module: {
    loaders: [
      /**
       * JS
       * We rely on babel for the transpiling of our javascript code.  This
       * allows us to convert our ES6 and JSX syntax into a format supported
       * by all major browsers.
       */
      {
        test: /\.js$/,

        // Please refer to the .babelrc for configuration of babel.
        loaders: ['babel-loader'],

        // Only parse the src folder.
        include: path.resolve(__dirname, '../../src')
      },
      /**
       * IMAGES and VIDEOS
       * We use a standard file loader to include image references in our
       * bundle.
       */
      {
        test: /\.(png|jpg|jpeg|gif|ico|svg|mp4|webm)$/,
        // Any file below or equal to 10K will be converted to inline base64.
        loader: 'url-loader?limit=10240'
      }
    ]
  }
};
