import { describe, expect, it } from 'vitest';
import { emptyBoard, singleLineBoard, singleLineText, writeText } from './model';
describe('single-line cell content', () => {
  it('replaces pasted line breaks with spaces without joining words', () => {
    expect(singleLineText('First\r\nSecond\n\nThird\u2028Fourth')).toBe('First Second Third Fourth');
  });
  it('normalizes edits for goals, subgoals, and actions', () => {
    let board = writeText(emptyBoard(), { kind: 'main' }, 'Main\ngoal');
    board = writeText(board, { kind: 'subgoal', subgoal: 'N' }, 'Sub\ngoal');
    board = writeText(board, { kind: 'action', subgoal: 'N', action: 'E' }, 'One\naction');
    expect(board.mainGoal).toBe('Main goal');
    expect(board.subgoals.N.title).toBe('Sub goal');
    expect(board.subgoals.N.actions.E).toBe('One action');
  });
  it('converts older multiline board content while preserving the words', () => {
    const old = emptyBoard(); old.mainGoal = 'My\nplan'; old.subgoals.W.title = 'Be\nhealthy'; old.subgoals.W.actions.S = 'Walk\ndaily';
    const normalized = singleLineBoard(old);
    expect(normalized.mainGoal).toBe('My plan');
    expect(normalized.subgoals.W.title).toBe('Be healthy');
    expect(normalized.subgoals.W.actions.S).toBe('Walk daily');
    expect(old.mainGoal).toBe('My\nplan');
  });
});
