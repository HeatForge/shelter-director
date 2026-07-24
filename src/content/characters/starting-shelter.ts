import type { CharacterInput } from "@/domain/character"

/** Defines the residents who start in the first shelter environment. */
export const startingShelterCharacters: Record<string, CharacterInput> = {
  mara: {
    id: "mara",
    name: "Mara",
    currentSpaceId: "bunk-room",
    stats: {
      hunger: { value: 25, min: 0, max: 100 },
      energy: { value: 70, min: 0, max: 100 },
      morale: { value: 55, min: 0, max: 100 },
    },
  },
  ivan: {
    id: "ivan",
    name: "Ivan",
    currentSpaceId: "utility-room",
    stats: {
      hunger: { value: 65, min: 0, max: 100 },
      energy: { value: 20, min: 0, max: 100 },
      morale: { value: 45, min: 0, max: 100 },
    },
  },
}
