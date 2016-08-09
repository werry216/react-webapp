// This grants us source map support, which is handy as our webpack bundling
// for the server will include source maps.  Therefore we will have nice stack
// traces again for our server.
import 'source-map-support/register';

import express from 'express';
import compression from 'compression';
import hpp from 'hpp';
import helmet from 'helmet';
import path from 'path';
import appRoot from 'app-root-path';
import universalReactAppMiddleware from './middleware/universalReactApp';
import SERVER_CONFIG from './config';

const appRootPath = appRoot.toString();

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
app.use(
  SERVER_CONFIG.CLIENT_BUNDLE_HTTP_PATH,
  express.static(
    path.resolve(appRootPath, SERVER_CONFIG.CLIENT_BUNDLE_OUTPUT_PATH),
    { maxAge: SERVER_CONFIG.CLIENT_BUNDLE_CACHE_MAXAGE }
  )
);

// Configure static serving of our "public" root http path static files.
app.use(express.static(path.resolve(appRootPath, './public')));

// Bind our universal react app middleware as the handler for all get requests.
app.get('*', universalReactAppMiddleware);

// Create an http listener for our express app.
const listener = app.listen(SERVER_CONFIG.SERVER_PORT);

console.log(`==> 💚  HTTP Listener is running on port ${SERVER_CONFIG.SERVER_PORT}`); // eslint-disable-line no-console,max-len

// We export the listener as it will be handy for our development hot reloader.
export default listener;
