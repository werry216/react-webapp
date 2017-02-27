/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */

import React from 'react';
import { render } from 'react-dom';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import { withAsyncComponents } from 'react-async-component';
import { toJS } from 'mobx';
import { Provider } from 'mobx-react';

import './polyfills';

import DemoApp from '../shared/components/DemoApp';
import Store from '../shared/store';
import stringify from '../shared/utils/json/stringify';

// Get the DOM Element that will host our React application.
const container = document.querySelector('#app');

// Construct a new store with data from the server
let store = new Store(window.__INITIAL_STATE__);

/**
 * Renders the given React Application component.
 */
function renderApp(TheApp) {
  // Firstly, define our full application component, wrapping the given
  // component app with a browser based version of react router.
  const app = (
    <Provider {...store}>
      <BrowserRouter>
        <TheApp />
      </BrowserRouter>
    </Provider>
  );

  // We use the react-async-component in order to support code splitting of
  // our bundle output. It's important to use this helper.
  // @see https://github.com/ctrlplusb/react-async-component
  withAsyncComponents(app).then(({ appWithAsyncComponents }) =>
    render(appWithAsyncComponents, container),
  );
}

// Execute the first render of our app.
renderApp(DemoApp);

// This registers our service worker for asset caching and offline support.
// Keep this as the last item, just in case the code execution failed (thanks
// to react-boilerplate for that tip.)
require('./registerServiceWorker');

// The following is needed so that we can support hot reloading our application.
if (process.env.BUILD_FLAG_IS_DEV && module.hot) {
  if (module.hot.data && module.hot.data.store) {
    // Create new store with previous store state
    store = new Store(JSON.parse(module.hot.data.store));
  }
  // Disposed right before hot-loading new code
  module.hot.dispose((data) => {
    // Deserialize store and keep in hot module data for next replacement
    data.store = stringify(toJS(store)); // eslint-disable-line no-param-reassign
  });
  // Accept changes to this file for hot reloading.
  module.hot.accept('./index.js');
  // Any changes to our App will cause a hotload re-render.
  module.hot.accept(
    () => renderApp(require('../shared/components/DemoApp').default),
  );

  // Make the store available in the window for debugging purposes
  window.store = store;
  // Filter out mobx store changed warnings.
  // Hot loading will always change the stores so suppression is needed.
  const warn = console.warn;
  console.warn = (firstArg, ...args) => {
    if (firstArg && /Provided store (.*) has changed/.test(firstArg)) {
      return;
    }
    warn.call(console, firstArg, ...args);
  };
}
