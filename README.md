I want to create a webapp for mandalart/mandarart
https://www.ourmindfullife.com/mandalart-planner/

The key thing I want to be very specific with is the UX.
The user starts with the center most box focused.
clicking enter changes selected box from focused to text input mode
typing can add text to whatever box
escape changes mode from input to focused
When selecting subgoals, the user uses arrow keys, and the other boxes will be highlighted (including the center boxes on the outside edges)
It's important to be careful about reading the direction of the arrow keys. obvious up means up, down means down, and a combination of left and up means a diagonal. but it's important to have some leeway for keys to be let go at slightly different times. research how this is done in video games, and put special attention into the implementation here
Hitting enter focuses the subgoal box 
Hitting enter again selects the text box, and now text can be input.
pressing escape escapes text edit. hitting escape again exits the selection, returns focus to the center box
Once selected, the user can type content in the subgoal boxes (note this should reflect the text in outer boxes)
then, for the concrete actions, selection of the box works much the same way, use arrow keys when focused on a subgoal box to select a specific action, press enter again to enter text mode, and use escape to backtrack. you can reuse same arrow key logic.

I'm not particular about the color scheme, CSS styling. I guess shadcn is a good default. the only thing I am particular about is using color to signify the difference between "highlighted"(i.e. not focused), "focus" (i.e. no text entry), and "input" modes.

## Running the app

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. This is a desktop, keyboard-centric app with one board saved in the current browser. See [SPECIFICATIONS.md](SPECIFICATIONS.md) for the agreed behavior.

## Keyboard controls

- Arrow keys highlight a child relative to the focused main goal or subgoal. Hold two perpendicular arrows together for a diagonal; opposing arrows cancel.
- Enter focuses a highlighted subgoal or opens text input. Highlighted actions open input immediately.
- Typing opens the highlighted cell's editor, or the focused goal's editor if nothing is highlighted, preserving the first character and appending to existing text.
- In input mode, Enter inserts a newline. Escape or Command+Enter (macOS) / Ctrl+Enter (Windows/Linux) finishes editing while keeping the text.
- Escape from a subgoal returns to the main goal. Tab follows normal browser focus navigation.
- Click any cell to edit it immediately. The small arrow on each subgoal opens its action block without editing its title.

The full board stays visible while navigating and editing. Appearance follows your system settings by default and updates live: Light uses Cloud and Dark uses Graphite. Use the toolbar to choose a saved Light/Dark override or return to System. Clear deletes the saved board and resets appearance to System after confirmation. JSON export and PNG output are outside the current scope.

## Validation

```sh
npm test
npm run build
```

Tests cover directional timing, interaction transitions, and local persistence. The build includes strict TypeScript checking. `npm run preview` serves the production build.

