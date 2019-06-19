const webpack = require('webpack')
const path = require('path')
const WebpackShellPlugin = require('webpack-shell-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

function recursiveIssuer(m) {
  if (m.issuer) {
    return recursiveIssuer(m.issuer);
  } else if (m.name) {
    return m.name;
  } else {
    return false;
  }
}

function cacheGroup(entryName) {
  return {
    name: entryName,
    test: (m, c, entry = entryName) =>
      m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
    chunks: 'all',
    enforce: true,
  }
}

module.exports = {
  mode: 'development',
  entry: {
    client: path.resolve(__dirname, 'clients/streaming-client/main.tsx'),
    public: path.resolve(__dirname, 'clients/public-site/main.tsx'),
    dashboard: path.resolve(__dirname, 'clients/dashboard/main.tsx'),
    presenter: path.resolve(__dirname, 'clients/presenter/main.tsx'),
  },
  output: {
    path: path.resolve(__dirname, 'static/assets/js'),
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.scss']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.react.json'
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: true,
              localIdentName: '[folder]-[name]__[local]--[hash:base64:5]'
            }
          },
          {
            loader: 'sass-loader',
            options: { sourceMaps: true }
          }
        ]
      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        clientStyles: cacheGroup('client'),
        publicStyles: cacheGroup('public'),
        dashboardStyles: cacheGroup('dashboard'),
        presenterStyles: cacheGroup('presenter'),
      },
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new WebpackShellPlugin({
      onBuildStart: ['yarn build:style-typings'],
      dev: false
    }),
    new webpack.WatchIgnorePlugin([
      /scss\.d\.ts$/
    ])
  ]
}
