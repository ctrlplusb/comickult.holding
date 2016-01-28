import { deepMerge } from './utils/objects';
import baseConfig from './tools/webpack/__base.config.js';

const env = process.env.NODE_ENV || 'development';

let envConfig;

switch (env) {
  case 'production':
    envConfig = require('./tools/webpack/prod.config.js').default;
    break;
  case 'development':
    // Flow into default...
  default:
    envConfig = require('./tools/webpack/dev.config.js').default;
    break;
}

const webpackConfig = deepMerge(baseConfig, envConfig);
console.dir(webpackConfig);

export default webpackConfig;
