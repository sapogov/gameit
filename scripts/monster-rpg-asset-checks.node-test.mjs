import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  assertNoRawVendorPathText,
  parseInventory,
  validateInventoryAssets,
  validateManifestShape,
  validateSourcePaths
} from './monster-rpg-asset-checks.mjs';

const validManifest = [
  { key: 'monster-rpg.licensed.environment.green-tree', source: 'vendor/python-monsters/graphics/objects/green_tree.png', type: 'image' },
  { key: 'monster-rpg.licensed.character.player', source: 'vendor/python-monsters/graphics/characters/player.png', type: 'spritesheet', frameWidth: 128, frameHeight: 128 },
  { key: 'monster-rpg.licensed.font.pixeloid-sans', source: 'vendor/python-monsters/graphics/fonts/PixeloidSans.ttf', type: 'font', family: 'Pixeloid Sans', format: 'truetype', style: 'normal', weight: '400', version: '0.4' }
];

describe('Monster RPG licensed asset checks', () => {
  it('rejects duplicate keys', () => {
    assert.throws(() => validateManifestShape([validManifest[0], validManifest[0], validManifest[2]]), /duplicate/);
  });

  it('rejects invalid frame and font metadata', () => {
    assert.throws(() => validateManifestShape(validManifest.map((entry) => entry.type === 'spritesheet' ? { ...entry, frameWidth: 64 } : entry)), /metadata/);
    assert.throws(() => validateManifestShape(validManifest.map((entry) => entry.type === 'font' ? { ...entry, version: '1.0' } : entry)), /metadata/);
  });

  it('rejects missing, escaping, and audio sources', () => {
    const assetRoot = mkdtempSync(join(tmpdir(), 'gameit-assets-'));
    mkdirSync(join(assetRoot, 'vendor/python-monsters/graphics'), { recursive: true });
    assert.throws(() => validateSourcePaths(validManifest, assetRoot), /missing/);
    assert.throws(() => validateSourcePaths([{ ...validManifest[0], source: '../outside.png' }], assetRoot), /escapes/);
    assert.throws(() => validateSourcePaths([{ ...validManifest[0], source: 'vendor/python-monsters/graphics/audio/theme.ogg' }], assetRoot), /audio/);
  });

  it('rejects malformed, duplicate, and audio inventory rows', () => {
    const hash = 'a'.repeat(64);
    assert.throws(() => parseInventory('bad'), /invalid/);
    assert.throws(() => parseInventory(`${hash}  graphics/ui/a.png\n${hash}  graphics/ui/a.png`), /duplicate/);
    assert.throws(() => parseInventory(`${hash}  graphics/audio/a.ogg`), /audio/);
  });

  it('rejects inventory symlinks even when their bytes match', () => {
    const root = mkdtempSync(join(tmpdir(), 'gameit-assets-'));
    const vendorRoot = join(root, 'vendor/python-monsters');
    const graphicsRoot = join(vendorRoot, 'graphics');
    const outside = join(root, 'outside.png');
    const internal = join(graphicsRoot, 'objects/real.png');
    const externalLink = join(graphicsRoot, 'objects/external.png');
    const internalLink = join(graphicsRoot, 'objects/internal.png');
    const hash = 'c0535e4be2b79ffd93291305436bf889314e4a3faec05ecffcbb7df31ad9e51a';
    mkdirSync(join(graphicsRoot, 'objects'), { recursive: true });
    writeFileSync(outside, 'Hello world!');
    writeFileSync(internal, 'Hello world!');
    symlinkSync(outside, externalLink);
    symlinkSync(internal, internalLink);

    assert.throws(
      () => validateInventoryAssets([{ hash, path: 'graphics/objects/external.png' }], vendorRoot, graphicsRoot),
      /not a regular file/
    );
    assert.throws(
      () => validateInventoryAssets([{ hash, path: 'graphics/objects/internal.png' }], vendorRoot, graphicsRoot),
      /not a regular file/
    );
  });

  it('rejects raw vendor paths outside the manifest boundary', () => {
    assert.throws(() => assertNoRawVendorPathText("const source = 'vendor/python-monsters/graphics/ui/star.png'", 'scene.ts'), /raw vendor path/);
    assert.doesNotThrow(() => assertNoRawVendorPathText('const key = monsterRpgAssetKeys.licensedCharacterPlayer', 'scene.ts'));
  });
});
