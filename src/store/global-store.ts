import { create } from "zustand"

import {
  cloneGameSession,
  createEmptyGameSession,
  type GameSessionSnapshot,
} from "@/domain/session"
import { getCharactersInSpace, getNeighborSpaces } from "@/domain/world-space"

/**
 * Global Zustand store for the active game session shared across the app.
 */
export type GlobalStoreState = {
  session: GameSessionSnapshot
  /** Replaces the complete live game session atomically. */
  hydrateSession: (session: GameSessionSnapshot) => void
  /** Restores the live game session to the empty baseline. */
  resetSession: () => void
  /** Reads one character from the active session. */
  getCharacter: (characterId: string) => GameSessionSnapshot["characters"][string] | undefined
  /** Reads one space from the active session. */
  getSpace: (spaceId: string) => GameSessionSnapshot["spaces"][string] | undefined
  /** Reads characters currently occupying one space. */
  getCharactersInSpace: (spaceId: string) => GameSessionSnapshot["characters"][string][]
  /** Reads spaces connected to one space. */
  getNeighborSpaces: (spaceId: string) => GameSessionSnapshot["spaces"][string][]
  /** Reads objects currently placed in one space. */
  getObjectsInSpace: (spaceId: string) => GameSessionSnapshot["objects"][string][]
}

/** Global store hook for the authoritative game session. */
export const useGlobalStore = create<GlobalStoreState>((set, get) => ({
  session: createEmptyGameSession(),
  hydrateSession: (session) => set({ session: cloneGameSession(session) }),
  resetSession: () => set({ session: createEmptyGameSession() }),
  getCharacter: (characterId) => get().session.characters[characterId],
  getSpace: (spaceId) => get().session.spaces[spaceId],
  getCharactersInSpace: (spaceId) => getCharactersInSpace(get().session, spaceId),
  getNeighborSpaces: (spaceId) => getNeighborSpaces(get().session, spaceId),
  getObjectsInSpace: (spaceId) =>
    Object.values(get().session.objects).filter((object) => object.spaceId === spaceId),
}))

/** Reads the active game session into a saveable payload. */
export function getGlobalStorePayload(): GameSessionSnapshot {
  return cloneGameSession(useGlobalStore.getState().session)
}
