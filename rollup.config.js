import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
	entry: 'client/main.js',
	format: 'iife',
	plugins: [
		builtins(),
		resolve(),
		commonjs(),
		json()
	],
	dest: 'public/build/main.js'
};
