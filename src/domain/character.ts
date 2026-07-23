export type ValidationResult<TValue> =
  | { ok: true; value: TValue }
  | { ok: false; errors: string[] }

export type CharacterId = string
export type SpaceId = string
export type CharacterStatKey = "hunger" | "energy" | "morale"

export const characterStatKeys = ["hunger", "energy", "morale"] as const

export type BoundedStat = {
  value: number
  min: number
  max: number
}

export type CharacterActivity = {
  kind: string
  label: string
}

export type Character = {
  id: CharacterId
  name: string
  currentSpaceId: SpaceId
  stats: Record<CharacterStatKey, BoundedStat>
  currentActivity: CharacterActivity | null
}

export type CharacterInput = {
  id: string
  name: string
  currentSpaceId: string
  stats: Record<CharacterStatKey, BoundedStat>
  currentActivity?: CharacterActivity | null
}

/** Builds a canonical character or throws with predictable validation details. */
export function createCharacter(input: CharacterInput): Character {
  const validationResult = validateCharacter(input)

  if (!validationResult.ok) {
    throw new Error(validationResult.errors.join(" "))
  }

  return validationResult.value
}

/** Validates character identity, location, stats, and activity shape. */
export function validateCharacter(input: CharacterInput): ValidationResult<Character> {
  const errors: string[] = []
  const id = input.id.trim()
  const name = input.name.trim()
  const currentSpaceId = input.currentSpaceId.trim()

  if (!id) {
    errors.push("Character id is required.")
  }

  if (!name) {
    errors.push("Character name is required.")
  }

  if (!currentSpaceId) {
    errors.push("Character current space is required.")
  }

  for (const statKey of characterStatKeys) {
    const stat = input.stats[statKey]

    if (!stat) {
      errors.push(`Character stat ${statKey} is required.`)
      continue
    }

    if (!Number.isFinite(stat.min) || !Number.isFinite(stat.max)) {
      errors.push(`Character stat ${statKey} bounds must be finite.`)
      continue
    }

    if (stat.min > stat.max) {
      errors.push(`Character stat ${statKey} minimum cannot exceed maximum.`)
    }

    if (!Number.isFinite(stat.value)) {
      errors.push(`Character stat ${statKey} value must be finite.`)
      continue
    }

    if (stat.value < stat.min || stat.value > stat.max) {
      errors.push(`Character stat ${statKey} value must stay inside its bounds.`)
    }
  }

  if (input.currentActivity) {
    if (!input.currentActivity.kind.trim()) {
      errors.push("Character activity kind is required.")
    }

    if (!input.currentActivity.label.trim()) {
      errors.push("Character activity label is required.")
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      id,
      name,
      currentSpaceId,
      stats: {
        hunger: { ...input.stats.hunger },
        energy: { ...input.stats.energy },
        morale: { ...input.stats.morale },
      },
      currentActivity: input.currentActivity
        ? { ...input.currentActivity }
        : null,
    },
  }
}
