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

export type ActionLogEntry = {
  id: string
  actorId: CharacterId | null
  message: string
  result: "success" | "failure" | "info"
}

export type GameSessionSnapshot = {
  schemaVersion: 2
  characters: Record<CharacterId, Character>
  spaces: Record<SpaceId, WorldSpace>
  objects: Record<InteractableObjectId, InteractableObject>
  actionLog: ActionLogEntry[]
}

/** Creates an empty but valid game session snapshot. */
export function createEmptyGameSession(): GameSessionSnapshot {
  return {
    schemaVersion: 2,
    characters: {},
    spaces: {},
    objects: {},
    actionLog: [],
  }
}

/** Creates a cloned session snapshot so callers cannot mutate store internals. */
export function cloneGameSession(
  session: GameSessionSnapshot,
): GameSessionSnapshot {
  return structuredClone(session)
}

/** Validates a complete game session snapshot and all current cross-references. */
export function validateGameSessionSnapshot(
  session: GameSessionSnapshot,
): ValidationResult<GameSessionSnapshot> {
  const errors: string[] = []

  if (!isRecord(session)) {
    return { ok: false, errors: ["Game session must be an object."] }
  }

  if (session.schemaVersion !== 2) {
    errors.push("Game session schema version must be 2.")
  }

  if (!isRecord(session.characters)) {
    errors.push("Game session characters must be a record.")
  }

  if (!isRecord(session.spaces)) {
    errors.push("Game session spaces must be a record.")
  }

  if (!isRecord(session.objects)) {
    errors.push("Game session objects must be a record.")
  }

  if (!Array.isArray(session.actionLog)) {
    errors.push("Game session action log must be an array.")
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  for (const [characterId, character] of Object.entries(session.characters)) {
    const characterValidation = validateCharacter(character)
    if (!characterValidation.ok) {
      errors.push(...characterValidation.errors.map((error) => `${characterId}: ${error}`))
    }
  }

  const spacesValidation = validateSpaces(session.spaces)
  if (!spacesValidation.ok) {
    errors.push(...spacesValidation.errors)
  }

  const occupancyValidation = validateCharacterOccupancy(session)
  if (!occupancyValidation.ok) {
    errors.push(...occupancyValidation.errors)
  }

  const objectValidation = validateInteractableObjects(session)
  if (!objectValidation.ok) {
    errors.push(...objectValidation.errors)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, value: cloneGameSession(session) }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
