import path from 'path';
import express from 'express';
import webpack from 'webpack';
import config from '../../webpack.config.babel';
import serveStatic from 'serve-static';

const root = path.join(__dirname, '../../dist');
const app = express();
const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));

app.use(serveStatic(`${root}`));

/*
app.use(serveStatic(`${root}/assets/img`));
app.use(serveStatic(`${root}/assets/sprites`));
app.use(serveStatic(`${root}/assets/fonts`));

app.get('*', (req, res) => {
  res.sendFile(root + '/index.html');
});
*/

app.listen(3000, 'localhost', (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Listening at http://localhost:3000');
});
