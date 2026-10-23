import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { MINIMUM_NODE_VERSION, isSupportedNodeVersion } from '../lib/node-version.mjs';

test('compares versions numerically', () => {
	for (const version of ['22.2.0', '22.2.1', '22.10.0', '23.0.0', '100.0.0']) {
		assert.ok(isSupportedNodeVersion(version), version);
	}
	for (const version of ['22.1.9', '22.0.0', '21.99.99', '20.18.0', '9.0.0']) {
		assert.ok(!isSupportedNodeVersion(version), version);
	}
});

test('matches engines.node in package.json', async () => {
	const { engines } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
	const [major, minor = '0', patch = '0'] = engines.node.replace('>=', '').trim().split('.');
	assert.equal(`${major}.${minor}.${patch}`, MINIMUM_NODE_VERSION);
});
