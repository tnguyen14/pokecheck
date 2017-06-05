import resolve from 'rollup-plugin-node-resolve';

export default {
	entry: 'client/main.js',
	format: 'iife',
	plugins: [resolve()],
	dest: 'public/build/main.js'
};
