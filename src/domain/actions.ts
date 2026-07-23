import type { CharacterId } from "./character"
import { applyCharacterEffects } from "./effects"
import { getInteractionEligibility, type ObjectStateEffect } from "./interactable-object"
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
  | "missing-object"
  | "remote-object"
  | "unknown-interaction"
  | "ineligible-interaction"
  | "invalid-effect"

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

  if (request.kind === "interact") {
    return executeInteractionAction(session, request.actorId, request.target)
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

/** Executes an instant object interaction in the actor's current space. */
function executeInteractionAction(
  session: GameSessionSnapshot,
  actorId: CharacterId,
  target: Record<string, string> | undefined,
): ActionResult {
  const actor = session.characters[actorId]
  const objectId = target?.objectId
  const interactionKey = target?.interactionKey

  if (!objectId || !interactionKey) {
    return fail(session, "invalid-target", "Interaction requires an object and key.")
  }

  const object = session.objects[objectId]
  if (!object) {
    return fail(session, "missing-object", `Object ${objectId} does not exist.`)
  }

  if (object.spaceId !== actor.currentSpaceId) {
    return fail(
      session,
      "remote-object",
      `Object ${object.name} is not in ${actor.currentSpaceId}.`,
    )
  }

  const interaction = object.interactions[interactionKey]
  if (!interaction) {
    return fail(
      session,
      "unknown-interaction",
      `Interaction ${interactionKey} does not exist on ${object.name}.`,
    )
  }

  const eligibility = getInteractionEligibility(object, interactionKey)
  if (!eligibility.eligible) {
    return fail(session, "ineligible-interaction", eligibility.reason)
  }

  const characterEffectResult = applyCharacterEffects(
    actor,
    interaction.characterEffects,
  )
  if (!characterEffectResult.ok) {
    return fail(session, "invalid-effect", characterEffectResult.errors.join(" "))
  }

  const objectEffectValidation = validateObjectStateEffects(
    object.state,
    interaction.objectEffects ?? [],
    interactionKey,
  )
  if (!objectEffectValidation.ok) {
    return fail(session, "invalid-effect", objectEffectValidation.message)
  }

  const nextSession = cloneGameSession(session)
  const nextActor = nextSession.characters[actorId]
  const nextObject = nextSession.objects[objectId]
  nextSession.characters[actorId] = {
    ...characterEffectResult.character,
    currentActivity: null,
  }

  for (const objectEffect of interaction.objectEffects ?? []) {
    if (objectEffect.operation === "set") {
      nextObject.state[objectEffect.key] = objectEffect.value
    } else {
      nextObject.state[objectEffect.key] =
        Number(nextObject.state[objectEffect.key]) + Number(objectEffect.value)
    }
  }

  const changeSummary = characterEffectResult.changes
    .map((change) => `${change.statKey} ${change.before}->${change.after}`)
    .join(", ")
  const message = `${nextActor.name} used ${nextObject.name}: ${changeSummary}.`
  nextSession.actionLog = [
    createActionLogEntry(nextSession, actorId, message, "success"),
    ...nextSession.actionLog,
  ]

  return {
    ok: true,
    session: nextSession,
    message,
  }
}

/** Validates object state effects before an interaction mutates session state. */
function validateObjectStateEffects(
  state: Record<string, number | boolean | string>,
  effects: ObjectStateEffect[],
  interactionKey: string,
): { ok: true } | { ok: false; message: string } {
  for (const effect of effects) {
    if (effect.operation === "add") {
      if (typeof state[effect.key] !== "number" || typeof effect.value !== "number") {
        return {
          ok: false,
          message: `Interaction ${interactionKey} can only add numeric object state.`,
        }
      }
    }
  }

  return { ok: true }
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
