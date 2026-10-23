// Loaded before anything else, so it must stay free of imports and of syntax newer than ES2017,
// letting old Node versions report the problem instead of crashing.

/** Keep in sync with `engines.node` in package.json (enforced by a test). */
export const MINIMUM_NODE_VERSION = '22.2.0';

/** @param {string} version e.g. `process.versions.node` */
export function isSupportedNodeVersion(version) {
	const actual = version.split('.').map(Number);
	const minimum = MINIMUM_NODE_VERSION.split('.').map(Number);
	for (let i = 0; i < minimum.length; i++) {
		if (actual[i] !== minimum[i]) return actual[i] > minimum[i];
	}
	return true;
}
