import { ArraySchema, defineTypes, Schema } from '@colyseus/schema';
import type {
  BattleKind,
  BattleStatus,
  BattleParticipantKind,
  CreatureStatKey,
  CreatureType
} from '../../src/games/monster-rpg/sim/types';

export class BattleStatsSchema extends Schema {
  declare hp: number;
  declare attack: number;
  declare defense: number;
  declare speed: number;
  declare stamina: number;

  constructor() {
    super();
    this.hp = 0;
    this.attack = 0;
    this.defense = 0;
    this.speed = 0;
    this.stamina = 0;
  }
}
defineTypes(BattleStatsSchema, {
  hp: 'number',
  attack: 'number',
  defense: 'number',
  speed: 'number',
  stamina: 'number'
});

export class BattleAttackSchema extends Schema {
  declare id: string;
  declare name: string;
  declare type: CreatureType;
  declare power: number;
  declare statFocus: CreatureStatKey;
  declare fatigueCost: number;

  constructor() {
    super();
    this.id = '';
    this.name = '';
    this.type = 'verdant';
    this.power = 0;
    this.statFocus = 'attack';
    this.fatigueCost = 0;
  }
}
defineTypes(BattleAttackSchema, {
  id: 'string',
  name: 'string',
  type: 'string',
  power: 'number',
  statFocus: 'string',
  fatigueCost: 'number'
});

export class BattleCreatureSchema extends Schema {
  declare id: string;
  declare ownerPlayerId: string;
  declare speciesId: number;
  declare level: number;
  declare stats: BattleStatsSchema;
  declare attacks: ArraySchema<BattleAttackSchema>;
  declare hp: number;
  declare maxHp: number;
  declare fatigue: number;
  declare maxFatigue: number;
  declare fainted: boolean;

  constructor() {
    super();
    this.id = '';
    this.ownerPlayerId = '';
    this.speciesId = 1;
    this.level = 1;
    this.stats = new BattleStatsSchema();
    this.attacks = new ArraySchema<BattleAttackSchema>();
    this.hp = 0;
    this.maxHp = 0;
    this.fatigue = 0;
    this.maxFatigue = 0;
    this.fainted = false;
  }
}
defineTypes(BattleCreatureSchema, {
  id: 'string',
  ownerPlayerId: 'string',
  speciesId: 'number',
  level: 'number',
  stats: BattleStatsSchema,
  attacks: [BattleAttackSchema],
  hp: 'number',
  maxHp: 'number',
  fatigue: 'number',
  maxFatigue: 'number',
  fainted: 'boolean'
});

export class BattleParticipantSchema extends Schema {
  declare kind: BattleParticipantKind;
  declare playerId: string;
  declare name: string;
  declare activeCreature: BattleCreatureSchema;

  constructor() {
    super();
    this.kind = 'player';
    this.playerId = '';
    this.name = '';
    this.activeCreature = new BattleCreatureSchema();
  }
}
defineTypes(BattleParticipantSchema, {
  kind: 'string',
  playerId: 'string',
  name: 'string',
  activeCreature: BattleCreatureSchema
});

export class BattleLogEntrySchema extends Schema {
  declare id: string;
  declare message: string;

  constructor() {
    super();
    this.id = '';
    this.message = '';
  }
}
defineTypes(BattleLogEntrySchema, {
  id: 'string',
  message: 'string'
});

export class BattleStateSchema extends Schema {
  declare balanceVersion: number;
  declare battleId: string;
  declare encounterId: string;
  declare battleKind: BattleKind;
  declare wildSpeciesId: number;
  declare status: BattleStatus;
  declare turn: number;
  declare canRun: boolean;
  declare runAttempts: number;
  declare player: BattleParticipantSchema;
  declare enemy: BattleParticipantSchema;
  declare lastLog: ArraySchema<BattleLogEntrySchema>;
  declare validPlayerAttackIds: ArraySchema<string>;
  declare rewardGranted: boolean;
  declare disconnectGraceUntil: string;

  constructor() {
    super();
    this.balanceVersion = 0;
    this.battleId = '';
    this.encounterId = '';
    this.battleKind = 'wild';
    this.wildSpeciesId = 1;
    this.status = 'active';
    this.turn = 1;
    this.canRun = false;
    this.runAttempts = 0;
    this.player = new BattleParticipantSchema();
    this.enemy = new BattleParticipantSchema();
    this.lastLog = new ArraySchema<BattleLogEntrySchema>();
    this.validPlayerAttackIds = new ArraySchema<string>();
    this.rewardGranted = false;
    this.disconnectGraceUntil = '';
  }
}
defineTypes(BattleStateSchema, {
  balanceVersion: 'number',
  battleId: 'string',
  encounterId: 'string',
  battleKind: 'string',
  wildSpeciesId: 'number',
  status: 'string',
  turn: 'number',
  canRun: 'boolean',
  runAttempts: 'number',
  player: BattleParticipantSchema,
  enemy: BattleParticipantSchema,
  lastLog: [BattleLogEntrySchema],
  validPlayerAttackIds: ['string'],
  rewardGranted: 'boolean',
  disconnectGraceUntil: 'string'
});
