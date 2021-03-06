var path = require('path');
var webpack = require('webpack');
var fs = require('fs');

module.exports = {
	cache: true,
	'if-loader': 'prod',
	entry: {
		bundle: [
			'babel-polyfill',
			'./app/scripts/main',
		],
		'web-import': [
			'babel-polyfill',
			'./app/scripts/web-import.js',
		],
	},
	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: '',
		filename: '[name].js',
	},
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				loaders: ['transform/cacheable?envify', 'babel-loader?cacheDirectory', 'prelude-loader', 'if-loader'],
				include: [
					path.join(__dirname, 'app'),
				],
			},
			{
				test: /prototypo\-canvas/,
				loaders: [ 'babel-loader?cacheDirectory'],
				include: [
					fs.realpathSync(__dirname + '/node_modules/prototypo-canvas'),
				],
			},
			{
				test: /\.scss$/,
				loaders: ['style', 'css', 'sass'],
				include: [
					path.join(__dirname, 'app/styles'),
				],
			},
			{
				test: /\.css$/,
				loaders: ['style', 'css'],
			},
			{
				test: /\.json$/, loader: 'json',
			},
			{
				test: /\.(jpg|otf)$/,
				loaders: ['file'],
			},
			{
				test: /\.(svg|png|jpg)$/,
				loader: 'url-loader?limit=100000',
			},
		],
		noParse: /(levelup|dist\/prototypo-canvas)/,
	},
	externals: [{
		'./node/window': true,
		'./node/extend': true,
		'prototypo.js': 'prototypo',
	}],
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': "'production'",
		}),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				conditionals: false
			}
		}),
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.optimize.DedupePlugin(),
	],
	resolve: {
		extensions: ['', '.js', '.jsx'],
	},
};
