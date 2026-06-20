import { ReactNode } from 'react';

interface Props {
  label: string;
  onClick: () => void;
  icon: ReactNode;
}

export const IconCircleButton = ({ label, onClick, icon }: Props) => (
  <button className="icon-circle-btn" onClick={onClick} aria-label={label} title={label}>
    <span className="icon-circle-art" aria-hidden>{icon}</span>
  </button>
);
