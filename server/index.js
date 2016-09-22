const path = require('path');
const express = require('express');
const compression = require('compression');
const hpp = require('hpp');
const helmet = require('helmet');

// Create our express based server.
const app = express();

// Don't expose any software information to hackers.
app.disable('x-powered-by');

// Prevent HTTP Parameter pollution.
app.use(hpp());

// Content Security Policy
app.use(helmet.contentSecurityPolicy({
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"],
  imgSrc: ["'self'"],
  connectSrc: ["'self'", 'ws:'],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'none'"],
  frameSrc: ["'none'"],
}));
app.use(helmet.xssFilter());
app.use(helmet.frameguard('deny'));
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());

// Response compression.
app.use(compression());

// Configure static serving of our webpack bundled client files.
app.use(express.static(path.resolve(__dirname, '../dist')));

// Create an http listener for our express app.
app.listen(3005);

console.log(`==> 💚  HTTP Listener is running on port ${3005}`);
