import { useRef, useState, type ChangeEvent } from "react"

import { Button } from "@/components/ui/button"
import type { GameSaveRecord } from "@/db/game-database"
import {
  deleteGameFromDatabase,
  listGamesFromDatabase,
  loadGameFromDatabase,
  loadGameFromFile,
  saveGameToDatabase,
  saveGameToFile,
} from "@/save/save-management"

/**
 * Temporary demo for saving and loading the current global store values
 * through IndexedDB and downloadable JSON files.
 */
export default function SaveManagementDemo() {
  const [saveName, setSaveName] = useState("Quick Save")
  const [saveSlots, setSaveSlots] = useState<GameSaveRecord[]>([])
  const [statusMessage, setStatusMessage] = useState("Ready. Refresh to load DB saves.")
  const [isBusy, setIsBusy] = useState(false)
  const [hasLoadedSlots, setHasLoadedSlots] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** Refreshes the list of IndexedDB save slots shown in the demo. */
  const refreshSaveSlots = async () => {
    const nextSlots = await listGamesFromDatabase()
    setSaveSlots(nextSlots)
    setHasLoadedSlots(true)
  }

  /** Runs an async save action and refreshes the slot list afterward. */
  const runSaveAction = async (
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    setIsBusy(true)
    try {
      await action()
      await refreshSaveSlots()
      setStatusMessage(successMessage)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setStatusMessage(`Save action failed: ${message}`)
    } finally {
      setIsBusy(false)
    }
  }

  /** Reloads IndexedDB save slots into the demo list. */
  const handleRefreshSlots = () => {
    setIsBusy(true)
    void refreshSaveSlots()
      .then(() => {
        setStatusMessage("Refreshed database saves.")
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown error"
        setStatusMessage(`Refresh failed: ${message}`)
      })
      .finally(() => {
        setIsBusy(false)
      })
  }

  /** Writes the current global store into a new IndexedDB save slot. */
  const handleSaveToDatabase = () => {
    void runSaveAction(async () => {
      await saveGameToDatabase(saveName)
    }, `Saved "${saveName}" to the database.`)
  }

  /** Downloads the current global store as a JSON save file. */
  const handleSaveToFile = () => {
    try {
      saveGameToFile(saveName)
      setStatusMessage(`Downloaded "${saveName}" as a save file.`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setStatusMessage(`File save failed: ${message}`)
    }
  }

  /** Loads one IndexedDB save slot into the global store. */
  const handleLoadFromDatabase = (saveId: number) => {
    void runSaveAction(async () => {
      const loadedSave = await loadGameFromDatabase(saveId)
      setSaveName(loadedSave.name)
    }, `Loaded save #${saveId} into the global store.`)
  }

  /** Deletes one IndexedDB save slot. */
  const handleDeleteFromDatabase = (saveId: number) => {
    void runSaveAction(async () => {
      await deleteGameFromDatabase(saveId)
    }, `Deleted save #${saveId}.`)
  }

  /** Opens the hidden file picker used for JSON save imports. */
  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  /** Loads a chosen JSON save file into the global store. */
  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ""
    if (!selectedFile) {
      return
    }

    void runSaveAction(async () => {
      const loadedFile = await loadGameFromFile(selectedFile)
      setSaveName(loadedFile.name || selectedFile.name)
    }, `Loaded "${selectedFile.name}" into the global store.`)
  }

  return (
    <div className="flex min-w-80 flex-col gap-3 rounded-xl border-2 border-accent p-4">
      <h2 className="text-lg font-bold">Save Management Demo</h2>
      <p className="text-sm text-muted-foreground">
        Saves and loads the current global store values through IndexedDB or a
        JSON file.
      </p>

      <label className="flex flex-col gap-1 text-sm">
        Save name
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          value={saveName}
          onChange={(event) => setSaveName(event.target.value)}
          disabled={isBusy}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSaveToDatabase} disabled={isBusy}>
          Save to DB
        </Button>
        <Button variant="outline" onClick={handleSaveToFile} disabled={isBusy}>
          Save to file
        </Button>
        <Button variant="outline" onClick={handleOpenFilePicker} disabled={isBusy}>
          Load from file
        </Button>
        <Button variant="outline" onClick={handleRefreshSlots} disabled={isBusy}>
          Refresh list
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <p className="text-sm text-muted-foreground">{statusMessage}</p>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Database saves</h3>
        {!hasLoadedSlots ? (
          <p className="text-sm text-muted-foreground">
            Press refresh to load saves from IndexedDB.
          </p>
        ) : saveSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saves yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {saveSlots.map((saveSlot) => (
              <li
                key={saveSlot.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-sm"
              >
                <div>
                  <div className="font-medium">
                    #{saveSlot.id} {saveSlot.name}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    a:{saveSlot.payload.alpha.toFixed(1)} b:
                    {saveSlot.payload.beta.toFixed(1)} g:
                    {saveSlot.payload.gamma.toFixed(1)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleLoadFromDatabase(saveSlot.id)}
                    disabled={isBusy}
                  >
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteFromDatabase(saveSlot.id)}
                    disabled={isBusy}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
