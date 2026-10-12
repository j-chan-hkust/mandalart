export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  canvas: string;
  surface: string;
  cell: string;
  ink: string;
  accent: string;
  highlight: string;
  input: string;
}
export const themes: readonly Theme[] = [
  { id: 'cloud', name: 'Cloud', mode: 'light', canvas: '#f0f2f6', surface: '#fcfdff', cell: '#f8faff', ink: '#354258', accent: '#637797', highlight: '#ac8040', input: '#856c9c' },
  { id: 'graphite', name: 'Graphite', mode: 'dark', canvas: '#191b1e', surface: '#222529', cell: '#282c31', ink: '#e5e7eb', accent: '#9aaebc', highlight: '#d4ab64', input: '#ada0dc' },
];
export const DEFAULT_THEME = 'cloud';
export const DEFAULT_APPEARANCE = 'system';
export function appearancePreference(value: unknown): string {
  return value === 'system' || value === undefined ? DEFAULT_APPEARANCE : findTheme(value).id;
}
export function resolveTheme(preference: string, systemDark: boolean): Theme {
  return findTheme(preference === 'system' ? systemDark ? 'graphite' : 'cloud' : preference);
}
export function findTheme(id: unknown): Theme {
  const current = themes.find(theme => theme.id === id);
  if (current) return current;
  // Preserve dark-mode intent for preferences saved during palette exploration.
  const retiredDark = ['ink', 'midnight', 'forest-night', 'aubergine', 'espresso'];
  return themes.find(theme => theme.id === (typeof id === 'string' && retiredDark.includes(id) ? 'graphite' : DEFAULT_THEME))!;
}
function mix(base: string, tint: string, amount: number): string {
  const channels = [1, 3, 5].map(offset => Math.round(parseInt(base.slice(offset, offset + 2), 16) * (1 - amount) + parseInt(tint.slice(offset, offset + 2), 16) * amount));
  return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}
export function themeVariables(theme: Theme): Record<string, string> {
  const dark = theme.mode === 'dark';
  return {
    '--canvas': theme.canvas, '--surface': theme.surface, '--cell': theme.cell, '--text': theme.ink,
    '--muted': mix(theme.cell, theme.ink, dark ? .64 : .76),
    '--line': mix(theme.cell, theme.ink, dark ? .22 : .18), '--soft-line': mix(theme.surface, theme.ink, .11),
    '--central-line': mix(theme.cell, theme.accent, .34), '--central': mix(theme.cell, theme.accent, dark ? .14 : .08),
    '--subgoal': mix(theme.cell, theme.accent, dark ? .18 : .10), '--main': mix(theme.cell, theme.accent, dark ? .25 : .18),
    '--accent': theme.accent, '--focus-ring': theme.accent,
    '--highlight': mix(theme.cell, theme.highlight, dark ? .25 : .18), '--highlight-ring': theme.highlight,
    '--input': mix(theme.cell, theme.input, dark ? .23 : .13), '--input-ring': theme.input,
    '--hover': mix(theme.cell, theme.accent, dark ? .25 : .13),
    '--button': dark ? mix(theme.accent, '#000000', .55) : theme.accent, '--button-text': '#ffffff',
    '--danger': dark ? '#ef9b89' : '#a34e40', '--danger-bg': dark ? '#48302c' : '#fff1ea',
    '--danger-button': dark ? '#a8493a' : '#b4594c', '--danger-button-hover': '#963f32',
    '--overlay': dark ? '#00000099' : '#263c2e66',
  };
}
