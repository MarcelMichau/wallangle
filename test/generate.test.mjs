import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { PALETTE_NAMES, findPalette, generate, pickPalette } from '../lib/generate.mjs';
import { createRandom } from '../lib/random.mjs';

const hash = (image) => createHash('sha256').update(image.data).digest('hex');

test('covers every pixel exactly once, for any variance and cell size', () => {
	// With a single colour, an uncovered or doubly covered sample would show up as a value other than 255.
	for (const [width, height, cellSize, variance] of [
		[64, 48, 10, 0],
		[97, 61, 13, 0.5],
		[200, 120, 37, 1],
		[33, 250, 50, 0.9],
	]) {
		const image = generate({ width, height, cellSize, variance, colors: ['#fff', '#fff'], random: createRandom('cover') });
		assert.equal(image.data.length, width * height * 3);
		const wrong = image.data.findIndex((value) => value !== 255);
		assert.equal(wrong, -1, `pixel ${Math.floor(wrong / 3)} wrong for ${width}x${height}/${cellSize}/${variance}`);
	}
});

test('is deterministic for a seed', () => {
	const options = { width: 120, height: 80, cellSize: 20, variance: 0.75, colors: ['#083d77', '#da4167'] };
	const a = generate({ ...options, random: createRandom('hello') });
	const b = generate({ ...options, random: createRandom('hello') });
	const c = generate({ ...options, random: createRandom('world') });
	assert.equal(hash(a), hash(b));
	assert.notEqual(hash(a), hash(c));
});

test('runs a gradient across the image', () => {
	const image = generate({ width: 100, height: 100, cellSize: 10, variance: 0, colors: ['#000', '#fff'], random: createRandom('x') });
	const pixel = (x, y) => image.data[(y * 100 + x) * 3];
	assert.ok(pixel(2, 2) < 60, 'top-left is dark');
	assert.ok(pixel(97, 97) > 200, 'bottom-right is light');
});

test('palettes', () => {
	assert.ok(!PALETTE_NAMES.includes('Set1'), 'qualitative palettes are excluded');
	assert.equal(findPalette('ylgnbu').name, 'YlGnBu');
	assert.equal(findPalette('nope'), undefined);
	assert.ok(PALETTE_NAMES.includes(pickPalette(createRandom('p')).name));
});
