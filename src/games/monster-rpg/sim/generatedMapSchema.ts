/** Build-time TMX output. This module deliberately contains no XML/TMX dependency. */
export const GENERATED_MAP_SCHEMA_VERSION = 1 as const;

export type GeneratedMapObjectKind = 'npc' | 'spawn' | 'service' | 'monster-patch';
export type GeneratedGeometry =
  | { kind: 'rect'; x: number; y: number; width: number; height: number }
  | { kind: 'polygon' | 'polyline'; x: number; y: number; points: ReadonlyArray<{ x: number; y: number }> }
  | { kind: 'ellipse'; x: number; y: number; width: number; height: number };

interface GeneratedObjectBase { id: string; geometry: GeneratedGeometry; }
export interface GeneratedNpcV1 extends GeneratedObjectBase { kind: 'npc'; characterKey: string; facing: 'north' | 'east' | 'south' | 'west'; graphicKey: string; patrolRadius: number; }
export interface GeneratedSpawnV1 extends GeneratedObjectBase { kind: 'spawn'; spawnKey: string; facing: 'north' | 'east' | 'south' | 'west'; }
export interface GeneratedEncounterV1 extends GeneratedObjectBase { kind: 'monster-patch'; encounterTableKey: `gameit:${string}`; }
export interface GeneratedServiceV1 extends GeneratedObjectBase { kind: 'service'; serviceKey: string; }
export type GeneratedMapObjectV1 = GeneratedNpcV1 | GeneratedSpawnV1 | GeneratedEncounterV1 | GeneratedServiceV1;
export interface GeneratedCollisionV1 extends GeneratedObjectBase { kind: 'collision'; properties: Readonly<Record<string, string | number | boolean>>; }
export interface GeneratedExitV1 { id: string; x: number; y: number; toMapId: string; toExitId: string; toX: number; toY: number; }
export interface GeneratedMapV1 {
  id: string; name: string; width: number; height: number; tileSize: number;
  terrain: ReadonlyArray<ReadonlyArray<number>>;
  terrainLayers: ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>;
  blocked: ReadonlyArray<ReadonlyArray<boolean>>;
  collisions: ReadonlyArray<GeneratedCollisionV1>;
  objects: ReadonlyArray<GeneratedNpcV1>; triggers: ReadonlyArray<GeneratedSpawnV1>;
  encounters: ReadonlyArray<GeneratedEncounterV1>; services: ReadonlyArray<GeneratedServiceV1>; exits: ReadonlyArray<GeneratedExitV1>;
  metadata: Readonly<Record<string, string | number | boolean>>;
}
export interface GeneratedMapSetV1 {
  schemaVersion: typeof GENERATED_MAP_SCHEMA_VERSION;
  mapSet: { id: string; version: string };
  maps: ReadonlyArray<GeneratedMapV1>;
  metadata: Readonly<Record<string, string>>;
}

export interface SquareGridMapAdapter { id: string; width: number; height: number; isBlocked(x: number, y: number): boolean; }
export function toSquareGridMap(map: GeneratedMapV1): SquareGridMapAdapter {
  return { id: map.id, width: map.width, height: map.height, isBlocked: (x, y) =>
    x < 0 || y < 0 || x >= map.width || y >= map.height || Boolean(map.blocked[y]?.[x]) };
}

export function validateGeneratedMapSet(mapSet: GeneratedMapSetV1): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const map of mapSet.maps) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(map.id) || ids.has(map.id)) errors.push(`map ${map.id}: id must be unique kebab-case`);
    ids.add(map.id);
    if (map.terrain.length !== map.height || map.blocked.length !== map.height) errors.push(`${map.id}: grid height mismatch`);
    map.terrain.forEach((row, y) => { if (row.length !== map.width || map.blocked[y]?.length !== map.width) errors.push(`${map.id}: grid width mismatch at row ${y}`); });
    const objectIds = new Set<string>();
    for (const object of [...map.objects, ...map.triggers, ...map.encounters, ...map.services]) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(object.id) || objectIds.has(object.id)) errors.push(`${map.id}: invalid or duplicate object id ${object.id}`);
      objectIds.add(object.id);
    }
    for (const exit of map.exits) {
      const target = mapSet.maps.find((candidate) => candidate.id === exit.toMapId);
      if (exit.x < 0 || exit.y < 0 || exit.x >= map.width || exit.y >= map.height || map.blocked[exit.y]?.[exit.x]) errors.push(`${map.id}/${exit.id}: blocked or invalid source`);
      if (!target) errors.push(`${map.id}/${exit.id}: missing target ${exit.toMapId}`);
      else if (exit.toX < 0 || exit.toY < 0 || exit.toX >= target.width || exit.toY >= target.height || target.blocked[exit.toY]?.[exit.toX]) errors.push(`${map.id}/${exit.id}: blocked or invalid target`);
      else if (!target.exits.some((candidate) => candidate.id === exit.toExitId && candidate.toMapId === map.id && candidate.toExitId === exit.id)) errors.push(`${map.id}/${exit.id}: target has no exact reciprocal exit`);
    }
  }
  return errors;
}

export type LoadMapSetResult = { ok: true; registry: GeneratedMapRegistry } | { ok: false; diagnostics: readonly string[] };
export function loadMapSet(input: unknown): LoadMapSetResult {
  const diagnostics: string[] = [];
  if (!input || typeof input !== 'object') return { ok: false, diagnostics: ['map-set: expected object'] };
  const candidate = input as Partial<GeneratedMapSetV1>;
  if (candidate.schemaVersion !== GENERATED_MAP_SCHEMA_VERSION) diagnostics.push('map-set: unsupported schemaVersion');
  if (!candidate.mapSet || typeof candidate.mapSet.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.mapSet.id) || typeof candidate.mapSet.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(candidate.mapSet.version)) diagnostics.push('map-set: invalid identity');
  if (!isPrimitiveRecord(candidate.metadata)) diagnostics.push('map-set: invalid metadata');
  if (!Array.isArray(candidate.maps)) diagnostics.push('map-set: maps must be an array');
  else for (const [index, map] of candidate.maps.entries()) {
    if (!map || typeof map !== 'object') { diagnostics.push(`maps[${index}]: expected object`); continue; }
    const value = map as Partial<GeneratedMapV1>;
    if (typeof value.id !== 'string' || !Number.isInteger(value.width) || !Number.isInteger(value.height) || !Number.isInteger(value.tileSize)) diagnostics.push(`maps[${index}]: invalid header`);
    for (const field of ['terrain', 'terrainLayers', 'blocked', 'collisions', 'objects', 'triggers', 'encounters', 'services', 'exits'] as const) if (!Array.isArray(value[field])) diagnostics.push(`maps[${index}].${field}: expected array`);
    if (Array.isArray(value.terrain) && !value.terrain.every((row) => Array.isArray(row) && row.every((cell) => Number.isSafeInteger(cell) && cell >= 0))) diagnostics.push(`maps[${index}].terrain: invalid cells`);
    if (Array.isArray(value.terrainLayers) && !value.terrainLayers.every((layer) => Array.isArray(layer) && layer.every((row) => Array.isArray(row) && row.every((cell) => Number.isSafeInteger(cell) && cell >= 0)))) diagnostics.push(`maps[${index}].terrainLayers: invalid cells`);
    if (Array.isArray(value.blocked) && !value.blocked.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === 'boolean'))) diagnostics.push(`maps[${index}].blocked: invalid cells`);
    if (Array.isArray(value.collisions) && !value.collisions.every((entry) => isRecord(entry) && entry.kind === 'collision' && typeof entry.id === 'string' && validCollisionGeometry(entry.geometry) && isPrimitiveRecord(entry.properties))) diagnostics.push(`maps[${index}].collisions: invalid collision`);
    if (Array.isArray(value.objects) && !value.objects.every((entry) => isRecord(entry) && entry.kind === 'npc' && typeof entry.id === 'string' && typeof entry.characterKey === 'string' && typeof entry.graphicKey === 'string' && typeof entry.patrolRadius === 'number' && validFacing(entry.facing) && validGeometry(entry.geometry))) diagnostics.push(`maps[${index}].objects: invalid npc`);
    if (Array.isArray(value.triggers) && !value.triggers.every((entry) => isRecord(entry) && entry.kind === 'spawn' && typeof entry.spawnKey === 'string' && validFacing(entry.facing) && validGeometry(entry.geometry))) diagnostics.push(`maps[${index}].triggers: invalid spawn`);
    if (Array.isArray(value.encounters) && !value.encounters.every((entry) => isRecord(entry) && entry.kind === 'monster-patch' && typeof entry.encounterTableKey === 'string' && entry.encounterTableKey.startsWith('gameit:') && validGeometry(entry.geometry))) diagnostics.push(`maps[${index}].encounters: invalid encounter`);
    if (Array.isArray(value.services) && !value.services.every((entry) => isRecord(entry) && entry.kind === 'service' && typeof entry.serviceKey === 'string' && validGeometry(entry.geometry))) diagnostics.push(`maps[${index}].services: invalid service`);
    if (Array.isArray(value.exits) && !value.exits.every((entry) => isRecord(entry) && ['id', 'toMapId', 'toExitId'].every((key) => typeof entry[key] === 'string') && ['x', 'y', 'toX', 'toY'].every((key) => Number.isInteger(entry[key])))) diagnostics.push(`maps[${index}].exits: invalid exit`);
    if (!isPrimitiveRecord(value.metadata)) diagnostics.push(`maps[${index}].metadata: invalid metadata`);
  }
  if (diagnostics.length) return { ok: false, diagnostics };
  const validated = input as GeneratedMapSetV1; diagnostics.push(...validateGeneratedMapSet(validated));
  return diagnostics.length ? { ok: false, diagnostics } : { ok: true, registry: new GeneratedMapRegistry(validated) };
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function isPrimitiveRecord(value: unknown): boolean { return isRecord(value) && !Object.keys(value).some((key) => ['__proto__', 'constructor', 'prototype'].includes(key)) && Object.values(value).every((entry) => ['string', 'number', 'boolean'].includes(typeof entry)); }
function validFacing(value: unknown): boolean { return value === 'north' || value === 'east' || value === 'south' || value === 'west'; }
function validGeometry(value: unknown): value is GeneratedGeometry {
  if (!isRecord(value) || !['rect', 'ellipse', 'polygon', 'polyline'].includes(String(value.kind)) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) return false;
  if (value.kind === 'polygon' || value.kind === 'polyline') {
    const minimumPoints = value.kind === 'polygon' ? 3 : 2;
    return Array.isArray(value.points) && value.points.length >= minimumPoints && value.points.every((point) => isRecord(point) && isFiniteNumber(point.x) && isFiniteNumber(point.y));
  }
  return isFiniteNumber(value.width) && value.width >= 0 && isFiniteNumber(value.height) && value.height >= 0;
}
function validCollisionGeometry(value: unknown): boolean {
  if (!validGeometry(value)) return false;
  return value.kind === 'rect' || value.kind === 'ellipse' ? value.width > 0 && value.height > 0 : true;
}
function isFiniteNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }

export class GeneratedMapRegistry {
  readonly diagnostics: readonly string[];
  private readonly byId: ReadonlyMap<string, GeneratedMapV1>;
  constructor(readonly mapSet: GeneratedMapSetV1) { this.diagnostics = validateGeneratedMapSet(mapSet); this.byId = new Map(mapSet.maps.map((map) => [map.id, map])); }
  get(id: string): GeneratedMapV1 | undefined { return this.byId.get(id); }
  require(id: string): GeneratedMapV1 { const map = this.get(id); if (!map) throw new Error(`Generated map not found: ${id}`); return map; }
  handshake(): { id: string; version: string } { return { ...this.mapSet.mapSet }; }
}
