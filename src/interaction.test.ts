import { describe, expect, it } from 'vitest';
import { initialInteraction, interactionReducer as reduce } from './interaction';
import { emptyBoard, readText, writeText } from './model';
describe('navigation and editing', () => {
  it('focuses subgoals, opens actions directly, and backtracks', () => {
    let s = reduce(initialInteraction, { type: 'direction', direction: 'NE' });
    s = reduce(s, { type: 'enter' }); expect(s).toEqual({ context: 'NE', highlight: null, editor: null });
    s = reduce(s, { type: 'enter' }); expect(s.editor).toEqual({ kind: 'subgoal', subgoal: 'NE' });
    s = reduce(s, { type: 'escape' }); s = reduce(s, { type: 'direction', direction: 'W' });
    s = reduce(s, { type: 'enter' }); expect(s.editor).toEqual({ kind: 'action', subgoal: 'NE', action: 'W' });
    s = reduce(s, { type: 'escape' }); expect(s).toEqual({ context: 'NE', highlight: 'W', editor: null });
    s = reduce(s, { type: 'escape' }); expect(s).toEqual(initialInteraction);
  });
  it('ignores directions while editing and directly opens clicked targets', () => {
    const s = reduce(initialInteraction, { type: 'edit', target: { kind: 'action', subgoal: 'S', action: 'E' } });
    expect(reduce(s, { type: 'direction', direction: 'N' })).toEqual(s);
    expect(reduce(s, { type: 'escape' })).toEqual({ context: 'S', highlight: 'E', editor: null });
  });
  it('updates shared subgoal text without overwriting its actions', () => {
    let board = writeText(emptyBoard(), { kind: 'action', subgoal: 'N', action: 'W' }, 'Do it');
    board = writeText(board, { kind: 'subgoal', subgoal: 'N' }, 'Health');
    expect(readText(board, { kind: 'subgoal', subgoal: 'N' })).toBe('Health');
    expect(readText(board, { kind: 'action', subgoal: 'N', action: 'W' })).toBe('Do it');
  });
});
