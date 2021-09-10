const path = require('path');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  output: {
    filename: 'FoxholeRouter.js',
    path: __dirname
	}
}