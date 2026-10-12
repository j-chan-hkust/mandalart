import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Command, Grid3X3, Maximize2, Trash2 } from 'lucide-react';
import { positions, directionNames, emptyBoard, readText, targetId, targetLabel, writeText } from './model';
import type { BoardDocument, Direction, Layout, Target } from './model';
import { focusedTarget, highlightedTarget, initialInteraction, interactionReducer } from './interaction';
import type { InteractionEvent } from './interaction';
import { arrowKeys, DirectionInput } from './direction-input';
import { clearState, loadState, saveState } from './storage';
import type { LoadResult } from './storage';
import { Button } from './components/ui/button';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from './components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { CellEditor } from './components/CellEditor';

function initialSaved(): LoadResult {
  try { return loadState(window.localStorage); }
  catch { return { state: { version: 1, board: emptyBoard(), layout: 'full' }, error: 'Browser storage is unavailable. Your edits cannot be saved.', writable: false }; }
}
export default function App() {
  const [loaded] = useState(initialSaved);
  const [board, setBoard] = useState<BoardDocument>(loaded.state.board);
  const [layout, setLayout] = useState<Layout>(loaded.state.layout);
  const [interaction, dispatch] = useReducer(interactionReducer, initialInteraction);
  const [storageError, setStorageError] = useState<string | null>(loaded.error);
  const writable = useRef(loaded.writable);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [editorStyle, setEditorStyle] = useState<CSSProperties>({});
  const surfaceRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialCaret = useRef<number | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resetFocus = useRef(false);
  const stateRef = useRef(interaction);
  stateRef.current = interaction;
  const input = useMemo(() => new DirectionInput(direction => dispatch({ type: 'direction', direction })), []);
  const send = useCallback((event: InteractionEvent, focus = true) => {
    input.reset();
    dispatch(event);
    if (focus) requestAnimationFrame(() => {
      if (stateRef.current.editor) textareaRef.current?.focus();
      else surfaceRef.current?.focus({ preventScroll: true });
    });
  }, [input]);
  // Save synchronously per edit: no delayed save can resurrect a cleared document.
  function persist(nextBoard: BoardDocument, nextLayout: Layout) {
    if (!writable.current) return;
    try { saveState(window.localStorage, nextBoard, nextLayout); setStorageError(null); }
    catch { setStorageError('Your latest changes could not be saved locally. Keep this tab open and retry saving.'); }
  }
  function edit(value: string) {
    const target = stateRef.current.editor;
    if (!target) return;
    const next = writeText(board, target, value);
    setBoard(next); persist(next, layout);
  }
  function changeLayout(value: string) {
    if (value !== 'full' && value !== 'focused') return;
    setLayout(value); persist(board, value);
    // The same textarea stays mounted. Mouse layout switches restore its selection.
    if (stateRef.current.editor) requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
  }
  function handleKey(event: ReactKeyboardEvent) {
    if (dialogOpen || event.nativeEvent.isComposing || event.keyCode === 229) return;
    const target = event.target as HTMLElement;
    const editing = target === textareaRef.current;
    if (editing) {
      if (event.key === 'Escape' || (event.key === 'Enter' && (event.metaKey || event.ctrlKey))) {
        event.preventDefault();
        if (!event.repeat) send({ type: 'escape' });
      }
      return;
    }
    if (target !== surfaceRef.current) return;
    if ((arrowKeys as readonly string[]).includes(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault(); input.down(event.key, event.repeat);
    } else if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault(); if (!event.repeat) send({ type: event.key === 'Enter' ? 'enter' : 'escape' });
    } else if (Array.from(event.key).length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      const textTarget = highlightedTarget(stateRef.current) ?? focusedTarget(stateRef.current);
      const value = readText(board, textTarget) + event.key;
      const next = writeText(board, textTarget, value);
      initialCaret.current = value.length;
      setBoard(next);
      persist(next, layout);
      send({ type: 'edit', target: textTarget });
    }
  }
  useEffect(() => {
    surfaceRef.current?.focus({ preventScroll: true });
    const up = (event: KeyboardEvent) => input.up(event.key);
    const blur = () => input.reset(false);
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    return () => { input.reset(false); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
  }, [input]);
  const editor = interaction.editor;
  const editorId = editor ? targetId(editor) : null;
  const enlarged = layout === 'focused' && interaction.context !== null;
  useLayoutEffect(() => {
    if (!editorId) return;
    const position = () => {
      const surface = surfaceRef.current;
      const cell = surface?.querySelector<HTMLElement>(`[data-anchor="${editorId}"]`);
      if (!surface || !cell) return;
      const base = surface.getBoundingClientRect(), rect = cell.getBoundingClientRect();
      setEditorStyle({ left: rect.left - base.left, top: rect.top - base.top, width: rect.width, height: rect.height });
    };
    position();
    const observer = new ResizeObserver(position);
    if (surfaceRef.current) observer.observe(surfaceRef.current);
    window.addEventListener('resize', position);
    return () => { observer.disconnect(); window.removeEventListener('resize', position); };
  }, [editorId, layout, interaction.context]);
  useLayoutEffect(() => {
    if (editorId) {
      textareaRef.current?.focus({ preventScroll: true });
      if (initialCaret.current !== null) {
        textareaRef.current?.setSelectionRange(initialCaret.current, initialCaret.current);
        initialCaret.current = null;
      }
    }
    else surfaceRef.current?.focus({ preventScroll: true });
  }, [editorId, interaction.context]);
  const focusId = targetId(focusedTarget(interaction));
  const highlighted = highlightedTarget(interaction);
  const highlightId = highlighted ? targetId(highlighted) : null;

  function cell(target: Target, central: boolean, index: number) {
    const id = targetId(target), text = readText(board, target);
    const focused = id === focusId, highlightedCell = id === highlightId, editingCell = id === editorId;
    const anchor = target.kind !== 'subgoal' || !central;
    const placeholder = target.kind === 'main' ? 'What do you want to achieve?' : target.kind === 'subgoal' ? 'Add a subgoal' : 'Add an action';
    return <div key={index} className={`cell ${target.kind === 'main' ? 'main-cell' : ''} ${target.kind === 'subgoal' ? 'subgoal-cell' : ''} ${focused ? 'is-focused' : ''} ${highlightedCell ? 'is-highlighted' : ''} ${editingCell ? 'is-input' : ''}`} data-target={id} data-anchor={anchor ? id : undefined}>
      <button tabIndex={-1} className="cell-text" aria-label={`Edit ${targetLabel(target)}${text ? `: ${text}` : ''}`} onClick={() => send({ type: 'edit', target })}>
        <span className={text ? 'cell-value' : 'cell-placeholder'}>{text || placeholder}</span>
      </button>
      {target.kind === 'subgoal' && <button className="open-block" aria-label={`Open ${directionNames[target.subgoal]} action block`} title="Focus this action block" onClick={() => send({ type: 'open', direction: target.subgoal })}><ArrowUpRight size={13}/></button>}
    </div>;
  }
  function block(direction: Direction | null) {
    const central = direction === null;
    const active = interaction.context === direction && direction !== null;
    return <section key={direction || 'center'} className={`block ${central ? 'central-block' : 'outer-block'} ${active ? 'active-block' : ''}`} data-block={direction || 'center'} aria-label={central ? 'Main goal and subgoals' : `${directionNames[direction]} actions`}>
      {positions.map((position, index) => {
        const target: Target = central ? position ? { kind: 'subgoal', subgoal: position } : { kind: 'main' } : position ? { kind: 'action', subgoal: direction, action: position } : { kind: 'subgoal', subgoal: direction };
        return cell(target, central, index);
      })}
    </section>;
  }
  function confirmClear() {
    try { clearState(window.localStorage); }
    catch { setClearError('Saved state could not be deleted. Please check your browser storage settings and try again.'); return; }
    input.reset(); writable.current = true; setStorageError(null); setBoard(emptyBoard()); setLayout('full'); dispatch({ type: 'reset' }); resetFocus.current = true; setDialogOpen(false);
  }

  return <div className="app-shell" onKeyDown={handleKey}>
    <main>
      <section className="workspace">
        <div className="workspace-toolbar">
          <a className="brand" href="#" onClick={e => { e.preventDefault(); send({ type: 'home' }); }}>mandalart<span className="brand-dot">.</span></a>
          <div className="toolbar-actions">
            <span className={`save-status ${storageError ? 'save-error' : ''}`}><span className="status-dot"/>{storageError ? 'Save needs attention' : 'Saved locally'}</span>
            {interaction.context && <Button variant="ghost" onClick={() => send({ type: 'home' })}><ArrowLeft size={15}/>Main goal</Button>}
            <ToggleGroup type="single" value={layout} onValueChange={changeLayout} aria-label="Board layout" onMouseDown={e => { if (editor) e.preventDefault(); }}>
              <ToggleGroupItem value="full" aria-label="Full board"><Grid3X3 size={14}/>Full board</ToggleGroupItem><ToggleGroupItem value="focused" aria-label="Focused block"><Maximize2 size={14}/>Focused block</ToggleGroupItem>
            </ToggleGroup>
            <AlertDialog open={dialogOpen} onOpenChange={open => { input.reset(); setClearError(null); setDialogOpen(open); }}>
              <AlertDialogTrigger asChild><Button variant="ghost" className="clear-button"><Trash2 size={15}/>Clear</Button></AlertDialogTrigger>
              <AlertDialogContent onOpenAutoFocus={e => { e.preventDefault(); cancelRef.current?.focus(); }} onCloseAutoFocus={e => { if (resetFocus.current) { e.preventDefault(); resetFocus.current = false; requestAnimationFrame(() => surfaceRef.current?.focus()); } }} onEscapeKeyDown={() => setDialogOpen(false)}>
                <div className="dialog-icon"><Trash2 size={22}/></div>
                <AlertDialogTitle className="dialog-title">Clear saved board?</AlertDialogTitle>
                <AlertDialogDescription className="dialog-description">This will delete your locally saved board and layout preference. All goals and actions will be cleared. This cannot be undone.</AlertDialogDescription>
                {clearError && <p className="clear-error" role="alert">{clearError}</p>}
                <div className="dialog-actions"><AlertDialogCancel asChild><Button ref={cancelRef} variant="outline">Cancel</Button></AlertDialogCancel><Button variant="destructive" onClick={confirmClear}>Clear saved state</Button></div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {storageError && <div className="storage-alert" role="alert">{storageError}{writable.current && <Button variant="outline" onClick={() => persist(board, layout)}>Retry saving</Button>}</div>}
        <div className="board-padding">
          <div ref={surfaceRef} tabIndex={0} role="group" aria-label={`Mandalart board. ${editor ? `Editing ${targetLabel(editor)}` : `Focused on ${interaction.context ? `${directionNames[interaction.context]} subgoal` : 'main goal'}`}. Use arrow keys to highlight, Enter to select or edit, and Escape to go back.`} className={`board ${enlarged ? 'board-enlarged' : ''}`} data-active-block={interaction.context || ''} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) input.reset(); }}>
            {positions.map(block)}
            {editor && <CellEditor textareaRef={textareaRef} style={editorStyle} label={`Input ${targetLabel(editor)}`} value={readText(board, editor)} onChange={edit} mainGoal={editor.kind === 'main'}/>}
          </div>
        </div>
        <footer className="workspace-footer">
          <div className="mode-indicator" aria-live="polite"><span className={`mode-dot ${editor ? 'input-dot' : 'focus-dot'}`}/>{editor ? 'Input' : 'Focus'}</div>
          <div className="keyboard-guide">{editor ? <><span><kbd>Enter</kbd> New line</span><span><kbd><Command size={11}/>/ Ctrl</kbd><kbd>Enter</kbd> Finish</span><span><kbd>Esc</kbd> Finish</span></> : <><span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> Direction</span><span><kbd>Enter</kbd> Select / edit</span><span>Type to edit</span><span><kbd>Esc</kbd> Back</span><span>Two arrows for diagonals</span></>}</div>
          <div className="legend"><span><i className="legend-highlight"/>Highlight</span><span><i className="legend-focus"/>Focus</span><span><i className="legend-input"/>Input</span></div>
        </footer>
      </section>
    </main>
  </div>;
}
