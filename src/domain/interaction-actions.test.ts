import { describe, expect, it } from "vitest"

import { executeCharacterAction } from "./actions"
import { createDemoSession } from "./demo-fixture"

describe("character interaction actions", () => {
  it("uses a local object and applies character and object effects atomically", () => {
    const session = createDemoSession()
    const moved = executeCharacterAction(session, {
      actorId: "mara",
      kind: "move",
      target: { destinationSpaceId: "mess-hall" },
    })

    if (!moved.ok) {
      throw new Error(moved.message)
    }

    const result = executeCharacterAction(moved.session, {
      actorId: "mara",
      kind: "interact",
      target: { objectId: "food-station", interactionKey: "eat" },
    })

    expect(result.ok).toBe(true)
    expect(result.session.characters.mara.stats.hunger.value).toBe(60)
    expect(result.session.objects["food-station"].state.portions).toBe(2)
    expect(result.session.actionLog[0].message).toBe(
      "Mara used Food Station: hunger 25->60.",
    )
  })

  it("rejects missing objects without mutation", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "interact",
      target: { objectId: "missing-object", interactionKey: "eat" },
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "missing-object",
      message: "Object missing-object does not exist.",
    })
  })

  it("rejects remote objects without mutation", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "interact",
      target: { objectId: "food-station", interactionKey: "eat" },
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "remote-object",
      message: "Object Food Station is not in bunk-room.",
    })
  })

  it("rejects unavailable interactions without mutation", () => {
    const session = createDemoSession()
    session.objects["rest-cot"].state.available = false

    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "interact",
      target: { objectId: "rest-cot", interactionKey: "rest" },
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "ineligible-interaction",
      message: "Object state available must equal true.",
    })
    expect(session.characters.mara.stats.energy.value).toBe(70)
  })

  it("rejects unknown interaction keys without mutation", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "interact",
      target: { objectId: "rest-cot", interactionKey: "sleep" },
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "unknown-interaction",
      message: "Interaction sleep does not exist on Rest Cot.",
    })
  })
})
