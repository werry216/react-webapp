import path from 'path';
import { sync as globSync } from 'glob';
import webpack from 'webpack';
import OfflinePlugin from 'offline-plugin';
import AssetsPlugin from 'assets-webpack-plugin';
import nodeExternals from 'webpack-node-externals';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import appRootDir from 'app-root-dir';
import WebpackMd5Hash from 'webpack-md5-hash';
import { removeEmpty, ifElse, merge, happyPackPlugin } from '../utils';
import getConfig from '../../config/get';
import ClientConfigScript from '../../config/ClientConfigScript';

/**
 * This function is responsible for creating the webpack configuration for
 * all of our bundles.
 *
 * It has been configured to support one "client/web" bundle, and any number of
 * additional "node" bundles (i.e. our "server").  You can define additional
 * node bundles by editing the config/project.js file.
 *
 * This factory does not and will not support building multiple web target
 * bundles.  We expect there to be only one web client representing the full
 * server side rendered single page application.  Code splitting negates any
 * need for you to create multiple web bundles.  Therefore we are avoiding this
 * level of abstraction to keep the config factory as simple as possible.
 */
export default function webpackConfigFactory(buildOptions) {
  const { target } = buildOptions;

  const NODE_ENV = process.env.NODE_ENV || 'development';

  const isDev = NODE_ENV === 'development';
  // Any environment but 'development' will be considered a production based build.
  const isProd = !isDev;
  const isClient = target === 'client';
  const isServer = target === 'server';
  // Any bundle but the client bundle must target node.
  const isNode = !isClient;

  // Preconfigure some ifElse helper instnaces. See the util docs for more
  // information on how this util works.
  const ifDev = ifElse(isDev);
  const ifProd = ifElse(isProd);
  const ifNode = ifElse(isNode);
  const ifClient = ifElse(isClient);
  const ifDevClient = ifElse(isDev && isClient);
  const ifProdClient = ifElse(isProd && isClient);

  console.log(`==> Creating "${target}" webpack config in "${isDev ? 'development' : 'production'}" mode`);

  // Resolve the bundle configuration.
  const bundleConfig = isServer || isClient
    // This is either our "server" or "client" bundle.
    ? getConfig(['bundles', target])
    // Otherwise it must be an additional node bundle.
    : getConfig(['additionalNodeBundles', target]);

  if (!bundleConfig) {
    throw new Error('No bundle configuration exists for target:', target);
  }

  const webpackConfig = {
    target: isClient
      // Only our client bundle will target the web as a runtime.
      ? 'web'
      // Any other bundle (including the server) will target node as a runtime.
      : 'node',

    // Ensure that webpack polyfills the following node features for use
    // within any bundles that are targetting node as a runtime. This will be
    // ignored otherwise.
    node: {
      __dirname: true,
      __filename: true,
    },

    // We don't want our node_modules to be bundled with any bundle that is
    // targetting the node environment, prefering them to be resolved via
    // native node module system.
    // Therefore we use the `webpack-node-externals` library to help us generate
    // an  externals config that will ignore all node_modules.
    externals: removeEmpty([
      ifNode(
        () => nodeExternals(
          // Some of our node_modules may contain files that depend on webpack
          // loaders, e.g. CSS or SASS.
          // For these cases please make sure that the file extensions are
          // registered within the following configuration setting.
          { whitelist:
              // We always want the source-map-support excluded.
              ['source-map-support/register'].concat(
                // Then exclude any items specified in the config.
                getConfig('nodeExternalsFileTypeWhitelist') || [],
              ),
          },
        ),
      ),
    ]),

    // Source map settings.
    devtool: ifElse(
        // Include source maps for ANY node bundle so that we can support
        // nice stack traces for errors (the source maps get consumed by
        // the `node-source-map-support` module to allow for this).
        isNode
        // Always include source maps for any development build.
        || isDev
        // Allow for the following flag to force source maps even for production
        // builds.
        || getConfig('includeSourceMapsForProductionBuilds'),
      )(
      // Produces an external source map (lives next to bundle output files).
      'source-map',
      // Produces no source map.
      'hidden-source-map',
    ),

    // Performance budget feature.
    // This enables checking of the output bundle size, which will result in
    // warnings/errors if the bundle sizes are too large.
    // We only want this enabled for our production client.  Please
    // see the webpack docs on how you can configure this to your own needs:
    // https://webpack.js.org/configuration/performance/
    performance: ifProdClient(
      // Enable webpack's performance hints for production client builds.
      { hints: 'warning' },
      // Else we have to set a value of "false" if we don't want the feature.
      false,
    ),

    // Define our entry chunks for our bundle.
    entry: {
      // We name our entry files "index" as it makes it easier for us to
      // target specific bundle output files as each bundle output will get
      // an output path similar to:
      //   ./build/server/index.js
      // This makes importing of the output module as simple as:
      //   import server from './build/server';
      index: removeEmpty([
        // Required to support hot reloading of our client.
        ifDevClient('react-hot-loader/patch'),
        // Required to support hot reloading of our client.
        ifDevClient(() => `webpack-hot-middleware/client?reload=true&path=http://${getConfig('host')}:${getConfig('clientDevServerPort')}/__webpack_hmr`),
        // We are using polyfill.io instead of the very heavy babel-polyfill.
        // Therefore we need to add the regenerator-runtime as the babel-polyfill
        // included this, which polyfill.io doesn't include.
        ifClient('regenerator-runtime/runtime'),
        // The source entry file for the bundle.
        path.resolve(appRootDir.get(), bundleConfig.srcEntryFile),
      ]),
    },

    // Bundle output configuration.
    output: merge(
      {
        // The dir in which our bundle should be output.
        path: path.resolve(appRootDir.get(), bundleConfig.outputPath),
        // The filename format for our bundle's entries.
        filename: ifProdClient(
          // For our production client bundles we include a hash in the filename.
          // That way we won't hit any browser caching issues when our bundle
          // output changes.
          // Note: as we are using the WebpackMd5Hash plugin, the hashes will
          // only change when the file contents change. This means we can
          // set very aggressive caching strategies on our bundle output.
          '[name]-[chunkhash].js',
          // For any other bundle (typically a server/node) bundle we want a
          // determinable output name to allow for easier importing/execution
          // of the bundle by our scripts.
          '[name].js',
        ),
        // The name format for any additional chunks produced for the bundle.
        chunkFilename: '[name]-[chunkhash].js',
        // When in node mode we will output our bundle as a commonjs2 module.
        libraryTarget: ifNode('commonjs2', 'var'),
      },
      // This is the web path under which our webpack bundled client should
      // be considered as being served from.
      // We only need to set this for our server/client bundles as the server
      // bundle is the application that serves the client bundle.
      ifElse(isServer || isClient)(() => ({
        publicPath: ifDev(
          // As we run a seperate development server for our client and server
          // bundles we need to use an absolute http path for the public path.
          `http://${getConfig('host')}:${getConfig('clientDevServerPort')}${getConfig('bundles.client.webPath')}`,
          // Otherwise we expect our bundled client to be served from this path.
          bundleConfig.webPath,
        ),
      })),
    ),

    resolve: {
      // These extensions are tried when resolving a file.
      extensions: getConfig('bundleSrcTypes').map(ext => `.${ext}`),

      // This is required for the modernizr-loader
      // @see https://github.com/peerigon/modernizr-loader
      alias: {
        modernizr$: path.resolve(appRootDir.get(), './.modernizrrc'),
      },
    },

    plugins: removeEmpty([
      // This grants us source map support, which combined with our webpack
      // source maps will give us nice stack traces for our node executed
      // bundles.
      // We use the BannerPlugin to make sure all of our chunks will get the
      // source maps support installed.
      ifNode(() => new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false,
      })),

      // We use this so that our generated [chunkhash]'s are only different if
      // the content for our respective chunks have changed.  This optimises
      // our long term browser caching strategy for our client bundle, avoiding
      // cases where browsers end up having to download all the client chunks
      // even though 1 or 2 may have only changed.
      ifClient(() => new WebpackMd5Hash()),

      // The DefinePlugin is used by webpack to substitute any patterns that it
      // finds within the code with the respective value assigned below.
      //
      // For example you may have the following in your code:
      //   if (process.env.NODE_ENV === 'development') {
      //     console.log('Foo');
      //   }
      //
      // If we assign the NODE_ENV variable in the DefinePlugin below a value
      // of 'production' webpack will replace your code with the following:
      //   if ('production' === 'development') {
      //     console.log('Foo');
      //   }
      //
      // This is very useful as we are compiling/bundling our code and we would
      // like our environment variables to persist within the code.
      //
      // At the same time please be careful with what environment variables you
      // use in each respective bundle.  For example, don't accidentally
      // expose a database connection string within your client bundle src!
      new webpack.DefinePlugin({
        // Adding the NODE_ENV key is especially important as React relies
        // on it to optimize production builds. We have to force this value
        // to be either 'development' or 'production'.
        // If you would like to use an environment specific environment file
        // when you execute your application then please use the "CONF_ENV"
        // environment variable.
        // e.g. `CONF_ENV=staging yarn run start`
        'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
        // Is this the "client" bundle?
        'process.env.IS_CLIENT': JSON.stringify(isClient),
        // Is this the "server" bundle?
        'process.env.IS_SERVER': JSON.stringify(isServer),
        // Is this a node bundle?
        'process.env.IS_NODE': JSON.stringify(isNode),
      }),

      // Generates a JSON file containing a map of all the output files for
      // our webpack bundle.  A necessisty for our server rendering process
      // as we need to interogate these files in order to know what JS/CSS
      // we need to inject into our HTML. We only need to know the assets for
      // our client bundle.
      ifClient(() =>
        new AssetsPlugin({
          filename: getConfig('bundleAssetsFileName'),
          path: path.resolve(appRootDir.get(), bundleConfig.outputPath),
        }),
      ),

      // We don't want webpack errors to occur during development as it will
      // kill our dev servers.
      ifDev(() => new webpack.NoEmitOnErrorsPlugin()),

      // We need this plugin to enable hot reloading of our client.
      ifDevClient(() => new webpack.HotModuleReplacementPlugin()),

      // For our production client we need to make sure we pass the required
      // configuration to ensure that the output is minimized/optimized.
      ifProdClient(
        () => new webpack.LoaderOptionsPlugin({
          minimize: getConfig('optimizeProductionBuilds'),
        }),
      ),

      // For our production client we need to make sure we pass the required
      // configuration to ensure that the output is minimized/optimized.
      ifProdClient(
        ifElse(getConfig('optimizeProductionBuilds'))(
          () => new webpack.optimize.UglifyJsPlugin({
            sourceMap: getConfig('includeSourceMapsForProductionBuilds'),
            compress: {
              screw_ie8: true,
              warnings: false,
            },
            mangle: {
              screw_ie8: true,
            },
            output: {
              comments: false,
              screw_ie8: true,
            },
          }),
        ),
      ),

      // For the production build of the client we need to extract the CSS into
      // CSS files.
      ifProdClient(
        () => new ExtractTextPlugin({
          filename: '[name]-[chunkhash].css', allChunks: true,
        }),
      ),

      // -----------------------------------------------------------------------
      // START: HAPPY PACK PLUGINS
      //
      // @see https://github.com/amireh/happypack/
      //
      // HappyPack allows us to use threads to execute our loaders. This means
      // that we can get parallel execution of our loaders, significantly
      // improving build and recompile times.
      //
      // This may not be an issue for you whilst your project is small, but
      // the compile times can be signficant when the project scales. A lengthy
      // compile time can significantly impare your development experience.
      // Therefore we employ HappyPack to do threaded execution of our
      // "heavy-weight" loaders.

      // HappyPack 'javascript' instance.
      happyPackPlugin({
        name: 'happypack-javascript',
        // We will use babel to do all our JS processing.
        loaders: [{
          path: 'babel-loader',
          // We will create a babel config and pass it through the plugin
          // defined in the project configuration, allowing additional
          // items to be added.
          query: getConfig('plugins.babelConfig')(
            // Our "standard" babel config.
            {
              // We need to ensure that we do this otherwise the babelrc will
              // get interpretted and for the current configuration this will mean
              // that it will kill our webpack treeshaking feature as the modules
              // transpilation has not been disabled within in.
              babelrc: false,

              presets: [
                // JSX
                'react',
                // Stage 3 javascript syntax.
                // "Candidate: complete spec and initial browser implementations."
                // Add anything lower than stage 3 at your own risk. :)
                'stage-3',
                // For our client bundles we transpile all the latest ratified
                // ES201X code into ES5, safe for browsers.  We exclude module
                // transilation as webpack takes care of this for us, doing
                // tree shaking in the process.
                ifClient(['latest', { es2015: { modules: false } }]),
                // For a node bundle we use the awesome babel-preset-env which
                // acts like babel-preset-latest in that it supports the latest
                // ratified ES201X syntax, however, it will only transpile what
                // is necessary for a target environment.  We have configured it
                // to target our current node version.  This is cool because
                // recent node versions have extensive support for ES201X syntax.
                // Also, we have disabled modules transpilation as webpack will
                // take care of that for us ensuring tree shaking takes place.
                // NOTE: Make sure you use the same node version for development
                // and production.
                ifNode(['env', { targets: { node: true }, modules: false }]),
              ].filter(x => x != null),

              plugins: [
                // Required to support react hot loader.
                ifDevClient('react-hot-loader/babel'),
                // This decorates our components with  __self prop to JSX elements,
                // which React will use to generate some runtime warnings.
                ifDev('transform-react-jsx-self'),
                // Adding this will give us the path to our components in the
                // react dev tools.
                ifDev('transform-react-jsx-source'),
                // Replaces the React.createElement function with one that is
                // more optimized for production.
                // NOTE: Symbol needs to be polyfilled. Ensure this feature
                // is enabled in the polyfill.io configuration.
                ifProd('transform-react-inline-elements'),
                // Hoists element creation to the top level for subtrees that
                // are fully static, which reduces call to React.createElement
                // and the resulting allocations. More importantly, it tells
                // React that the subtree hasn’t changed so React can completely
                // skip it when reconciling.
                ifProd('transform-react-constant-elements'),
              ].filter(x => x != null),
            },
            buildOptions,
          ),
        }],
      }),

      // HappyPack 'css' instance for development client.
      ifDevClient(
        () => happyPackPlugin({
          name: 'happypack-devclient-css',
          loaders: [
            'style-loader',
            {
              path: 'css-loader',
              // Include sourcemaps for dev experience++.
              query: { sourceMap: true },
            },
          ],
        }),
      ),

      // END: HAPPY PACK PLUGINS
      // -----------------------------------------------------------------------

      // Service Worker - Offline Page generation.
      //
      // We use the HtmlWebpackPlugin to produce an "offline" html page that
      // can be used by our service worker (see the OfflinePlugin below) in
      // order support offline rendering of our application.
      // We will only create the service worker required page if enabled in
      // config and if we are building the production version of client.
      ifElse(isProd && isClient && getConfig('serviceWorker.enabled'))(
        () => new HtmlWebpackPlugin({
          filename: getConfig('serviceWorker.offlinePageFileName'),
          template: `babel-loader!${getConfig('serviceWorker.offlinePageTemplate')}`,
          production: true,
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
          inject: true,
          // We pass our getConfig and client config script compoent as it will
          // be needed by the offline template.
          custom: {
            getConfig,
            ClientConfigScript,
          },
        }),
      ),

      // Service Worker - generation.
      //
      // NOTE: It is HIGHLY recommended to keep this plugin as the last item
      // within the list as it needs to be aware of all possible manipulations
      // that may have be done to assets by the previous plugins. This is an
      // offical request/recommendation by the plugin author.
      //
      // This is bound to our server/client bundles as we only expect to be
      // serving the client bundle as a Single Page Application through the
      // server.
      //
      // We use the offline-plugin to generate the service worker.  It also
      // provides a runtime installation script which gets executed within
      // the client.
      // @see https://github.com/NekR/offline-plugin
      //
      // This plugin generates a service worker script which as configured below
      // will precache all our generated client bundle assets as well as our
      // static "public" folder assets.
      //
      // It has also been configured to make use of a HtmlWebpackPlugin
      // generated "offline" page so that users can still used the application
      // offline.
      //
      // Any time our static files or generated bundle files change the user's
      // cache will be updated.
      //
      // We will only include the service worker if enabled in config.
      ifElse(isProd && isClient && getConfig('serviceWorker.enabled'))(
        () => new OfflinePlugin({
          // Setting this value lets the plugin know where our generated client
          // assets will be served from.
          // e.g. /client/
          publicPath: bundleConfig.webPath,
          // When using the publicPath we need to disable the "relativePaths"
          // feature of this plugin.
          relativePaths: false,
          // Our offline support will be done via a service worker.
          // Read more on them here:
          // http://bit.ly/2f8q7Td
          ServiceWorker: {
            // The name of the service worker script that will get generated.
            output: getConfig('serviceWorker.fileName'),
            // Enable events so that we can register updates.
            events: true,
            // By default the service worker will be ouput and served from the
            // publicPath setting above in the root config of the OfflinePlugin.
            // This means that it would be served from /client/sw.js
            // We do not want this! Service workers have to be served from the
            // root of our application in order for them to work correctly.
            // Therefore we override the publicPath here. The sw.js will still
            // live in at the /build/client/sw.js output location therefore in
            // our server configuration we need to make sure that any requests
            // to /sw.js will serve the /build/client/sw.js file.
            publicPath: `/${getConfig('serviceWorker.fileName')}`,
            // When the user is offline then this html page will be used at
            // the base that loads all our cached client scripts.  This page
            // is generated by the HtmlWebpackPlugin above, which takes care
            // of injecting all of our client scripts into the body.
            // Please see the HtmlWebpackPlugin configuration above for more
            // information on this page.
            navigateFallbackURL: `${bundleConfig.webPath}${getConfig('serviceWorker.offlinePageFileName')}`,
          },
          // According to the Mozilla docs, AppCache is considered deprecated.
          // @see https://mzl.la/1pOZ5wF
          // It does however have much wider support compared to the newer
          // Service Worker specification, so you could consider enabling it
          // if you needed.
          AppCache: false,
          // Which external files should be included with the service worker?
          externals:
            // Add the polyfill io script as an external if it is enabled.
            (
              getConfig('polyfillIO.enabled')
                ? [getConfig('polyfillIO.url')]
                : []
            )
            // Add any included public folder assets.
            .concat(
              getConfig('serviceWorker.includePublicAssets').reduce((acc, cur) => {
                const publicAssetPathGlob = path.resolve(
                  appRootDir.get(), getConfig('publicAssetsPath'), cur,
                );
                const publicFileWebPaths = acc.concat(
                  // First get all the matching public folder files.
                  globSync(publicAssetPathGlob, { nodir: true })
                  // Then map them to relative paths against the public folder.
                  // We need to do this as we need the "web" paths for each one.
                  .map(publicFile => path.relative(
                    path.resolve(appRootDir.get(), getConfig('publicAssetsPath')),
                    publicFile,
                  ))
                  // Add the leading "/" indicating the file is being hosted
                  // off the root of the application.
                  .map(relativePath => `/${relativePath}`),
                );
                return publicFileWebPaths;
              }, []),
            ),
        }),
      ),
      // ),
    ]),
    module: {
      rules: removeEmpty([
        // JAVASCRIPT
        {
          test: /\.jsx?$/,
          // We will defer all our js processing to the happypack plugin
          // named "happypack-javascript".
          // See the respective plugin within the plugins section for full
          // details on what loader is being implemented.
          loader: 'happypack/loader?id=happypack-javascript',
          include: removeEmpty([
            ...bundleConfig.srcPaths.map(srcPath =>
              path.resolve(appRootDir.get(), srcPath),
            ),
            ifProdClient(path.resolve(appRootDir.get(), 'src/html')),
          ]),
        },

        // CSS
        // This is bound to our server/client bundles as we only expect to be
        // serving the client bundle as a Single Page Application through the
        // server.
        ifElse(isClient || isServer)(
          merge(
            {
              test: /\.css$/,
            },
            // For development clients we will defer all our css processing to the
            // happypack plugin named "happypack-devclient-css".
            // See the respective plugin within the plugins section for full
            // details on what loader is being implemented.
            ifDevClient({
              loaders: ['happypack/loader?id=happypack-devclient-css'],
            }),
            // For a production client build we use the ExtractTextPlugin which
            // will extract our CSS into CSS files. We don't use happypack here
            // as there are some edge cases where it fails when used within
            // an ExtractTextPlugin instance.
            // Note: The ExtractTextPlugin needs to be registered within the
            // plugins section too.
            ifProdClient(() => ({
              loader: ExtractTextPlugin.extract({
                fallbackLoader: 'style-loader',
                loader: ['css-loader'],
              }),
            })),
            // When targetting the server we use the "/locals" version of the
            // css loader, as we don't need any css files for the server.
            ifNode({
              loaders: ['css-loader/locals'],
            }),
          ),
        ),

        // ASSETS (Images/Fonts/etc)
        // This is bound to our server/client bundles as we only expect to be
        // serving the client bundle as a Single Page Application through the
        // server.
        ifElse(isClient || isServer)(() => ({
          test: new RegExp(`\\.(${getConfig('bundleAssetTypes').join('|')})$`, 'i'),
          loader: 'file-loader',
          query: {
            // What is the web path that the client bundle will be served from?
            // The same value has to be used for both the client and the
            // server bundles in order to ensure that SSR paths match the
            // paths used on the client.
            publicPath: isDev
              // When running in dev mode the client bundle runs on a
              // seperate port so we need to put an absolute path here.
              ? `http://${getConfig('host')}:${getConfig('clientDevServerPort')}${getConfig('bundles.client.webPath')}`
              // Otherwise we just use the configured web path for the client.
              : getConfig('bundles.client.webPath'),
            // We only emit files when building a web bundle, for the server
            // bundle we only care about the file loader being able to create
            // the correct asset URLs.
            emitFile: isClient,
          },
        })),

        // MODERNIZR
        // This allows you to do feature detection.
        // @see https://modernizr.com/docs
        // @see https://github.com/peerigon/modernizr-loader
        ifClient({
          test: /\.modernizrrc.js$/,
          loader: 'modernizr-loader',
        }),
        ifClient({
          test: /\.modernizrrc(\.json)?$/,
          loader: 'modernizr-loader!json-loader',
        }),
      ]),
    },
  };

  // Apply the configuration middleware.
  return getConfig('plugins.webpackConfig')(webpackConfig, buildOptions);
}
