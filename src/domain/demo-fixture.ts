import { createCharacter } from "./character"
import { cloneGameSession, type GameSessionSnapshot } from "./session"

const demoSession: GameSessionSnapshot = {
  schemaVersion: 2,
  spaces: {
    "bunk-room": {
      id: "bunk-room",
      name: "Bunk Room",
      description: "Rows of narrow bunks and a usable rest cot.",
      connectedSpaceIds: ["mess-hall"],
    },
    "mess-hall": {
      id: "mess-hall",
      name: "Mess Hall",
      description: "A shared table and the shelter food station.",
      connectedSpaceIds: ["bunk-room", "utility-room"],
    },
    "utility-room": {
      id: "utility-room",
      name: "Utility Room",
      description: "Supplies, panels, and backup systems.",
      connectedSpaceIds: ["mess-hall"],
    },
  },
  characters: {
    mara: createCharacter({
      id: "mara",
      name: "Mara",
      currentSpaceId: "bunk-room",
      stats: {
        hunger: { value: 25, min: 0, max: 100 },
        energy: { value: 70, min: 0, max: 100 },
        morale: { value: 55, min: 0, max: 100 },
      },
    }),
    ivan: createCharacter({
      id: "ivan",
      name: "Ivan",
      currentSpaceId: "utility-room",
      stats: {
        hunger: { value: 65, min: 0, max: 100 },
        energy: { value: 20, min: 0, max: 100 },
        morale: { value: 45, min: 0, max: 100 },
      },
    }),
  },
  objects: {
    "food-station": {
      id: "food-station",
      name: "Food Station",
      spaceId: "mess-hall",
      state: {
        available: true,
        portions: 3,
      },
      interactions: {
        eat: {
          key: "eat",
          name: "Eat",
          requiredObjectState: { available: true },
          characterEffects: [{ statKey: "hunger", operation: "add", value: 35 }],
          objectEffects: [{ key: "portions", operation: "add", value: -1 }],
        },
      },
    },
    "rest-cot": {
      id: "rest-cot",
      name: "Rest Cot",
      spaceId: "bunk-room",
      state: {
        available: true,
        uses: 0,
      },
      interactions: {
        rest: {
          key: "rest",
          name: "Rest",
          requiredObjectState: { available: true },
          characterEffects: [
            { statKey: "energy", operation: "add", value: 40 },
            { statKey: "morale", operation: "add", value: 5 },
          ],
          objectEffects: [{ key: "uses", operation: "add", value: 1 }],
        },
      },
    },
  },
  actionLog: [
    {
      id: "demo-started",
      actorId: null,
      message: "Demo shelter initialized.",
      result: "info",
    },
  ],
}

/** Creates the deterministic demo shelter session as a fresh snapshot. */
export function createDemoSession(): GameSessionSnapshot {
  return cloneGameSession(demoSession)
}
