import {
  gameDatabase,
  type GameSavePayload,
  type GameSaveRecord,
} from "@/db/game-database"
import { validateGameSessionSnapshot } from "@/domain/session"
import { getGlobalStorePayload, useGlobalStore } from "@/store/global-store"

/** File format written when exporting a save to disk. */
export type GameSaveFile = {
  version: 2
  name: string
  createdAt: number
  updatedAt: number
  payload: GameSavePayload
}

const SAVE_FILE_EXTENSION = ".shelter.json"
const OLD_PLACEHOLDER_SAVE_ERROR =
  "This save uses an older placeholder format and cannot be loaded."

/** Builds a save file object from a name and the current global store values. */
export function createSaveFileFromStore(name: string): GameSaveFile {
  const timestamp = Date.now()
  return {
    version: 2,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    payload: getGlobalStorePayload(),
  }
}

/** Creates a new IndexedDB save slot from the current global store values. */
export async function saveGameToDatabase(name: string): Promise<GameSaveRecord> {
  const saveFile = createSaveFileFromStore(name)
  const saveId = await gameDatabase.saves.add({
    name: saveFile.name,
    createdAt: saveFile.createdAt,
    updatedAt: saveFile.updatedAt,
    payload: saveFile.payload,
  })

  const savedRecord = await gameDatabase.saves.get(saveId)
  if (!savedRecord) {
    throw new Error("Failed to read the save after writing it to the database.")
  }

  return savedRecord
}

/** Overwrites an existing IndexedDB save slot with the current global store values. */
export async function updateGameInDatabase(saveId: number): Promise<GameSaveRecord> {
  const existingRecord = await gameDatabase.saves.get(saveId)
  if (!existingRecord) {
    throw new Error(`No save found for id ${saveId}.`)
  }

  const updatedRecord: GameSaveRecord = {
    ...existingRecord,
    updatedAt: Date.now(),
    payload: getGlobalStorePayload(),
  }

  await gameDatabase.saves.put(updatedRecord)
  return updatedRecord
}

/** Loads a save from IndexedDB into the global store. */
export async function loadGameFromDatabase(saveId: number): Promise<GameSaveRecord> {
  const savedRecord = await gameDatabase.saves.get(saveId)
  if (!savedRecord) {
    throw new Error(`No save found for id ${saveId}.`)
  }

  const payload = validateSavePayload(savedRecord.payload)
  useGlobalStore.getState().hydrateSession(payload)
  return savedRecord
}

/** Lists every save stored in IndexedDB, newest updates first. */
export async function listGamesFromDatabase(): Promise<GameSaveRecord[]> {
  return gameDatabase.saves.orderBy("updatedAt").reverse().toArray()
}

/** Deletes one save slot from IndexedDB. */
export async function deleteGameFromDatabase(saveId: number): Promise<void> {
  await gameDatabase.saves.delete(saveId)
}

/** Downloads the current global store values as a JSON save file. */
export function saveGameToFile(name: string): void {
  const saveFile = createSaveFileFromStore(name)
  const fileBlob = new Blob([JSON.stringify(saveFile, null, 2)], {
    type: "application/json",
  })
  const objectUrl = URL.createObjectURL(fileBlob)
  const downloadLink = document.createElement("a")
  const safeName = name.trim().replace(/[^\w.-]+/g, "-") || "save"

  downloadLink.href = objectUrl
  downloadLink.download = `${safeName}${SAVE_FILE_EXTENSION}`
  downloadLink.click()
  URL.revokeObjectURL(objectUrl)
}

/** Reads a JSON save file and writes its payload into the global store. */
export async function loadGameFromFile(file: File): Promise<GameSaveFile> {
  const fileText = await file.text()
  const parsedFile = JSON.parse(fileText) as Partial<Omit<GameSaveFile, "version">> & {
    version?: number
    payload?: unknown
  }

  if (parsedFile.version === 1) {
    throw new Error(OLD_PLACEHOLDER_SAVE_ERROR)
  }

  if (parsedFile.version !== 2 || !parsedFile.payload) {
    throw new Error("The selected file is not a valid shelter save.")
  }

  const payload = validateSavePayload(parsedFile.payload)
  const saveFile: GameSaveFile = {
    version: 2,
    name: parsedFile.name || file.name,
    createdAt: parsedFile.createdAt || Date.now(),
    updatedAt: parsedFile.updatedAt || Date.now(),
    payload,
  }

  useGlobalStore.getState().hydrateSession(saveFile.payload)
  return saveFile
}

/** Imports a JSON save file into IndexedDB and returns the new record. */
export async function importGameFileToDatabase(file: File): Promise<GameSaveRecord> {
  const saveFile = await loadGameFromFile(file)
  const saveId = await gameDatabase.saves.add({
    name: saveFile.name || file.name,
    createdAt: saveFile.createdAt || Date.now(),
    updatedAt: Date.now(),
    payload: saveFile.payload,
  })

  const savedRecord = await gameDatabase.saves.get(saveId)
  if (!savedRecord) {
    throw new Error("Failed to import the save file into the database.")
  }

  return savedRecord
}

/** Validates a save payload before it can replace the live session. */
export function validateSavePayload(payload: unknown): GameSavePayload {
  if (!isRecord(payload)) {
    throw new Error("The selected file is not a valid shelter save.")
  }

  const validationResult = validateGameSessionSnapshot(payload as GameSavePayload)
  if (!validationResult.ok) {
    throw new Error(validationResult.errors.join(" "))
  }

  return validationResult.value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
