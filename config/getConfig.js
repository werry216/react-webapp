/**
 * Unified Configuration Reader
 *
 * This helper function allows you to use the same API in accessing configuration
 * values no matter where the code is being executed from (browser/node).
 *
 * e.g.
 *   import getConfig from '../config';
 *   console.log(getConfig('welcomeMessage'));
 */

/* eslint-disable no-console */
/* eslint-disable import/global-require */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-underscore-dangle */

// This resolves the correct configuration source based on the execution
// environment.  For node we use the standard config file, however, for browsers
// we need to access the configuration object that would have been bound to
// the "window" by our "reactApplication" middleware.
let configCache;
function resolveConfigForExecutionEnv() {
  if (configCache) {
    return configCache;
  }

  // NOTE: By using the "process.env.IS_NODE" flag here this block of code
  // will be removed when "process.env.IS_NODE === true".
  // If no "IS_NODE" env var is undefined we can assume that we are running outside
  // of a webpack run, and will therefore return the config file.
  if (typeof process.env.IS_NODE === 'undefined' || process.env.IS_NODE) {
    // i.e. running in our server/node process.
    configCache = require('./values').default;
    return configCache;
  }

  // To get here we are likely running in the browser.

  if (typeof window !== 'undefined'
    && typeof window.__CLIENT_CONFIG__ === 'object') {
    configCache = window.__CLIENT_CONFIG__;
  } else {
    // To get here we must be running in the browser.
    console.warn('No client configuration object was bound to the window.');
    configCache = {};
  }

  return configCache;
}

/**
 * This function wraps up the boilerplate needed to access the correct
 * configuration depending on whether your code will get executed in the
 * browser/node.
 *
 * i.e.
 *  - For the browser the config values are available at window.__CLIENT_CONFIG__
 *  - For a node process they are within the "<root>/config".
 *
 * To request a configuration value you must provide the repective path. For
 * example, f you had the following configuration structure:
 *   {
 *     foo: {
 *       bar: [1, 2, 3]
 *     },
 *     bob: 'bob'
 *   }
 *
 * You could use this function to access "bar" like so:
 *   import config from '../config';
 *   const value = config(['foo', 'bar']);
 *
 * And you could access "bob" like so:
 *   import config from '../config';
 *   const value = config(['bob']);
 *
 * If any part of the path isn't available as a configuration key/value then
 * an error will be thrown indicating that a respective configuration value
 * could not be found at the given path.
 */
export default function configGet(path) {
  const parts = typeof path === 'string'
    ? path.split('.')
    : path;

  if (parts.length === 0) {
    throw new Error('You must provide the path to the configuration value you would like to consume.');
  }
  let result = resolveConfigForExecutionEnv();
  for (let i = 0; i < parts.length; i += 1) {
    if (result === undefined) {
      const errorMessage = `Failed to resolve configuration value at "${parts.join('.')}".`;
      // This "if" block gets stripped away by webpack for production builds.
      if (process.env.NODE_ENV === 'development' && process.env.IS_CLIENT) {
        throw new Error(`${errorMessage} We have noticed that you are trying to access this configuration value from the client bundle (i.e. browser) though.  For configuration values to be exposed to the client bundle you must ensure that the path is added to the client configuration filter file, which is located at "config/clientConfigFilter.js".`);
      }
      throw new Error(errorMessage);
    }
    result = result[parts[i]];
  }
  return result;
}
