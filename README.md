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

