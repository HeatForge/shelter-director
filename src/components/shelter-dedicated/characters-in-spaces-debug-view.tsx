import { Bot, MousePointer2, MoveRight, RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { executeCharacterAction, type ActionResult } from "@/domain/actions"
import { runBehaviorStep } from "@/domain/behavior"
import { getInteractionEligibility } from "@/domain/interactable-object"
import { formatTimeUnit, type TimeDuration } from "@/domain/time"
import { useGlobalStore } from "@/store/global-store"

import SaveManagementDemo from "./save-management-demo"
import TimeWidget from "./time-widget"

/** Shows the complete Characters In Spaces milestone loop in one debug view. */
export default function CharactersInSpacesDebugView() {
  const session = useGlobalStore((state) => state.session)
  const hydrateSession = useGlobalStore((state) => state.hydrateSession)
  const resetSession = useGlobalStore((state) => state.resetSession)
  const advanceTime = useGlobalStore((state) => state.advanceTime)
  const characterIds = Object.keys(session.characters)
  const [selectedCharacterId, setSelectedCharacterId] = useState(
    characterIds[0] ?? ""
  )
  const [statusMessage, setStatusMessage] = useState("Ready.")
  const effectiveSelectedCharacterId = session.characters[selectedCharacterId]
    ? selectedCharacterId
    : characterIds[0]

  const selectedCharacter = effectiveSelectedCharacterId
    ? session.characters[effectiveSelectedCharacterId]
    : undefined
  const selectedSpace = selectedCharacter
    ? session.spaces[selectedCharacter.currentSpaceId]
    : undefined
  const localObjects = useMemo(
    () =>
      selectedCharacter
        ? Object.values(session.objects).filter(
            (object) => object.spaceId === selectedCharacter.currentSpaceId
          )
        : [],
    [selectedCharacter, session.objects]
  )

  /** Applies an action result to the store and status line. */
  const applyActionResult = (result: ActionResult) => {
    if (result.ok) {
      hydrateSession(result.session)
    }

    setStatusMessage(result.message)
  }

  /** Executes one movement action for the selected character. */
  const handleMove = (destinationSpaceId: string) => {
    if (!selectedCharacter) {
      return
    }

    applyActionResult(
      executeCharacterAction(session, {
        actorId: selectedCharacter.id,
        kind: "move",
        target: { destinationSpaceId },
      })
    )
  }

  /** Executes one object interaction for the selected character. */
  const handleInteract = (objectId: string, interactionKey: string) => {
    if (!selectedCharacter) {
      return
    }

    applyActionResult(
      executeCharacterAction(session, {
        actorId: selectedCharacter.id,
        kind: "interact",
        target: { objectId, interactionKey },
      })
    )
  }

  /** Runs one deterministic behavior step and loads the resulting session. */
  const handleBehaviorStep = () => {
    const stepResult = runBehaviorStep(session)
    hydrateSession(stepResult.session)
    setStatusMessage(
      stepResult.actionResults.length === 0
        ? stepResult.decisions.map((decision) => decision.reason).join(" ")
        : stepResult.actionResults.map((result) => result.message).join(" ")
    )
  }

  /** Advances the game clock and displays the selected duration in the status line. */
  const handleTimeAdvance = (duration: TimeDuration) => {
    advanceTime(duration)
    setStatusMessage(
      `Time advanced by ${duration.amount} ${formatTimeUnit(duration.unit, duration.amount)}.`
    )
  }

  /** Restores the deterministic demo fixture. */
  const handleReset = () => {
    resetSession()
    setStatusMessage("Demo reset.")
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h1 className="text-2xl font-bold">Characters In Spaces</h1>
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleBehaviorStep}>
              <Bot />
              Step
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw />
              Reset
            </Button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="grid gap-3 md:grid-cols-3">
            {Object.values(session.spaces).map((space) => {
              const occupants = Object.values(session.characters).filter(
                (character) => character.currentSpaceId === space.id
              )
              const objects = Object.values(session.objects).filter(
                (object) => object.spaceId === space.id
              )

              return (
                <article
                  key={space.id}
                  className="flex min-h-64 flex-col gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div>
                    <h2 className="text-base font-semibold">{space.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {space.description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {space.connectedSpaceIds
                      .map(
                        (spaceId) => session.spaces[spaceId]?.name ?? spaceId
                      )
                      .join(" / ")}
                  </div>
                  <div className="flex flex-col gap-2">
                    {occupants.map((character) => (
                      <button
                        key={character.id}
                        className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                          character.id === effectiveSelectedCharacterId
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                        onClick={() => setSelectedCharacterId(character.id)}
                      >
                        <span className="block font-medium">
                          {character.name}
                        </span>
                        <span className="text-xs opacity-80">
                          H {character.stats.hunger.value} / E{" "}
                          {character.stats.energy.value} / M{" "}
                          {character.stats.morale.value}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 text-xs">
                    {objects.map((object) => (
                      <span
                        key={object.id}
                        className="rounded-md border border-border px-2 py-1"
                      >
                        {object.name}
                      </span>
                    ))}
                  </div>
                </article>
              )
            })}
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">
                {selectedCharacter?.name ?? "No character"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedSpace?.name ?? "No space selected"}
              </p>
              {selectedCharacter ? (
                <div className="mt-4 grid gap-2">
                  {Object.entries(selectedCharacter.stats).map(
                    ([statKey, stat]) => (
                      <div key={statKey} className="grid gap-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{statKey}</span>
                          <span>
                            {stat.value}/{stat.max}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width:
                                stat.max === stat.min
                                  ? "100%"
                                  : `${((stat.value - stat.min) / (stat.max - stat.min)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </section>

            <TimeWidget
              gameTime={session.gameTime}
              onAdvance={handleTimeAdvance}
              timeSimulation={session.timeSimulation}
            />

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">Movement</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selectedSpace?.connectedSpaceIds ?? []).map((spaceId) => (
                  <Button
                    key={spaceId}
                    variant="outline"
                    className="w-full justify-start whitespace-normal"
                    onClick={() => handleMove(spaceId)}
                  >
                    <MoveRight />
                    {session.spaces[spaceId]?.name ?? spaceId}
                  </Button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">Interactions</h2>
              <div className="mt-3 flex flex-col gap-2">
                {localObjects.flatMap((object) =>
                  Object.values(object.interactions).map((interaction) => {
                    const eligibility = getInteractionEligibility(
                      object,
                      interaction.key
                    )

                    return (
                      <Button
                        key={`${object.id}:${interaction.key}`}
                        variant="outline"
                        className="w-full justify-start whitespace-normal"
                        disabled={!eligibility.eligible}
                        onClick={() =>
                          handleInteract(object.id, interaction.key)
                        }
                      >
                        <MousePointer2 />
                        {interaction.name} at {object.name}
                      </Button>
                    )
                  })
                )}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">Action Log</h2>
              <ol className="mt-3 flex max-h-60 flex-col gap-2 overflow-auto text-sm">
                {session.actionLog.slice(0, 8).map((entry) => (
                  <li
                    key={entry.id}
                    className="border-b border-border pb-2 last:border-0"
                  >
                    {entry.message}
                  </li>
                ))}
              </ol>
            </section>

            <SaveManagementDemo />
          </aside>
        </div>
      </div>
    </main>
  )
}
