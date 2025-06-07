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
          test: /src[\/\\].*\.(ts|tsx)$/,
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
      extensions: [".js", ".ts", ".tsx"],
    },
    watchOptions: {
      poll: 50,
      ignored: /node_modules/,
    },
    entry: {
      "main": __dirname + "/src/" + "main.tsx",
    },
    plugins: [
      new BrowserSyncPlugin(
        {
          host: 'localhost',
          port: 3000,
          server: { baseDir: ['dist'] },
          files: ["dist/*.js", "dist/*.css", "dist/*.html"],
          open: false,
          injectChanges: true,
        },
      )
    ]
  },
]
