import { beforeEach, describe, expect, it } from "vitest"

import type { GameSessionSnapshot } from "@/domain/session"

import { getGlobalStorePayload, useGlobalStore } from "./global-store"

const session: GameSessionSnapshot = {
  schemaVersion: 2,
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
      connectedSpaceIds: ["bunk-room"],
    },
  },
  characters: {
    warden: {
      id: "warden",
      name: "Warden",
      currentSpaceId: "bunk-room",
      stats: {
        hunger: { value: 30, min: 0, max: 100 },
        energy: { value: 80, min: 0, max: 100 },
        morale: { value: 50, min: 0, max: 100 },
      },
      currentActivity: null,
    },
  },
  objects: {
    "food-station": {
      id: "food-station",
      name: "Food Station",
      spaceId: "mess-hall",
      state: { portions: 2 },
      interactions: {},
    },
  },
  actionLog: [],
}

describe("global store session", () => {
  beforeEach(() => {
    useGlobalStore.getState().resetSession()
  })

  it("hydrates and reads one authoritative session snapshot", () => {
    useGlobalStore.getState().hydrateSession(session)

    expect(useGlobalStore.getState().getCharacter("warden")?.name).toBe("Warden")
    expect(useGlobalStore.getState().getSpace("bunk-room")?.name).toBe("Bunk Room")
  })

  it("derives occupants, neighbors, and local objects through selectors", () => {
    useGlobalStore.getState().hydrateSession(session)

    expect(
      useGlobalStore
        .getState()
        .getCharactersInSpace("bunk-room")
        .map((character) => character.id),
    ).toEqual(["warden"])
    expect(
      useGlobalStore
        .getState()
        .getNeighborSpaces("bunk-room")
        .map((space) => space.id),
    ).toEqual(["mess-hall"])
    expect(
      useGlobalStore
        .getState()
        .getObjectsInSpace("mess-hall")
        .map((object) => object.id),
    ).toEqual(["food-station"])
  })

  it("resets the complete session atomically", () => {
    useGlobalStore.getState().hydrateSession(session)
    useGlobalStore.getState().resetSession()

    expect(getGlobalStorePayload()).toEqual({
      schemaVersion: 2,
      characters: {},
      spaces: {},
      objects: {},
      actionLog: [],
    })
  })
})
