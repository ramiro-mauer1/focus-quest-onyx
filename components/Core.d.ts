import { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface CoreProps {
  systemState?: 'idle' | 'flow';
  level?: number;
  energy?: number;
  pillars?: {
    Intelecto: number;
    Vigor: number;
    Voluntad: number;
  };
  size?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

export interface CoreRef {
  pulse: () => void;
}

declare const Core: ForwardRefExoticComponent<CoreProps & RefAttributes<CoreRef>>;
export default Core;
