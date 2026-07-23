import { Button } from "@/components/ui/button"
import { useTheme } from "./components/theme-provider"
import TimeWidget from "./components/shelter-dedicated/time-widget"

export function App() {

  const theme = useTheme()
  theme.setTheme("dark")

  return (
    <main>
      <TimeWidget/>
    </main>
  )
}

export default App
