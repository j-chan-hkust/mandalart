# Mandalart web app specifications

## Purpose and status

Build a Mandalart planning app whose primary design priority is a precise, forgiving keyboard workflow. Users organize one main goal into eight subgoals, each with eight concrete actions.

**Platform scope (confirmed):** this is a desktop, keyboard-centric app. Phone layouts, mobile-specific interactions, and mobile usability validation are out of scope. Mouse interaction supplements the keyboard workflow.

This document captures the README and subsequent planning discussion. The full board layout, direct entry into action input mode, browser-local persistence, and clearing saved state with confirmation are agreed requirements. Technical choices and unspecified behaviors below are working proposals where indicated.

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
| Main goal input | Normal text cursor movement | Finish editing and return to parent level | Keep text and focus the main goal with no highlight |
| Subgoal input | Normal text cursor movement | Finish editing and return to parent level | Keep text and focus the main goal with no highlight |
| Action input | Normal text cursor movement | Finish editing and return to parent level | Keep text and focus the parent subgoal with no highlight |

Finishing input with Enter or Escape moves to the edited cell's parent level and clears the highlight. Subgoal input returns to the main goal; action input returns to its parent subgoal; main-goal input returns to the main goal. This applies to typing, Enter, and mouse entry, including when switching between editors. Navigation has no dependence on the focus held before editing.

**Switching actions (confirmed):** finish editing with Enter or Escape, use arrow keys from the parent subgoal to highlight another action, then press Enter to edit it. No additional action-switching shortcut is required. Tab and Shift+Tab retain their normal focus-navigation behavior.

Typing a printable character while the board has keyboard focus immediately opens input for the highlighted cell, if any, or the focused goal otherwise, and inserts that character. This includes highlighted subgoals and actions; no Enter is required first. Preserve existing text, append the first character, and place the caret after it. This includes letters, numbers, punctuation, and spaces; command/control/alt shortcuts do not start editing. Enter still selects the highlighted child. Escape exits input without discarding text. While editing, arrow keys belong to the text field, and navigation shortcuts must not interfere with text composition.

**Confirmed input shortcuts:** Enter and Escape finish editing, keep the text, move to the edited cell's parent level, and clear the highlight. Cells do not support manual newlines; text still wraps naturally to fit its cell. Pasted line breaks and line breaks from older saved boards become spaces. Enter used to confirm IME composition must not finish editing. Actions never gain a separate focused state. Finishing editing is not required for autosave.

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

## Full board layout

- Keep all 81 cells in place while navigating and editing.
- Clearly outline the active subgoal's outer 3×3 block when navigating or editing within it.
- Use the shared highlight, focus, and input styling to indicate the current interaction.
- Enlarging a subgoal into a separate view and the associated layout toggle are removed from scope.

## Visual and accessibility requirements

- Fit the complete board and essential controls within the desktop browser viewport, including laptop screens, without page scrolling. Size grid rows from available viewport height; long text scrolls within its cell/editor.
- Keep the interface limited to the board, Clear and navigation controls, save status, and compact keyboard/mode guidance. Omit decorative headings, slogans, progress counters, and subtree breadcrumbs.
- Cells show their content or an empty-cell placeholder, without decorative captions or visible compass-direction labels. Retain descriptive accessibility labels.
- Offer exactly two color schemes: Cloud for Light mode and Graphite for Dark mode. Provide a compact System/Light/Dark toolbar selector. System is the default and follows `prefers-color-scheme`, updating live when the user's OS/browser appearance changes. Light and Dark are saved manual overrides; choosing System resumes automatic behavior. Apply appearance to the entire interface, including editors, mode indicators, and confirmation dialogs.
- Changing appearance preserves board content, navigation, and editor selection. Save the selected preference (`system`, `cloud`, or `graphite`) locally. Old saves without a preference follow the system. Clear resets to System along with board content. Retired light palettes map to Cloud and retired dark palettes map to Graphite without losing board content.
- Input uses the same font, weight, line height, wrapping width, and horizontal/vertical centering as the finished text. Preserve the main goal's heavier weight in its editor. Long input scrolls inside the available cell space.
- Measure editor height from fractional text line boxes rather than rounded scroll height. Use the same natural wrapping in editing and display so leaving input does not move the text.
- Use distinct colors for highlight, focus, and input modes, as requested in the README.
- Supplement color with structural cues: a tinted highlight, a strong focus outline, and a recognizable text field with a caret.
- Make the active navigation context clear even when a different cell is highlighted.
- Provide a compact keyboard hint that reflects the current mode.
- Keep browser focus and application navigation state coordinated, with an accessible label for the active cell/editor.
- Allow users to leave the board with Tab; do not trap keyboard focus.
- Exact colors, typography, and animation are flexible. shadcn is an acceptable starting point for supporting controls.

### Mouse interaction (confirmed)

- Clicking any text cell immediately opens its editor, including either representation of a subgoal title. No preliminary focus-only click is required.
- Opening an action editor temporarily activates its parent subgoal. Leaving action input focuses its parent subgoal with no highlight, just as keyboard editing does.
- Provide a separate, clearly labeled control for each subgoal to focus its action block in place without editing the title.
- Activating that control must not also open the title editor. It must be usable with mouse and keyboard.
- Switching to another cell preserves edits to the previous cell and opens the new editor immediately.

## Technical design

### Stack and tooling (confirmed)

- **React:** render the board and editors from shared application state.
- **TypeScript:** define document types, interaction states, and keyboard events explicitly.
- **Vite:** provide the development server and production build for a browser application.
- **CSS Grid:** implement the board and its 3×3 blocks with custom styling.
- **shadcn/ui:** provide supporting controls such as the Clear confirmation dialog.
- **Browser-local persistence:** keep the single board on the user's browser; the initial app requires no application backend.

Vitest covers the input interpreter, interaction state machine, and storage adapter. Browser verification covers real keyboard events, focus, stable text alignment and caret behavior, and the Clear dialog.

### Architecture and data model

Separate the implementation into:

1. **Document model:** main goal, subgoals, and actions, with each subgoal title stored once.
2. **Input interpreter:** held keys, timing tolerance, and directional selection.
3. **Interaction state machine:** focus, highlight, input target, and explicit Enter/Escape transitions.
4. **View:** a stationary full board rendering shared state.
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

Represent input targets explicitly as the main goal, a subgoal direction, or a subgoal/action direction pair. Avoid storing duplicate text in view state.

**Initial scope (confirmed):** support exactly one locally saved board. Multiple boards and JSON import/export are out of scope. A JSON export button and a print-to-PNG button are possible future additions, not part of the initial implementation.

## Browser-local storage and clearing state

- Store exactly one board locally in the browser and automatically save edits, including text entered before leaving input mode.
- Restore saved content after refresh or reopening the app. Start navigation at the main goal as specified above; held keys, input timers, and active editors are transient.
- Use `localStorage` with versioned, app-specific keys as the proposed storage implementation.
- Implementation: save synchronously on each content or palette change using `mandalart.state.v1`. Its JSON payload contains `{ version: 1, board, theme }`, with `theme` optional for older saves. Transient navigation state is not saved. There are no delayed autosave writes.
- Validate the saved version and all 73 text fields before loading. Invalid saved data remains untouched and autosave is paused until the user explicitly clears it.
- Handle unavailable storage, failed writes, and invalid saved data explicitly; do not claim an edit was saved when persistence fails.
- Provide a visible **Clear** button that opens a confirmation dialog before deleting any state.
- The dialog explains that clearing deletes the locally saved board and resets the color scheme, and provides **Cancel** and **Clear saved state** actions. Initially focus Cancel; Escape cancels. Suspend board keyboard shortcuts while the dialog is open.
- Canceling preserves content and the previous interaction state, then restores focus to the invoking control.
- Confirming removes this app's saved state, resets the in-memory board to its initial default, and returns focus to the empty main goal with no highlight or active editor.
- Cancel pending autosaves and input timers during a confirmed reset so stale content cannot be written back. Delete only this app's storage keys, rather than clearing all storage for the origin.
- If deletion fails, show the failure instead of claiming saved state was cleared.

## Implementation sequence

1. Confirm remaining input decisions.
2. Build a minimal board and explicit interaction state machine, including direct action input.
3. Implement and tune directional input using recorded press/release sequences and hands-on use.
4. Render the full board with stationary blocks and shared editing state.
5. Add browser-local autosave for the single board, the Clear confirmation flow, accessibility details, and visual polish.

## Acceptance scenarios

- Initial focus is the main goal; Enter opens its editor and Escape exits without losing text.
- Typing opens the highlighted cell's editor when a highlight exists, or the focused goal's editor otherwise; it retains the first character, appends to existing text, and saves immediately. Keyboard shortcuts and Tab do not trigger input.
- Highlighting a subgoal marks both of its visible representations.
- Enter on a highlighted subgoal focuses it; another Enter opens its title editor.
- A title change appears in both subgoal representations.
- Enter on a highlighted action opens input immediately, with no intermediate focused-action state.
- Finishing action input focuses its parent subgoal and clears the action highlight; another Escape returns to the main goal.
- Finishing subgoal input focuses the main goal and clears the subgoal highlight, regardless of how editing began. Finishing after switching editors returns to the final edited cell’s parent.
- Slightly staggered, overlapping diagonal key presses and uneven releases select and retain the intended diagonal.
- Non-overlapping Up then Left taps select north then west, never northwest.
- Holding one direction beyond the diagonal release tolerance switches to that direction.
- Opposing directions cancel per axis: Left + Right retains the existing highlight, Left + Right + Up selects north, and all four arrows retain the existing highlight.
- Repeated browser keydown events do not cause unintended transitions.
- Leaving the window while keys are held does not produce stuck input on return.
- Arrow keys work normally inside the editor.
- Clicking any text cell opens input immediately; the separate subgoal control opens its action block without editing its title.
- Enter and Escape finish every editor and return to the parent level with no highlight. Manual newlines are disabled; pasted and previously saved line breaks become spaces.
- All 81 cells remain visible while navigating and editing a subgoal or action.
- Refreshing or reopening restores saved board content, including edits made before exiting input mode.
- Clicking Clear opens confirmation without deleting anything; Cancel or Escape preserves state.
- Confirming Clear removes saved board content and returns to an empty board focused on the main goal.
- Refreshing after Clear does not restore deleted content, and pending autosaves cannot resurrect it.
- Clearing app state leaves unrelated browser storage untouched.

## Compatibility

Existing saves that include a former layout preference continue to load their board content. Ignore that obsolete field and omit it on the next save.
