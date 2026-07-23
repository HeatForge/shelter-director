import { describe, expect, it } from "vitest"

import { createCharacter, validateCharacter, type CharacterInput } from "./character"

const validCharacterInput: CharacterInput = {
  id: "warden",
  name: "Warden",
  currentSpaceId: "bunk-room",
  stats: {
    hunger: { value: 30, min: 0, max: 100 },
    energy: { value: 80, min: 0, max: 100 },
    morale: { value: 55, min: 0, max: 100 },
  },
  currentActivity: null,
}

describe("character domain", () => {
  it("creates a valid character without UI or database dependencies", () => {
    const character = createCharacter(validCharacterInput)

    expect(character).toEqual(validCharacterInput)
  })

  it("trims stable identity fields", () => {
    const character = createCharacter({
      ...validCharacterInput,
      id: " warden ",
      name: " Warden ",
      currentSpaceId: " bunk-room ",
    })

    expect(character.id).toBe("warden")
    expect(character.name).toBe("Warden")
    expect(character.currentSpaceId).toBe("bunk-room")
  })

  it("fails predictably for missing identity and location fields", () => {
    const result = validateCharacter({
      ...validCharacterInput,
      id: " ",
      name: "",
      currentSpaceId: " ",
    })

    expect(result).toEqual({
      ok: false,
      errors: [
        "Character id is required.",
        "Character name is required.",
        "Character current space is required.",
      ],
    })
  })

  it("rejects stats with invalid ranges or non-finite values", () => {
    const result = validateCharacter({
      ...validCharacterInput,
      stats: {
        hunger: { value: 30, min: 100, max: 0 },
        energy: { value: Number.NaN, min: 0, max: 100 },
        morale: { value: 120, min: 0, max: 100 },
      },
    })

    expect(result).toEqual({
      ok: false,
      errors: [
        "Character stat hunger minimum cannot exceed maximum.",
        "Character stat hunger value must stay inside its bounds.",
        "Character stat energy value must be finite.",
        "Character stat morale value must stay inside its bounds.",
      ],
    })
  })
})
