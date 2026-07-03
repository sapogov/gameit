import { deflateSync, inflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const approvalDir = join(root, 'docs/monster-rpg/art-approval');
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

function readPng(path) {
  const file = readFileSync(path);
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];

  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    const data = file.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`Unsupported PNG color type ${colorType} in ${path}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  let sourceOffset = 0;
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[sourceOffset];
    sourceOffset += 1;
    const line = Buffer.from(raw.subarray(sourceOffset, sourceOffset + stride));
    sourceOffset += stride;
    unfilterLine(line, previous, channels, filter);

    for (let x = 0; x < width; x += 1) {
      const source = x * channels;
      const target = (y * width + x) * 4;
      pixels[target] = line[source];
      pixels[target + 1] = line[source + 1];
      pixels[target + 2] = line[source + 2];
      pixels[target + 3] = channels === 4 ? line[source + 3] : 255;
    }

    previous = line;
  }

  return { width, height, pixels };
}

function unfilterLine(line, previous, bytesPerPixel, filter) {
  for (let i = 0; i < line.length; i += 1) {
    const left = i >= bytesPerPixel ? line[i - bytesPerPixel] : 0;
    const up = previous[i] ?? 0;
    const upLeft = i >= bytesPerPixel ? (previous[i - bytesPerPixel] ?? 0) : 0;

    if (filter === 1) line[i] = (line[i] + left) & 0xff;
    else if (filter === 2) line[i] = (line[i] + up) & 0xff;
    else if (filter === 3) line[i] = (line[i] + Math.floor((left + up) / 2)) & 0xff;
    else if (filter === 4) line[i] = (line[i] + paeth(left, up, upLeft)) & 0xff;
    else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
  }
}

function paeth(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}

function writePng(path, image) {
  const scanlines = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    scanlines[y * (image.width * 4 + 1)] = 0;
    image.pixels.copy(scanlines, y * (image.width * 4 + 1) + 1, y * image.width * 4, (y + 1) * image.width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(scanlines)),
      chunk('IEND', Buffer.alloc(0))
    ])
  );
}

function crop(image, x, y, width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let cy = 0; cy < height; cy += 1) {
    for (let cx = 0; cx < width; cx += 1) {
      const sx = Math.max(0, Math.min(image.width - 1, x + cx));
      const sy = Math.max(0, Math.min(image.height - 1, y + cy));
      image.pixels.copy(pixels, (cy * width + cx) * 4, (sy * image.width + sx) * 4, (sy * image.width + sx) * 4 + 4);
    }
  }
  return { width, height, pixels };
}

function resizeNearest(image, width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(image.width - 1, Math.floor((x / width) * image.width));
      const sy = Math.min(image.height - 1, Math.floor((y / height) * image.height));
      image.pixels.copy(pixels, (y * width + x) * 4, (sy * image.width + sx) * 4, (sy * image.width + sx) * 4 + 4);
    }
  }
  return { width, height, pixels };
}

function removeLightBackground(image) {
  for (let index = 0; index < image.pixels.length; index += 4) {
    const r = image.pixels[index];
    const g = image.pixels[index + 1];
    const b = image.pixels[index + 2];
    if (r > 224 && g > 220 && b > 208) image.pixels[index + 3] = 0;
  }
}

function trimToContent(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.pixels[(y * image.width + x) * 4 + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return image;
  const padding = 4;
  return crop(
    image,
    Math.max(0, minX - padding),
    Math.max(0, minY - padding),
    Math.min(image.width - minX + padding, maxX - minX + 1 + padding * 2),
    Math.min(image.height - minY + padding, maxY - minY + 1 + padding * 2)
  );
}

function placeBottomCenter(source, size) {
  const scale = Math.min((size - 8) / source.width, (size - 6) / source.height);
  const scaled = resizeNearest(source, Math.max(1, Math.floor(source.width * scale)), Math.max(1, Math.floor(source.height * scale)));
  const target = { width: size, height: size, pixels: Buffer.alloc(size * size * 4) };
  const offsetX = Math.floor((size - scaled.width) / 2);
  const offsetY = Math.max(0, size - scaled.height - 2);

  for (let y = 0; y < scaled.height; y += 1) {
    for (let x = 0; x < scaled.width; x += 1) {
      const src = (y * scaled.width + x) * 4;
      const dst = ((offsetY + y) * size + offsetX + x) * 4;
      scaled.pixels.copy(target.pixels, dst, src, src + 4);
    }
  }

  return target;
}

function stitchFrames(frames, columns, rows, frameSize) {
  const sheet = { width: columns * frameSize, height: rows * frameSize, pixels: Buffer.alloc(columns * rows * frameSize * frameSize * 4) };
  frames.forEach((frame, index) => {
    const ox = (index % columns) * frameSize;
    const oy = Math.floor(index / columns) * frameSize;
    for (let y = 0; y < frameSize; y += 1) {
      for (let x = 0; x < frameSize; x += 1) {
        const src = (y * frameSize + x) * 4;
        const dst = ((oy + y) * sheet.width + ox + x) * 4;
        frame.pixels.copy(sheet.pixels, dst, src, src + 4);
      }
    }
  });
  return sheet;
}

function blank(width, height, color = [0, 0, 0, 0]) {
  const image = { width, height, pixels: Buffer.alloc(width * height * 4) };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) setPixel(image, x, y, color);
  }
  return image;
}

function setPixel(image, x, y, color) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const index = (y * image.width + x) * 4;
  image.pixels[index] = color[0];
  image.pixels[index + 1] = color[1];
  image.pixels[index + 2] = color[2];
  image.pixels[index + 3] = color[3] ?? 255;
}

function fillRect(image, x, y, width, height, color) {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) setPixel(image, px, py, color);
  }
}

function addNoise(image, base, alternate, modulo) {
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      setPixel(image, x, y, (x * 17 + y * 31) % modulo === 0 ? alternate : base);
    }
  }
}

function drawTuft(image, x, y, color) {
  setPixel(image, x, y, color);
  setPixel(image, x - 1, y + 1, color);
  setPixel(image, x, y + 1, color);
  setPixel(image, x + 1, y + 1, color);
  setPixel(image, x, y + 2, color);
}

function drawStone(image, x, y, color, highlight) {
  fillRect(image, x, y + 1, 5, 3, color);
  fillRect(image, x + 1, y, 3, 1, highlight);
  setPixel(image, x + 4, y + 2, [80, 88, 82, 255]);
}

function generateTerrainVariants() {
  const grassVariants = [
    ['terrain-grass-1.png', [[11, 14], [38, 36], [53, 20]], [[32, 48], [48, 12]]],
    ['terrain-grass-2.png', [[18, 45], [42, 22], [51, 48]], [[13, 25], [47, 38]]],
    ['terrain-grass-3.png', [[8, 30], [28, 18], [55, 34]], [[22, 46], [44, 11]]]
  ];

  grassVariants.forEach(([fileName, tufts, flowers]) => {
    const image = blank(64, 64);
    addNoise(image, [108, 177, 94, 255], [126, 193, 101, 255], 7);
    tufts.forEach(([x, y]) => drawTuft(image, x, y, [47, 117, 59, 255]));
    flowers.forEach(([x, y]) => {
      setPixel(image, x, y, [245, 224, 92, 255]);
      setPixel(image, x + 1, y, [255, 244, 173, 255]);
    });
    writePng(join(assetDir, fileName), image);
  });

  const fieldVariants = [
    ['terrain-field-ai-1.png', [242, 219, 97, 255], 'vertical'],
    ['terrain-field-ai-2.png', [220, 174, 78, 255], 'horizontal'],
    ['terrain-field-ai-3.png', [132, 178, 80, 255], 'patch']
  ];

  fieldVariants.forEach(([fileName, cropColor, mode]) => {
    const image = blank(64, 64);
    addNoise(image, [130, 177, 83, 255], [151, 199, 95, 255], 9);
    if (mode === 'vertical') {
      for (let x = 10; x < 64; x += 14) fillRect(image, x, 5, 4, 54, cropColor);
    } else if (mode === 'horizontal') {
      for (let y = 9; y < 64; y += 13) fillRect(image, 4, y, 56, 4, cropColor);
    } else {
      fillRect(image, 10, 8, 18, 21, cropColor);
      fillRect(image, 34, 30, 20, 20, cropColor);
      drawTuft(image, 30, 18, [47, 117, 59, 255]);
      drawTuft(image, 17, 42, [47, 117, 59, 255]);
    }
    writePng(join(assetDir, fileName), image);
  });

  const forestVariants = [
    ['terrain-forest-ai-1.png', [[9, 29], [28, 17], [44, 31]]],
    ['terrain-forest-ai-2.png', [[16, 37], [36, 22], [50, 42]]],
    ['terrain-forest-ai-3.png', [[8, 38], [24, 24], [40, 20], [52, 36]]]
  ];

  forestVariants.forEach(([fileName, trees]) => {
    const image = blank(64, 64);
    addNoise(image, [41, 101, 55, 255], [57, 125, 69, 255], 8);
    trees.forEach(([x, y]) => {
      fillRect(image, x + 5, y + 15, 5, 13, [91, 57, 36, 255]);
      fillRect(image, x, y + 7, 16, 13, [30, 86, 48, 255]);
      fillRect(image, x + 3, y, 11, 11, [50, 127, 67, 255]);
      fillRect(image, x + 6, y + 3, 4, 4, [88, 153, 77, 255]);
    });
    writePng(join(assetDir, fileName), image);
  });

  const treeVariants = [
    ['terrain-tree-ai-1.png', [28, 10], [42, 108, 60, 255]],
    ['terrain-tree-ai-2.png', [18, 18], [57, 129, 66, 255]]
  ];

  treeVariants.forEach(([fileName, origin, leafColor]) => {
    const image = blank(64, 64);
    addNoise(image, [108, 177, 94, 255], [126, 193, 101, 255], 10);
    const [x, y] = origin;
    fillRect(image, x + 8, y + 27, 8, 24, [99, 67, 40, 255]);
    fillRect(image, x, y + 12, 26, 20, leafColor);
    fillRect(image, x + 5, y, 18, 17, [66, 145, 72, 255]);
    fillRect(image, x + 9, y + 6, 7, 7, [106, 172, 82, 255]);
    writePng(join(assetDir, fileName), image);
  });

  const mountainVariants = [
    ['terrain-mountain-ai-1.png', [[4, 43], [16, 28], [29, 11]]],
    ['terrain-mountain-ai-2.png', [[7, 46], [24, 22], [40, 34]]]
  ];

  mountainVariants.forEach(([fileName, peaks]) => {
    const image = blank(64, 64);
    addNoise(image, [103, 139, 82, 255], [91, 124, 75, 255], 10);
    peaks.forEach(([x, y]) => {
      fillRect(image, x, y + 28, 24, 8, [86, 89, 94, 255]);
      fillRect(image, x + 4, y + 18, 16, 11, [122, 126, 130, 255]);
      fillRect(image, x + 8, y + 9, 9, 10, [160, 163, 166, 255]);
      fillRect(image, x + 10, y + 3, 5, 6, [236, 238, 236, 255]);
    });
    drawStone(image, 48, 49, [99, 105, 103, 255], [151, 158, 152, 255]);
    writePng(join(assetDir, fileName), image);
  });
}

function sliceCreatureSheet() {
  const source = readPng(join(approvalDir, 'creature-animation-sheet-v2.png'));
  const columns = 4;
  const rows = 6;
  const frames = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = Math.round((column * source.width) / columns) + 6;
      const y = Math.round((row * source.height) / rows) + 6;
      const width = Math.round(source.width / columns) - 12;
      const height = Math.round(source.height / rows) - 12;
      const cell = crop(source, x, y, width, height);
      removeLightBackground(cell);
      frames.push(placeBottomCenter(trimToContent(cell), 64));
    }
  }

  writePng(join(assetDir, 'creature-encounters.png'), stitchFrames(frames, columns, rows, 64));
}

function sliceTerrainSheet() {
  const source = readPng(join(approvalDir, 'road-water-tiles-v2.png'));
  const cells = [
    ['terrain-road-horizontal.png', 0, 0],
    ['terrain-road-vertical.png', 1, 0],
    ['terrain-road-end.png', 2, 0],
    ['terrain-road-curve.png', 3, 0],
    ['terrain-water-ai-1.png', 0, 1],
    ['terrain-water-ai-2.png', 1, 1],
    ['terrain-shoreline.png', 2, 1],
    ['terrain-bridge-water.png', 3, 1]
  ];

  cells.forEach(([fileName, column, row]) => {
    const x = Math.round((column * source.width) / 4) + 24;
    const y = Math.round((row * source.height) / 2) + 24;
    const size = Math.min(Math.round(source.width / 4), Math.round(source.height / 2)) - 48;
    writePng(join(assetDir, fileName), resizeNearest(crop(source, x, y, size, size), 64, 64));
  });
}

mkdirSync(assetDir, { recursive: true });
sliceCreatureSheet();
sliceTerrainSheet();
generateTerrainVariants();
