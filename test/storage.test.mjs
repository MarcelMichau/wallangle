import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pruneOldRuns, wallpaperPath } from '../lib/storage.mjs';

async function withDirectory(fn) {
	const directory = await mkdtemp(join(tmpdir(), 'wallangle-test-'));
	try {
		await fn(directory);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

test('keeps every monitor of the newest runs and deletes older runs', () =>
	withDirectory(async (directory) => {
		// Run ids deliberately have different digit counts, so a string sort would get them wrong.
		for (const runId of [9, 100, 20, 300]) {
			for (const index of [0, 1]) {
				await writeFile(wallpaperPath(directory, runId, index), '');
			}
		}
		await writeFile(join(directory, 'unrelated.png'), '');

		await pruneOldRuns(directory, 2);

		assert.deepEqual((await readdir(directory)).sort(), [
			'unrelated.png',
			'wallangle-100-0.png',
			'wallangle-100-1.png',
			'wallangle-300-0.png',
			'wallangle-300-1.png',
		]);
	}));

test('keeps everything when there are fewer runs than the limit', () =>
	withDirectory(async (directory) => {
		await writeFile(wallpaperPath(directory, 1, 0), '');
		await pruneOldRuns(directory, 10);
		assert.deepEqual(await readdir(directory), ['wallangle-1-0.png']);
	}));
