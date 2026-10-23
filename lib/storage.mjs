import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const FILE_PATTERN = /^wallangle-(\d+)-\d+\.png$/;

/**
 * How many runs' wallpapers to keep. Older wallpapers can still be in use (macOS only updates the
 * current Space, so other Spaces keep pointing at earlier files), and a run that overlaps with
 * this one must not lose its files before it applies them.
 */
export const KEEP_RUNS = 10;

/** Run ids sort chronologically, and every file name is unique, so the OS never shows a cached image. */
export function wallpaperPath(directory, runId, index) {
	return join(directory, `wallangle-${runId}-${index}.png`);
}

/** Deletes wallpapers from all but the newest `keepRuns` runs. */
export async function pruneOldRuns(directory, keepRuns = KEEP_RUNS) {
	const files = (await readdir(directory))
		.map((file) => ({ file, runId: Number(FILE_PATTERN.exec(file)?.[1]) }))
		.filter(({ runId }) => Number.isFinite(runId));

	const keep = new Set(
		[...new Set(files.map(({ runId }) => runId))].sort((a, b) => b - a).slice(0, keepRuns)
	);
	for (const { file, runId } of files) {
		if (!keep.has(runId)) {
			await rm(join(directory, file), { force: true });
		}
	}
}
