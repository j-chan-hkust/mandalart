import { describe, expect, it } from 'vitest';
import { clearState, loadState, saveState, STORAGE_KEY } from './storage';
import { emptyBoard } from './model';
function memoryStorage() {
  const entries = new Map<string, string>();
  return { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); }, removeItem: (key: string) => { entries.delete(key); } };
}
describe('local persistence', () => {
  it('restores content and layout and clears only its own key', () => {
    const storage = memoryStorage(), board = { ...emptyBoard(), mainGoal: 'Learn\nsomething' };
    storage.setItem('unrelated', 'keep'); saveState(storage, board, 'focused');
    expect(loadState(storage).state).toEqual({ version: 1, board, layout: 'focused' });
    clearState(storage); expect(storage.getItem(STORAGE_KEY)).toBe(null); expect(storage.getItem('unrelated')).toBe('keep');
    expect(loadState(storage).state.board.mainGoal).toBe('');
  });
  it('preserves corrupt saved data and pauses autosave', () => {
    const storage = memoryStorage(); storage.setItem(STORAGE_KEY, '{bad');
    expect(loadState(storage).writable).toBe(false); expect(storage.getItem(STORAGE_KEY)).toBe('{bad');
  });
  it('rejects unknown schema versions and incomplete boards', () => {
    const storage = memoryStorage(); storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, board: emptyBoard(), layout: 'full' }));
    expect(loadState(storage).writable).toBe(false);
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, board: { schemaVersion: 1, mainGoal: '', subgoals: {} }, layout: 'full' }));
    expect(loadState(storage).writable).toBe(false);
  });
  it('surfaces storage failures', () => {
    const storage = { getItem: () => { throw new Error('Unavailable'); } };
    expect(loadState(storage).error).toBeTruthy();
    expect(() => saveState({ setItem: () => { throw new Error('Full'); } }, emptyBoard(), 'full')).toThrow();
    expect(() => clearState({ removeItem: () => { throw new Error('Blocked'); } })).toThrow();
  });
});
