import { createContext, useContext, useMemo, useState } from 'react'

/* ------------------------------------------------------------------
   App state. Layouts are keyed by node id:
   - 'exp-N'            — a card; every card is a flex box by default
   - 'wrap:experience'  — the container created by Add grid / Add flex
                          around the selected cards (members)
   - 'group:experience' — the original cards row
------------------------------------------------------------------- */

export const makeTrack = () => ({ mode: 'fill', fr: 1, px: 120 })

const makeGrid = (cols, rows) => ({
  cols: Array.from({ length: cols }, makeTrack),
  rows: Array.from({ length: rows }, makeTrack),
  rowMode: 'fixed', // 'fixed' (explicit count) | 'auto' (implicit rows that hug content)
  colGap: 8,
  rowGap: 8,
  posMode: 'item', // which position tab is being edited: 'item' | 'grid'
  itemPos: { x: 'stretch', y: 'stretch' }, // items stretch by default
  gridPos: { x: 'start', y: 'start' }, // where tracks sit when there is free space
  pad: { t: 0, r: 0, b: 0, l: 0 },
  individualPad: false,
  clip: true,
})

const makeFlex = () => ({
  dir: 'row',
  gap: 8,
  pos: { x: 'start', y: 'start' },
  pad: { t: 0, r: 0, b: 0, l: 0 },
  individualPad: false,
  clip: true,
})

/* the cards' own default flex: column, 8 gap, 12 padding — how they were designed */
const cardFlex = () => ({
  dir: 'column',
  gap: 8,
  pos: { x: 'start', y: 'start' },
  pad: { t: 12, r: 12, b: 12, l: 12 },
  individualPad: false,
  clip: true,
})

const makeEntry = (cols = 3, rows = 2) => ({ layout: 'none', grid: makeGrid(cols, rows), flex: makeFlex() })

export const CARD_IDS = ['exp-0', 'exp-1', 'exp-2', 'exp-3', 'exp-4']

/* exp-0 starts as a plain frame (no layout) so selecting it alone demos the
   single-element "Add flex" entry point; the rest are flex boxes. */
const NO_LAYOUT_CARD = 'exp-0'

const initialLayouts = () => ({
  'group:experience': makeEntry(3, 2),
  ...Object.fromEntries(
    CARD_IDS.map((id) => [id, { ...makeEntry(), layout: id === NO_LAYOUT_CARD ? 'none' : 'flex', flex: cardFlex() }]),
  ),
})

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [selection, setSelection] = useState([])
  const [layouts, setLayouts] = useState(initialLayouts)
  const [overlay, setOverlay] = useState(null) // 'gridSettings' | null
  const [menu, setMenu] = useState(null) // {kind:'position'|'track', ...}

  if (import.meta.env.DEV) {
    window.__layouts = layouts // debug aid
    window.__selection = selection
  }

  const api = useMemo(() => {
    const entryOf = (id) => layouts[id] ?? null

    /* the single selected node that owns an active layout, or null */
    const activeLayoutId =
      selection.length === 1 && entryOf(selection[0]) && entryOf(selection[0]).layout !== 'none' ? selection[0] : null

    return {
      selection,
      layouts,
      overlay,
      menu,
      setOverlay,
      setMenu,
      entryOf,
      activeLayoutId,

      selectCard(id, additive) {
        setOverlay(null)
        setMenu(null)
        setSelection((prev) => {
          if (!additive) return [id]
          const prevCards = prev.filter((x) => x.startsWith('exp-'))
          if (prevCards.includes(id)) return prevCards.filter((x) => x !== id)
          return [...prevCards, id]
        })
      },

      selectNode(id) {
        setOverlay(null)
        setMenu(null)
        setSelection([id])
      },

      clearSelection() {
        setOverlay(null)
        setMenu(null)
        setSelection([])
      },

      /* Add flex on 1 element applies to that element. With 2+ selected,
         the selected cards get wrapped in a new container (grid or flex);
         the wrapper becomes the selection. */
      applyLayout(kind) {
        const cards = selection.filter((x) => x.startsWith('exp-'))
        if (!cards.length) return
        if (cards.length === 1) {
          if (kind === 'grid') return
          const id = cards[0]
          setLayouts((prev) => ({ ...prev, [id]: { ...prev[id], layout: 'flex' } }))
          return
        }
        const members = CARD_IDS.filter((id) => cards.includes(id))
        setLayouts((prev) => ({
          ...prev,
          'wrap:experience': {
            ...makeEntry(3, 2),
            layout: kind,
            members,
            spans: Object.fromEntries(members.map((mid) => [mid, { col: 1, row: 1 }])),
          },
        }))
        setSelection(['wrap:experience'])
      },

      removeLayout(id) {
        setLayouts((prev) => ({ ...prev, [id]: { ...prev[id], layout: 'none', members: [] } }))
        setOverlay(null)
        setMenu(null)
        if (id.startsWith('wrap:')) setSelection([])
      },

      updateGrid(id, patch) {
        setLayouts((prev) => ({ ...prev, [id]: { ...prev[id], grid: { ...prev[id].grid, ...patch } } }))
      },

      updateFlex(id, patch) {
        setLayouts((prev) => ({ ...prev, [id]: { ...prev[id], flex: { ...prev[id].flex, ...patch } } }))
      },

      setTrackCount(id, axis, n) {
        n = Math.max(1, Math.min(12, Math.round(n) || 1))
        setLayouts((prev) => {
          const grid = prev[id].grid
          const key = axis === 'col' ? 'cols' : 'rows'
          const tracks = grid[key].slice(0, n)
          while (tracks.length < n) tracks.push(makeTrack())
          return { ...prev, [id]: { ...prev[id], grid: { ...grid, [key]: tracks } } }
        })
      },

      /* how many columns/rows a grid item spans (edge-drag or panel edit) */
      updateSpan(wrapId, cardId, patch) {
        setLayouts((prev) => {
          const entry = prev[wrapId]
          if (!entry) return prev
          const grid = entry.grid
          const cur = entry.spans?.[cardId] ?? { col: 1, row: 1 }
          const next = { ...cur, ...patch }
          next.col = Math.max(1, Math.min(grid.cols.length, Math.round(next.col) || 1))
          const rowMax = grid.rowMode === 'fixed' ? grid.rows.length : 8
          next.row = Math.max(1, Math.min(rowMax, Math.round(next.row) || 1))
          if (next.col === cur.col && next.row === cur.row) return prev
          return { ...prev, [wrapId]: { ...entry, spans: { ...(entry.spans ?? {}), [cardId]: next } } }
        })
      },

      updateTrack(id, axis, index, patch) {
        setLayouts((prev) => {
          const grid = prev[id].grid
          const key = axis === 'col' ? 'cols' : 'rows'
          const tracks = grid[key].map((t, i) => (i === index ? { ...t, ...patch } : t))
          return { ...prev, [id]: { ...prev[id], grid: { ...grid, [key]: tracks } } }
        })
      },
    }
  }, [selection, layouts, overlay, menu])

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>
}

export const useApp = () => useContext(AppCtx)

/* ---------- CSS derivation ---------- */

export const trackToCSS = (t) => {
  switch (t.mode) {
    case 'hug':
      return 'auto'
    case 'fixed':
      return `${t.px}px`
    default:
      return `${t.fr}fr`
  }
}

export const trackLabel = (t) => {
  switch (t.mode) {
    case 'hug':
      return { value: 'Auto', mode: 'Hug' }
    case 'fixed':
      return { value: `${t.px}`, mode: 'Fixed' }
    default:
      return { value: `${t.fr}fr`, mode: 'Fill' }
  }
}

const flexAlign = (v) => (v === 'center' ? 'center' : v === 'end' ? 'flex-end' : v === 'stretch' ? 'stretch' : 'flex-start')

export function layoutStyle(entry) {
  if (!entry) return null
  const { layout, grid, flex } = entry
  if (layout === 'grid') {
    const base = {
      display: 'grid',
      columnGap: grid.colGap,
      rowGap: grid.rowGap,
      padding: `${grid.pad.t}px ${grid.pad.r}px ${grid.pad.b}px ${grid.pad.l}px`,
      overflow: grid.clip ? 'hidden' : 'visible',
    }
    base.gridTemplateColumns = grid.cols.map(trackToCSS).join(' ')
    // rows: Fixed = explicit track list; Auto = implicit rows that hug content
    if (grid.rowMode === 'fixed') {
      base.gridTemplateRows = grid.rows.map(trackToCSS).join(' ')
    } else {
      base.gridAutoRows = 'auto'
    }
    /* both apply simultaneously — the posMode tab only picks which one the picker edits */
    base.justifyItems = grid.itemPos.x
    base.alignItems = grid.itemPos.y
    base.justifyContent = grid.gridPos.x
    base.alignContent = grid.gridPos.y
    return base
  }
  if (layout === 'flex') {
    return {
      display: 'flex',
      flexDirection: flex.dir,
      gap: flex.gap,
      justifyContent: flexAlign(flex.pos.x),
      alignItems: flexAlign(flex.pos.y),
      padding: `${flex.pad.t}px ${flex.pad.r}px ${flex.pad.b}px ${flex.pad.l}px`,
      overflow: flex.clip ? 'hidden' : 'visible',
    }
  }
  return null
}
