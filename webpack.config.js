const path = require('path')

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
        test: /\.s?css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMaps: true,
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
  }
}
