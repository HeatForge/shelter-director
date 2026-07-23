import { describe, expect, it } from "vitest"

import { executeCharacterAction } from "./actions"
import { createDemoSession } from "./demo-fixture"
import { getCharactersInSpace } from "./world-space"

describe("character movement actions", () => {
  it("moves a character to a connected space through the pipeline", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "mess-hall" },
    })

    expect(result.ok).toBe(true)
    expect(result.session.characters.mara.currentSpaceId).toBe("mess-hall")
    expect(getCharactersInSpace(result.session, "mess-hall").map((character) => character.id)).toContain(
      "mara",
    )
    expect(result.session.actionLog[0].message).toBe("Mara moved to Mess Hall.")
  })

  it("rejects movement to missing spaces without mutation", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "missing-space" },
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "missing-space",
      message: "Space missing-space does not exist.",
    })
    expect(session.characters.mara.currentSpaceId).toBe("bunk-room")
  })

  it("rejects movement to non-neighbor spaces without mutation", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "utility-room" },
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "not-adjacent",
      message: "Space utility-room is not connected to bunk-room.",
    })
    expect(session.characters.mara.currentActivity).toBeNull()
  })

  it("supports repeated valid movement", () => {
    const firstMove = executeCharacterAction(createDemoSession(), {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "mess-hall" },
    })

    if (!firstMove.ok) {
      throw new Error(firstMove.message)
    }

    const secondMove = executeCharacterAction(firstMove.session, {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "utility-room" },
    })

    expect(secondMove.ok).toBe(true)
    expect(secondMove.session.characters.mara.currentSpaceId).toBe("utility-room")
  })
})
