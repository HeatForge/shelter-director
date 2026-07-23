import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { useGlobalStore } from "@/store/global-store"

/**
 * Temporary demo that shows the global store in action.
 * When alpha changes, beta is rewritten to mirror half of alpha.
 */
export default function GlobalStoreDemo() {
  const alpha = useGlobalStore((state) => state.alpha)
  const beta = useGlobalStore((state) => state.beta)
  const gamma = useGlobalStore((state) => state.gamma)
  const setAlpha = useGlobalStore((state) => state.setAlpha)
  const setBeta = useGlobalStore((state) => state.setBeta)
  const randomizeAll = useGlobalStore((state) => state.randomizeAll)

  useEffect(() => {
    setBeta(alpha / 2)
  }, [alpha, setBeta])

  /** Rolls a new random alpha to trigger the beta reaction. */
  const handleChangeAlpha = () => {
    setAlpha(Math.random() * 100)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-accent p-4">
      <h2 className="text-lg font-bold">Global Store Demo</h2>
      <p className="text-sm text-muted-foreground">
        Changing alpha updates beta to half of alpha.
      </p>
      <ul className="font-mono text-sm">
        <li>alpha: {alpha.toFixed(2)}</li>
        <li>beta: {beta.toFixed(2)}</li>
        <li>gamma: {gamma.toFixed(2)}</li>
      </ul>
      <div className="flex gap-2">
        <Button onClick={handleChangeAlpha}>Change alpha</Button>
        <Button variant="outline" onClick={randomizeAll}>
          Randomize all
        </Button>
      </div>
    </div>
  )
}
