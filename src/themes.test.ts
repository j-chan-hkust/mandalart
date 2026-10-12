import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, appearancePreference, findTheme, resolveTheme, themes, themeVariables } from './themes';
function luminance(hex: string) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
describe('color schemes', () => {
  it('offers only Cloud light mode and Graphite dark mode', () => {
    expect(themes.map(theme => ({ id: theme.id, mode: theme.mode }))).toEqual([
      { id: 'cloud', mode: 'light' }, { id: 'graphite', mode: 'dark' },
    ]);
  });
  it('keeps content readable in every cell state and both light and dark chrome', () => {
    for (const theme of themes) {
      const vars = themeVariables(theme);
      for (const background of ['--cell', '--central', '--subgoal', '--main', '--highlight', '--input', '--surface']) {
        expect(contrast(vars['--text'], vars[background]), `${theme.name} ${background}`).toBeGreaterThanOrEqual(4.5);
      }
      for (const background of ['--cell', '--surface']) expect(contrast(vars['--muted'], vars[background]), `${theme.name} secondary text`).toBeGreaterThanOrEqual(4.5);
      expect(new Set([vars['--focus-ring'], vars['--highlight-ring'], vars['--input-ring']]).size).toBe(3);
    }
  });
  it('falls back gracefully for obsolete or unknown preferences', () => {
    expect(findTheme(undefined).id).toBe(DEFAULT_THEME);
    expect(findTheme('missing-palette').id).toBe(DEFAULT_THEME);
    expect(findTheme('sage-paper').id).toBe('cloud');
    expect(findTheme('midnight').id).toBe('graphite');
  });
  it('defaults to system and resolves live appearance without changing manual overrides', () => {
    expect(appearancePreference(undefined)).toBe('system');
    expect(resolveTheme('system', false).id).toBe('cloud');
    expect(resolveTheme('system', true).id).toBe('graphite');
    expect(resolveTheme('cloud', true).id).toBe('cloud');
    expect(resolveTheme('graphite', false).id).toBe('graphite');
  });
});
