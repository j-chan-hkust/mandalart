import type { Direction, Target } from './model';
export interface Interaction { context: Direction | null; highlight: Direction | null; editor: Target | null; }
export const initialInteraction: Interaction = { context: null, highlight: null, editor: null };
export type InteractionEvent = { type: 'direction'; direction: Direction } | { type: 'enter' } | { type: 'escape' } | { type: 'edit'; target: Target } | { type: 'open'; direction: Direction } | { type: 'reset' } | { type: 'home' };
export function focusedTarget(s: Interaction): Target { return s.context ? { kind: 'subgoal', subgoal: s.context } : { kind: 'main' }; }
export function highlightedTarget(s: Interaction): Target | null { return !s.highlight ? null : s.context ? { kind: 'action', subgoal: s.context, action: s.highlight } : { kind: 'subgoal', subgoal: s.highlight }; }
function beginInput(target: Target): Interaction {
  return {
    context: target.kind === 'main' ? null : target.subgoal,
    highlight: target.kind === 'action' ? target.action : null,
    editor: target,
  };
}
export function interactionReducer(s: Interaction, e: InteractionEvent): Interaction {
  switch (e.type) {
    case 'reset': case 'home': return { ...initialInteraction };
    case 'direction': return s.editor ? s : { ...s, highlight: e.direction };
    case 'open': return { context: e.direction, highlight: null, editor: null };
    case 'edit': return beginInput(e.target);
    case 'enter':
      if (s.editor) return s;
      if (!s.highlight) return beginInput(focusedTarget(s));
      if (!s.context) return { context: s.highlight, highlight: null, editor: null };
      return beginInput(highlightedTarget(s)!);
    case 'escape':
      if (s.editor) return { context: s.editor.kind === 'action' ? s.editor.subgoal : null, highlight: null, editor: null };
      if (s.context) return { ...initialInteraction };
      return { ...s, highlight: null };
  }
}
