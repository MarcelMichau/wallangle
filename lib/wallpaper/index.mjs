import { homedir } from 'node:os';
import { join } from 'node:path';

const platforms = {
	win32: {
		load: () => import('./windows.mjs'),
		directory: () => join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'wallangle'),
	},
	darwin: {
		load: () => import('./macos.mjs'),
		directory: () => join(homedir(), 'Library', 'Application Support', 'wallangle'),
	},
};

/**
 * Loads the wallpaper backend for the current OS.
 * @returns {Promise<{
 *   directory: string,
 *   listMonitors: () => Promise<{ id: string, width: number, height: number }[]>,
 *   setWallpapers: (assignments: { id: string, path: string }[]) => Promise<void>,
 * }>}
 */
export async function loadPlatform(platform = process.platform) {
	const entry = platforms[platform];
	if (!entry) {
		throw new Error(`wallangle supports Windows and macOS; "${platform}" is not supported yet.`);
	}
	const { listMonitors, setWallpapers } = await entry.load();
	return { directory: entry.directory(), listMonitors, setWallpapers };
}
