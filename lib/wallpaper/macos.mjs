import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// JavaScript for Automation talks to AppKit directly, which avoids the Automation permission
// prompt that scripting System Events would trigger.
const LIST_MONITORS = `
ObjC.import('AppKit');
function run() {
	const screens = $.NSScreen.screens;
	const monitors = [];
	for (let i = 0; i < screens.count; i++) {
		const screen = screens.objectAtIndex(i);
		// Frames are in points; the backing scale factor converts to physical (e.g. Retina) pixels.
		const scale = screen.backingScaleFactor;
		monitors.push({
			id: String(ObjC.unwrap(screen.deviceDescription.objectForKey('NSScreenNumber'))),
			width: Math.round(screen.frame.size.width * scale),
			height: Math.round(screen.frame.size.height * scale),
		});
	}
	return JSON.stringify(monitors);
}
`;

const SET_WALLPAPERS = `
ObjC.import('AppKit');
function run(argv) {
	const assignments = JSON.parse(argv[0]);
	const screens = $.NSScreen.screens;
	const workspace = $.NSWorkspace.sharedWorkspace;
	for (let i = 0; i < screens.count; i++) {
		const screen = screens.objectAtIndex(i);
		const id = String(ObjC.unwrap(screen.deviceDescription.objectForKey('NSScreenNumber')));
		const assignment = assignments.find((candidate) => candidate.id === id);
		if (!assignment) continue;

		const error = Ref();
		const url = $.NSURL.fileURLWithPath(assignment.path);
		if (!workspace.setDesktopImageURLForScreenOptionsError(url, screen, $({}), error)) {
			throw new Error(ObjC.unwrap(error[0].localizedDescription));
		}
	}
}
`;

async function runJxa(script, args = []) {
	const { stdout } = await execFileAsync('osascript', ['-l', 'JavaScript', '-e', script, ...args]);
	return stdout;
}

/** @returns {Promise<{ id: string, width: number, height: number }[]>} */
export async function listMonitors() {
	return JSON.parse(await runJxa(LIST_MONITORS));
}

/**
 * Only affects the current Space on each monitor; macOS has no public API for the others.
 * @param {{ id: string, path: string }[]} assignments
 */
export async function setWallpapers(assignments) {
	await runJxa(SET_WALLPAPERS, [JSON.stringify(assignments)]);
}
