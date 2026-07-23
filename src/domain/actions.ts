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
  | "missing-space"
  | "not-adjacent"

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

  if (request.kind === "wait") {
    return executeWaitAction(session, request.actorId)
  }

  if (request.kind === "move") {
    return executeMoveAction(session, request.actorId, request.target)
  }

  return fail(session, "unknown-action-kind", `Action ${request.kind} is not supported.`)
}

/** Executes an instant wait action and records it in the action log. */
function executeWaitAction(
  session: GameSessionSnapshot,
  actorId: CharacterId,
): ActionResult {
  const nextSession = cloneGameSession(session)
  const nextActor = nextSession.characters[actorId]
  nextActor.currentActivity = {
    kind: "wait",
    label: "waiting",
  }
  nextSession.actionLog = [
    createActionLogEntry(nextSession, actorId, `${nextActor.name} waits.`, "success"),
    ...nextSession.actionLog,
  ]

  return {
    ok: true,
    session: nextSession,
    message: `${nextActor.name} waits.`,
  }
}

/** Executes an instant move action between adjacent spaces. */
function executeMoveAction(
  session: GameSessionSnapshot,
  actorId: CharacterId,
  target: Record<string, string> | undefined,
): ActionResult {
  const destinationSpaceId = target?.destinationSpaceId
  const actor = session.characters[actorId]

  if (!destinationSpaceId) {
    return fail(session, "invalid-target", "Move action requires a destination space.")
  }

  if (!session.spaces[destinationSpaceId]) {
    return fail(session, "missing-space", `Space ${destinationSpaceId} does not exist.`)
  }

  const originSpace = session.spaces[actor.currentSpaceId]
  if (!originSpace.connectedSpaceIds.includes(destinationSpaceId)) {
    return fail(
      session,
      "not-adjacent",
      `Space ${destinationSpaceId} is not connected to ${actor.currentSpaceId}.`,
    )
  }

  const nextSession = cloneGameSession(session)
  const nextActor = nextSession.characters[actorId]
  const destinationSpace = nextSession.spaces[destinationSpaceId]
  nextActor.currentSpaceId = destinationSpaceId
  nextActor.currentActivity = null
  nextSession.actionLog = [
    createActionLogEntry(
      nextSession,
      actorId,
      `${nextActor.name} moved to ${destinationSpace.name}.`,
      "success",
    ),
    ...nextSession.actionLog,
  ]

  return {
    ok: true,
    session: nextSession,
    message: `${nextActor.name} moved to ${destinationSpace.name}.`,
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
