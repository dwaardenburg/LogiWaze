const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  output: {
    filename: 'main.js'
	},
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  }
}