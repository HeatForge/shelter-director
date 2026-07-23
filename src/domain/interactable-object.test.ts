import { describe, expect, it } from "vitest"

import {
  getInteractionEligibility,
  validateInteractableObjects,
  type InteractableObject,
} from "./interactable-object"

const foodStation: InteractableObject = {
  id: "food-station",
  name: "Food Station",
  spaceId: "mess-hall",
  state: {
    available: true,
    portions: 2,
  },
  interactions: {
    eat: {
      key: "eat",
      name: "Eat",
      requiredObjectState: { available: true },
      characterEffects: [{ statKey: "hunger", operation: "add", value: 30 }],
      objectEffects: [{ key: "portions", operation: "add", value: -1 }],
    },
  },
}

describe("interactable objects", () => {
  it("validates object placement and serializable interactions", () => {
    const result = validateInteractableObjects({
      spaces: { "mess-hall": {} },
      objects: { "food-station": foodStation },
    })

    expect(result.ok).toBe(true)
  })

  it("checks interaction eligibility without mutating object state", () => {
    const result = getInteractionEligibility(foodStation, "eat")

    expect(result).toEqual({ eligible: true })
    expect(foodStation.state.portions).toBe(2)
  })

  it("rejects unavailable interaction state without mutating", () => {
    const result = getInteractionEligibility(
      {
        ...foodStation,
        state: { ...foodStation.state, available: false },
      },
      "eat",
    )

    expect(result).toEqual({
      eligible: false,
      reason: "Object state available must equal true.",
    })
  })

  it("fails predictably for missing placement and malformed effects", () => {
    const result = validateInteractableObjects({
      spaces: {},
      objects: {
        "food-station": {
          ...foodStation,
          interactions: {
            eat: {
              ...foodStation.interactions.eat,
              characterEffects: [
                { statKey: "hunger", operation: "add", value: Number.POSITIVE_INFINITY },
              ],
              objectEffects: [{ key: "available", operation: "add", value: 1 }],
            },
          },
        },
      },
    })

    expect(result).toEqual({
      ok: false,
      errors: [
        "Object food-station is placed in missing space mess-hall.",
        "Effect 0 value must be finite.",
        "Interaction eat can only add to numeric object state available.",
      ],
    })
  })
})
