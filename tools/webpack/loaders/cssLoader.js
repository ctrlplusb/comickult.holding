import merge from 'ramda/src/merge';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const cssModulesLoader = (sourcemaps = true) => {
  /**
   * CSS
   */
  const baseCssLoader = {
    test: /\.css$/,
  };

  if (sourcemaps) {
    return merge(baseCssLoader, {
      loader: ExtractTextPlugin.extract(
        'style',
        'css?sourceMap!postcss?sourceMap'
      )
    });
  }

  return merge(baseCssLoader, {
    loader: ExtractTextPlugin.extract(
      'style',
      'css!postcss'
    )
  });
};

export default cssModulesLoader;
