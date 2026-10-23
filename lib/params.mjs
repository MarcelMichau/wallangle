import { pickPalette } from './generate.mjs';
import { createRandom } from './random.mjs';

/**
 * Chooses the generation parameters for one monitor. Every default is drawn from the seed before
 * overrides are applied, so overriding one option never changes the others.
 * @param {string} seed
 * @param {{ variance?: number, cellSize?: number, palette?: { name: string, colors: string[] } }} options
 */
export function pickParams(seed, options) {
	const random = createRandom(`${seed}:params`);
	const defaults = {
		variance: random(),
		cellSize: Math.floor(random() * 200 + 40),
		palette: pickPalette(random),
	};
	return {
		variance: options.variance ?? defaults.variance,
		cellSize: options.cellSize ?? defaults.cellSize,
		palette: options.palette ?? defaults.palette,
	};
}
