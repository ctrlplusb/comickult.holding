import merge from 'ramda/src/merge';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const cssModulesLoader = (development = true) => {
  /**
   * CSS
   * We are using the fairly bleeding edge CSS Modules approach.
   * As we are also using react-toolbox, which has opted for SASS as it's
   * preprocessor we need to first parse through the sass-loader.
   * @see: https://github.com/css-modules/css-modules
   */
  const baseCssLoader = {
    test: /(\.scss|\.css)$/,
  };

  if (development) {
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
