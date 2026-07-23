import type { Character, SpaceId, ValidationResult } from "./character"

export type WorldSpace = {
  id: SpaceId
  name: string
  description: string
  connectedSpaceIds: SpaceId[]
}

export type OccupancySession = {
  spaces: Record<SpaceId, WorldSpace>
  characters: Record<string, Character>
}

/** Validates space identity and graph connection invariants. */
export function validateSpaces(
  spaces: Record<SpaceId, WorldSpace>,
): ValidationResult<Record<SpaceId, WorldSpace>> {
  const errors: string[] = []

  for (const [spaceId, space] of Object.entries(spaces)) {
    if (space.id !== spaceId) {
      errors.push(`Space ${spaceId} must use a matching id field.`)
    }

    if (!space.id.trim()) {
      errors.push("Space id is required.")
    }

    if (!space.name.trim()) {
      errors.push(`Space ${space.id || spaceId} name is required.`)
    }

    const seenConnections = new Set<SpaceId>()
    for (const connectedSpaceId of space.connectedSpaceIds) {
      if (!spaces[connectedSpaceId]) {
        errors.push(`Space ${space.id} connects to missing space ${connectedSpaceId}.`)
      }

      if (seenConnections.has(connectedSpaceId)) {
        errors.push(`Space ${space.id} has duplicate connection ${connectedSpaceId}.`)
      }

      seenConnections.add(connectedSpaceId)
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: Object.fromEntries(
      Object.entries(spaces).map(([spaceId, space]) => [
        spaceId,
        {
          ...space,
          connectedSpaceIds: [...space.connectedSpaceIds],
        },
      ]),
    ),
  }
}

/** Returns spaces directly connected to a known space. */
export function getNeighborSpaces(
  session: Pick<OccupancySession, "spaces">,
  spaceId: SpaceId,
): WorldSpace[] {
  const space = session.spaces[spaceId]

  if (!space) {
    return []
  }

  return space.connectedSpaceIds
    .map((connectedSpaceId) => session.spaces[connectedSpaceId])
    .filter((neighbor): neighbor is WorldSpace => Boolean(neighbor))
}

/** Returns characters whose current location matches the requested space. */
export function getCharactersInSpace(
  session: Pick<OccupancySession, "characters">,
  spaceId: SpaceId,
): Character[] {
  return Object.values(session.characters).filter(
    (character) => character.currentSpaceId === spaceId,
  )
}

/** Validates that every character occupies an existing space. */
export function validateCharacterOccupancy(
  session: OccupancySession,
): ValidationResult<OccupancySession> {
  const errors: string[] = []

  for (const character of Object.values(session.characters)) {
    if (!session.spaces[character.currentSpaceId]) {
      errors.push(
        `Character ${character.id} occupies missing space ${character.currentSpaceId}.`,
      )
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, value: session }
}
