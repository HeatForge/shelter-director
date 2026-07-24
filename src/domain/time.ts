export const TIME_UNITS = [
  "second",
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
  "decade",
  "century",
  "millennium",
] as const

export type TimeUnit = (typeof TIME_UNITS)[number]

export type GameTime = {
  seconds: number
  minutes: number
  hours: number
  days: number
  weeks: number
  months: number
  years: number
  decades: number
  centuries: number
  millennia: number
}

export type TimeDuration = {
  amount: number
  unit: TimeUnit
}

const timeUnitFields: Record<TimeUnit, keyof GameTime> = {
  second: "seconds",
  minute: "minutes",
  hour: "hours",
  day: "days",
  week: "weeks",
  month: "months",
  year: "years",
  decade: "decades",
  century: "centuries",
  millennium: "millennia",
}

const rolloverRules: Array<{
  field: keyof GameTime
  nextField: keyof GameTime
  amount: number
}> = [
  { field: "seconds", nextField: "minutes", amount: 60 },
  { field: "minutes", nextField: "hours", amount: 60 },
  { field: "hours", nextField: "days", amount: 24 },
  { field: "days", nextField: "weeks", amount: 7 },
  { field: "weeks", nextField: "months", amount: 4 },
  { field: "months", nextField: "years", amount: 12 },
  { field: "years", nextField: "decades", amount: 10 },
  { field: "decades", nextField: "centuries", amount: 10 },
  { field: "centuries", nextField: "millennia", amount: 10 },
]

const unitSeconds: Record<TimeUnit, number> = {
  second: 1,
  minute: 60,
  hour: 60 * 60,
  day: 60 * 60 * 24,
  week: 60 * 60 * 24 * 7,
  month: 60 * 60 * 24 * 7 * 4,
  year: 60 * 60 * 24 * 7 * 4 * 12,
  decade: 60 * 60 * 24 * 7 * 4 * 12 * 10,
  century: 60 * 60 * 24 * 7 * 4 * 12 * 10 * 10,
  millennium: 60 * 60 * 24 * 7 * 4 * 12 * 10 * 10 * 10,
}

/** Creates the baseline game-clock value. */
export function createGameTime(): GameTime {
  return {
    seconds: 0,
    minutes: 0,
    hours: 0,
    days: 0,
    weeks: 0,
    months: 0,
    years: 0,
    decades: 0,
    centuries: 0,
    millennia: 0,
  }
}

/** Advances a game-clock value and carries each field into its next larger unit. */
export function advanceGameTime(
  time: GameTime,
  duration: TimeDuration
): GameTime {
  validateGameTime(time)
  validateTimeDuration(duration)

  const advancedTime = { ...time }
  const field = timeUnitFields[duration.unit]
  advancedTime[field] += duration.amount

  for (const rule of rolloverRules) {
    const carriedAmount = Math.floor(advancedTime[rule.field] / rule.amount)
    advancedTime[rule.field] %= rule.amount
    advancedTime[rule.nextField] += carriedAmount
  }

  validateGameTime(advancedTime)
  return advancedTime
}

/** Returns the number of seconds represented by a duration. */
export function getDurationInSeconds(duration: TimeDuration): number {
  validateTimeDuration(duration)
  const durationSeconds = duration.amount * unitSeconds[duration.unit]

  if (!Number.isSafeInteger(durationSeconds)) {
    throw new RangeError("Time duration is too large.")
  }

  return durationSeconds
}

/** Returns a human-readable name for one time unit. */
export function formatTimeUnit(unit: TimeUnit, amount = 1): string {
  const labels: Record<TimeUnit, string> = {
    second: "second",
    minute: "minute",
    hour: "hour",
    day: "day",
    week: "week",
    month: "month",
    year: "year",
    decade: "decade",
    century: "century",
    millennium: "millennium",
  }

  return `${labels[unit]}${amount === 1 ? "" : "s"}`
}

/** Formats the complete normalized game clock for display. */
export function formatGameTime(time: GameTime): string {
  validateGameTime(time)

  return `${padTime(time.hours)}:${padTime(time.minutes)}:${padTime(time.seconds)} · Day ${time.days + 1}, Week ${time.weeks + 1}, Month ${time.months + 1}, Year ${time.years + 1}, Decade ${time.decades + 1}, Century ${time.centuries + 1}, Millennium ${time.millennia + 1}`
}

/** Validates that a value is a normalized game-clock shape. */
export function validateGameTime(time: unknown): asserts time is GameTime {
  if (!isRecord(time)) {
    throw new Error("Game time must be an object.")
  }

  for (const field of Object.values(timeUnitFields)) {
    if (!isSafeNonNegativeInteger(time[field])) {
      throw new Error(`Game time ${field} must be a non-negative safe integer.`)
    }
  }

  for (const rule of rolloverRules) {
    if ((time[rule.field] as number) >= rule.amount) {
      throw new Error(
        `Game time ${rule.field} must be less than ${rule.amount}.`
      )
    }
  }
}

/** Validates a requested clock advancement. */
export function validateTimeDuration(
  duration: unknown
): asserts duration is TimeDuration {
  if (!isRecord(duration) || !TIME_UNITS.includes(duration.unit as TimeUnit)) {
    throw new Error("Time duration must include a valid unit.")
  }

  if (!isSafeNonNegativeInteger(duration.amount) || duration.amount < 1) {
    throw new Error("Time duration amount must be a positive safe integer.")
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
}

function padTime(value: number): string {
  return value.toString().padStart(2, "0")
}
