import { characterStatKeys, type CharacterStatKey, type ValidationResult } from "./character"

export type CharacterEffectOperation = "add" | "set"

export type CharacterStateEffect = {
  statKey: CharacterStatKey
  operation: CharacterEffectOperation
  value: number
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
