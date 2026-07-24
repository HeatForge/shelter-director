import type { InteractableObject } from "@/domain/interactable-object"

/** Defines the interactable objects placed in the starting shelter. */
export const startingShelterObjects: Record<string, InteractableObject> = {
  "food-station": {
    id: "food-station",
    name: "Food Station",
    spaceId: "mess-hall",
    state: {
      available: true,
      portions: 3,
    },
    interactions: {
      eat: {
        key: "eat",
        name: "Eat",
        requiredObjectState: { available: true },
        characterEffects: [{ statKey: "hunger", operation: "add", value: 35 }],
        objectEffects: [{ key: "portions", operation: "add", value: -1 }],
      },
    },
  },
  "rest-cot": {
    id: "rest-cot",
    name: "Rest Cot",
    spaceId: "bunk-room",
    state: {
      available: true,
      uses: 0,
    },
    interactions: {
      rest: {
        key: "rest",
        name: "Rest",
        requiredObjectState: { available: true },
        characterEffects: [
          { statKey: "energy", operation: "add", value: 40 },
          { statKey: "morale", operation: "add", value: 5 },
        ],
        objectEffects: [{ key: "uses", operation: "add", value: 1 }],
      },
    },
  },
}
