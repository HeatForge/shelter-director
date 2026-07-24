import type { GameTime, TimeDuration } from "./time"

export type TimeChangeEvent = {
  previousTime: GameTime
  currentTime: GameTime
  duration: TimeDuration
  elapsedSeconds: number
}

export type TimeSimulationState = {
  dummySimulatedValue: number
}

/** Creates the initial state for the temporary time-change simulation. */
export function createTimeSimulationState(): TimeSimulationState {
  return { dummySimulatedValue: 0 }
}

/** Updates the temporary simulation value after a game-clock change. */
export function applyTimeChangeSimulation(
  simulation: TimeSimulationState,
  event: TimeChangeEvent
): TimeSimulationState {
  const dummySimulatedValue =
    simulation.dummySimulatedValue + event.elapsedSeconds

  if (!Number.isSafeInteger(dummySimulatedValue)) {
    throw new RangeError("Dummy simulation value is too large.")
  }

  return { dummySimulatedValue }
}
