import { describe, expect, it } from "vitest"

import { chooseBehaviorAction, runBehaviorStep } from "./behavior"
import { createDemoSession } from "./demo-fixture"

describe("character behavior step", () => {
  it("chooses the same decisions for the same initial fixture", () => {
    const firstStep = runBehaviorStep(createDemoSession())
    const secondStep = runBehaviorStep(createDemoSession())

    expect(firstStep.decisions).toEqual(secondStep.decisions)
  })

  it("evaluates each demo character at most once", () => {
    const step = runBehaviorStep(createDemoSession())

    expect(step.decisions.map((decision) => decision.actorId)).toEqual(["ivan", "mara"])
  })

  it("moves toward useful objects when none are local", () => {
    const decision = chooseBehaviorAction(createDemoSession(), "ivan")

    expect(decision).toEqual({
      ok: true,
      actorId: "ivan",
      request: {
        actorId: "ivan",
        kind: "move",
        target: { destinationSpaceId: "mess-hall" },
      },
      reason: "Ivan moves toward energy support.",
    })
  })

  it("uses a local useful object when available", () => {
    const session = createDemoSession()
    session.characters.mara.currentSpaceId = "mess-hall"

    const decision = chooseBehaviorAction(session, "mara")

    expect(decision).toEqual({
      ok: true,
      actorId: "mara",
      request: {
        actorId: "mara",
        kind: "interact",
        target: { objectId: "food-station", interactionKey: "eat" },
      },
      reason: "Mara can improve hunger locally.",
    })
  })

  it("returns an explainable no-op when no valid action exists", () => {
    const session = createDemoSession()
    session.objects = {}

    const decision = chooseBehaviorAction(session, "mara")

    expect(decision).toEqual({
      ok: false,
      actorId: "mara",
      reason: "Mara has no valid behavior action for hunger.",
    })
  })

  it("causes movement and state-changing interaction over multiple steps", () => {
    const firstStep = runBehaviorStep(createDemoSession())
    const secondStep = runBehaviorStep(firstStep.session)

    expect(firstStep.actionResults.some((result) => result.ok && result.message.includes("moved"))).toBe(
      true,
    )
    expect(
      secondStep.actionResults.some(
        (result) => result.ok && result.message.includes("used Food Station"),
      ),
    ).toBe(true)
  })
})
