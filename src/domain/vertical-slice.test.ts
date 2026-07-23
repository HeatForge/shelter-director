import "fake-indexeddb/auto"

import { beforeEach, describe, expect, it } from "vitest"

import { executeCharacterAction } from "./actions"
import { createDemoSession } from "./demo-fixture"
import { gameDatabase } from "@/db/game-database"
import { loadGameFromDatabase, saveGameToDatabase } from "@/save/save-management"
import { useGlobalStore } from "@/store/global-store"

describe("characters in spaces vertical slice", () => {
  beforeEach(async () => {
    await gameDatabase.saves.clear()
    useGlobalStore.getState().resetSession()
  })

  it("creates the fixture, moves a character, uses an object, and verifies state", () => {
    const moved = executeCharacterAction(createDemoSession(), {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "mess-hall" },
    })

    if (!moved.ok) {
      throw new Error(moved.message)
    }

    const interacted = executeCharacterAction(moved.session, {
      actorId: "mara",
      kind: "interact",
      target: { objectId: "food-station", interactionKey: "eat" },
    })

    if (!interacted.ok) {
      throw new Error(interacted.message)
    }

    expect(interacted.session.characters.mara.currentSpaceId).toBe("mess-hall")
    expect(interacted.session.characters.mara.stats.hunger.value).toBe(60)
    expect(interacted.session.objects["food-station"].state.portions).toBe(2)
    expect(interacted.session.actionLog[0].message).toBe(
      "Mara used Food Station: hunger 25->60.",
    )
  })

  it("persists a modified session and restores equivalent state", async () => {
    const moved = executeCharacterAction(createDemoSession(), {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "mess-hall" },
    })

    if (!moved.ok) {
      throw new Error(moved.message)
    }

    useGlobalStore.getState().hydrateSession(moved.session)
    const savedRecord = await saveGameToDatabase("Vertical Slice")
    useGlobalStore.getState().resetSession()

    await loadGameFromDatabase(savedRecord.id)

    expect(useGlobalStore.getState().session).toEqual(moved.session)
  })
})
