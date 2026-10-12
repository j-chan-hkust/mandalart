import { emptyBoard, validBoard } from './model';
import type { BoardDocument, Layout } from './model';
export const STORAGE_KEY = 'mandalart.state.v1';
export interface SavedState { version: 1; board: BoardDocument; layout: Layout; }
export interface LoadResult { state: SavedState; error: string | null; writable: boolean; }
export function loadState(storage: Pick<Storage, 'getItem'>): LoadResult {
  const fallback: SavedState = { version: 1, board: emptyBoard(), layout: 'full' };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { state: fallback, error: null, writable: true };
    const data = JSON.parse(raw) as SavedState;
    if (!data || data.version !== 1 || !validBoard(data.board) || !['full', 'focused'].includes(data.layout)) throw new Error('Invalid saved state');
    return { state: data, error: null, writable: true };
  } catch {
    return { state: fallback, error: 'Saved data could not be loaded. Autosave is paused to protect it. Use Clear to start again.', writable: false };
  }
}
export function saveState(storage: Pick<Storage, 'setItem'>, board: BoardDocument, layout: Layout) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, board, layout } satisfies SavedState));
}
export function clearState(storage: Pick<Storage, 'removeItem'>) { storage.removeItem(STORAGE_KEY); }
