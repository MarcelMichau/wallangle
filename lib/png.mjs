import { crc32, deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(type, data) {
	const typeBuffer = Buffer.from(type, 'latin1');
	const header = Buffer.alloc(4);
	header.writeUInt32BE(data.length);
	const footer = Buffer.alloc(4);
	footer.writeUInt32BE(crc32(data, crc32(typeBuffer)));
	return Buffer.concat([header, typeBuffer, data, footer]);
}

/**
 * Encodes an 8-bit RGB image as a PNG.
 * @param {{ width: number, height: number, data: Uint8Array }} image `data` holds `width * height * 3` bytes.
 * @returns {Buffer}
 */
export function encodePng({ width, height, data }) {
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 2; // colour type: truecolour (RGB)
	ihdr[10] = 0; // compression
	ihdr[11] = 0; // filter method
	ihdr[12] = 0; // no interlacing

	// Every scanline uses the "Sub" filter: flat triangle runs become zeros, which deflate squeezes well.
	const stride = width * 3;
	const raw = Buffer.alloc(height * (stride + 1));
	for (let y = 0; y < height; y++) {
		const src = y * stride;
		const dst = y * (stride + 1);
		raw[dst] = 1;
		for (let x = 0; x < stride; x++) {
			const left = x >= 3 ? data[src + x - 3] : 0;
			raw[dst + 1 + x] = (data[src + x] - left) & 0xff;
		}
	}

	return Buffer.concat([
		SIGNATURE,
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0)),
	]);
}
