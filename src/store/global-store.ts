import { create } from "zustand"

/**
 * Temporary placeholder values held in the global store until real game session data lands.
 */
export type GlobalStoreState = {
  /** First temporary random value. */
  alpha: number
  /** Second temporary random value. */
  beta: number
  /** Third temporary random value. */
  gamma: number
  /** Replaces alpha with a new random value. */
  setAlpha: (alpha: number) => void
  /** Replaces beta with a new random value. */
  setBeta: (beta: number) => void
  /** Replaces gamma with a new random value. */
  setGamma: (gamma: number) => void
  /** Fills alpha, beta, and gamma with fresh random values. */
  randomizeAll: () => void
}

/** Builds a random number between 0 and 100 for temporary store demos. */
function createRandomValue(): number {
  return Math.random() * 100
}

/**
 * Global Zustand store for game session data shared across the app.
 * Currently holds three temporary random values for wiring demos.
 */
export const useGlobalStore = create<GlobalStoreState>((set) => ({
  alpha: createRandomValue(),
  beta: createRandomValue(),
  gamma: createRandomValue(),
  setAlpha: (alpha) => set({ alpha }),
  setBeta: (beta) => set({ beta }),
  setGamma: (gamma) => set({ gamma }),
  randomizeAll: () =>
    set({
      alpha: createRandomValue(),
      beta: createRandomValue(),
      gamma: createRandomValue(),
    }),
}))
