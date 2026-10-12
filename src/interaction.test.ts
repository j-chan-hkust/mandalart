import { describe, expect, it } from 'vitest';
import { initialInteraction, interactionReducer as reduce } from './interaction';
import { emptyBoard, readText, writeText } from './model';
describe('navigation and editing', () => {
  it('focuses subgoals, opens actions directly, and backtracks', () => {
    let s = reduce(initialInteraction, { type: 'direction', direction: 'NE' });
    s = reduce(s, { type: 'enter' }); expect(s).toEqual({ context: 'NE', highlight: null, editor: null });
    s = reduce(s, { type: 'enter' }); expect(s.editor).toEqual({ kind: 'subgoal', subgoal: 'NE' });
    s = reduce(s, { type: 'escape' }); expect(s).toEqual(initialInteraction);
    s = reduce(s, { type: 'open', direction: 'NE' }); s = reduce(s, { type: 'direction', direction: 'W' });
    s = reduce(s, { type: 'enter' }); expect(s.editor).toEqual({ kind: 'action', subgoal: 'NE', action: 'W' });
    s = reduce(s, { type: 'escape' }); expect(s).toEqual({ context: 'NE', highlight: null, editor: null });
    s = reduce(s, { type: 'escape' }); expect(s).toEqual(initialInteraction);
  });
  it('ignores directions while editing and directly opens clicked targets', () => {
    const s = reduce(initialInteraction, { type: 'edit', target: { kind: 'action', subgoal: 'S', action: 'E' } });
    expect(reduce(s, { type: 'direction', direction: 'N' })).toEqual(s);
    expect(reduce(s, { type: 'escape' })).toEqual({ context: 'S', highlight: null, editor: null });
  });
  it('returns to the main goal with no highlight after directly editing a highlighted subgoal', () => {
    const previous = reduce(initialInteraction, { type: 'direction', direction: 'N' });
    const editing = reduce(previous, { type: 'edit', target: { kind: 'subgoal', subgoal: 'N' } });
    expect(reduce(editing, { type: 'escape' })).toEqual(initialInteraction);
  });
  it('returns to the final edited cell’s parent after switching editors with the mouse', () => {
    const previous = { context: 'W' as const, highlight: 'S' as const, editor: null };
    let editing = reduce(previous, { type: 'edit', target: { kind: 'action', subgoal: 'N', action: 'E' } });
    editing = reduce(editing, { type: 'edit', target: { kind: 'subgoal', subgoal: 'SE' } });
    expect(reduce(editing, { type: 'escape' })).toEqual(initialInteraction);
    editing = reduce(editing, { type: 'edit', target: { kind: 'action', subgoal: 'E', action: 'N' } });
    expect(reduce(editing, { type: 'escape' })).toEqual({ context: 'E', highlight: null, editor: null });
  });
  it('returns to the main goal after editing an explicitly focused subgoal title', () => {
    const previous = reduce(initialInteraction, { type: 'open', direction: 'E' });
    const editing = reduce(previous, { type: 'enter' });
    expect(reduce(editing, { type: 'escape' })).toEqual(initialInteraction);
  });
  it('updates shared subgoal text without overwriting its actions', () => {
    let board = writeText(emptyBoard(), { kind: 'action', subgoal: 'N', action: 'W' }, 'Do it');
    board = writeText(board, { kind: 'subgoal', subgoal: 'N' }, 'Health');
    expect(readText(board, { kind: 'subgoal', subgoal: 'N' })).toBe('Health');
    expect(readText(board, { kind: 'action', subgoal: 'N', action: 'W' })).toBe('Do it');
  });
});
