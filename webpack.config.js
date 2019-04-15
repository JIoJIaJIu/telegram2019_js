const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
// TODO: chose
const ClosurePlugin = require('closure-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');

let config = {
  entry: './src/index.js',
  mode: process.env.NODE_ENV || 'production',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
	devServer: {
		contentBase: './dist',
	},
	module: {
		rules: [
			{
				test: /\.html$/,
				use: [{
					loader: 'html-loader',
					options: { minimize: true }
				}]
			}, {
				test: /\.scss$/,
				use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: (resourcePath, context) => {
                // publicPath is the relative path of the resource to the context
                // e.g. for ./css/admin/main.css the publicPath will be ../../
                // while for ./css/main.css the publicPath will be ../
                return path.relative(path.dirname(resourcePath), context) + '/';
              },
            },
          },
          'css-loader', 'sass-loader'],
      }
		]
	},
  /*
  optimization: {
    minimizer: [
      new ClosurePlugin({mode: 'AGGRESSIVE_BUNDLE'})
    ]
  },
  */
  optimization: {
    minimize: false
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: './index.html'
    }),
    new MiniCssExtractPlugin(),
  ]
};

if (config.mode === 'production') {
  //config.plugins.push(new CompressionPlugin());
  //config.plugins.push(new MinifyPlugin({ removeConsole: true }));
} else {
  config.devtool = 'inline-source-map'
}

module.exports = config
