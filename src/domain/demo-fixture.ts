import { createGameSessionFromShelterContent } from "@/content"

import type { GameSessionSnapshot } from "./session"

/** Creates the deterministic starting shelter session as a fresh snapshot. */
export function createDemoSession(): GameSessionSnapshot {
  return createGameSessionFromShelterContent()
}
