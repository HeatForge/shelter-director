import {
  characterStatKeys,
  type Character,
  type CharacterStatKey,
  type ValidationResult,
} from "./character"

export type CharacterEffectOperation = "add" | "set"

export type CharacterStateEffect = {
  statKey: CharacterStatKey
  operation: CharacterEffectOperation
  value: number
}

export type CharacterEffectChange = {
  statKey: CharacterStatKey
  before: number
  after: number
}

export type ApplyCharacterEffectsResult =
  | {
      ok: true
      character: Character
      changes: CharacterEffectChange[]
    }
  | {
      ok: false
      errors: string[]
    }

/** Validates serializable character effect descriptions. */
export function validateCharacterEffects(
  effects: CharacterStateEffect[],
): ValidationResult<CharacterStateEffect[]> {
  const errors: string[] = []

  effects.forEach((effect, effectIndex) => {
    if (!characterStatKeys.includes(effect.statKey)) {
      errors.push(`Effect ${effectIndex} uses unknown stat ${effect.statKey}.`)
    }

    if (effect.operation !== "add" && effect.operation !== "set") {
      errors.push(`Effect ${effectIndex} uses unsupported operation ${effect.operation}.`)
    }

    if (!Number.isFinite(effect.value)) {
      errors.push(`Effect ${effectIndex} value must be finite.`)
    }
  })

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: effects.map((effect) => ({ ...effect })),
  }
}

/** Applies validated effects to a character atomically with bounded stat clamping. */
export function applyCharacterEffects(
  character: Character,
  effects: CharacterStateEffect[],
): ApplyCharacterEffectsResult {
  const effectValidation = validateCharacterEffects(effects)
  const errors = effectValidation.ok ? [] : [...effectValidation.errors]

  for (const effect of effects) {
    if (!character.stats[effect.statKey]) {
      errors.push(`Character ${character.id} does not have stat ${effect.statKey}.`)
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const nextCharacter: Character = {
    ...character,
    stats: {
      hunger: { ...character.stats.hunger },
      energy: { ...character.stats.energy },
      morale: { ...character.stats.morale },
    },
    currentActivity: character.currentActivity
      ? { ...character.currentActivity }
      : null,
  }
  const changes: CharacterEffectChange[] = []

  for (const effect of effects) {
    const stat = nextCharacter.stats[effect.statKey]
    const before = stat.value
    const rawAfter =
      effect.operation === "add" ? stat.value + effect.value : effect.value
    const after = Math.min(stat.max, Math.max(stat.min, rawAfter))

    stat.value = after
    changes.push({
      statKey: effect.statKey,
      before,
      after,
    })
  }

  return {
    ok: true,
    character: nextCharacter,
    changes,
  }
}
