import { Clock3, FastForward } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  formatGameTime,
  formatTimeUnit,
  TIME_UNITS,
  type GameTime,
  type TimeDuration,
  type TimeUnit,
} from "@/domain/time"
import type { TimeSimulationState } from "@/domain/time-simulation"

type TimeWidgetProps = {
  gameTime: GameTime
  timeSimulation: TimeSimulationState
  onAdvance: (duration: TimeDuration) => void
}

/** Displays the game clock and controls for manually advancing it. */
export default function TimeWidget({
  gameTime,
  timeSimulation,
  onAdvance,
}: TimeWidgetProps) {
  const [amount, setAmount] = useState("1")
  const [unit, setUnit] = useState<TimeUnit>("hour")

  /** Advances the clock when the selected amount is valid. */
  const advanceSelectedDuration = () => {
    const parsedAmount = Number(amount)
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 1) {
      return
    }

    onAdvance({ amount: parsedAmount, unit })
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Clock3 className="size-5" />
        <h2 className="text-lg font-semibold">Game Time</h2>
      </div>
      <time
        className="mt-3 block text-sm font-medium"
        dateTime={JSON.stringify(gameTime)}
      >
        {formatGameTime(gameTime)}
      </time>
      <p className="mt-2 text-sm text-muted-foreground">
        Dummy simulation output:{" "}
        {timeSimulation.dummySimulatedValue.toLocaleString()}
      </p>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
        <label className="sr-only" htmlFor="time-amount">
          Time amount
        </label>
        <input
          id="time-amount"
          className="min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
          min="1"
          onChange={(event) => setAmount(event.target.value)}
          step="1"
          type="number"
          value={amount}
        />
        <label className="sr-only" htmlFor="time-unit">
          Time unit
        </label>
        <select
          id="time-unit"
          className="min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
          onChange={(event) => setUnit(event.target.value as TimeUnit)}
          value={unit}
        >
          {TIME_UNITS.map((timeUnit) => (
            <option key={timeUnit} value={timeUnit}>
              {formatTimeUnit(timeUnit)}
            </option>
          ))}
        </select>
        <Button onClick={advanceSelectedDuration}>
          <FastForward />
          Advance time
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { amount: 1, unit: "minute" },
          { amount: 1, unit: "hour" },
          { amount: 1, unit: "day" },
          { amount: 1, unit: "week" },
        ].map((duration) => (
          <Button
            key={duration.unit}
            onClick={() => onAdvance(duration as TimeDuration)}
            size="sm"
            variant="outline"
          >
            +{duration.amount} {formatTimeUnit(duration.unit as TimeUnit)}
          </Button>
        ))}
      </div>
    </section>
  )
}
