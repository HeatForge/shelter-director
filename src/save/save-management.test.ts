import "fake-indexeddb/auto"

import { beforeEach, describe, expect, it } from "vitest"

import { executeCharacterAction } from "@/domain/actions"
import { createDemoSession } from "@/domain/demo-fixture"
import { gameDatabase } from "@/db/game-database"
import { useGlobalStore } from "@/store/global-store"

import {
  createSaveFileFromStore,
  loadGameFromDatabase,
  loadGameFromFile,
  saveGameToDatabase,
} from "./save-management"

describe("save management", () => {
  beforeEach(async () => {
    await gameDatabase.saves.clear()
    useGlobalStore.getState().resetSession()
  })

  it("round-trips a modified session through IndexedDB", async () => {
    const moved = executeCharacterAction(createDemoSession(), {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "mess-hall" },
    })

    if (!moved.ok) {
      throw new Error(moved.message)
    }

    useGlobalStore.getState().hydrateSession(moved.session)
    const savedRecord = await saveGameToDatabase("Movement Save")
    useGlobalStore.getState().resetSession()

    await loadGameFromDatabase(savedRecord.id)

    expect(useGlobalStore.getState().session.characters.mara.currentSpaceId).toBe(
      "mess-hall",
    )
    expect(useGlobalStore.getState().session.spaces["utility-room"].connectedSpaceIds).toEqual([
      "mess-hall",
    ])
  })

  it("round-trips a modified session through a version 2 JSON file", async () => {
    const moved = executeCharacterAction(createDemoSession(), {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "mess-hall" },
    })

    if (!moved.ok) {
      throw new Error(moved.message)
    }

    useGlobalStore.getState().hydrateSession(moved.session)
    const saveFile = createSaveFileFromStore("File Save")
    useGlobalStore.getState().resetSession()

    await loadGameFromFile(
      new File([JSON.stringify(saveFile)], "file-save.shelter.json", {
        type: "application/json",
      }),
    )

    expect(useGlobalStore.getState().session.characters.mara.currentSpaceId).toBe(
      "mess-hall",
    )
  })

  it("rejects old placeholder saves with a clear incompatibility error", async () => {
    const oldSaveFile = new File(
      [
        JSON.stringify({
          version: 1,
          payload: { alpha: 1, beta: 2, gamma: 3 },
        }),
      ],
      "old-save.shelter.json",
      { type: "application/json" },
    )

    await expect(loadGameFromFile(oldSaveFile)).rejects.toThrow(
      "This save uses an older placeholder format and cannot be loaded.",
    )
  })

  it("rejects invalid files without partially hydrating the live session", async () => {
    const beforeSession = useGlobalStore.getState().session
    const invalidFile = new File(
      [
        JSON.stringify({
          version: 2,
          payload: {
            schemaVersion: 2,
            characters: {},
            spaces: null,
            objects: {},
            actionLog: [],
          },
        }),
      ],
      "invalid-save.shelter.json",
      { type: "application/json" },
    )

    await expect(loadGameFromFile(invalidFile)).rejects.toThrow(
      "Game session spaces must be a record.",
    )
    expect(useGlobalStore.getState().session).toEqual(beforeSession)
  })
})
