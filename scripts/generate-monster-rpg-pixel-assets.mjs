import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetDir = join(root, 'src/games/monster-rpg/client/assets/pixel');

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function png(width, height, draw) {
  const pixels = Buffer.alloc(width * height * 4);
  const api = {
    rect(x, y, w, h, color) {
      for (let py = Math.max(0, y); py < Math.min(height, y + h); py += 1) {
        for (let px = Math.max(0, x); px < Math.min(width, x + w); px += 1) {
          const index = (py * width + px) * 4;
          pixels[index] = color[0];
          pixels[index + 1] = color[1];
          pixels[index + 2] = color[2];
          pixels[index + 3] = color[3] ?? 255;
        }
      }
    },
    checker(x, y, w, h, a, b) {
      for (let py = y; py < y + h; py += 1) {
        for (let px = x; px < x + w; px += 1) {
          api.rect(px, py, 1, 1, (px + py) % 2 === 0 ? a : b);
        }
      }
    }
  };

  draw(api);

  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    scanlines[y * (width * 4 + 1)] = 0;
    pixels.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(scanlines)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function write(name, width, height, draw) {
  mkdirSync(assetDir, { recursive: true });
  writeFileSync(join(assetDir, name), png(width, height, draw));
}

function villageBase(draw, width, height, roof, wall) {
  draw.rect(0, height - 7, width, 5, [40, 73, 44, 255]);
  draw.rect(3, height - 12, width - 6, 8, [120, 159, 80, 255]);
  draw.rect(5, 11, width - 10, height - 18, wall);
  draw.rect(3, 8, width - 6, 6, roof);
  draw.rect(7, height - 16, 5, 5, [255, 244, 173, 255]);
  draw.rect(width - 12, height - 16, 5, 5, [255, 244, 173, 255]);
  draw.rect(Math.floor(width / 2) - 3, height - 11, 6, 8, [92, 58, 39, 255]);
  draw.rect(Math.floor(width / 2) - 1, height - 8, 2, 2, [237, 212, 112, 255]);
}

write('village-small.png', 32, 32, (draw) => {
  villageBase(draw, 32, 32, [163, 84, 62, 255], [230, 196, 112, 255]);
  draw.rect(2, 5, 8, 8, [57, 125, 69, 255]);
  draw.rect(22, 6, 7, 7, [54, 111, 70, 255]);
});

write('village-large.png', 48, 48, (draw) => {
  villageBase(draw, 48, 48, [122, 96, 175, 255], [231, 207, 132, 255]);
  draw.rect(14, 8, 20, 8, [153, 72, 60, 255]);
  draw.rect(6, 23, 7, 7, [255, 244, 173, 255]);
  draw.rect(35, 23, 7, 7, [255, 244, 173, 255]);
  draw.rect(3, 14, 8, 9, [47, 108, 64, 255]);
  draw.rect(37, 13, 8, 9, [42, 96, 59, 255]);
});

const buildings = {
  house: [[157, 88, 66, 255], [232, 198, 135, 255]],
  shop: [[207, 125, 48, 255], [239, 202, 111, 255]],
  clinic: [[214, 236, 240, 255], [235, 111, 111, 255]],
  'post-office': [[78, 124, 188, 255], [226, 208, 141, 255]],
  'town-hall': [[115, 100, 174, 255], [218, 210, 164, 255]],
  tavern: [[130, 79, 52, 255], [222, 170, 96, 255]]
};

for (const [name, [roof, wall]] of Object.entries(buildings)) {
  write(`building-${name}.png`, 72, 72, (draw) => {
    draw.rect(6, 28, 60, 34, wall);
    draw.rect(2, 20, 68, 10, roof);
    draw.rect(9, 17, 54, 8, roof);
    draw.rect(17, 39, 10, 10, [255, 244, 173, 255]);
    draw.rect(45, 39, 10, 10, [255, 244, 173, 255]);
    draw.rect(31, 46, 10, 16, [86, 56, 38, 255]);
    draw.rect(38, 53, 2, 2, [238, 214, 102, 255]);
    draw.rect(0, 63, 72, 5, [54, 73, 50, 210]);
  });
}

write('marker-door.png', 24, 24, (draw) => {
  draw.rect(5, 6, 14, 15, [91, 57, 38, 255]);
  draw.rect(7, 8, 10, 13, [128, 80, 47, 255]);
  draw.rect(15, 14, 2, 2, [237, 212, 112, 255]);
  draw.rect(4, 4, 16, 3, [222, 170, 96, 255]);
});

write('marker-sign.png', 24, 24, (draw) => {
  draw.rect(10, 12, 4, 10, [82, 55, 35, 255]);
  draw.rect(3, 4, 18, 10, [238, 206, 115, 255]);
  draw.rect(5, 6, 14, 2, [112, 82, 45, 255]);
  draw.rect(5, 10, 10, 2, [112, 82, 45, 255]);
});

write('terrain-tree.png', 24, 24, (draw) => {
  draw.rect(10, 13, 5, 9, [99, 67, 40, 255]);
  draw.rect(5, 5, 14, 11, [40, 103, 57, 255]);
  draw.rect(8, 2, 9, 8, [52, 128, 67, 255]);
});

write('terrain-forest.png', 24, 24, (draw) => {
  draw.rect(6, 14, 4, 8, [86, 57, 36, 255]);
  draw.rect(15, 13, 4, 9, [86, 57, 36, 255]);
  draw.rect(2, 7, 12, 10, [31, 82, 48, 255]);
  draw.rect(10, 4, 13, 12, [37, 96, 54, 255]);
});

write('terrain-mountain.png', 24, 24, (draw) => {
  draw.rect(2, 18, 20, 4, [91, 94, 98, 255]);
  draw.rect(5, 13, 14, 5, [121, 124, 128, 255]);
  draw.rect(8, 8, 8, 5, [156, 158, 161, 255]);
  draw.rect(10, 4, 4, 4, [236, 238, 236, 255]);
});

write('terrain-water.png', 16, 16, (draw) => {
  draw.rect(0, 0, 16, 16, [77, 155, 215, 255]);
  draw.rect(2, 4, 10, 2, [181, 228, 255, 190]);
  draw.rect(6, 10, 8, 2, [181, 228, 255, 160]);
});

write('terrain-field.png', 16, 16, (draw) => {
  draw.rect(1, 1, 14, 14, [151, 199, 95, 120]);
  draw.rect(4, 3, 2, 10, [242, 223, 122, 200]);
  draw.rect(10, 2, 2, 11, [242, 223, 122, 180]);
});
