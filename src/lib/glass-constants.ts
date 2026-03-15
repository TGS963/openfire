import type { CSSProperties } from 'react';

// --- Noise Texture ---

export const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// --- Glass Backdrop ---

export const GLASS_BACKDROP: CSSProperties = {
  background: 'rgba(255,255,255,0.008)',
  backdropFilter: 'blur(12px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
};

export const GLASS_BACKDROP_LIGHT: CSSProperties = {
  background: 'rgba(255,255,255,0.5)',
  backdropFilter: 'blur(12px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
};

// --- Glass Borders ---

export const GLASS_BORDER = '1px solid rgba(255,255,255,0.06)';
export const GLASS_BORDER_LIGHT = '1px solid rgba(0,0,0,0.08)';

// --- Top Shine Effect ---

export const GLASS_TOP_SHINE =
  'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.15) 70%, transparent 90%)';

// --- Shadows ---

export const GLASS_SHADOW_NEUTRAL =
  '0 1px 6px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -0.5px 0 rgba(0,0,0,0.1)';

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

export const glassAccentShadow = (color = '#f59e0b'): string => {
  const [r, g, b] = hexToRgb(color);
  return `0 1px 6px rgba(${r},${g},${b},0.15), 0 4px 14px rgba(${r},${g},${b},0.08), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -0.5px 0 rgba(0,0,0,0.08)`;
};

// --- Dialog Style ---

export const GLASS_DIALOG_STYLE: CSSProperties = {
  background: 'rgba(20,20,25,0.85)',
  backdropFilter: 'blur(32px) saturate(1.5)',
  WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
  boxShadow:
    '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.12)',
};
