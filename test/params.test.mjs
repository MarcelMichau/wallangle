import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickParams } from '../lib/params.mjs';

test('is deterministic for a seed', () => {
	assert.deepEqual(pickParams('hello', {}), pickParams('hello', {}));
	assert.notDeepEqual(pickParams('hello', {}), pickParams('world', {}));
});

test('overriding one option leaves the other defaults unchanged', () => {
	const defaults = pickParams('hello', {});
	const palette = { name: 'custom', colors: ['#000', '#fff'] };

	assert.deepEqual(pickParams('hello', { variance: 0.5 }), { ...defaults, variance: 0.5 });
	assert.deepEqual(pickParams('hello', { cellSize: 100 }), { ...defaults, cellSize: 100 });
	assert.deepEqual(pickParams('hello', { palette }), { ...defaults, palette });
});

test('keeps 0 as an explicit variance', () => {
	assert.equal(pickParams('hello', { variance: 0 }).variance, 0);
});
