import { CSSProperties } from 'react';
import { logoSpriteSheet } from '../config/uiAssets';

interface Props {
  index: number;
}

export const PortalLogo = ({ index }: Props) => {
  const safeIndex = Math.max(0, Math.min(logoSpriteSheet.logos.length - 1, index));
  const region = logoSpriteSheet.logos[safeIndex];

  const style = {
    '--sheet-url': `url(${logoSpriteSheet.src})`,
    '--sheet-width': `${logoSpriteSheet.sheetWidth}px`,
    '--sheet-height': `${logoSpriteSheet.sheetHeight}px`,
    '--crop-x': `${region.x}px`,
    '--crop-y': `${region.y}px`,
    '--crop-w': `${region.width}px`,
    '--crop-h': `${region.height}px`,
  } as CSSProperties;

  return (
    <div className="logo-crop" style={style} role="img" aria-label="GameIt portal logo">
      <span className="logo-crop-inner" aria-hidden />
    </div>
  );
};
