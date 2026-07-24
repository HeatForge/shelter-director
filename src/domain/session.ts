import {
  validateCharacter,
  type Character,
  type CharacterId,
  type SpaceId,
  type ValidationResult,
} from "./character"
import type {
  InteractableObject,
  InteractableObjectId,
} from "./interactable-object"
import { validateInteractableObjects } from "./interactable-object"
import {
  validateCharacterOccupancy,
  validateSpaces,
  type WorldSpace,
} from "./world-space"
import {
  applyTimeChangeSimulation,
  createTimeSimulationState,
  type TimeSimulationState,
} from "./time-simulation"
import {
  advanceGameTime,
  createGameTime,
  getDurationInSeconds,
  validateGameTime,
  type GameTime,
  type TimeDuration,
} from "./time"

export type ActionLogEntry = {
  id: string
  actorId: CharacterId | null
  message: string
  result: "success" | "failure" | "info"
}

export type GameSessionSnapshot = {
  schemaVersion: 3
  characters: Record<CharacterId, Character>
  spaces: Record<SpaceId, WorldSpace>
  objects: Record<InteractableObjectId, InteractableObject>
  actionLog: ActionLogEntry[]
  gameTime: GameTime
  timeSimulation: TimeSimulationState
}

/** Creates an empty but valid game session snapshot. */
export function createEmptyGameSession(): GameSessionSnapshot {
  return {
    schemaVersion: 3,
    characters: {},
    spaces: {},
    objects: {},
    actionLog: [],
    gameTime: createGameTime(),
    timeSimulation: createTimeSimulationState(),
  }
}

/** Creates a cloned session snapshot so callers cannot mutate store internals. */
export function cloneGameSession(
  session: GameSessionSnapshot
): GameSessionSnapshot {
  return structuredClone(session)
}

/** Validates a complete game session snapshot and all current cross-references. */
export function validateGameSessionSnapshot(
  session: unknown
): ValidationResult<GameSessionSnapshot> {
  const errors: string[] = []

  const migratedSession = migrateGameSessionSnapshot(session)

  if (!isRecord(migratedSession)) {
    return { ok: false, errors: ["Game session must be an object."] }
  }

  if (migratedSession.schemaVersion !== 3) {
    errors.push("Game session schema version must be 3.")
  }

  if (!isRecord(migratedSession.characters)) {
    errors.push("Game session characters must be a record.")
  }

  if (!isRecord(migratedSession.spaces)) {
    errors.push("Game session spaces must be a record.")
  }

  if (!isRecord(migratedSession.objects)) {
    errors.push("Game session objects must be a record.")
  }

  if (!Array.isArray(migratedSession.actionLog)) {
    errors.push("Game session action log must be an array.")
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  try {
    validateGameTime(migratedSession.gameTime)
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Game time is invalid."
    )
  }

  if (!isTimeSimulationState(migratedSession.timeSimulation)) {
    errors.push("Game time simulation must include a safe integer dummy value.")
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const typedSession = migratedSession as GameSessionSnapshot

  for (const [characterId, character] of Object.entries(
    typedSession.characters
  )) {
    const characterValidation = validateCharacter(character)
    if (!characterValidation.ok) {
      errors.push(
        ...characterValidation.errors.map((error) => `${characterId}: ${error}`)
      )
    }
  }

  const spacesValidation = validateSpaces(typedSession.spaces)
  if (!spacesValidation.ok) {
    errors.push(...spacesValidation.errors)
  }

  const occupancyValidation = validateCharacterOccupancy(typedSession)
  if (!occupancyValidation.ok) {
    errors.push(...occupancyValidation.errors)
  }

  const objectValidation = validateInteractableObjects(typedSession)
  if (!objectValidation.ok) {
    errors.push(...objectValidation.errors)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, value: cloneGameSession(typedSession) }
}

/** Advances the session clock and sends the resulting change to the demo simulation. */
export function advanceGameSessionTime(
  session: GameSessionSnapshot,
  duration: TimeDuration
): GameSessionSnapshot {
  const previousTime = session.gameTime
  const currentTime = advanceGameTime(previousTime, duration)
  const elapsedSeconds = getDurationInSeconds(duration)

  return {
    ...cloneGameSession(session),
    gameTime: currentTime,
    timeSimulation: applyTimeChangeSimulation(session.timeSimulation, {
      previousTime,
      currentTime,
      duration,
      elapsedSeconds,
    }),
  }
}

/** Adds initial time state when loading a version 2 game session. */
function migrateGameSessionSnapshot(session: unknown): unknown {
  if (!isRecord(session) || session.schemaVersion !== 2) {
    return session
  }

  return {
    ...session,
    schemaVersion: 3,
    gameTime: createGameTime(),
    timeSimulation: createTimeSimulationState(),
  }
}

function isTimeSimulationState(value: unknown): value is TimeSimulationState {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.dummySimulatedValue === "number" &&
    Number.isSafeInteger(value.dummySimulatedValue) &&
    value.dummySimulatedValue >= 0
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
