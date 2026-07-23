import type { CharacterId } from "./character"
import { cloneGameSession, type GameSessionSnapshot } from "./session"

export type ActionKind = "wait" | "move" | "interact"

export type ActionRequest = {
  actorId: CharacterId
  kind: ActionKind | string
  target?: Record<string, string>
}

export type ActionFailureReason =
  | "unknown-actor"
  | "actor-busy"
  | "unknown-action-kind"
  | "invalid-target"

export type ActionResult =
  | {
      ok: true
      session: GameSessionSnapshot
      message: string
    }
  | {
      ok: false
      session: GameSessionSnapshot
      reason: ActionFailureReason
      message: string
    }

/** Executes a character action through shared actor and precondition checks. */
export function executeCharacterAction(
  session: GameSessionSnapshot,
  request: ActionRequest,
): ActionResult {
  const actor = session.characters[request.actorId]

  if (!actor) {
    return fail(session, "unknown-actor", `Character ${request.actorId} does not exist.`)
  }

  if (actor.currentActivity) {
    return fail(
      session,
      "actor-busy",
      `Character ${actor.name} is already ${actor.currentActivity.label}.`,
    )
  }

  if (request.kind !== "wait") {
    return fail(session, "unknown-action-kind", `Action ${request.kind} is not supported.`)
  }

  const nextSession = cloneGameSession(session)
  const nextActor = nextSession.characters[request.actorId]
  nextActor.currentActivity = {
    kind: "wait",
    label: "waiting",
  }
  nextSession.actionLog = [
    createActionLogEntry(nextSession, request.actorId, `${nextActor.name} waits.`, "success"),
    ...nextSession.actionLog,
  ]

  return {
    ok: true,
    session: nextSession,
    message: `${nextActor.name} waits.`,
  }
}

/** Creates a deterministic action log entry from the current session log length. */
export function createActionLogEntry(
  session: Pick<GameSessionSnapshot, "actionLog">,
  actorId: CharacterId | null,
  message: string,
  result: "success" | "failure" | "info",
) {
  return {
    id: `action-${session.actionLog.length + 1}`,
    actorId,
    message,
    result,
  }
}

/** Returns a typed action failure without mutating the supplied session. */
export function fail(
  session: GameSessionSnapshot,
  reason: ActionFailureReason,
  message: string,
): ActionResult {
  return {
    ok: false,
    session,
    reason,
    message,
  }
}
