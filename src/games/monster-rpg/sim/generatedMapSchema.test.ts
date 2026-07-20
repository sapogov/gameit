import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canonicalPinnedSourceLocation, convertMapSet, convertTmx, readSourceWithinRoot, readTmxWithinRoot, serializeMapSetModule, TmxConversionError } from '../../../../scripts/convert-monster-rpg-tmx';
import { findSquareGridPath, generatedMapRegistry, generatedTracerMapSet, loadMapSet, moveOnSquareGrid, toSquareGridMap, validateGeneratedMapSet } from './index';

const fixtureRoot = new URL('../../../../scripts/fixtures/python-monsters', import.meta.url).pathname;
const convertPinnedPair = () => convertMapSet([
  { ...readSourceWithinRoot(fixtureRoot, 'maps/water.tmx', 'tracer-water-town', 'Water Town Tracer'), location: canonicalPinnedSourceLocation('maps/water.tmx') },
  { ...readSourceWithinRoot(fixtureRoot, 'maps/world.tmx', 'tracer-world-route', 'World Route Tracer', ['house', 'hospital', 'fire', 'plant', 'hospital2']), location: canonicalPinnedSourceLocation('maps/world.tmx') }
]);

describe('generated map set v1', () => {
  it('is byte-identical to a rerun from the pinned official CSV fixtures', () => {
    expect(canonicalPinnedSourceLocation('maps/water.tmx')).toBe('data/maps/water.tmx');
    const rerun = convertPinnedPair();
    expect(rerun.maps.map(({ width, height }) => [width, height])).toEqual([[24, 34], [86, 86]]);
    expect(rerun.maps[0].terrainLayers).toHaveLength(2);
    expect(rerun.maps[1].terrain[0][0]).toBe(195);
    expect(rerun.maps[0].objects[0].id).toBe('tracer-water-town-entities-855');
    expect(rerun.maps[0].collisions.length).toBeGreaterThan(10);
    expect(rerun.maps[0].collisions[0].id).toBe('tracer-water-town-collisions-861');
    expect(JSON.stringify(rerun.maps.flatMap((map) => map.encounters))).not.toMatch(/"(monsters|biome|level)"/);
    expect(rerun.maps[0].metadata.tilesets).toContain('../tilesets/world.tsx');
    expect(serializeMapSetModule(rerun)).toBe(readFileSync(new URL('./generatedMapArtifact.ts', import.meta.url), 'utf8'));
  });
  it('loads atomically, validates reciprocal references, and drives square movement/pathfinding', () => {
    expect(validateGeneratedMapSet(generatedTracerMapSet)).toEqual([]);
    expect(loadMapSet({ schemaVersion: 1, maps: [{}] })).toMatchObject({ ok: false });
    expect(loadMapSet({ ...generatedTracerMapSet, maps: [{ ...generatedTracerMapSet.maps[0], blocked: [['no']] }] })).toMatchObject({ ok: false });
    const withCollision = (collision: unknown) => loadMapSet({ ...generatedTracerMapSet, maps: [{ ...generatedTracerMapSet.maps[0], collisions: [collision] }, generatedTracerMapSet.maps[1]] });
    const collision = generatedTracerMapSet.maps[0].collisions[0];
    const { properties: _properties, ...withoutProperties } = collision;
    expect(withCollision(withoutProperties)).toMatchObject({ ok: false });
    expect(withCollision({ ...collision, geometry: { ...collision.geometry, x: Number.NaN } })).toMatchObject({ ok: false });
    expect(withCollision({ ...collision, geometry: { kind: 'rect', x: 0, y: 0, width: 0, height: 1 } })).toMatchObject({ ok: false });
    expect(withCollision({ ...collision, geometry: { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] } })).toMatchObject({ ok: false });
    expect(withCollision({ ...collision, geometry: { kind: 'polyline', x: 0, y: 0, points: [{ x: 0, y: 0 }, { x: Number.POSITIVE_INFINITY, y: 1 }] } })).toMatchObject({ ok: false });
    expect(withCollision({ ...collision, properties: { bad: {} } })).toMatchObject({ ok: false });
    expect(validateGeneratedMapSet({ ...generatedTracerMapSet, maps: [{ ...generatedTracerMapSet.maps[0], exits: generatedTracerMapSet.maps[0].exits.map((exit) => ({ ...exit, toExitId: 'wrong-id' })) }, generatedTracerMapSet.maps[1]] })).toContainEqual(expect.stringContaining('exact reciprocal'));
    const town = generatedMapRegistry.require('tracer-water-town'); const route = generatedMapRegistry.require('tracer-world-route'); const grid = toSquareGridMap(route);
    expect(town.exits[0].toMapId).toBe('tracer-world-route');
    expect(route.collisions).not.toHaveLength(0);
    expect(route.blocked.flat()).not.toContain(true);
    expect(moveOnSquareGrid(grid, 0, 0, 'east')).toEqual({ x: 1, y: 0, moved: true });
    expect(findSquareGridPath(grid, { x: 0, y: 0 }, { x: 1, y: 0 })).toEqual(['east']);
    expect(grid.isBlocked(-1, 0)).toBe(true);
  });
  it('fails closed for unsafe/unsupported input and tolerates explicit editor-only groups', () => {
    const base = (extra: string, data = '<data encoding="csv">1</data>') => `<?xml version="1.0" encoding="UTF-8"?><map width="1" height="1" tilewidth="64">${data}${extra}</map>`;
    const source = (xml: string) => ({ location: 'fixture.tmx', xml, id: 'fixture-map', name: 'Fixture', tilesets: {} });
    expect(() => convertTmx(source(`<!DOCTYPE map>${base('')}`))).toThrow(TmxConversionError);
    expect(() => convertTmx(source(base('', '<data encoding="base64">AAAA</data>')))).toThrow('only uncompressed CSV');
    expect(() => convertTmx(source(base('', '<data encoding="csv" compression="gzip">1</data>')))).toThrow('only uncompressed CSV');
    expect(() => convertTmx(source(base('<objectgroup name="Entities"><object id="1" name="Player"><properties><property name="__proto__" value="bad"/></properties></object></objectgroup>')))).toThrow('dangerous property key');
    expect(() => convertTmx(source(base('<objectgroup name="GameplayMystery"><object id="1"/></objectgroup>')))).toThrow('unknown gameplay group');
    expect(() => convertTmx(source(base('<objectgroup name="Entities"><object id="1" name="Merchant"/></objectgroup>')))).toThrow('unknown gameplay object kind');
    for (const uri of ['file:///etc/passwd', 'ftp://example.test/map', 'data:text/plain,x', 'javascript:alert(1)', 'ws://example.test/socket', 'custom+scheme:payload']) {
      expect(() => convertTmx(source(base(`<objectgroup name="Entities"><object id="1" name="Player"><properties><property name="pos" value="${uri}"/></properties></object></objectgroup>`)))).toThrow('URLs');
      expect(() => convertTmx(source(base(`<note>${uri}</note>`)))).toThrow('URLs');
    }
    expect(convertTmx(source(base('<objectgroup xmlns:editor="https://editor.example/schema" name="Objects"/>'))).objects).toEqual([]);
    for (const attributes of ['x="NaN"', 'y="Infinity"', 'width="NaN"', 'height="-Infinity"']) {
      expect(() => convertTmx(source(base(`<objectgroup name="Entities"><object id="1" name="Player" ${attributes}/></objectgroup>`)))).toThrow('non-finite geometry');
    }
    for (const points of ['NaN,0 1,0 1,1', '0,Infinity 1,0 1,1']) {
      expect(() => convertTmx(source(base(`<objectgroup name="Collisions"><object id="1"><polygon points="${points}"/></object></objectgroup>`)))).toThrow('non-finite geometry');
    }
    expect(() => convertTmx(source(base('<objectgroup name="Collisions"><object id="1" width="0" height="1"/></object></objectgroup>')))).toThrow('positive dimensions');
    expect(() => convertTmx(source(base('<objectgroup name="Collisions"><object id="1" width="1" height="-1"><ellipse/></object></objectgroup>')))).toThrow('positive dimensions');
    expect(() => convertTmx(source(base('<objectgroup name="Collisions"><object id="1"><polygon points="0,0 1,0"/></object></objectgroup>')))).toThrow('at least 3 points');
    expect(() => convertTmx(source(base('<objectgroup name="Collisions"><object id="1"><polyline points="0,0"/></object></objectgroup>')))).toThrow('at least 2 points');
    expect(convertTmx(source(base('<objectgroup name="Entities"><object id="1" name="Player" width="0" height="0"/></object></objectgroup>'))).triggers).toHaveLength(1);
    expect(convertTmx(source(base('<objectgroup name="Objects"/><objectgroup name="Coast"/>'))).objects).toEqual([]);
    expect(() => readTmxWithinRoot(new URL('../../../../scripts/fixtures/python-monsters', import.meta.url).pathname, '../package.json')).toThrow('root-relative');
    expect(() => readSourceWithinRoot(fixtureRoot, 'maps/missing-tsx.tmx', 'bad-map', 'Bad Map')).toThrow('unable to read TSX reference');
    expect(() => readSourceWithinRoot(fixtureRoot, 'maps/escape-tsx.tmx', 'bad-map', 'Bad Map')).toThrow('escapes root');
    expect(() => readSourceWithinRoot(fixtureRoot, 'maps/absolute-tsx.tmx', 'bad-map', 'Bad Map')).toThrow('invalid TSX reference');
    for (const input of ['maps/missing-top-level.tmx', 'maps']) {
      let message = '';
      try { readTmxWithinRoot(fixtureRoot, input); } catch (error) { message = (error as Error).message; }
      expect(message).toContain(input);
      expect(message).not.toContain(fixtureRoot);
      expect(message).not.toMatch(/\/(?:private|Users)\//);
    }
    const wideLayers = Array.from({ length: 51 }, () => '<layer><data encoding="csv">' + Array(40_000).fill(1).join(',') + '</data></layer>').join('');
    expect(() => convertTmx(source(`<?xml version="1.0"?><map width="40000" height="1" tilewidth="64">${wideLayers}</map>`))).toThrow('aggregate layer/cell limit');
    const mapXml = (target: string, pos: string, spawn: string) => base(`<objectgroup name="Entities"><object id="1" name="Player" x="0" y="0"><properties><property name="pos" value="${spawn}"/></properties></object></objectgroup><objectgroup name="Transition"><object id="2" x="0" y="0"><properties><property name="target" value="${target}"/><property name="pos" value="${pos}"/></properties></object></objectgroup>`);
    expect(() => convertMapSet([{ ...source(mapXml('missing', 'b', 'a')), location: 'a.tmx', id: 'a-map' }, { ...source(mapXml('a', 'a', 'b')), location: 'b.tmx', id: 'b-map' }])).toThrow('unknown exit target');
    expect(() => convertMapSet([{ ...source(mapXml('b', 'missing', 'a')), location: 'a.tmx', id: 'a-map' }, { ...source(mapXml('a', 'a', 'b')), location: 'b.tmx', id: 'b-map' }])).toThrow('unknown exit position');
    const polygon = convertTmx(source(base('<objectgroup name="Collisions"><object id="9"><polygon points="0,0 64,0 64,64"/></object></objectgroup>')));
    expect(polygon.collisions[0]).toMatchObject({ id: 'fixture-map-collisions-9', geometry: { kind: 'polygon' } }); expect(polygon.blocked[0][0]).toBe(false);
  });
});
