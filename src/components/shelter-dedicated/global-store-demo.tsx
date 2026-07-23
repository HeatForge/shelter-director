import { Button } from "@/components/ui/button"
import { useGlobalStore } from "@/store/global-store"

/**
 * Temporary session summary for checking that the global store is wired.
 */
export default function GlobalStoreDemo() {
  const session = useGlobalStore((state) => state.session)
  const resetSession = useGlobalStore((state) => state.resetSession)

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-accent p-4">
      <h2 className="text-lg font-bold">Game Session Store</h2>
      <ul className="font-mono text-sm">
        <li>characters: {Object.keys(session.characters).length}</li>
        <li>spaces: {Object.keys(session.spaces).length}</li>
        <li>objects: {Object.keys(session.objects).length}</li>
        <li>log entries: {session.actionLog.length}</li>
      </ul>
      <Button variant="outline" onClick={resetSession}>
        Reset session
      </Button>
    </div>
  )
}
