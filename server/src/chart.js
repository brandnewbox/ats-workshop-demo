import { deflateSync, crc32 } from 'node:zlib';

const WIDTH = 240;
const HEIGHT = 150;
const COLOURS = {
  background: [255, 255, 255],
  axis: [73, 80, 87],
  correct: [25, 135, 84],
  incorrect: [176, 42, 55],
};

// A small bar chart (correct and incorrect answers) as a PNG, with no dependencies.
export function resultChartPng(correct, total) {
  const pixels = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => COLOURS.background));
  const fill = (x0, y0, x1, y1, colour) => {
    for (let y = Math.max(0, y0); y < Math.min(HEIGHT, y1); y++) {
      for (let x = Math.max(0, x0); x < Math.min(WIDTH, x1); x++) pixels[y][x] = colour;
    }
  };
  const base = HEIGHT - 20;
  const barHeight = (n) => (total === 0 ? 0 : Math.round((n / total) * (base - 10)));
  fill(30, base - barHeight(correct), 100, base, COLOURS.correct);
  fill(140, base - barHeight(total - correct), 210, base, COLOURS.incorrect);
  fill(20, base, 220, base + 2, COLOURS.axis);
  fill(20, 10, 22, base, COLOURS.axis);
  return encodePng(pixels);
}

function encodePng(pixels) {
  const raw = Buffer.alloc(HEIGHT * (WIDTH * 3 + 1));
  let offset = 0;
  for (const row of pixels) {
    raw[offset++] = 0;
    for (const [r, g, b] of row) {
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
