import Dexie, { type EntityTable } from "dexie"

/**
 * Persisted snapshot of global store values kept inside a save slot.
 */
export type GameSavePayload = {
  alpha: number
  beta: number
  gamma: number
}

/**
 * One saved game session stored in IndexedDB.
 */
export type GameSaveRecord = {
  id: number
  name: string
  createdAt: number
  updatedAt: number
  payload: GameSavePayload
}

/**
 * Dexie database that holds game save slots in IndexedDB.
 */
export class GameDatabase extends Dexie {
  saves!: EntityTable<GameSaveRecord, "id">

  constructor() {
    super("shelter-director")
    this.version(1).stores({
      saves: "++id, name, updatedAt",
    })
  }
}

/** Shared IndexedDB database instance for the app. */
export const gameDatabase = new GameDatabase()
