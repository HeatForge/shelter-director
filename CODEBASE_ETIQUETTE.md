Alright here are some basic rules when creating branches, PR/MR's and other stuff for the project.

# Rule One - Prefixes
Every branch should be prefixed with what that feature is:
```
feature/... - We are adding a new thing to the project
bugfix/... - We are fixing an existing thing
content/... - We are adding content into the game, not touching the codebase
docs/... - We are adding documentation or are documenting some code
```

# Rule Two - Tickets, Tickets, Tickets
If you are making stuff from a Linear ticket, after the name follows the ticket id then space and the rest of the name of the branch, so:
```
feature/HEA-5 Working Vite setup
```

# Rule Three - Git commit message at least 3 words long
Explain what you did in the commit in at least 3 words so we know from a glance what changed:
```
Fixed clock widget jumping around screen
```

# Rule Four - Commit frequently
Rather than big monster commits it would be best to separate them into small procedurall commits so there is a timeline of changes:
```
Made button 5px tall
Added icon to button
Management wants 4px button
Removed text input from form XYZ
```

# Rule Five - Doc strings
Codebases grow unweildy and obtuse as time goes on. So here is a solution, annotate each public method with a doc string.
No need to describe each parameter or link other parts of the code, just a text telling me what the method does without me needing to look at your sphagetti.

# Rule Six - Naming
DO NOT USE SINGLE LETTER VARIABLES FOR ANYTHING OTHER THAN INDEXES!!!

But really, naming is important. First of all nothing should have the same name or too similar of a name so:
```
existing AppService component
new AppServiceService component - X not allowed
```

Keep variable names fully worded if reasonable, but no essay-level variable names also.

If you are naming a major component or a system in the codebase it would be best to update the GLOSSARY.md so others have the same understanding of what means what.