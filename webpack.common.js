const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  output: {
    filename: 'FoxholeRouter.js'
	},
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  }
}