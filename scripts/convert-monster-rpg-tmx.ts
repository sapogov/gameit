import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { GeneratedCollisionV1, GeneratedEncounterV1, GeneratedGeometry, GeneratedMapSetV1, GeneratedMapV1, GeneratedNpcV1, GeneratedSpawnV1 } from '../src/games/monster-rpg/sim/generatedMapSchema';

export const TMX_LIMITS = { xmlBytes: 16 * 1024 * 1024, decodedCells: 2_000_000, layers: 64, objects: 50_000, points: 4096, propertyBytes: 8 * 1024 } as const;
const forbidden = /<!DOCTYPE|<!ENTITY|<xi:include|<\/?[^>]*:include/i;
const uriScheme = /^[a-z][a-z0-9+.-]*:/i;
const safeGroups = new Set(['Entities', 'Monsters', 'Collisions', 'Transition', 'Objects', 'Coast', 'Water']);
export type Source = { location: string; xml: string; id: string; name: string; tilesets: Readonly<Record<string, string>>; ignoredExitTargets?: readonly string[] };

export class TmxConversionError extends Error { constructor(message: string) { super(message); this.name = 'TmxConversionError'; } }
function rootRealpath(root: string): string {
  try { return realpathSync(root); } catch { throw new TmxConversionError('Unable to access configured TMX root'); }
}
function validateTmxInput(input: string): void {
  if (!input || input.includes('\0') || input.includes('..') || input.startsWith('/') || /^[A-Za-z]:/.test(input)) throw new TmxConversionError('TMX path must be root-relative');
}
export function readTmxWithinRoot(root: string, input: string): string {
  validateTmxInput(input);
  const rootReal = rootRealpath(root); const candidate = resolve(rootReal, input); let real: string; let xml: string;
  try { real = realpathSync(candidate); if (!real.startsWith(`${rootReal}${sep}`) || lstatSync(candidate).isSymbolicLink()) throw new TmxConversionError('TMX path escapes configured root or is a symlink'); xml = readFileSync(real, 'utf8'); }
  catch (error) { if (error instanceof TmxConversionError) throw error; throw new TmxConversionError(`${input}: unable to read TMX input`); }
  if (Buffer.byteLength(xml) > TMX_LIMITS.xmlBytes) throw new TmxConversionError('TMX exceeds 16 MiB limit');
  return xml;
}
export function readSourceWithinRoot(root: string, input: string, id: string, name: string, ignoredExitTargets: readonly string[] = []): Source {
  const xml = readTmxWithinRoot(root, input); const rootReal = rootRealpath(root); const mapPath = resolve(rootReal, input); const tilesets: Record<string, string> = {};
  for (const match of xml.matchAll(/<tileset\b([^>]*)\/?\s*>/g)) {
    const reference = attr(match[1], 'source') ?? '';
    if (!reference || reference.startsWith('/') || /^[A-Za-z]:/.test(reference) || reference.includes('\0')) throw new TmxConversionError(`${input}: invalid TSX reference`);
    const candidate = resolve(mapPath, '..', reference); let real: string; let content: string;
    try { real = realpathSync(candidate); if (!real.startsWith(`${rootReal}${sep}`) || lstatSync(candidate).isSymbolicLink()) throw new TmxConversionError(`${input}: TSX reference escapes root or is a symlink`); content = readFileSync(real, 'utf8'); }
    catch (error) { if (error instanceof TmxConversionError) throw error; throw new TmxConversionError(`${input}: unable to read TSX reference ${reference}`); }
    if (Buffer.byteLength(content) > TMX_LIMITS.xmlBytes || forbidden.test(content) || !/^\s*<\?xml[^?]*\?>\s*<tileset\b/i.test(content) || (content.match(/<tile\b/g) ?? []).length > TMX_LIMITS.objects) throw new TmxConversionError(`${input}: unsafe or excessive TSX ${reference}`); validateXml(content, reference); properties(content, reference);
    tilesets[reference] = createHash('sha256').update(content).digest('hex');
  }
  return { location: input, xml, id, name, tilesets, ignoredExitTargets };
}
const attr = (source: string, name: string) => new RegExp(`\\b${name}=["']([^"']*)["']`).exec(source)?.[1];
const num = (source: string, name: string) => Number(attr(source, name) ?? 0);
const kebab = (value: string) => value.replace(/\.tmx$/i, '').replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
const facing = (value: unknown): 'north' | 'east' | 'south' | 'west' => ({ up: 'north', right: 'east', down: 'south', left: 'west' })[String(value)] as 'north' | 'east' | 'south' | 'west' ?? 'south';
function properties(body: string, location: string): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const match of body.matchAll(/<property\b([^>]*)\/?\s*>/g)) {
    const key = attr(match[1], 'name') ?? ''; const raw = attr(match[1], 'value') ?? '';
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new TmxConversionError(`${location}: dangerous property key`);
    if (Buffer.byteLength(raw) > TMX_LIMITS.propertyBytes) throw new TmxConversionError(`${location}: property value exceeds 8 KiB`);
    result[key] = attr(match[1], 'type') === 'bool' ? raw === 'true' : attr(match[1], 'type') === 'int' || attr(match[1], 'type') === 'float' ? Number(raw) : raw;
  }
  return result;
}
function geometry(attrs: string, body: string, location: string): GeneratedGeometry {
  const x = num(attrs, 'x'); const y = num(attrs, 'y'); const width = num(attrs, 'width'); const height = num(attrs, 'height');
  const shape = /<(polygon|polyline)\b([^>]*)\/?\s*>/.exec(body);
  if (shape) {
    const raw = (attr(shape[2], 'points') ?? '').trim(); const values = raw ? raw.split(/\s+/) : [];
    if (values.length > TMX_LIMITS.points) throw new TmxConversionError(`${location}: geometry point limit exceeded`);
    const parsed = { kind: shape[1] as 'polygon' | 'polyline', x, y, points: values.map((point) => { const [px, py] = point.split(',').map(Number); return { x: px, y: py }; }) };
    validateGeometry(parsed, location);
    return parsed;
  }
  const parsed = body.includes('<ellipse') ? { kind: 'ellipse' as const, x, y, width, height } : { kind: 'rect' as const, x, y, width, height };
  validateGeometry(parsed, location);
  return parsed;
}
function validateGeometry(value: GeneratedGeometry, location: string) {
  const numbers = 'points' in value ? [value.x, value.y, ...value.points.flatMap((point) => [point.x, point.y])] : [value.x, value.y, value.width, value.height];
  if (numbers.some((number) => !Number.isFinite(number))) throw new TmxConversionError(`${location}: non-finite geometry`);
}
function validateCollisionGeometry(value: GeneratedGeometry, location: string) {
  if ('width' in value && (value.width <= 0 || value.height <= 0)) throw new TmxConversionError(`${location}: collision geometry requires positive dimensions`);
  if ('points' in value && value.kind === 'polygon' && value.points.length < 3) throw new TmxConversionError(`${location}: collision polygon requires at least 3 points`);
  if ('points' in value && value.kind === 'polyline' && value.points.length < 2) throw new TmxConversionError(`${location}: collision polyline requires at least 2 points`);
}
function validateXml(xml: string, location: string) {
  if (forbidden.test(xml) || hasUriValue(xml)) throw new TmxConversionError(`${location}: XML external entities/includes/URLs are forbidden`);
  const declaration = /^\s*<\?xml\b([^?]*)\?>/.exec(xml)?.[1] ?? '';
  const declaredEncoding = attr(declaration, 'encoding');
  if (declaredEncoding && declaredEncoding.toUpperCase() !== 'UTF-8') throw new TmxConversionError(`${location}: unsupported XML encoding`);
  if (/\bcompression=/.test(xml) || /<data\b[^>]*\bencoding=["'](?!csv["'])/i.test(xml)) throw new TmxConversionError(`${location}: only uncompressed CSV layer data is supported`);
}
function hasUriValue(xml: string): boolean {
  let cursor = 0;
  while (cursor < xml.length) {
    const tagStart = xml.indexOf('<', cursor);
    if (tagStart === -1) return hasUriText(xml.slice(cursor));
    if (hasUriText(xml.slice(cursor, tagStart))) return true;
    const tagEnd = xml.indexOf('>', tagStart + 1);
    if (tagEnd === -1) return hasUriText(xml.slice(tagStart));
    for (const attribute of xml.slice(tagStart, tagEnd + 1).matchAll(/\s([^\s=/>]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
      const name = attribute[1].toLowerCase();
      if (name !== 'xmlns' && !name.startsWith('xmlns:') && uriScheme.test(attribute[3].trim())) return true;
    }
    cursor = tagEnd + 1;
  }
  return false;
}
function hasUriText(text: string): boolean { return /(?:^|\s)[a-z][a-z0-9+.-]*:\S*/i.test(text); }
export function convertTmx(source: Source): GeneratedMapV1 {
  validateXml(source.xml, source.location);
  const mapTag = /<map\b([^>]*)>/.exec(source.xml)?.[1]; if (!mapTag) throw new TmxConversionError(`${source.location}: missing map`);
  const width = num(mapTag, 'width'); const height = num(mapTag, 'height'); const tileSize = num(mapTag, 'tilewidth');
  if (!width || !height || width * height > TMX_LIMITS.decodedCells) throw new TmxConversionError(`${source.location}: invalid or excessive dimensions`);
  const tilesets = [...source.xml.matchAll(/<tileset\b([^>]*)\/?\s*>/g)].map((match) => attr(match[1], 'source') ?? '').filter(Boolean);
  if (tilesets.some((reference) => !source.tilesets[reference])) throw new TmxConversionError(`${source.location}: unvalidated TSX reference`);
  const terrainLayers: number[][][] = [];
  for (const layer of source.xml.matchAll(/<layer\b([^>]*)>([\s\S]*?)<\/layer>/g)) {
    if (terrainLayers.length >= TMX_LIMITS.layers || (terrainLayers.length + 1) * width * height > TMX_LIMITS.decodedCells) throw new TmxConversionError(`${source.location}: aggregate layer/cell limit exceeded`);
    const data = /<data\b([^>]*)>([\s\S]*?)<\/data>/.exec(layer[2]); if (!data || attr(data[1], 'encoding') !== 'csv') throw new TmxConversionError(`${source.location}: layer requires CSV data`);
    const cells = data[2].split(',').map((cell) => cell.trim()).filter(Boolean).map(Number);
    if (cells.length !== width * height || cells.some((cell) => !Number.isSafeInteger(cell) || cell < 0)) throw new TmxConversionError(`${source.location}: CSV cell count/value mismatch`);
    terrainLayers.push(Array.from({ length: height }, (_, y) => cells.slice(y * width, (y + 1) * width)));
  }
  const objects: GeneratedNpcV1[] = []; const triggers: GeneratedSpawnV1[] = []; const encounters: GeneratedEncounterV1[] = []; const services: never[] = []; const collisions: GeneratedCollisionV1[] = [];
  const rawExits: Array<{ id: string; x: number; y: number; target: string; pos: string }> = []; let objectCount = 0;
  for (const group of source.xml.matchAll(/<objectgroup\b(?![^>]*\/>)([^>]*)>([\s\S]*?)<\/objectgroup>/g)) {
    const groupName = attr(group[1], 'name') ?? ''; if (!safeGroups.has(groupName)) throw new TmxConversionError(`${source.location}: unknown gameplay group "${groupName}"`);
    for (const object of group[2].matchAll(/<object\b([^>]*?)(?:\/>|>([\s\S]*?)<\/object>)/g)) {
      if (++objectCount > TMX_LIMITS.objects) throw new TmxConversionError(`${source.location}: object limit exceeded`);
      const sourceId = attr(object[1], 'id') ?? String(objectCount); const body = object[2] ?? ''; const props = properties(body, source.location); const shape = geometry(object[1], body, source.location);
      const id = `${source.id}-${kebab(groupName)}-${sourceId}`; const name = attr(object[1], 'name') ?? '';
      if (groupName === 'Entities') {
        if (name !== 'Player' && name !== 'Character') throw new TmxConversionError(`${source.location}: unknown gameplay object kind "${name || '(unnamed)'}"`);
        if (name === 'Player') triggers.push({ id, kind: 'spawn', geometry: shape, spawnKey: String(props.pos ?? 'entrance'), facing: facing(props.direction) });
        else objects.push({ id, kind: 'npc', geometry: shape, characterKey: String(props.character_id ?? id), facing: facing(props.direction), graphicKey: kebab(String(props.graphic ?? 'npc')), patrolRadius: Number(props.radius ?? 0) });
      } else if (groupName === 'Monsters') encounters.push({ id, kind: 'monster-patch', geometry: shape, encounterTableKey: `gameit:${source.id}-default` });
      else if (groupName === 'Collisions') { validateCollisionGeometry(shape, source.location); collisions.push({ id, kind: 'collision', geometry: shape, properties: props }); }
      else if (groupName === 'Transition') rawExits.push({ id, x: Math.floor(num(object[1], 'x') / tileSize), y: Math.floor(num(object[1], 'y') / tileSize), target: String(props.target ?? ''), pos: String(props.pos ?? '') });
    }
  }
  const terrain = terrainLayers[0] ?? Array.from({ length: height }, () => Array(width).fill(0)); const blocked = Array.from({ length: height }, () => Array(width).fill(false));
  return { id: source.id, name: source.name, width, height, tileSize, terrain, terrainLayers, blocked, collisions, objects, triggers, encounters, services, exits: rawExits.map((exit) => ({ ...exit, toMapId: kebab(exit.target), toExitId: '', toX: 0, toY: 0 })), metadata: { source: source.location, sourceSha256: createHash('sha256').update(source.xml).digest('hex'), tilesets: tilesets.join(','), tilesetHashes: Object.entries(source.tilesets).map(([key, hash]) => `${key}:${hash}`).join(',') } };
}
export function convertMapSet(sources: Source[]): GeneratedMapSetV1 {
  const maps = sources.map(convertTmx); const aliases = new Map(sources.map((source) => { const parts = source.location.split('/'); return [kebab(parts[parts.length - 1] ?? ''), source.id]; }));
  const spawns = new Map<string, { x: number; y: number }>();
  for (const map of maps) for (const trigger of map.triggers) if (trigger.spawnKey) spawns.set(`${map.id}:${trigger.spawnKey}`, { x: Math.floor(trigger.geometry.x / map.tileSize), y: Math.floor(trigger.geometry.y / map.tileSize) });
  const resolved = maps.map((map, mapIndex) => ({ ...map, blocked: map.blocked.map((row) => [...row]), exits: map.exits.flatMap((exit) => {
    const source = sources[mapIndex]; const raw = exit as typeof exit & { pos?: string; target?: string }; const toMapId = aliases.get(exit.toMapId);
    if (!toMapId) { if (source.ignoredExitTargets?.includes(exit.toMapId)) return []; throw new TmxConversionError(`${source.location}: unknown exit target ${exit.toMapId}`); }
    const spawn = spawns.get(`${toMapId}:${String(raw.pos ?? '')}`); if (!spawn) throw new TmxConversionError(`${source.location}: unknown exit position ${String(raw.pos ?? '')} on ${toMapId}`);
    const targetMap = maps.find((candidate) => candidate.id === toMapId)!; const reciprocals = targetMap.exits.filter((candidate) => candidate.toMapId === kebab(source.location.split('/').pop() ?? ''));
    if (reciprocals.length !== 1) throw new TmxConversionError(`${source.location}: missing or ambiguous reciprocal exit for ${exit.id}`); const reciprocal = reciprocals[0];
    const { pos: _pos, target: _target, ...stable } = raw; return [{ ...stable, toMapId, toExitId: reciprocal.id, toX: spawn.x, toY: spawn.y }];
  }) }));
  for (const map of resolved) for (const exit of map.exits) { map.blocked[exit.y][exit.x] = false; const target = resolved.find((candidate) => candidate.id === exit.toMapId)!; target.blocked[exit.toY][exit.toX] = false; }
  return { schemaVersion: 1, mapSet: { id: 'python-monsters-tracer', version: '1.0.0' }, maps: resolved, metadata: { upstream: 'clear-code-projects/Python-Monsters@1b15724635ef11e84dd719c6c30240c053348d82' } };
}
export function serializeMapSetModule(mapSet: GeneratedMapSetV1): string { return `import type { GeneratedMapSetV1 } from './generatedMapSchema';\nexport const generatedTracerMapSet = ${JSON.stringify(mapSet)} as const satisfies GeneratedMapSetV1;\n`; }
export function canonicalPinnedSourceLocation(input: string): string { return `data/${input.replace(/^data\//, '')}`; }

function runCli(): void {
  const [root, first, second, output] = process.argv.slice(2); if (!root || !first) throw new TmxConversionError('Usage: convert-monster-rpg-tmx <root> <town.tmx> [route.tmx output.ts]');
  if (!second) console.log(JSON.stringify(convertTmx(readSourceWithinRoot(root, first, `tracer-${kebab(first)}`, kebab(first))), null, 2));
  else { const set = convertMapSet([{ ...readSourceWithinRoot(root, first, 'tracer-water-town', 'Water Town Tracer'), location: canonicalPinnedSourceLocation(first) }, { ...readSourceWithinRoot(root, second, 'tracer-world-route', 'World Route Tracer', ['house', 'hospital', 'fire', 'plant', 'hospital2']), location: canonicalPinnedSourceLocation(second) }]); const serialized = serializeMapSetModule(set); if (output) try { writeFileSync(resolve(output), serialized); } catch { throw new TmxConversionError('Unable to write generated map output'); } else console.log(serialized); }
}
if (process.argv[1]?.endsWith('convert-monster-rpg-tmx.ts')) {
  try { runCli(); } catch (error) { console.error(error instanceof TmxConversionError ? error.message : 'TMX conversion failed'); process.exitCode = 1; }
}
