import Phaser from 'phaser';
import type { InputAction, LocationRoomState, MonsterRpgSaveState } from '../sim';
import { getGameMap } from '../sim';
import { VillageScene } from './scenes/VillageScene';

export interface MonsterRpgGameRuntime {
  setSaveState: (state: MonsterRpgSaveState) => void;
  setRoomState: (state: LocationRoomState | null) => void;
  destroy: () => void;
}

interface BootGameOptions {
  initialState: MonsterRpgSaveState;
  onAction: (action: InputAction) => void;
}

export function bootGame(parent: HTMLElement, options: BootGameOptions): MonsterRpgGameRuntime {
  const villageScene = new VillageScene({
    initialState: options.initialState,
    map: getGameMap(options.initialState.mapId),
    onAction: options.onAction
  });

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1d2b23',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: Math.max(parent.clientWidth, 320),
      height: Math.max(parent.clientHeight, 320)
    },
    scene: [villageScene]
  });

  return {
    setSaveState: (state) => {
      villageScene.setSaveState(state);
    },
    setRoomState: (state) => {
      villageScene.setRoomState(state);
    },
    destroy: () => {
      game.destroy(true);
    }
  };
}
