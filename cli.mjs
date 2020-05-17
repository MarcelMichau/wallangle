#!/usr/bin/env node

import parseArgs from 'minimist';
import Trianglify from 'trianglify';
import wallpaper from 'wallpaper';
import fs from 'fs';

(async () => {
	const parsedArgs = parseArgs(process.argv.slice(2));

	const screenWidth = parsedArgs.width ?? 3840;
	const screenHeight = parsedArgs.height ?? 2160;
	const variance = parsedArgs.variance ?? Math.random();
	const cellSize = parsedArgs.cellSize ?? Math.random() * 200 + 40;
	const seed = parsedArgs.seed ?? null;
	const colors = parsedArgs?.colors.split(',') ?? 'random';

	const pngURI = Trianglify({
		width: screenWidth,
		height: screenHeight,
		cell_size: cellSize,
		x_colors: colors,
		y_colors: 'match_x',
		variance,
		seed,
	}).png();

	const data = pngURI.substr(pngURI.indexOf('base64') + 7);

	const buffer = new Buffer.from(data, 'base64');

	const wallpaperFileName = 'wallpaper.png';

	fs.writeFile(wallpaperFileName, buffer, async () => {
		await wallpaper.set(wallpaperFileName);
		console.log(
			`Wallpaper generated & set with screenWidth: ${screenWidth}, screenHeight: ${screenHeight}, variance: ${variance}, cellSize: ${cellSize}, seed: ${seed} & colors: ${colors.join(
				','
			)}.`
		);
	});
})();
