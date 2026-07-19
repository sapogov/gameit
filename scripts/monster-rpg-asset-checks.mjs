import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = resolve(scriptDirectory, '..');
const expectedManifest = [
  {
    key: 'monster-rpg.licensed.environment.green-tree',
    source: 'vendor/python-monsters/graphics/objects/green_tree.png',
    type: 'image'
  },
  {
    key: 'monster-rpg.licensed.character.player',
    source: 'vendor/python-monsters/graphics/characters/player.png',
    type: 'spritesheet',
    frameWidth: 128,
    frameHeight: 128
  },
  {
    key: 'monster-rpg.licensed.font.pixeloid-sans',
    source: 'vendor/python-monsters/graphics/fonts/PixeloidSans.ttf',
    type: 'font',
    family: 'Pixeloid Sans',
    format: 'truetype',
    style: 'normal',
    weight: '400',
    version: '0.4'
  }
];

const expectedFontHashes = new Map([
  ['fonts/PixeloidSans.ttf', '9afa72c564fd027e826b23375847a25f17fc8e214dd52d10c9fcf3d173e252e9'],
  ['fonts/dogicapixel.otf', '41209b3fb5be11f6a40c9c74c3b769f6089bee5f3047d1f475a7d40281fab5e0'],
  ['fonts/dogicapixelbold.otf', 'abbdb8e28c3128ca6b8eef772b6dc61434659916c05656b6fb6a2f4e230c2708']
]);

export function validateManifestShape(entries) {
  assert.equal(entries.length, expectedManifest.length, 'licensed manifest entry count changed');
  assert.equal(new Set(entries.map((entry) => entry.key)).size, entries.length, 'duplicate licensed asset key');
  assert.deepEqual(entries, expectedManifest, 'licensed frame or font metadata changed');
}

export function validateSourcePaths(entries, assetRoot) {
  const vendorGraphicsRoot = resolve(assetRoot, 'vendor/python-monsters/graphics');
  for (const entry of entries) {
    assert.equal(isAbsolute(entry.source), false, `absolute asset source: ${entry.source}`);
    assert.equal(entry.source.split(/[\\/]/).includes('audio'), false, `audio source is forbidden: ${entry.source}`);
    const source = resolve(assetRoot, entry.source);
    assert.ok(source.startsWith(`${vendorGraphicsRoot}${sep}`), `asset source escapes vendor graphics root: ${entry.source}`);
    assert.ok(existsSync(source) && statSync(source).isFile(), `missing asset source: ${entry.source}`);
    assert.ok(realpathSync(source).startsWith(`${realpathSync(vendorGraphicsRoot)}${sep}`), `asset source resolves outside vendor root: ${entry.source}`);
  }
}

export function assertNoRawVendorPathText(text, sourceName) {
  assert.equal(
    /vendor[\\/]python-monsters|graphics[\\/](?:attacks|backgrounds|characters|fonts|icons|monsters|objects|other|tilesets|ui)/.test(text),
    false,
    `raw vendor path outside asset manifest boundary: ${sourceName}`
  );
}

export function parseInventory(text) {
  const records = text.trim().split('\n').map((line) => {
    const match = /^([a-f0-9]{64})  (graphics\/.+)$/.exec(line);
    assert.ok(match, `invalid SHA256SUMS row: ${line}`);
    assert.equal(match[2].split(/[\\/]/).includes('..'), false, `inventory path traversal: ${match[2]}`);
    assert.equal(match[2].split(/[\\/]/).includes('audio'), false, `audio inventory row: ${match[2]}`);
    return { hash: match[1], path: match[2] };
  });
  assert.equal(new Set(records.map((record) => record.path)).size, records.length, 'duplicate inventory path');
  return records;
}

export function validateMonsterRpgAssets(projectRoot = defaultProjectRoot) {
  const assetRoot = join(projectRoot, 'src/games/monster-rpg/client/assets');
  const vendorRoot = join(assetRoot, 'vendor/python-monsters');
  const graphicsRoot = join(vendorRoot, 'graphics');
  const entries = JSON.parse(readFileSync(join(assetRoot, 'licensedAssetManifest.json'), 'utf8'));
  validateManifestShape(entries);
  validateSourcePaths(entries, assetRoot);
  const runtimeManifestSource = readFileSync(join(assetRoot, 'monsterRpgAssets.ts'), 'utf8');
  const keyBlock = runtimeManifestSource.slice(
    runtimeManifestSource.indexOf('export const monsterRpgAssetKeys'),
    runtimeManifestSource.indexOf('} as const;')
  );
  const runtimeKeys = [...keyBlock.matchAll(/:\s*'(monster-rpg\.[^']+)'/g)].map((match) => match[1]);
  assert.ok(runtimeKeys.length > 0, 'runtime asset key registry is empty');
  assert.equal(new Set(runtimeKeys).size, runtimeKeys.length, 'duplicate runtime asset key');
  for (const required of ['licensedPlayerMetadata.frameHeight', 'licensedPlayerMetadata.frameWidth', 'licensedFontMetadata.family']) {
    assert.ok(runtimeManifestSource.includes(required), `runtime does not consume validated metadata: ${required}`);
  }

  const inventorySource = join(vendorRoot, 'SHA256SUMS');
  assert.equal(sha256(inventorySource), 'fe827e41fac55839822ca4ba35b503962ce43bbb2c5b696b3adb0034f57d023f', 'pinned inventory hash changed');
  const inventory = parseInventory(readFileSync(inventorySource, 'utf8'));
  const actualFiles = walkFiles(graphicsRoot).map((file) => `graphics/${relative(graphicsRoot, file)}`).sort();
  assert.equal(inventory.length, 140, 'pinned graphics inventory must contain 140 files');
  assert.deepEqual(inventory.map((record) => record.path), actualFiles, 'vendor inventory is incomplete or contains extra files');
  validateInventoryAssets(inventory, vendorRoot, graphicsRoot);

  const player = readPngSize(join(graphicsRoot, 'characters/player.png'));
  assert.deepEqual(player, { width: 512, height: 512 }, 'licensed player sheet dimensions changed');
  assert.equal(player.width % 128, 0, 'licensed player frame width is invalid');
  assert.equal(player.height % 128, 0, 'licensed player frame height is invalid');
  validateFontMetadata(graphicsRoot);

  const sourceNotice = readFileSync(join(vendorRoot, 'SOURCE.md'), 'utf8');
  for (const required of [
    '1b15724635ef11e84dd719c6c30240c053348d82',
    '044bc7916305e89fb0e602b6ea82f42e931871ec',
    'Scarloxy',
    'CC BY 4.0',
    'GGBotNet',
    'Roberto Mocci',
    'Excluded: all upstream `audio/**`'
  ]) assert.ok(sourceNotice.includes(required), `missing provenance notice: ${required}`);
  assert.ok(readFileSync(join(vendorRoot, 'OFL-1.1.txt'), 'utf8').includes('SIL OPEN FONT LICENSE Version 1.1'), 'missing full OFL 1.1 text');

  for (const source of walkFiles(join(projectRoot, 'src/games/monster-rpg'))) {
    if (source.startsWith(`${assetRoot}${sep}`) || !['.ts', '.tsx', '.js', '.jsx'].includes(extname(source))) continue;
    assertNoRawVendorPathText(readFileSync(source, 'utf8'), relative(projectRoot, source));
  }
  assert.equal(actualFiles.some((file) => file.split('/').includes('audio')), false, 'audio found in vendor tree');
  console.log(`monster-rpg licensed asset checks passed (${actualFiles.length} pinned files)`);
}

export function validateInventoryAssets(inventory, vendorRoot, graphicsRoot) {
  const canonicalVendorRoot = realpathSync(vendorRoot);
  for (const record of inventory) {
    const source = resolve(vendorRoot, record.path);
    assert.ok(source.startsWith(`${graphicsRoot}${sep}`), `inventory source escapes graphics root: ${record.path}`);
    const details = lstatSync(source);
    assert.ok(details.isFile() && !details.isSymbolicLink(), `inventory source is not a regular file: ${record.path}`);
    assert.ok(realpathSync(source).startsWith(`${canonicalVendorRoot}${sep}`), `inventory source resolves outside vendor root: ${record.path}`);
    assert.equal(sha256(source), record.hash, `vendor hash mismatch: ${record.path}`);
  }
}

function validateFontMetadata(graphicsRoot) {
  const expectations = [
    ['fonts/PixeloidSans.ttf', { 0: '© 2020-2022 GGBotNet', 1: 'Pixeloid Sans', 5: '0.4', 9: 'GGBotNet', 13: 'SIL Open Font License, Version 1.1' }],
    ['fonts/dogicapixel.otf', { 0: 'Roberto Mocci', 1: 'Dogica Pixel', 2: 'Regular', 5: 'Version 001.000', 9: 'Roberto Mocci', 13: 'Reserved Font Name Dogica Pixel' }],
    ['fonts/dogicapixelbold.otf', { 0: 'Roberto Mocci', 1: 'Dogica Pixel', 2: 'Bold', 5: 'Version 001.000', 9: 'Roberto Mocci', 13: 'Reserved Font Name Dogica' }]
  ];
  for (const [path, expected] of expectations) {
    const source = join(graphicsRoot, path);
    assert.equal(sha256(source), expectedFontHashes.get(path), `font hash mismatch: ${path}`);
    const names = readSfntNames(source);
    for (const [id, value] of Object.entries(expected)) {
      assert.ok(names.get(Number(id))?.some((name) => name.includes(value)), `invalid embedded font metadata ${id}: ${path}`);
    }
  }
}

function readSfntNames(source) {
  const buffer = readFileSync(source);
  const tableCount = buffer.readUInt16BE(4);
  let offset = -1;
  for (let index = 0; index < tableCount; index += 1) {
    const record = 12 + index * 16;
    if (buffer.toString('ascii', record, record + 4) === 'name') offset = buffer.readUInt32BE(record + 8);
  }
  assert.ok(offset >= 0, `font has no name table: ${source}`);
  const count = buffer.readUInt16BE(offset + 2);
  const strings = offset + buffer.readUInt16BE(offset + 4);
  const names = new Map();
  for (let index = 0; index < count; index += 1) {
    const record = offset + 6 + index * 12;
    const platform = buffer.readUInt16BE(record);
    const id = buffer.readUInt16BE(record + 6);
    const length = buffer.readUInt16BE(record + 8);
    const start = strings + buffer.readUInt16BE(record + 10);
    const data = buffer.subarray(start, start + length);
    let value = data.toString('latin1');
    if (platform === 0 || platform === 3) {
      value = '';
      for (let cursor = 0; cursor + 1 < data.length; cursor += 2) value += String.fromCharCode(data.readUInt16BE(cursor));
    }
    names.set(id, [...(names.get(id) ?? []), value]);
  }
  return names;
}

function readPngSize(source) {
  const buffer = readFileSync(source);
  assert.equal(buffer.toString('hex', 0, 8), '89504e470d0a1a0a', `invalid PNG: ${source}`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function sha256(source) {
  return createHash('sha256').update(readFileSync(source)).digest('hex');
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const source = join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(source);
    assert.ok(entry.isFile() && !entry.isSymbolicLink(), `vendor tree contains a non-regular file: ${source}`);
    return [source];
  }).sort();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) validateMonsterRpgAssets();
