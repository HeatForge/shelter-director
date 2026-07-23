WorldCell - A cell of space with widht, depth and height that can connect to other cells and houses characters

World Space - A traversable game location with stable identity, display metadata, and explicit connections to other spaces

Global Store - Zustand store that keeps game session data globally accessible across the app

Game Database - Dexie wrapper around IndexedDB that stores game save slots in the browser

Save Management - Helpers that save and load the current Global Store values through the Game Database or JSON files

Character - A person in the game session with a stable identity, current space, bounded stats, and optional current activity

Character Stat - A bounded character value such as hunger, energy, or morale

Character Activity - The action or task a character is currently performing, if any

Interactable Object - An object placed in a World Space that advertises interactions characters can use

Interaction - A serializable object action with eligibility requirements and declared state effects

Game Session - The complete in-memory snapshot of characters, spaces, interactable objects, and recent action log entries
