# Mandalart web app specifications

## Purpose and status

Build a Mandalart planning app whose primary design priority is a precise, forgiving keyboard workflow. Users organize one main goal into eight subgoals, each with eight concrete actions.

**Platform scope (confirmed):** this is a desktop, keyboard-centric app. Phone layouts, mobile-specific interactions, and mobile usability validation are out of scope. Mouse interaction supplements the keyboard workflow.

This document captures the README and subsequent planning discussion. Both layout variants, direct entry into action input mode, browser-local persistence, and clearing saved state with confirmation are agreed requirements. Technical choices and unspecified behaviors below are working proposals; the open questions section identifies decisions still to confirm.

Reference: [Mandalart planner](https://www.ourmindfullife.com/mandalart-planner/).

## Board structure

- Display nine 3×3 blocks arranged as a 3×3 board: 81 visible cells.
- The central block contains the main goal at its center and eight surrounding subgoals.
- Each outer block contains the corresponding subgoal at its center and eight surrounding actions.
- A subgoal's position in the central block determines the position of its outer block.
- Store 73 distinct text values: one main goal, eight subgoal titles, and 64 actions. Each subgoal title is rendered twice from the same stored value.
- Editing a subgoal through either representation updates both immediately.

Use a consistent directional ordering throughout the data and UI: northwest, north, northeast, west, east, southwest, south, southeast.

## Interaction states

Distinguish these concepts explicitly:

- **Focus:** the main goal or subgoal currently serving as the navigation context, without text input active.
- **Highlight:** a candidate child selected by directional input, without changing the navigation context.
- **Input:** an active text editor for the main goal, a subgoal, or an action.

Actions have no separate focused state. Enter on a highlighted action opens its editor immediately.

On initial load, focus the main goal with no child highlighted and no editor open.

### Keyboard transitions

| Current state | Arrow keys | Enter | Escape |
| --- | --- | --- | --- |
| Main goal focused, no highlight | Highlight a subgoal | Open main goal input | No change |
| Main goal focused, subgoal highlighted | Change highlighted subgoal | Focus that subgoal and clear the highlight | Clear the highlight |
| Subgoal focused, no highlight | Highlight an action | Open subgoal input | Return focus to the main goal |
| Subgoal focused, action highlighted | Change highlighted action | Open that action's input immediately | Return focus to the main goal |
| Main goal input | Normal text cursor movement | Insert a newline | Keep text and return to main goal focus |
| Subgoal input | Normal text cursor movement | Insert a newline | Keep text and return to that subgoal's focus |
| Action input | Normal text cursor movement | Insert a newline | Keep text, return focus to the parent subgoal, and retain the action highlight |

When returning from a subgoal to the main goal, clear the child highlight. After leaving action input, Enter reopens that action; Escape returns to the main goal.

**Switching actions (confirmed):** finish editing with Escape or Command/Ctrl+Enter, use arrow keys from the parent subgoal to highlight another action, then press Enter to edit it. No additional action-switching shortcut is required. Tab and Shift+Tab retain their normal focus-navigation behavior.

Typing starts only after entering input mode. Escape exits input without discarding text. While editing, arrow keys belong to the text field, and navigation shortcuts must not interfere with text composition.

**Confirmed input shortcuts:** Enter inserts a newline. Command+Enter on macOS and Ctrl+Enter on Windows/Linux finish editing with exactly the same transition as Escape, preserving the text without inserting a newline. For action input, this returns focus to the parent subgoal and retains the action highlight; actions never gain a separate focused state. Finishing editing is not required for autosave.

### Directional selection (confirmed)

Arrow keys select relative to the focused goal. For example, Right selects the eastern child; pressing Right again keeps that same child highlighted. Up + Left selects the northwestern child.

The same direction interpreter must serve both subgoal and action selection.

When highlighting a subgoal from the main goal, highlight both its cell in the central block and its matching outer block center.

## Forgiving directional input

Track held arrow keys and their event times together, rather than treating each keydown as an independent navigation step.

Proposed behavior:

1. A single direction highlights its child immediately.
2. Two perpendicular held directions produce a diagonal, even when pressed at slightly different times.
3. When one key in a diagonal is released, retain the diagonal briefly to tolerate uneven release timing.
4. If both keys are released within that tolerance, keep the diagonal highlighted.
5. If the remaining key stays held beyond the tolerance, change to its cardinal direction.
6. Once all keys are released, keep the last highlighted destination until a new selection, Enter, or Escape.

Start with an **80 ms release tolerance** as a tunable prototype value. This is a proposed starting point, not a validated threshold. **Diagonal selection requires overlapping perpendicular key presses (confirmed).** Non-overlapping taps never combine into a diagonal, regardless of how close together they occur. Release tolerance preserves an already established diagonal; it does not create one from successive taps.

Implementation requirements:

- Ignore browser key repeat for navigation and mode transitions.
- Cancel pending input timers and clear held-key state when the window loses focus or the page becomes hidden.
- Reset directional interpretation when changing navigation context or entering input. Keys held across a transition must not select children in the new context until released and pressed again.
- Enter acts on the destination currently displayed as highlighted, including during release tolerance.
- Prevent arrow-key page scrolling only while the board handles navigation.
- Keep timing and direction interpretation independent from rendering.
- Opposing arrow keys cancel on each axis (confirmed): Left + Right produces no horizontal direction, and Up + Down produces no vertical direction. Any uncanceled axis still selects its direction; for example, Left + Right + Up selects north. If both axes resolve to zero, retain the existing highlight. Recompute from the remaining held keys when an opposing key is released. Cancellation takes precedence over diagonal release tolerance.

Research background: [Godot's input API](https://docs.godotengine.org/en/4.6/classes/class_input.html) combines directional actions into a vector; [Programming Responsiveness](https://www.gamedeveloper.com/programming/programming-responsiveness) discusses timing tolerance in game input. The behavior and timing above are app-specific proposals informed by these ideas.

## Layout variants

Build both variants and provide a visible toggle for comparison. Both use the same document data, navigation state, and keyboard interpreter.

### Full board

- Keep all 81 cells in place.
- Clearly outline the active subgoal's outer 3×3 block when navigating or editing within it.
- Use the shared highlight, focus, and input styling to indicate the current interaction.

### Focused block

- Start with the full board while the main goal is focused.
- Focusing a subgoal enlarges its corresponding outer 3×3 block into the main view.
- Keep the enlarged block visible while editing its subgoal title or actions.
- Returning focus to the main goal restores the full board.
- Escape from action input first returns to the parent subgoal within the enlarged block; the next Escape restores the full board.

Switching variants preserves text, navigation context, highlight, and any active editing session. Layout changes must not reset the editor or lose its caret/selection.

## Visual and accessibility requirements

- Use distinct colors for highlight, focus, and input modes, as requested in the README.
- Supplement color with structural cues: a tinted highlight, a strong focus outline, and a recognizable text field with a caret.
- Make the active navigation context clear even when a different cell is highlighted.
- Provide a compact keyboard hint that reflects the current mode.
- Keep browser focus and application navigation state coordinated, with an accessible label for the active cell/editor.
- Allow users to leave the board with Tab; do not trap keyboard focus.
- Exact colors, typography, and animation are flexible. shadcn is an acceptable starting point for supporting controls.

### Mouse interaction (confirmed)

- Clicking any text cell immediately opens its editor, including either representation of a subgoal title. No preliminary focus-only click is required.
- Opening an action editor sets its parent subgoal as the navigation context. Leaving input follows the same transitions as keyboard editing.
- Provide a separate, clearly labeled control for each subgoal to focus/open its action block without editing the title. In Full board mode this activates the block in place; in Focused block mode it enlarges the block into the main view.
- Activating that control must not also open the title editor. It must be usable with mouse and keyboard.
- Switching to another cell preserves edits to the previous cell and opens the new editor immediately.

## Technical design

### Stack and tooling (confirmed)

- **React:** render the board, editors, and both layout variants from shared application state.
- **TypeScript:** define document types, interaction states, and keyboard events explicitly.
- **Vite:** provide the development server and production build for a browser application.
- **CSS Grid:** implement the board and its 3×3 blocks with custom styling.
- **shadcn/ui:** provide supporting controls such as the layout toggle and Clear confirmation dialog.
- **Browser-local persistence:** keep the single board on the user's browser; the initial app requires no application backend.

Vitest covers the input interpreter, interaction state machine, and storage adapter. Browser verification covers real keyboard events, focus, layout switching with caret preservation, and the Clear dialog.

### Architecture and data model

Separate the implementation into:

1. **Document model:** main goal, subgoals, and actions, with each subgoal title stored once.
2. **Input interpreter:** held keys, timing tolerance, and directional selection.
3. **Interaction state machine:** focus, highlight, input target, and explicit Enter/Escape transitions.
4. **Views:** full board and focused block, rendering shared state.
5. **Persistence adapter:** loading and saving document content independently of transient interaction state.

Suggested document shape:

```ts
type Direction = 'NW' | 'N' | 'NE' | 'W' | 'E' | 'SW' | 'S' | 'SE';

interface BoardDocument {
  schemaVersion: 1;
  mainGoal: string;
  subgoals: Record<Direction, {
    title: string;
    actions: Record<Direction, string>;
  }>;
}
```

Represent input targets explicitly as the main goal, a subgoal direction, or a subgoal/action direction pair. Avoid storing duplicate text in view state. Keep layout choice independent of the interaction state machine.

**Initial scope (confirmed):** support exactly one locally saved board. Multiple boards and JSON import/export are out of scope. A JSON export button and a print-to-PNG button are possible future additions, not part of the initial implementation.

## Browser-local storage and clearing state

- Store exactly one board locally in the browser and automatically save edits, including text entered before leaving input mode.
- Restore saved content after refresh or reopening the app. Start navigation at the main goal as specified above; held keys, input timers, and active editors are transient.
- Use `localStorage` with versioned, app-specific keys as the proposed storage implementation. Persist the layout preference alongside board content.
- Implementation: save synchronously on each content or preference change using `mandalart.state.v1`. Its JSON payload contains `{ version: 1, board, layout }`. Transient navigation state is not saved. There are no delayed autosave writes.
- Validate the saved version, all 73 text fields, and the layout before loading. Invalid saved data remains untouched and autosave is paused until the user explicitly clears it.
- Handle unavailable storage, failed writes, and invalid saved data explicitly; do not claim an edit was saved when persistence fails.
- Provide a visible **Clear** button that opens a confirmation dialog before deleting any state.
- The dialog explains that clearing deletes the locally saved board and app preferences, and provides **Cancel** and **Clear saved state** actions. Initially focus Cancel; Escape cancels. Suspend board keyboard shortcuts while the dialog is open.
- Canceling preserves content, preferences, and the previous interaction state, then restores focus to the invoking control.
- Confirming removes this app's saved state, resets the in-memory board and preferences to their initial defaults, and returns focus to the empty main goal with no highlight or active editor.
- Cancel pending autosaves and input timers during a confirmed reset so stale content cannot be written back. Delete only this app's storage keys, rather than clearing all storage for the origin.
- If deletion fails, show the failure instead of claiming saved state was cleared.

## Implementation sequence

1. Confirm remaining input decisions.
2. Build a minimal board and explicit interaction state machine, including direct action input.
3. Implement and tune directional input using recorded press/release sequences and hands-on use.
4. Build both layout variants with shared state and a toggle.
5. Add browser-local autosave for the single board, the Clear confirmation flow, accessibility details, and visual polish.

## Acceptance scenarios

- Initial focus is the main goal; Enter opens its editor and Escape exits without losing text.
- Highlighting a subgoal marks both of its visible representations.
- Enter on a highlighted subgoal focuses it; another Enter opens its title editor.
- A title change appears in both subgoal representations.
- Enter on a highlighted action opens input immediately, with no intermediate focused-action state.
- Escape from action input retains its highlight within the parent subgoal; another Escape returns to the main goal.
- Slightly staggered, overlapping diagonal key presses and uneven releases select and retain the intended diagonal.
- Non-overlapping Up then Left taps select north then west, never northwest.
- Holding one direction beyond the diagonal release tolerance switches to that direction.
- Opposing directions cancel per axis: Left + Right retains the existing highlight, Left + Right + Up selects north, and all four arrows retain the existing highlight.
- Repeated browser keydown events do not cause unintended transitions.
- Leaving the window while keys are held does not produce stuck input on return.
- Arrow keys work normally inside the editor.
- Clicking any text cell opens input immediately; the separate subgoal control opens its action block without editing its title.
- Enter inserts a newline in every editor. Command+Enter on macOS or Ctrl+Enter on Windows/Linux keeps the text and performs the same transition as Escape without adding a newline.
- Both layouts implement identical keyboard transitions.
- Switching layouts preserves text, navigation state, and active editing state.
- Refreshing or reopening restores saved board content and layout preference, including edits made before exiting input mode.
- Clicking Clear opens confirmation without deleting anything; Cancel or Escape preserves state.
- Confirming Clear removes saved board content and preferences and returns to an empty board focused on the main goal.
- Refreshing after Clear does not restore deleted content, and pending autosaves cannot resurrect it.
- Clearing app state leaves unrelated browser storage untouched.

## Open decisions

- Choose the default layout after trying both variants.

The initial implementation starts in Full board mode and remembers the user's layout selection. The final default can be revisited after comparing both variants.
