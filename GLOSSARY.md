WorldCell - A cell of space with widht, depth and height that can connect to other cells and houses characters

World Space - A traversable game location with stable identity, display metadata, and explicit connections to other spaces

Global Store - Zustand store that keeps game session data globally accessible across the app

Game Database - Dexie wrapper around IndexedDB that stores game save slots in the browser

Save Management - Helpers that save and load versioned Game Session snapshots through the Game Database or JSON files

Character - A person in the game session with a stable identity, current space, bounded stats, and optional current activity

Character Stat - A bounded character value such as hunger, energy, or morale

Character Activity - The action or task a character is currently performing, if any

Interactable Object - An object placed in a World Space that advertises interactions characters can use

Interaction - A serializable object action with eligibility requirements and declared state effects

Game Session - The complete in-memory snapshot of characters, spaces, interactable objects, and recent action log entries

Action Pipeline - The shared domain path that validates and executes character action requests

Action Log - Recent readable records describing successful or informational game session events

Behavior Step - A deterministic simulation pass where characters choose one valid action from the current session state

Game Clock - The normalized in-session time hierarchy used to advance and coordinate future simulation systems

Time Widget - The debug interface that displays the Game Clock and lets the player advance it by a chosen duration

Content Catalogue - The single `src/content` directory that collects authored game definitions by content type and builds playable shelters from them

Shelter Definition - A content record that selects the spaces, characters, and interactable objects that make up one starting shelter
