import { describe, it, expect } from 'vitest';

import {
  GLASS_BACKDROP,
  GLASS_BACKDROP_LIGHT,
  GLASS_BORDER,
  GLASS_BORDER_LIGHT,
  GLASS_TOP_SHINE,
  GLASS_SHADOW_NEUTRAL,
  GLASS_DIALOG_STYLE,
  glassAccentShadow,
  NOISE_SVG,
} from '@/lib/glass-constants';

describe('glass-constants', () => {
  it('GLASS_BACKDROP has background and backdropFilter', () => {
    expect(GLASS_BACKDROP.background).toContain('rgba');
    expect(GLASS_BACKDROP.backdropFilter).toContain('blur');
  });

  it('GLASS_BACKDROP_LIGHT has higher opacity than dark', () => {
    expect(GLASS_BACKDROP_LIGHT.background).toContain('rgba');
    expect(GLASS_BACKDROP_LIGHT.backdropFilter).toContain('blur');
  });

  it('GLASS_BORDER is a border string', () => {
    expect(GLASS_BORDER).toContain('solid');
    expect(GLASS_BORDER).toContain('rgba');
  });

  it('GLASS_BORDER_LIGHT uses darker tones', () => {
    expect(GLASS_BORDER_LIGHT).toContain('solid');
    expect(GLASS_BORDER_LIGHT).toContain('rgba(0,0,0');
  });

  it('GLASS_TOP_SHINE is a linear-gradient string', () => {
    expect(GLASS_TOP_SHINE).toContain('linear-gradient');
    expect(GLASS_TOP_SHINE).toContain('rgba');
  });

  it('GLASS_SHADOW_NEUTRAL contains inset shadows', () => {
    expect(GLASS_SHADOW_NEUTRAL).toContain('inset');
    expect(GLASS_SHADOW_NEUTRAL).toContain('rgba');
  });

  it('GLASS_DIALOG_STYLE has background, backdropFilter, boxShadow, and border', () => {
    expect(GLASS_DIALOG_STYLE.background).toContain('rgba');
    expect(GLASS_DIALOG_STYLE.backdropFilter).toContain('blur');
    expect(GLASS_DIALOG_STYLE.boxShadow).toContain('inset');
    expect(GLASS_DIALOG_STYLE.border).toContain('rgba');
  });

  it('glassAccentShadow returns a shadow string with the given color', () => {
    const shadow = glassAccentShadow('#f59e0b');
    expect(shadow).toContain('rgba');
    expect(shadow).toContain('inset');
  });

  it('glassAccentShadow uses default amber color when called with no args', () => {
    const shadow = glassAccentShadow();
    expect(shadow).toContain('245,158,11');
  });

  it('NOISE_SVG is a data URI SVG string', () => {
    expect(NOISE_SVG).toContain('data:image/svg+xml');
    expect(NOISE_SVG).toContain('feTurbulence');
  });
});
