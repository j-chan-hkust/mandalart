import { describe, expect, it } from 'vitest';
import { clearState, loadState, saveState, STORAGE_KEY } from './storage';
import { emptyBoard } from './model';
function memoryStorage() {
  const entries = new Map<string, string>();
  return { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); }, removeItem: (key: string) => { entries.delete(key); } };
}
describe('local persistence', () => {
  it('restores content and clears only its own key', () => {
    const storage = memoryStorage(), board = { ...emptyBoard(), mainGoal: 'Learn\nsomething' };
    storage.setItem('unrelated', 'keep'); saveState(storage, board);
    expect(loadState(storage).state).toEqual({ version: 1, board: { ...board, mainGoal: 'Learn something' } });
    clearState(storage); expect(storage.getItem(STORAGE_KEY)).toBe(null); expect(storage.getItem('unrelated')).toBe('keep');
    expect(loadState(storage).state.board.mainGoal).toBe('');
  });
  it('loads former focused-layout saves without losing content and drops the obsolete preference on save', () => {
    const storage = memoryStorage(), board = { ...emptyBoard(), mainGoal: 'Keep my plan' };
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, board, layout: 'focused' }));
    const loaded = loadState(storage);
    expect(loaded.writable).toBe(true);
    expect(loaded.state).toEqual({ version: 1, board });
    saveState(storage, loaded.state.board);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toEqual({ version: 1, board });
  });
  it('preserves corrupt saved data and pauses autosave', () => {
    const storage = memoryStorage(); storage.setItem(STORAGE_KEY, '{bad');
    expect(loadState(storage).writable).toBe(false); expect(storage.getItem(STORAGE_KEY)).toBe('{bad');
  });
  it('saves the palette alongside the board and clears both together', () => {
    const storage = memoryStorage(), board = { ...emptyBoard(), mainGoal: 'My plan' };
    saveState(storage, board, 'graphite');
    expect(loadState(storage).state).toEqual({ version: 1, board, theme: 'graphite' });
    clearState(storage);
    expect(loadState(storage).state).toEqual({ version: 1, board: emptyBoard() });
  });
  it('loads unknown palette preferences without rejecting valid board content', () => {
    const storage = memoryStorage(), board = { ...emptyBoard(), mainGoal: 'Keep this' };
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, board, theme: 'retired-palette' }));
    expect(loadState(storage).state).toEqual({ version: 1, board, theme: 'cloud' });
    expect(loadState(storage).writable).toBe(true);
  });
  it('preserves system appearance rather than saving its currently resolved color scheme', () => {
    const storage = memoryStorage();
    saveState(storage, emptyBoard(), 'system');
    expect(loadState(storage).state.theme).toBe('system');
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
    expect(() => saveState({ setItem: () => { throw new Error('Full'); } }, emptyBoard())).toThrow();
    expect(() => clearState({ removeItem: () => { throw new Error('Blocked'); } })).toThrow();
  });
});
