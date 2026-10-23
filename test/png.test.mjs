import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crc32, inflateSync } from 'node:zlib';
import { encodePng } from '../lib/png.mjs';

function readChunks(png) {
	const chunks = [];
	for (let offset = 8; offset < png.length; ) {
		const length = png.readUInt32BE(offset);
		const type = png.toString('latin1', offset + 4, offset + 8);
		const data = png.subarray(offset + 8, offset + 8 + length);
		const crc = png.readUInt32BE(offset + 8 + length);
		assert.equal(crc, crc32(data, crc32(Buffer.from(type, 'latin1'))), `${type} CRC`);
		chunks.push({ type, data });
		offset += 12 + length;
	}
	return chunks;
}

test('encodes RGB pixels that decode back to the input', () => {
	const width = 5;
	const height = 3;
	const data = Uint8Array.from({ length: width * height * 3 }, (_, i) => (i * 37) % 256);
	const png = encodePng({ width, height, data });

	assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const chunks = readChunks(png);
	assert.deepEqual(chunks.map(({ type }) => type), ['IHDR', 'IDAT', 'IEND']);

	const ihdr = chunks[0].data;
	assert.equal(ihdr.readUInt32BE(0), width);
	assert.equal(ihdr.readUInt32BE(4), height);
	assert.deepEqual([...ihdr.subarray(8)], [8, 2, 0, 0, 0]);

	// Undo the Sub filter.
	const raw = inflateSync(chunks[1].data);
	const stride = width * 3;
	const decoded = new Uint8Array(width * height * 3);
	for (let y = 0; y < height; y++) {
		assert.equal(raw[y * (stride + 1)], 1);
		for (let x = 0; x < stride; x++) {
			const left = x >= 3 ? decoded[y * stride + x - 3] : 0;
			decoded[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + left) & 0xff;
		}
	}
	assert.deepEqual(decoded, data);
});
