#!/usr/bin/env node

// The real CLI is loaded dynamically: its static imports (e.g. zlib.crc32) fail with a cryptic
// error on older Node versions, before any check inside it could run.
import { MINIMUM_NODE_VERSION, isSupportedNodeVersion } from './lib/node-version.mjs';

if (isSupportedNodeVersion(process.versions.node)) {
	import('./lib/main.mjs').then(({ run }) => run(process.argv.slice(2)));
} else {
	console.error(
		'wallangle needs Node.js ' + MINIMUM_NODE_VERSION + ' or newer, but this is ' + process.version + '.\n' +
			'Update Node.js from https://nodejs.org/ and try again.'
	);
	process.exitCode = 1;
}
