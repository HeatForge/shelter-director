import { describe, expect, it } from "vitest"

import { validateGameSessionSnapshot } from "./session"
import { createDemoSession } from "./demo-fixture"

describe("demo fixture", () => {
  it("creates the same valid session every time", () => {
    const firstSession = createDemoSession()
    const secondSession = createDemoSession()

    expect(validateGameSessionSnapshot(firstSession).ok).toBe(true)
    expect(secondSession).toEqual(firstSession)
  })

  it("contains spaces, characters, and objects needed by the milestone", () => {
    const session = createDemoSession()

    expect(Object.keys(session.spaces)).toEqual([
      "bunk-room",
      "mess-hall",
      "utility-room",
    ])
    expect(Object.keys(session.characters)).toEqual(["mara", "ivan"])
    expect(Object.keys(session.objects)).toEqual(["food-station", "rest-cot"])
    expect(session.spaces["bunk-room"].connectedSpaceIds).toContain("mess-hall")
    expect(session.objects["food-station"].interactions.eat.characterEffects).toEqual([
      { statKey: "hunger", operation: "add", value: 35 },
    ])
  })

  it("does not leak mutations between created sessions", () => {
    const changedSession = createDemoSession()
    changedSession.characters.mara.currentSpaceId = "mess-hall"
    changedSession.objects["food-station"].state.portions = 0

    const freshSession = createDemoSession()

    expect(freshSession.characters.mara.currentSpaceId).toBe("bunk-room")
    expect(freshSession.objects["food-station"].state.portions).toBe(3)
  })
})
