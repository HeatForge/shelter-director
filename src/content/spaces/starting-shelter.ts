import type { WorldSpace } from "@/domain/world-space"

/** Defines the rooms and their fixed connections in the starting shelter. */
export const startingShelterSpaces: Record<string, WorldSpace> = {
  "bunk-room": {
    id: "bunk-room",
    name: "Bunk Room",
    description: "Rows of narrow bunks and a usable rest cot.",
    connectedSpaceIds: ["mess-hall"],
  },
  "mess-hall": {
    id: "mess-hall",
    name: "Mess Hall",
    description: "A shared table and the shelter food station.",
    connectedSpaceIds: ["bunk-room", "utility-room"],
  },
  "utility-room": {
    id: "utility-room",
    name: "Utility Room",
    description: "Supplies, panels, and backup systems.",
    connectedSpaceIds: ["mess-hall"],
  },
}
