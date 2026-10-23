#!/usr/bin/env node

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generate, pickPalette } from './lib/generate.mjs';
import { USAGE, UsageError, parseOptions } from './lib/options.mjs';
import { encodePng } from './lib/png.mjs';
import { createRandom, randomSeed } from './lib/random.mjs';
import { loadPlatform } from './lib/wallpaper/index.mjs';

const FILE_PATTERN = /^wallangle-.*\.png$/;

async function main(args) {
	const options = parseOptions(args);
	if (options.help) {
		console.log(USAGE);
		return;
	}

	const platform = await loadPlatform();
	const monitors = await platform.listMonitors();
	if (monitors.length === 0) {
		throw new Error('No monitors were found.');
	}

	const seed = options.seed ?? randomSeed();
	await mkdir(platform.directory, { recursive: true });
	// macOS and Windows cache wallpapers by path, so every run needs fresh file names.
	const stamp = Date.now();

	const assignments = [];
	const summaries = [];
	for (const [index, monitor] of monitors.entries()) {
		const monitorSeed = index === 0 ? seed : `${seed}:${index}`;
		// Separate streams keep the point layout stable when only --variance, --cellSize or --colors change.
		const pickParam = createRandom(`${monitorSeed}:params`);
		const width = options.width ?? monitor.width;
		const height = options.height ?? monitor.height;
		const variance = options.variance ?? pickParam();
		const cellSize = options.cellSize ?? Math.floor(pickParam() * 200 + 40);
		const palette = options.palette ?? pickPalette(pickParam);

		const image = generate({
			width,
			height,
			cellSize,
			variance,
			colors: palette.colors,
			random: createRandom(`${monitorSeed}:points`),
		});

		const path = join(platform.directory, `wallangle-${stamp}-${index}.png`);
		await writeFile(path, encodePng(image));
		assignments.push({ id: monitor.id, path });
		summaries.push(
			`  Monitor ${index + 1}: ${width}x${height}, variance ${variance.toFixed(3)}, cellSize ${cellSize}, colors ${palette.name}`
		);
	}

	await platform.setWallpapers(assignments);

	const current = new Set(assignments.map(({ path }) => path));
	for (const file of await readdir(platform.directory)) {
		const path = join(platform.directory, file);
		if (FILE_PATTERN.test(file) && !current.has(path)) {
			await rm(path, { force: true });
		}
	}

	console.log(`Wallpaper generated & set with seed ${seed}:\n${summaries.join('\n')}`);
	console.log(`Run again with --seed=${seed} to recreate it.`);
}

main(process.argv.slice(2)).catch((error) => {
	if (error instanceof UsageError) {
		console.error(`${error.message}\n\n${USAGE}`);
		process.exitCode = 2;
	} else {
		console.error(`wallangle: ${error.message}`);
		process.exitCode = 1;
	}
});
