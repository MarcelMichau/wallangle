import { parseArgs } from 'node:util';
import chroma from 'chroma-js';
import { findPalette } from './generate.mjs';

export const USAGE = `Usage: wallangle [options]

Generates low-poly triangle art and sets it as the wallpaper on every monitor.

Options:
  --width=<px>       Image width. Defaults to each monitor's resolution.
  --height=<px>      Image height. Defaults to each monitor's resolution.
  --variance=<0-1>   Randomness of the triangles. Random by default.
  --cellSize=<px>    Size of the triangle grid (min 10). Random (40-239) by default.
  --seed=<value>     Seed for repeatable patterns. Random by default.
  --colors=<list>    Comma-separated CSS colours, a ColorBrewer palette name, or "random" (default).
  -h, --help         Show this message.`;

export class UsageError extends Error {}

function number(name, value, { min, max, integer = false }) {
	const parsed = Number(value);
	const valid =
		value.trim() !== '' &&
		Number.isFinite(parsed) &&
		(!integer || Number.isInteger(parsed)) &&
		(min === undefined || parsed >= min) &&
		(max === undefined || parsed <= max);
	if (!valid) {
		const kind = integer ? 'an integer' : 'a number';
		const range = max === undefined ? `>= ${min}` : `between ${min} and ${max}`;
		throw new UsageError(`--${name} must be ${kind} ${range}, got "${value}".`);
	}
	return parsed;
}

// Splits on commas that are not inside parentheses, so "rgb(1, 2, 3),#fff" stays two colours.
function parseColors(value) {
	const list = value
		.split(/,(?![^(]*\))/)
		.map((color) => color.trim())
		.filter(Boolean);

	if (list.length === 0 || (list.length === 1 && list[0].toLowerCase() === 'random')) {
		return undefined;
	}
	if (list.length === 1) {
		const palette = findPalette(list[0]);
		if (palette) return palette;
	}

	const invalid = list.filter((color) => !chroma.valid(color));
	if (invalid.length > 0) {
		throw new UsageError(`--colors contains invalid colours: ${invalid.join(', ')}.`);
	}
	return { name: list.join(','), colors: list };
}

/**
 * Parses command line arguments. Options left unset are `undefined` and are chosen per monitor.
 * @param {string[]} args
 */
export function parseOptions(args) {
	let values;
	try {
		({ values } = parseArgs({
			args,
			options: {
				width: { type: 'string' },
				height: { type: 'string' },
				variance: { type: 'string' },
				cellSize: { type: 'string' },
				seed: { type: 'string' },
				colors: { type: 'string' },
				help: { type: 'boolean', short: 'h' },
			},
			strict: true,
		}));
	} catch (error) {
		throw new UsageError(error.message);
	}

	return {
		help: values.help ?? false,
		width: values.width === undefined ? undefined : number('width', values.width, { min: 1, integer: true }),
		height: values.height === undefined ? undefined : number('height', values.height, { min: 1, integer: true }),
		variance: values.variance === undefined ? undefined : number('variance', values.variance, { min: 0, max: 1 }),
		cellSize: values.cellSize === undefined ? undefined : number('cellSize', values.cellSize, { min: 10, integer: true }),
		seed: values.seed,
		palette: values.colors === undefined ? undefined : parseColors(values.colors),
	};
}
