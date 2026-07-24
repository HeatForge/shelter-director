import type { ShelterDefinition } from ".."

/** Selects the content that makes up the initial playable shelter. */
export const startingShelter: ShelterDefinition = {
  id: "starting-shelter",
  name: "Starting Shelter",
  description: "The small shelter environment used when a new game begins.",
  spaceIds: ["bunk-room", "mess-hall", "utility-room"],
  characterIds: ["mara", "ivan"],
  objectIds: ["food-station", "rest-cot"],
  startingActionMessage: "Demo shelter initialized.",
}
