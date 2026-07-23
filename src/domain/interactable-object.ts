import type { ValidationResult } from "./character"
import {
  validateCharacterEffects,
  type CharacterStateEffect,
} from "./effects"
import type { SpaceId } from "./world-space"

export type InteractableObjectId = string
export type InteractionKey = string
export type ObjectStateValue = number | boolean | string
export type ObjectState = Record<string, ObjectStateValue>

export type InteractionEligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string }

export type ObjectStateEffect = {
  key: string
  operation: "set" | "add"
  value: ObjectStateValue
}

export type ObjectInteraction = {
  key: InteractionKey
  name: string
  requiredObjectState?: ObjectState
  characterEffects: CharacterStateEffect[]
  objectEffects?: ObjectStateEffect[]
}

export type InteractableObject = {
  id: InteractableObjectId
  name: string
  spaceId: SpaceId
  interactions: Record<InteractionKey, ObjectInteraction>
  state: ObjectState
}

export type InteractableObjectSession = {
  spaces: Record<SpaceId, unknown>
  objects: Record<InteractableObjectId, InteractableObject>
}

/** Checks whether an object interaction is currently eligible without mutating state. */
export function getInteractionEligibility(
  object: InteractableObject,
  interactionKey: InteractionKey,
): InteractionEligibilityResult {
  const interaction = object.interactions[interactionKey]

  if (!interaction) {
    return { eligible: false, reason: `Interaction ${interactionKey} does not exist.` }
  }

  for (const [stateKey, requiredValue] of Object.entries(
    interaction.requiredObjectState ?? {},
  )) {
    if (object.state[stateKey] !== requiredValue) {
      return {
        eligible: false,
        reason: `Object state ${stateKey} must equal ${String(requiredValue)}.`,
      }
    }
  }

  return { eligible: true }
}

/** Validates interactable object placement, state, and interaction contracts. */
export function validateInteractableObjects(
  session: InteractableObjectSession,
): ValidationResult<Record<InteractableObjectId, InteractableObject>> {
  const errors: string[] = []

  for (const [objectId, object] of Object.entries(session.objects)) {
    if (object.id !== objectId) {
      errors.push(`Object ${objectId} must use a matching id field.`)
    }

    if (!object.id.trim()) {
      errors.push("Object id is required.")
    }

    if (!object.name.trim()) {
      errors.push(`Object ${object.id || objectId} name is required.`)
    }

    if (!session.spaces[object.spaceId]) {
      errors.push(`Object ${object.id} is placed in missing space ${object.spaceId}.`)
    }

    for (const [interactionKey, interaction] of Object.entries(object.interactions)) {
      if (interaction.key !== interactionKey) {
        errors.push(`Interaction ${interactionKey} must use a matching key field.`)
      }

      if (!interaction.name.trim()) {
        errors.push(`Interaction ${interactionKey} name is required.`)
      }

      const effectValidation = validateCharacterEffects(interaction.characterEffects)
      if (!effectValidation.ok) {
        errors.push(...effectValidation.errors)
      }

      for (const objectEffect of interaction.objectEffects ?? []) {
        if (!objectEffect.key.trim()) {
          errors.push(`Interaction ${interactionKey} object effect key is required.`)
        }

        if (
          objectEffect.operation === "add" &&
          typeof object.state[objectEffect.key] !== "number"
        ) {
          errors.push(
            `Interaction ${interactionKey} can only add to numeric object state ${objectEffect.key}.`,
          )
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: Object.fromEntries(
      Object.entries(session.objects).map(([objectId, object]) => [
        objectId,
        {
          ...object,
          interactions: Object.fromEntries(
            Object.entries(object.interactions).map(([interactionKey, interaction]) => [
              interactionKey,
              {
                ...interaction,
                characterEffects: interaction.characterEffects.map((effect) => ({
                  ...effect,
                })),
                objectEffects: interaction.objectEffects?.map((effect) => ({
                  ...effect,
                })),
              },
            ]),
          ),
          state: { ...object.state },
        },
      ]),
    ),
  }
}
