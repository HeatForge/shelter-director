import { describe, expect, it } from "vitest"

import {
  advanceGameTime,
  createGameTime,
  formatGameTime,
  getDurationInSeconds,
} from "./time"

describe("game time", () => {
  it("carries each unit through the complete simplified hierarchy", () => {
    const advancedTime = advanceGameTime(createGameTime(), {
      amount: 1,
      unit: "millennium",
    })
    const carriedTime = advanceGameTime(advancedTime, {
      amount: 60 * 60 * 24 * 7 * 4 * 12 * 10 * 10 * 10,
      unit: "second",
    })

    expect(carriedTime).toEqual({
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      weeks: 0,
      months: 0,
      years: 0,
      decades: 0,
      centuries: 0,
      millennia: 2,
    })
  })

  it("formats a zero-based clock as player-facing one-based calendar values", () => {
    expect(formatGameTime(createGameTime())).toBe(
      "00:00:00 · Day 1, Week 1, Month 1, Year 1, Decade 1, Century 1, Millennium 1"
    )
  })

  it("converts a supplied unit amount to elapsed seconds", () => {
    expect(getDurationInSeconds({ amount: 2, unit: "week" })).toBe(1_209_600)
  })
})
