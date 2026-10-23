import chroma from 'chroma-js';
import Delaunator from 'delaunator';

// Qualitative ColorBrewer palettes are made of unrelated hues and look muddy as gradients.
const QUALITATIVE = new Set(['Set1', 'Set2', 'Set3', 'Accent', 'Dark2', 'Paired', 'Pastel1', 'Pastel2']);

/** Names of the ColorBrewer palettes that `random` picks from. */
export const PALETTE_NAMES = Object.keys(chroma.brewer).filter((name) => !QUALITATIVE.has(name));

/** Looks up a palette by name, case-insensitively. */
export function findPalette(name) {
	const match = PALETTE_NAMES.find((candidate) => candidate.toLowerCase() === name.toLowerCase());
	return match && { name: match, colors: chroma.brewer[match] };
}

export function pickPalette(random) {
	const name = PALETTE_NAMES[Math.floor(random() * PALETTE_NAMES.length)];
	return { name, colors: chroma.brewer[name] };
}

/**
 * Lays out a grid of points covering the image plus a margin, each nudged by up to
 * `variance * cellSize / 2` so the triangulation reaches past every edge.
 */
function createPoints(width, height, cellSize, variance, random) {
	const columns = Math.ceil(width / cellSize) + 3;
	const rows = Math.ceil(height / cellSize) + 3;
	const offsetX = (width - (columns - 1) * cellSize) / 2;
	const offsetY = (height - (rows - 1) * cellSize) / 2;
	const jitter = variance * cellSize;

	const coords = new Float64Array(columns * rows * 2);
	let i = 0;
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			coords[i++] = offsetX + column * cellSize + (random() - 0.5) * jitter;
			coords[i++] = offsetY + row * cellSize + (random() - 0.5) * jitter;
		}
	}
	return coords;
}

function edgeX(ax, ay, bx, by, y) {
	return ax + ((y - ay) * (bx - ax)) / (by - ay);
}

/**
 * Adds a flat-coloured triangle into a 2x supersampled accumulation buffer.
 *
 * Samples sit at the centres of a grid twice the image resolution; a sample is covered when it
 * lies in [top, bottom) and [left, right) of the triangle. Vertices are ordered by (y, x), so two
 * triangles sharing an edge evaluate it identically and every sample is covered exactly once.
 */
function fillTriangle(acc, width, height, vertices, r, g, b) {
	vertices.sort((p, q) => p[1] - q[1] || p[0] - q[0]);
	const [[x0, y0], [x1, y1], [x2, y2]] = vertices;
	const sampleWidth = width * 2;

	const rowStart = Math.max(0, Math.ceil(y0 - 0.5));
	const rowEnd = Math.min(height * 2, Math.ceil(y2 - 0.5));
	for (let sy = rowStart; sy < rowEnd; sy++) {
		const y = sy + 0.5;
		const xLong = edgeX(x0, y0, x2, y2, y);
		const xShort = y < y1 ? edgeX(x0, y0, x1, y1, y) : edgeX(x1, y1, x2, y2, y);
		const left = Math.min(xLong, xShort);
		const right = Math.max(xLong, xShort);

		const columnStart = Math.max(0, Math.ceil(left - 0.5));
		const columnEnd = Math.min(sampleWidth, Math.ceil(right - 0.5));
		const rowOffset = (sy >> 1) * width;
		for (let sx = columnStart; sx < columnEnd; sx++) {
			const i = (rowOffset + (sx >> 1)) * 3;
			acc[i] += r;
			acc[i + 1] += g;
			acc[i + 2] += b;
		}
	}
}

/**
 * Generates low-poly triangle art.
 * @param {object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} options.cellSize Spacing of the point grid, in pixels.
 * @param {number} options.variance 0 (regular grid) to 1 (maximum jitter).
 * @param {string[]} options.colors Colours the gradient runs through, in any CSS format chroma-js accepts.
 * @param {() => number} options.random
 * @returns {{ width: number, height: number, data: Uint8Array }} 8-bit RGB pixels.
 */
export function generate({ width, height, cellSize, variance, colors, random }) {
	const points = createPoints(width, height, cellSize, variance, random);
	const { triangles } = new Delaunator(points);

	// The same scale runs along x and y; mixing the two gives a diagonal gradient.
	const scale = chroma.scale(colors).mode('lab');
	const clamp = (value) => Math.min(1, Math.max(0, value));

	const acc = new Uint16Array(width * height * 3);
	for (let t = 0; t < triangles.length; t += 3) {
		const vertices = [];
		let centroidX = 0;
		let centroidY = 0;
		for (let k = 0; k < 3; k++) {
			const p = triangles[t + k] * 2;
			vertices.push([points[p] * 2, points[p + 1] * 2]);
			centroidX += points[p] / 3;
			centroidY += points[p + 1] / 3;
		}

		const color = chroma.mix(scale(clamp(centroidX / width)), scale(clamp(centroidY / height)), 0.5, 'lab');
		const [r, g, b] = color.rgb();
		fillTriangle(acc, width, height, vertices, r, g, b);
	}

	// Each pixel received exactly four samples; average them.
	const data = new Uint8Array(acc.length);
	for (let i = 0; i < acc.length; i++) {
		data[i] = (acc[i] + 2) >> 2;
	}
	return { width, height, data };
}
