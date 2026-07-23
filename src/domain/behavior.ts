import {
  characterStatKeys,
  type Character,
  type CharacterId,
  type CharacterStatKey,
} from "./character"
import { executeCharacterAction, type ActionRequest, type ActionResult } from "./actions"
import { getInteractionEligibility, type InteractableObject } from "./interactable-object"
import { cloneGameSession, type GameSessionSnapshot } from "./session"

export type BehaviorDecision =
  | {
      ok: true
      actorId: CharacterId
      request: ActionRequest
      reason: string
    }
  | {
      ok: false
      actorId: CharacterId
      reason: string
    }

export type BehaviorStepResult = {
  session: GameSessionSnapshot
  decisions: BehaviorDecision[]
  actionResults: ActionResult[]
}

export type TieBreaker = <TValue extends { id: string }>(values: TValue[]) => TValue | undefined

const defaultTieBreaker: TieBreaker = (values) =>
  [...values].sort((leftValue, rightValue) => leftValue.id.localeCompare(rightValue.id))[0]

/** Chooses one deterministic action for a character based on depleted stats. */
export function chooseBehaviorAction(
  session: GameSessionSnapshot,
  actorId: CharacterId,
  tieBreaker: TieBreaker = defaultTieBreaker,
): BehaviorDecision {
  const actor = session.characters[actorId]

  if (!actor) {
    return { ok: false, actorId, reason: `Character ${actorId} does not exist.` }
  }

  const depletedStatKey = getMostDepletedStatKey(actor)
  const localObject = findUsefulObject(
    Object.values(session.objects).filter((object) => object.spaceId === actor.currentSpaceId),
    actor,
    depletedStatKey,
    tieBreaker,
  )

  if (localObject) {
    return {
      ok: true,
      actorId,
      request: {
        actorId,
        kind: "interact",
        target: {
          objectId: localObject.object.id,
          interactionKey: localObject.interactionKey,
        },
      },
      reason: `${actor.name} can improve ${depletedStatKey} locally.`,
    }
  }

  const nextSpaceId = findFirstStepTowardUsefulObject(
    session,
    actor,
    depletedStatKey,
    tieBreaker,
  )

  if (nextSpaceId) {
    return {
      ok: true,
      actorId,
      request: {
        actorId,
        kind: "move",
        target: { destinationSpaceId: nextSpaceId },
      },
      reason: `${actor.name} moves toward ${depletedStatKey} support.`,
    }
  }

  return {
    ok: false,
    actorId,
    reason: `${actor.name} has no valid behavior action for ${depletedStatKey}.`,
  }
}

/** Runs one deterministic behavior step, evaluating each character at most once. */
export function runBehaviorStep(
  session: GameSessionSnapshot,
  tieBreaker: TieBreaker = defaultTieBreaker,
): BehaviorStepResult {
  let nextSession = cloneGameSession(session)
  const decisions: BehaviorDecision[] = []
  const actionResults: ActionResult[] = []

  for (const actorId of Object.keys(session.characters).sort()) {
    const decision = chooseBehaviorAction(nextSession, actorId, tieBreaker)
    decisions.push(decision)

    if (!decision.ok) {
      continue
    }

    const actionResult = executeCharacterAction(nextSession, decision.request)
    actionResults.push(actionResult)

    if (actionResult.ok) {
      nextSession = actionResult.session
    }
  }

  return {
    session: nextSession,
    decisions,
    actionResults,
  }
}

function getMostDepletedStatKey(character: Character): CharacterStatKey {
  return [...characterStatKeys].sort((leftStatKey, rightStatKey) => {
    const leftStat = character.stats[leftStatKey]
    const rightStat = character.stats[rightStatKey]
    const leftRatio = (leftStat.value - leftStat.min) / (leftStat.max - leftStat.min)
    const rightRatio =
      (rightStat.value - rightStat.min) / (rightStat.max - rightStat.min)

    if (leftRatio === rightRatio) {
      return leftStatKey.localeCompare(rightStatKey)
    }

    return leftRatio - rightRatio
  })[0]
}

function findUsefulObject(
  objects: InteractableObject[],
  character: Character,
  statKey: CharacterStatKey,
  tieBreaker: TieBreaker,
):
  | {
      id: string
      object: InteractableObject
      interactionKey: string
    }
  | undefined {
  const usefulInteractions = objects.flatMap((object) =>
    Object.values(object.interactions)
      .filter((interaction) => getInteractionEligibility(object, interaction.key).eligible)
      .filter((interaction) =>
        interaction.characterEffects.some((effect) => {
          const stat = character.stats[effect.statKey]
          if (effect.statKey !== statKey) {
            return false
          }

          if (effect.operation === "add") {
            return effect.value > 0 && stat.value < stat.max
          }

          return effect.value > stat.value
        }),
      )
      .map((interaction) => ({
        id: `${object.id}:${interaction.key}`,
        object,
        interactionKey: interaction.key,
      })),
  )

  return tieBreaker(usefulInteractions)
}

function findFirstStepTowardUsefulObject(
  session: GameSessionSnapshot,
  character: Character,
  statKey: CharacterStatKey,
  tieBreaker: TieBreaker,
): string | undefined {
  const visitedSpaceIds = new Set<string>([character.currentSpaceId])
  let frontier = [...(session.spaces[character.currentSpaceId]?.connectedSpaceIds ?? [])]
    .sort()
    .map((spaceId) => ({ id: spaceId, firstStepId: spaceId }))

  while (frontier.length > 0) {
    const usefulDestination = tieBreaker(
      frontier
        .filter(({ id }) =>
          findUsefulObject(
            Object.values(session.objects).filter((object) => object.spaceId === id),
            character,
            statKey,
            tieBreaker,
          ),
        )
        .map(({ id, firstStepId }) => ({ id, firstStepId })),
    )

    if (usefulDestination) {
      return usefulDestination.firstStepId
    }

    frontier = frontier.flatMap(({ id, firstStepId }) => {
      if (visitedSpaceIds.has(id)) {
        return []
      }

      visitedSpaceIds.add(id)

      return (session.spaces[id]?.connectedSpaceIds ?? [])
        .filter((spaceId) => !visitedSpaceIds.has(spaceId))
        .sort()
        .map((spaceId) => ({ id: spaceId, firstStepId }))
    })
  }

  return undefined
}
