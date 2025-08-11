/* eslint-disable @typescript-eslint/no-unsafe-call */
import {defineConfig} from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		cli: 'src/cli.ts',
	},
	format: ['esm'],
	dts: true, // Generate .d.ts
	sourcemap: true,
	clean: true,
	target: 'node18', // Set to your minimum Node
	splitting: false, // Usually off for Node libs
	minify: false, // Publish readable code
	external: ['node:*'], // Keep Node builtins external
	noExternal: ['chalk'], // Bundle chalk to avoid ESM/CJS issues
	banner: {
		js: '#!/usr/bin/env node',
	},
});
