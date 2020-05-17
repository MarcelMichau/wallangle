#!/usr/bin/env node

import parseArgs from 'minimist';
import Trianglify from 'trianglify';
import wallpaper from 'wallpaper';
import fs from 'fs';

(async () => {
	const screenWidth = parseArgs(process.argv.slice(2)).width || 3840;
	const screenHeight = parseArgs(process.argv.slice(2)).height || 2160;
	const variance = parseArgs(process.argv.slice(2)).variance || Math.random();
	const cellSize =
		parseArgs(process.argv.slice(2)).cellSize || Math.random() * 200 + 40;

	const pngURI = Trianglify({
		width: screenWidth,
		height: screenHeight,
		cell_size: cellSize,
		x_colors: 'random',
		variance,
	}).png();

	const data = pngURI.substr(pngURI.indexOf('base64') + 7);

	const buffer = new Buffer.from(data, 'base64');

	const wallpaperFile = 'wallpaper.png';

	fs.writeFile(wallpaperFile, buffer, async () => {
		await wallpaper.set(wallpaperFile);
		console.log(
			`Wallpaper generated & set with screenWidth: ${screenWidth}, screenHeight: ${screenHeight}, variance: ${variance} & cellSize: ${cellSize}.`
		);
	});
})();
