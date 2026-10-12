export const directions = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'] as const;
export type Direction = typeof directions[number];
export const positions: (Direction | null)[] = ['NW', 'N', 'NE', 'W', null, 'E', 'SW', 'S', 'SE'];
export const directionNames: Record<Direction, string> = { NW: 'Northwest', N: 'North', NE: 'Northeast', W: 'West', E: 'East', SW: 'Southwest', S: 'South', SE: 'Southeast' };
export type Layout = 'full' | 'focused';
export interface BoardDocument {
  schemaVersion: 1;
  mainGoal: string;
  subgoals: Record<Direction, { title: string; actions: Record<Direction, string> }>;
}
export type Target = { kind: 'main' } | { kind: 'subgoal'; subgoal: Direction } | { kind: 'action'; subgoal: Direction; action: Direction };
export function emptyBoard(): BoardDocument {
  return { schemaVersion: 1, mainGoal: '', subgoals: Object.fromEntries(directions.map(d => [d, { title: '', actions: Object.fromEntries(directions.map(a => [a, ''])) }])) as BoardDocument['subgoals'] };
}
export function targetId(t: Target): string { return t.kind === 'main' ? 'main' : t.kind === 'subgoal' ? `subgoal-${t.subgoal}` : `action-${t.subgoal}-${t.action}`; }
export function targetLabel(t: Target): string { return t.kind === 'main' ? 'Main goal' : t.kind === 'subgoal' ? `${directionNames[t.subgoal]} subgoal` : `${directionNames[t.subgoal]} subgoal, ${directionNames[t.action]} action`; }
export function readText(board: BoardDocument, t: Target): string { return t.kind === 'main' ? board.mainGoal : t.kind === 'subgoal' ? board.subgoals[t.subgoal].title : board.subgoals[t.subgoal].actions[t.action]; }
export function writeText(board: BoardDocument, t: Target, value: string): BoardDocument {
  if (t.kind === 'main') return { ...board, mainGoal: value };
  const goal = board.subgoals[t.subgoal];
  return { ...board, subgoals: { ...board.subgoals, [t.subgoal]: t.kind === 'subgoal' ? { ...goal, title: value } : { ...goal, actions: { ...goal.actions, [t.action]: value } } } };
}
export function validBoard(value: unknown): value is BoardDocument {
  if (!value || typeof value !== 'object') return false;
  const b = value as BoardDocument;
  return b.schemaVersion === 1 && typeof b.mainGoal === 'string' && !!b.subgoals && directions.every(d => {
    const g = b.subgoals[d];
    return !!g && typeof g.title === 'string' && !!g.actions && directions.every(a => typeof g.actions[a] === 'string');
  });
}
