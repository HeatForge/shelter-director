import { useTheme } from "./components/theme-provider"
import GlobalStoreDemo from "./components/shelter-dedicated/global-store-demo"
import SaveManagementDemo from "./components/shelter-dedicated/save-management-demo"
import TimeWidget from "./components/shelter-dedicated/time-widget"

export function App() {

  const theme = useTheme()
  theme.setTheme("dark")

  return (
    <main className="flex flex-wrap gap-4 p-4">
      <TimeWidget/>
      <GlobalStoreDemo/>
      <SaveManagementDemo/>
    </main>
  )
}

export default App
