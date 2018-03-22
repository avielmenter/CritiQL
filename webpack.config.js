const path = require("path");

var config = {
	entry: ['./public/index.ts'],
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							appendTsSuffixTo: [/\.vue$/],
							configFile: 'tsconfig.vue.json'
						}
					}
				]
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader'
			},
			{
				test: /\.(png|jpg|jpeg|gif|svg)$/,
				loader: 'file-loader'
			}
		]
	}
};

module.exports = config;