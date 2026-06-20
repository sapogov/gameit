import type { Direction, InputAction } from '../sim';

interface MobileDpadProps {
  onAction: (action: InputAction) => void;
}

const controls: Array<{ direction: Direction; label: string; className: string }> = [
  { direction: 'north', label: '^', className: 'up' },
  { direction: 'west', label: '<', className: 'left' },
  { direction: 'east', label: '>', className: 'right' },
  { direction: 'south', label: 'v', className: 'down' }
];

export function MobileDpad({ onAction }: MobileDpadProps) {
  return (
    <div className="monster-dpad" aria-label="Movement controls">
      {controls.map((control) => (
        <button
          aria-label={`Move ${control.direction}`}
          className={control.className}
          key={control.direction}
          onClick={() => onAction({ type: 'move', direction: control.direction })}
          type="button"
        >
          {control.label}
        </button>
      ))}
    </div>
  );
}
