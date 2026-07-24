import {
  createCharacter,
  validateCharacter,
  type Character,
  type CharacterId,
  type CharacterInput,
  type ValidationResult,
} from "@/domain/character"
import {
  validateInteractableObjects,
  type InteractableObject,
  type InteractableObjectId,
} from "@/domain/interactable-object"
import {
  validateGameSessionSnapshot,
  type GameSessionSnapshot,
} from "@/domain/session"
import { createTimeSimulationState } from "@/domain/time-simulation"
import { createGameTime } from "@/domain/time"
import {
  validateCharacterOccupancy,
  validateSpaces,
  type WorldSpace,
} from "@/domain/world-space"

import { startingShelterCharacters } from "./characters/starting-shelter"
import { startingShelterObjects } from "./objects/starting-shelter"
import { startingShelter } from "./shelters/starting-shelter"
import { startingShelterSpaces } from "./spaces/starting-shelter"

export type ShelterDefinition = {
  id: string
  name: string
  description: string
  spaceIds: string[]
  characterIds: string[]
  objectIds: string[]
  startingActionMessage: string
}

export type ContentCatalogue = {
  spaces: Record<string, WorldSpace>
  characters: Record<string, CharacterInput>
  objects: Record<string, InteractableObject>
  shelters: Record<string, ShelterDefinition>
}

export const startingShelterId = "starting-shelter"

/** Aggregates every current content definition by its content type. */
export const contentCatalogue: ContentCatalogue = {
  spaces: startingShelterSpaces,
  characters: startingShelterCharacters,
  objects: startingShelterObjects,
  shelters: {
    [startingShelter.id]: startingShelter,
  },
}

/** Validates a shelter definition and the referenced content before it becomes a game session. */
export function validateShelterContent(
  catalogue: ContentCatalogue,
  shelterId: string
): ValidationResult<ShelterDefinition> {
  const shelter = catalogue.shelters[shelterId]

  if (!shelter) {
    return {
      ok: false,
      errors: [`Shelter content ${shelterId} does not exist.`],
    }
  }

  const errors = validateShelterDefinition(shelter, shelterId)
  const selectedSpaces = selectContent(catalogue.spaces, shelter.spaceIds)
  const selectedCharacters = selectContent(
    catalogue.characters,
    shelter.characterIds
  )
  const selectedObjects = selectContent(catalogue.objects, shelter.objectIds)

  errors.push(
    ...getMissingContentErrors("space", shelter.spaceIds, catalogue.spaces),
    ...getMissingContentErrors(
      "character",
      shelter.characterIds,
      catalogue.characters
    ),
    ...getMissingContentErrors("object", shelter.objectIds, catalogue.objects)
  )

  for (const [characterId, character] of Object.entries(selectedCharacters)) {
    const characterValidation = validateCharacter(character)
    if (!characterValidation.ok) {
      errors.push(
        ...characterValidation.errors.map((error) => `${characterId}: ${error}`)
      )
    }
  }

  const spacesValidation = validateSpaces(selectedSpaces)
  if (!spacesValidation.ok) {
    errors.push(...spacesValidation.errors)
  }

  if (errors.length === 0) {
    const characters = Object.fromEntries(
      Object.entries(selectedCharacters).map(([characterId, character]) => [
        characterId,
        createCharacter(character),
      ])
    ) as Record<CharacterId, Character>
    const occupancyValidation = validateCharacterOccupancy({
      spaces: selectedSpaces,
      characters,
    })
    if (!occupancyValidation.ok) {
      errors.push(...occupancyValidation.errors)
    }
  }

  const objectValidation = validateInteractableObjects({
    spaces: selectedSpaces,
    objects: selectedObjects,
  })
  if (!objectValidation.ok) {
    errors.push(...objectValidation.errors)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, value: structuredClone(shelter) }
}

/** Creates a fresh game session from a validated shelter content definition. */
export function createGameSessionFromShelterContent(
  shelterId = startingShelterId,
  catalogue = contentCatalogue
): GameSessionSnapshot {
  const shelterValidation = validateShelterContent(catalogue, shelterId)
  if (!shelterValidation.ok) {
    throw new Error(shelterValidation.errors.join(" "))
  }

  const shelter = shelterValidation.value
  const characters = Object.fromEntries(
    shelter.characterIds.map((characterId) => [
      characterId,
      createCharacter(catalogue.characters[characterId]),
    ])
  ) as Record<CharacterId, Character>
  const spaces = selectContent(catalogue.spaces, shelter.spaceIds)
  const objects = selectContent(catalogue.objects, shelter.objectIds) as Record<
    InteractableObjectId,
    InteractableObject
  >
  const session: GameSessionSnapshot = {
    schemaVersion: 3,
    spaces: structuredClone(spaces),
    characters,
    objects: structuredClone(objects),
    actionLog: [
      {
        id: `${shelter.id}-started`,
        actorId: null,
        message: shelter.startingActionMessage,
        result: "info",
      },
    ],
    gameTime: createGameTime(),
    timeSimulation: createTimeSimulationState(),
  }
  const sessionValidation = validateGameSessionSnapshot(session)

  if (!sessionValidation.ok) {
    throw new Error(sessionValidation.errors.join(" "))
  }

  return sessionValidation.value
}

function validateShelterDefinition(
  shelter: ShelterDefinition,
  expectedId: string
): string[] {
  const errors: string[] = []

  if (shelter.id !== expectedId) {
    errors.push(`Shelter ${expectedId} must use a matching id field.`)
  }

  if (!shelter.name.trim()) {
    errors.push(`Shelter ${expectedId} name is required.`)
  }

  if (!shelter.description.trim()) {
    errors.push(`Shelter ${expectedId} description is required.`)
  }

  if (!shelter.startingActionMessage.trim()) {
    errors.push(`Shelter ${expectedId} starting action message is required.`)
  }

  for (const [contentType, contentIds] of Object.entries({
    space: shelter.spaceIds,
    character: shelter.characterIds,
    object: shelter.objectIds,
  })) {
    if (contentIds.length === 0) {
      errors.push(
        `Shelter ${expectedId} must include at least one ${contentType}.`
      )
    }

    const seenContentIds = new Set<string>()
    for (const contentId of contentIds) {
      if (!contentId.trim()) {
        errors.push(`Shelter ${expectedId} ${contentType} id is required.`)
      }

      if (seenContentIds.has(contentId)) {
        errors.push(
          `Shelter ${expectedId} includes ${contentType} ${contentId} more than once.`
        )
      }

      seenContentIds.add(contentId)
    }
  }

  return errors
}

function getMissingContentErrors<TContent>(
  contentType: string,
  contentIds: string[],
  content: Record<string, TContent>
): string[] {
  return contentIds
    .filter((contentId) => !content[contentId])
    .map(
      (contentId) => `Shelter references missing ${contentType} ${contentId}.`
    )
}

function selectContent<TContent>(
  content: Record<string, TContent>,
  contentIds: string[]
): Record<string, TContent> {
  return Object.fromEntries(
    contentIds.flatMap((contentId) => {
      const contentItem = content[contentId]
      return contentItem ? [[contentId, contentItem]] : []
    })
  )
}
