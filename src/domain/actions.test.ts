import { describe, expect, it } from "vitest"

import { executeCharacterAction } from "./actions"
import { createDemoSession } from "./demo-fixture"

describe("character action pipeline", () => {
  it("runs a supported action through shared execution", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "wait",
    })

    expect(result.ok).toBe(true)
    expect(result.session.characters.mara.currentActivity).toEqual({
      kind: "wait",
      label: "waiting",
    })
    expect(result.session.actionLog[0]).toEqual({
      id: "action-2",
      actorId: "mara",
      message: "Mara waits.",
      result: "success",
    })
    expect(session.characters.mara.currentActivity).toBeNull()
  })

  it("rejects unknown actors without mutating the session", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "missing",
      kind: "wait",
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "unknown-actor",
      message: "Character missing does not exist.",
    })
  })

  it("rejects conflicting actions for busy actors", () => {
    const session = createDemoSession()
    session.characters.mara.currentActivity = {
      kind: "wait",
      label: "waiting",
    }

    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "wait",
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "actor-busy",
      message: "Character Mara is already waiting.",
    })
  })

  it("rejects unsupported action kinds predictably", () => {
    const session = createDemoSession()
    const result = executeCharacterAction(session, {
      actorId: "mara",
      kind: "dance",
    })

    expect(result).toEqual({
      ok: false,
      session,
      reason: "unknown-action-kind",
      message: "Action dance is not supported.",
    })
  })
})
