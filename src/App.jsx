import { useEffect } from 'react'
import { AppProvider, useApp } from './store.jsx'
import Sidebar from './components/Sidebar.jsx'
import Toolbar from './components/Toolbar.jsx'
import Canvas from './components/Canvas.jsx'
import Panel from './components/Panel.jsx'
import { GridSettingsOverlay, Menus } from './components/Overlays.jsx'
import { Analytics } from '@vercel/analytics/react'

function Shortcuts() {
  const app = useApp()
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (app.menu) app.setMenu(null)
        else if (app.overlay) app.setOverlay(null)
        else app.clearSelection()
        return
      }
      const cardsSelected = app.selection.length > 0 && !app.selection[0].startsWith('group:')
      if (e.key.toLowerCase() === 'a' && e.shiftKey && cardsSelected) {
        if (e.metaKey && app.selection.length >= 2) {
          e.preventDefault()
          app.applyLayout('grid')
        } else if (!e.metaKey) {
          e.preventDefault()
          app.applyLayout('flex')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [app])
  return null
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex h-full font-sans antialiased text-xs/4">
        <Sidebar />
        <Toolbar />
        <Canvas />
        <Panel />
        <GridSettingsOverlay />
        <Menus />
      </div>
      <Shortcuts />
      <Analytics />
    </AppProvider>
  )
}
