const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = [
  {
    devtool: "source-map",
    output: {
      path: __dirname + "/dist",
      filename: "[name]-bundle.min.js",
    },
    module: {
      rules: [
        {
          test: /src[\/\\].*\.ts/,
          use: 'ts-loader'
        },
        {
          test: /\.(glsl|vs|fs|vert|frag)$/,
          exclude: /node_modules/,
          use: [
            'raw-loader'
          ]
        },
      ],
    },
    resolve: {
      extensions: [".js", ".ts"],
    },
    watchOptions: {
      poll: 50,
      ignored: /node_modules/,
    },
    entry: {
      "main": __dirname + "/src/" + "main.ts",
    },
    plugins: [
      new BrowserSyncPlugin({
        host: 'localhost',
        port: 3000,
        server: { baseDir: ['dist'] },
      })
    ]
  },
]
