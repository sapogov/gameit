import { useEffect, useRef } from 'react';
import { SnakeSnapshot } from './engine';

interface Props {
  snapshot: SnakeSnapshot;
}

const colors: Record<string, string> = {
  food: '#22c55e',
  coin: '#fbbf24',
  heart: '#ef4444',
  berry: '#a855f7',
  leaf: '#84cc16',
  magnet: '#38bdf8',
};

export const SnakeCanvas = ({ snapshot }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tile = 18;
    canvas.width = 24 * tile;
    canvas.height = 24 * tile;

    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    snapshot.obstacles.forEach((o) => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(o.x * tile, o.y * tile, tile - 1, tile - 1);
    });

    snapshot.items.forEach((item) => {
      ctx.fillStyle = colors[item.kind] ?? '#fff';
      ctx.fillRect(item.x * tile + 2, item.y * tile + 2, tile - 4, tile - 4);
    });

    snapshot.snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#14b8a6' : '#2dd4bf';
      ctx.fillRect(s.x * tile + 1, s.y * tile + 1, tile - 2, tile - 2);
    });
  }, [snapshot]);

  return <canvas ref={canvasRef} className="snake-canvas" aria-label="Snake game board" style={{ aspectRatio: "1 / 1", height: "auto" }} />;
};
