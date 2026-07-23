import { describe, expect, it } from "vitest"

import { createCharacter } from "./character"
import {
  getCharactersInSpace,
  getNeighborSpaces,
  validateCharacterOccupancy,
  validateSpaces,
  type OccupancySession,
} from "./world-space"

const session: OccupancySession = {
  spaces: {
    "bunk-room": {
      id: "bunk-room",
      name: "Bunk Room",
      description: "Sleeping area",
      connectedSpaceIds: ["mess-hall"],
    },
    "mess-hall": {
      id: "mess-hall",
      name: "Mess Hall",
      description: "Shared food area",
      connectedSpaceIds: ["bunk-room", "utility-room"],
    },
    "utility-room": {
      id: "utility-room",
      name: "Utility Room",
      description: "Maintenance storage",
      connectedSpaceIds: ["mess-hall"],
    },
  },
  characters: {
    warden: createCharacter({
      id: "warden",
      name: "Warden",
      currentSpaceId: "bunk-room",
      stats: {
        hunger: { value: 30, min: 0, max: 100 },
        energy: { value: 80, min: 0, max: 100 },
        morale: { value: 50, min: 0, max: 100 },
      },
    }),
    medic: createCharacter({
      id: "medic",
      name: "Medic",
      currentSpaceId: "mess-hall",
      stats: {
        hunger: { value: 60, min: 0, max: 100 },
        energy: { value: 40, min: 0, max: 100 },
        morale: { value: 70, min: 0, max: 100 },
      },
    }),
  },
}

describe("world spaces", () => {
  it("returns connected neighboring spaces", () => {
    expect(getNeighborSpaces(session, "mess-hall").map((space) => space.id)).toEqual([
      "bunk-room",
      "utility-room",
    ])
  })

  it("derives occupants from character locations", () => {
    expect(getCharactersInSpace(session, "bunk-room").map((character) => character.id)).toEqual([
      "warden",
    ])
  })

  it("rejects missing and duplicate connections", () => {
    const result = validateSpaces({
      ...session.spaces,
      "mess-hall": {
        ...session.spaces["mess-hall"],
        connectedSpaceIds: ["missing-space", "bunk-room", "bunk-room"],
      },
    })

    expect(result).toEqual({
      ok: false,
      errors: [
        "Space mess-hall connects to missing space missing-space.",
        "Space mess-hall has duplicate connection bunk-room.",
      ],
    })
  })

  it("rejects characters occupying missing spaces", () => {
    const result = validateCharacterOccupancy({
      ...session,
      characters: {
        ...session.characters,
        medic: {
          ...session.characters.medic,
          currentSpaceId: "missing-space",
        },
      },
    })

    expect(result).toEqual({
      ok: false,
      errors: ["Character medic occupies missing space missing-space."],
    })
  })
})
