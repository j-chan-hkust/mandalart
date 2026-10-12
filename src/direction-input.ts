import type { Direction } from './model';
export const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const;
export const RELEASE_TOLERANCE_MS = 80;
const isArrow = (key: string) => (arrowKeys as readonly string[]).includes(key);
/** Interprets real held keys. A timer can preserve, but never create, a diagonal. */
export class DirectionInput {
  private held = new Set<string>();
  private blocked = new Set<string>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private last: Direction | null = null;
  constructor(private select: (d: Direction) => void, private tolerance = RELEASE_TOLERANCE_MS) {}
  private cancelTimer() { if (this.timer !== null) clearTimeout(this.timer); this.timer = null; }
  private vector(): Direction | null {
    const x = Number(this.held.has('ArrowRight')) - Number(this.held.has('ArrowLeft'));
    const y = Number(this.held.has('ArrowDown')) - Number(this.held.has('ArrowUp'));
    return x || y ? `${y < 0 ? 'N' : y > 0 ? 'S' : ''}${x < 0 ? 'W' : x > 0 ? 'E' : ''}` as Direction : null;
  }
  private emit() { const d = this.vector(); if (d) { this.last = d; this.select(d); } }
  down(key: string, repeat = false) {
    if (!isArrow(key) || repeat || this.blocked.has(key) || this.held.has(key)) return;
    this.cancelTimer(); this.held.add(key); this.emit();
  }
  up(key: string) {
    this.blocked.delete(key);
    if (!this.held.has(key)) return;
    const before = this.vector();
    this.held.delete(key); this.cancelTimer();
    const after = this.vector();
    if (!after) return;
    if (before?.length === 2 && after.length === 1 && this.last === before) {
      this.timer = setTimeout(() => { this.timer = null; this.emit(); }, this.tolerance);
    } else this.emit();
  }
  /** Block keys carried across contexts until an actual keyup. */
  reset(blockHeld = true) {
    this.cancelTimer();
    if (blockHeld) for (const key of this.held) this.blocked.add(key);
    else this.blocked.clear();
    this.held.clear(); this.last = null;
  }
}
