#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { generate } from './lib/generate.mjs';
import { USAGE, UsageError, parseOptions } from './lib/options.mjs';
import { pickParams } from './lib/params.mjs';
import { encodePng } from './lib/png.mjs';
import { createRandom, randomSeed } from './lib/random.mjs';
import { pruneOldRuns, wallpaperPath } from './lib/storage.mjs';
import { loadPlatform } from './lib/wallpaper/index.mjs';

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
	const runId = Date.now();

	const assignments = [];
	const summaries = [];
	for (const [index, monitor] of monitors.entries()) {
		const monitorSeed = index === 0 ? seed : `${seed}:${index}`;
		const width = options.width ?? monitor.width;
		const height = options.height ?? monitor.height;
		const { variance, cellSize, palette } = pickParams(monitorSeed, options);

		const image = generate({
			width,
			height,
			cellSize,
			variance,
			colors: palette.colors,
			// A separate stream keeps the point layout stable when only --variance, --cellSize or --colors change.
			random: createRandom(`${monitorSeed}:points`),
		});

		const path = wallpaperPath(platform.directory, runId, index);
		await writeFile(path, encodePng(image));
		assignments.push({ id: monitor.id, path });
		summaries.push(
			`  Monitor ${index + 1}: ${width}x${height}, variance ${variance.toFixed(3)}, cellSize ${cellSize}, colors ${palette.name}`
		);
	}

	await platform.setWallpapers(assignments);
	await pruneOldRuns(platform.directory);

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
