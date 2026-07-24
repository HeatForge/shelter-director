/* @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { useGlobalStore } from "@/store/global-store"

import CharactersInSpacesDebugView from "./characters-in-spaces-debug-view"

describe("characters in spaces debug view", () => {
  beforeEach(() => {
    useGlobalStore.getState().resetSession()
  })

  afterEach(() => {
    cleanup()
  })

  it("opens directly into the milestone demo", () => {
    render(<CharactersInSpacesDebugView />)

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Characters In Spaces"
    )
    expect(screen.getByRole("button", { name: /Mara/ }).textContent).toContain(
      "H 25"
    )
    expect(screen.getByText("Demo shelter initialized.")).toBeTruthy()
  })

  it("demonstrates movement, interaction, behavior stepping, logging, and reset", async () => {
    const user = userEvent.setup()
    render(<CharactersInSpacesDebugView />)

    await user.click(screen.getByRole("button", { name: "Mess Hall" }))
    expect(
      screen.getAllByText("Mara moved to Mess Hall.").length
    ).toBeGreaterThan(0)

    await user.click(
      screen.getByRole("button", { name: "Eat at Food Station" })
    )
    expect(
      screen.getAllByText("Mara used Food Station: hunger 25->60.").length
    ).toBeGreaterThan(0)
    expect(screen.getByText("60/100")).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Step" }))
    expect(document.body.textContent).toContain("Ivan moved to Mess Hall.")

    await user.click(screen.getByRole("button", { name: "Reset" }))
    expect(screen.getByText("Demo reset.")).toBeTruthy()
    expect(screen.getByRole("button", { name: /Mara/ }).textContent).toContain(
      "H 25"
    )
  })

  it("advances the game clock and updates the connected demo value", async () => {
    const user = userEvent.setup()
    render(<CharactersInSpacesDebugView />)

    expect(screen.getByText(/Dummy simulation output: 0/)).toBeTruthy()
    await user.click(screen.getByRole("button", { name: "+1 hour" }))

    expect(screen.getByText(/01:00:00/)).toBeTruthy()
    expect(screen.getByText(/Dummy simulation output: 3,600/)).toBeTruthy()
    expect(screen.getByText("Time advanced by 1 hour.")).toBeTruthy()
  })
})
