import { useEffect } from "react"

import CharactersInSpacesDebugView from "./components/shelter-dedicated/characters-in-spaces-debug-view"
import { useTheme } from "./components/theme-provider"

export function App() {

  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme("dark")
  }, [setTheme])

  return <CharactersInSpacesDebugView/>
}

export default App
