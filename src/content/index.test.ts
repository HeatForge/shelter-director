import { describe, expect, it } from "vitest"

import {
  contentCatalogue,
  createGameSessionFromShelterContent,
  startingShelterId,
  validateShelterContent,
} from "./index"

describe("shelter content catalogue", () => {
  it("builds the starting shelter from definitions grouped by content type", () => {
    const session = createGameSessionFromShelterContent()

    expect(Object.keys(contentCatalogue.spaces)).toEqual([
      "bunk-room",
      "mess-hall",
      "utility-room",
    ])
    expect(Object.keys(contentCatalogue.characters)).toEqual(["mara", "ivan"])
    expect(Object.keys(contentCatalogue.objects)).toEqual([
      "food-station",
      "rest-cot",
    ])
    expect(session.actionLog[0].message).toBe("Demo shelter initialized.")
    expect(session.spaces["mess-hall"].connectedSpaceIds).toEqual([
      "bunk-room",
      "utility-room",
    ])
  })

  it("creates independent sessions without mutating the catalogue", () => {
    const changedSession = createGameSessionFromShelterContent()
    changedSession.characters.mara.currentSpaceId = "mess-hall"
    changedSession.objects["food-station"].state.portions = 0

    const freshSession = createGameSessionFromShelterContent()

    expect(freshSession.characters.mara.currentSpaceId).toBe("bunk-room")
    expect(freshSession.objects["food-station"].state.portions).toBe(3)
    expect(contentCatalogue.characters.mara.currentSpaceId).toBe("bunk-room")
    expect(contentCatalogue.objects["food-station"].state.portions).toBe(3)
  })

  it("rejects a shelter that references missing content", () => {
    const invalidCatalogue = structuredClone(contentCatalogue)
    invalidCatalogue.shelters[startingShelterId].objectIds = ["missing-object"]

    const validation = validateShelterContent(
      invalidCatalogue,
      startingShelterId
    )

    expect(validation).toEqual({
      ok: false,
      errors: expect.arrayContaining([
        "Shelter references missing object missing-object.",
      ]),
    })
  })

  it("rejects content that places a resident outside the selected shelter", () => {
    const invalidCatalogue = structuredClone(contentCatalogue)
    invalidCatalogue.characters.mara.currentSpaceId = "outside"

    const validation = validateShelterContent(
      invalidCatalogue,
      startingShelterId
    )

    expect(validation).toEqual({
      ok: false,
      errors: expect.arrayContaining([
        "Character mara occupies missing space outside.",
      ]),
    })
  })
})
