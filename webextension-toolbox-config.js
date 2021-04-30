// This file does not going through babel transformation.
// So, we write it in vanilla JS
// (but you could use ES2015 features supported by your Node.js version).
const { resolve } = require('path')
const GlobEntriesPlugin = require('webpack-watched-glob-entries-plugin')

module.exports = {
	webpack: (config, { dev, vendor }) => {
		// Add typescript loader. Supports .ts and .tsx files as entry points.
		config.resolve.extensions.push('.ts')
		config.resolve.extensions.push('.tsx')
		config.entry = GlobEntriesPlugin.getEntries(
			[
				resolve('app', '*.{js,mjs,jsx,ts,tsx}'),
				resolve('app', '?(scripts)/*.{js,mjs,jsx,ts,tsx}'),
			]
		)
		config.module.rules.push({
			test: /\.tsx?$/,
			loader: 'ts-loader'
		})

		return config
	},
}