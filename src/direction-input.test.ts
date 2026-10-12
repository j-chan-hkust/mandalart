import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DirectionInput } from './direction-input';
import type { Direction } from './model';
describe('direction input timing', () => {
  let seen: Direction[], input: DirectionInput;
  beforeEach(() => { vi.useFakeTimers(); seen = []; input = new DirectionInput(d => seen.push(d)); });
  afterEach(() => { input.reset(false); vi.useRealTimers(); });
  it('preserves an established diagonal across uneven releases', () => {
    input.down('ArrowUp'); input.down('ArrowLeft'); input.up('ArrowUp');
    vi.advanceTimersByTime(60); input.up('ArrowLeft'); vi.advanceTimersByTime(100);
    expect(seen).toEqual(['N', 'NW']);
  });
  it('returns to the remaining axis after the release tolerance', () => {
    input.down('ArrowUp'); input.down('ArrowRight'); input.up('ArrowUp');
    vi.advanceTimersByTime(79); expect(seen.at(-1)).toBe('NE');
    vi.advanceTimersByTime(1); expect(seen.at(-1)).toBe('E');
  });
  it('does not combine non-overlapping taps', () => {
    input.down('ArrowUp'); input.up('ArrowUp'); input.down('ArrowLeft');
    expect(seen).toEqual(['N', 'W']);
  });
  it('cancels opposing axes and recomputes on release', () => {
    input.down('ArrowLeft'); input.down('ArrowRight'); expect(seen).toEqual(['W']);
    input.down('ArrowUp'); expect(seen.at(-1)).toBe('N');
    input.down('ArrowDown'); expect(seen.at(-1)).toBe('N');
    input.up('ArrowDown'); expect(seen.at(-1)).toBe('N');
    input.up('ArrowRight'); expect(seen.at(-1)).toBe('NW');
  });
  it('opposing presses override pending release tolerance', () => {
    input.down('ArrowUp'); input.down('ArrowLeft'); input.up('ArrowUp');
    input.down('ArrowRight'); vi.advanceTimersByTime(100); expect(seen.at(-1)).toBe('NW');
    input.down('ArrowDown'); expect(seen.at(-1)).toBe('S');
  });
  it('blocks held keys across contexts until released and pressed again', () => {
    input.down('ArrowUp'); input.reset(); input.down('ArrowUp'); input.down('ArrowUp', true);
    expect(seen).toEqual(['N']); input.up('ArrowUp'); input.down('ArrowUp'); expect(seen).toEqual(['N', 'N']);
  });
  it('clears timers and keys after window focus loss', () => {
    input.down('ArrowUp'); input.down('ArrowLeft'); input.up('ArrowLeft'); input.reset(false);
    vi.advanceTimersByTime(100); expect(seen).toEqual(['N', 'NW']);
    input.down('ArrowRight'); expect(seen.at(-1)).toBe('E');
  });
});
