import { describe, expect, it } from "vitest"

import { createCharacter } from "./character"
import { applyCharacterEffects } from "./effects"

const character = createCharacter({
  id: "mara",
  name: "Mara",
  currentSpaceId: "bunk-room",
  stats: {
    hunger: { value: 25, min: 0, max: 100 },
    energy: { value: 70, min: 0, max: 100 },
    morale: { value: 55, min: 0, max: 100 },
  },
})

describe("bounded character effects", () => {
  it("applies additive and replacement effects with before and after values", () => {
    const result = applyCharacterEffects(character, [
      { statKey: "hunger", operation: "add", value: 30 },
      { statKey: "morale", operation: "set", value: 80 },
    ])

    expect(result).toEqual({
      ok: true,
      character: {
        ...character,
        stats: {
          ...character.stats,
          hunger: { value: 55, min: 0, max: 100 },
          morale: { value: 80, min: 0, max: 100 },
        },
      },
      changes: [
        { statKey: "hunger", before: 25, after: 55 },
        { statKey: "morale", before: 55, after: 80 },
      ],
    })
  })

  it("clamps values to declared stat bounds", () => {
    const result = applyCharacterEffects(character, [
      { statKey: "energy", operation: "add", value: 50 },
    ])

    expect(result.ok && result.character.stats.energy.value).toBe(100)
  })

  it("rejects invalid effects without mutating the original character", () => {
    const result = applyCharacterEffects(character, [
      { statKey: "hunger", operation: "add", value: Number.NaN },
    ])

    expect(result).toEqual({
      ok: false,
      errors: ["Effect 0 value must be finite."],
    })
    expect(character.stats.hunger.value).toBe(25)
  })

  it("rejects an unknown stat before applying any valid effects", () => {
    const characterWithoutMorale = {
      ...character,
      stats: {
        ...character.stats,
        morale: undefined,
      },
    } as unknown as typeof character

    const result = applyCharacterEffects(characterWithoutMorale, [
      { statKey: "hunger", operation: "add", value: 10 },
      { statKey: "morale", operation: "add", value: 10 },
    ])

    expect(result).toEqual({
      ok: false,
      errors: ["Character mara does not have stat morale."],
    })
    expect(character.stats.hunger.value).toBe(25)
  })
})
