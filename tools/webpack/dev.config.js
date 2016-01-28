import webpack from 'webpack';
import { cssLoader } from './loaders';

export default {
  // @see https://webpack.github.io/docs/configuration.html#devtool
  devtool: 'inline-source-map',
  entry: [
    'webpack-hot-middleware/client'
  ],
  output: {
    // This is the web path for static assets generated by webpack especially
    // required when doing hot loaded webpack based development.
    publicPath: '/assets/js/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      cssLoader()
    ]
  }
};
