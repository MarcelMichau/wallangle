import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UsageError, parseOptions } from '../lib/options.mjs';

test('leaves unset options undefined', () => {
	assert.deepEqual(parseOptions([]), {
		help: false,
		width: undefined,
		height: undefined,
		variance: undefined,
		cellSize: undefined,
		seed: undefined,
		palette: undefined,
	});
});

test('parses the README example', () => {
	const options = parseOptions([
		'--width=2560',
		'--height=1440',
		'--variance=0.75',
		'--cellSize=250',
		'--seed=helloworld',
		'--colors=#083d77,#ebebd3,#da4167,#f4d35e,#f78764',
	]);
	assert.equal(options.width, 2560);
	assert.equal(options.height, 1440);
	assert.equal(options.variance, 0.75);
	assert.equal(options.cellSize, 250);
	assert.equal(options.seed, 'helloworld');
	assert.deepEqual(options.palette.colors, ['#083d77', '#ebebd3', '#da4167', '#f4d35e', '#f78764']);
});

test('accepts 0 as a seed and variance', () => {
	const options = parseOptions(['--seed=0', '--variance=0']);
	assert.equal(options.seed, '0');
	assert.equal(options.variance, 0);
});

test('colors', () => {
	assert.equal(parseOptions(['--colors=']).palette, undefined);
	assert.equal(parseOptions(['--colors=random']).palette, undefined);
	assert.equal(parseOptions(['--colors=spectral']).palette.name, 'Spectral');
	assert.deepEqual(parseOptions(['--colors=rgb(1, 2, 3), red']).palette.colors, ['rgb(1, 2, 3)', 'red']);
	assert.throws(() => parseOptions(['--colors=#fff,notacolor']), /notacolor/);
});

test('rejects invalid values', () => {
	for (const arg of ['--variance=1.5', '--variance=abc', '--cellSize=5', '--cellSize=12.5', '--width=0', '--width=', '--bogus']) {
		assert.throws(() => parseOptions([arg]), UsageError, arg);
	}
});
