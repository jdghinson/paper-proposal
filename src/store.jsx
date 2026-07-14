import { createContext, useContext, useMemo, useState } from 'react'
import { resolveDrop, clampRect, rectOf } from './placement.js'

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

/* cells the items take up — a spanning item eats more than one */
const usedCells = (entry) =>
  (entry.members ?? []).reduce((n, mid) => {
    const s = entry.spans?.[mid] ?? { col: 1, row: 1 }
    return n + s.col * s.row
  }, 0)

/* If the items can't fit the explicit grid, CSS spills them into implicit rows —
   so the row count is no longer the truth. Say so: switch rows to Auto. */
const autoRowsIfOverflowing = (entry) => {
  const g = entry.grid
  if (g.rowMode !== 'fixed') return entry
  if (usedCells(entry) <= g.cols.length * g.rows.length) return entry
  return { ...entry, grid: { ...g, rowMode: 'auto' } }
}

/* Inverse: adding enough explicit rows so a Fixed row count can hold the items */
const growRowsToFit = (entry) => {
  const g = entry.grid
  const need = Math.ceil(usedCells(entry) / g.cols.length)
  if (g.rows.length >= need) return entry
  const rows = g.rows.slice()
  while (rows.length < need) rows.push(makeTrack())
  return { ...entry, grid: { ...g, rows } }
}

export const WRAP_ID = 'wrap:experience'

/* Auto rows are implicit — CSS makes as many as the content needs — so the row
   ceiling for placement is the explicit count plus headroom for those. */
export const AUTO_ROW_HEADROOM = 8

export const gridDims = (entry) => ({
  cols: entry.grid.cols.length,
  rows: entry.grid.rowMode === 'fixed' ? entry.grid.rows.length : entry.grid.rows.length + AUTO_ROW_HEADROOM,
})

export const isPinned = (entry) => Boolean(entry?.places)

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
        /* Default a grid to a near-square shape so both dimensions are visible
           immediately (grid's whole point) — cols = ⌈√N⌉, rows = ⌈N/cols⌉:
           3→2×2, 4→2×2, 5→3×2, 6→3×2. Flex wrap keeps the 3×2 config unused. */
        const n = members.length
        const cols = kind === 'grid' ? Math.ceil(Math.sqrt(n)) : 3
        const rows = kind === 'grid' ? Math.ceil(n / cols) : 2
        setLayouts((prev) => ({
          ...prev,
          'wrap:experience': {
            ...makeEntry(cols, rows),
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
        setLayouts((prev) => {
          let entry = { ...prev[id], grid: { ...prev[id].grid, ...patch } }
          /* picking Fixed rows: give it enough rows to actually hold the items,
             otherwise "Fixed N" would be a lie the moment anything overflows */
          if (patch.rowMode === 'fixed') entry = growRowsToFit(entry)
          return { ...prev, [id]: entry }
        })
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
          const entry = { ...prev[id], grid: { ...grid, [key]: tracks } }
          return { ...prev, [id]: autoRowsIfOverflowing(entry) }
        })
      },

      /* First move pins every member where it currently sits, measured from the
         DOM by the canvas. After that, placement is explicit and nothing
         re-flows behind the user. Idempotent — a second call is ignored. */
      pinPlaces(wrapId, places) {
        setLayouts((prev) => {
          const entry = prev[wrapId]
          if (!entry || entry.places) return prev
          return { ...prev, [wrapId]: { ...entry, places } }
        })
      },

      moveItem(wrapId, cardId, target) {
        setLayouts((prev) => {
          const entry = prev[wrapId]
          if (!entry?.places) return prev
          const result = resolveDrop(entry, cardId, target, gridDims(entry))
          if (!result.ok) return prev // refused: swap wouldn't fit, or 2+ occupants
          return { ...prev, [wrapId]: autoRowsIfOverflowing({ ...entry, places: result.places }) }
        })
      },

      /* an edge-drag resize: the rect the user is asking for, shrunk until legal */
      resizeItem(wrapId, cardId, desired) {
        setLayouts((prev) => {
          const entry = prev[wrapId]
          if (!entry?.places) return prev
          const rect = clampRect(entry, cardId, desired, gridDims(entry))
          if (!rect) return prev // not pinned, or its pinned rect is no longer legal
          const cur = rectOf(entry, cardId)
          if (cur && rect.col === cur.col && rect.row === cur.row && rect.colSpan === cur.colSpan && rect.rowSpan === cur.rowSpan)
            return prev
          const next = {
            ...entry,
            places: { ...entry.places, [cardId]: { col: rect.col, row: rect.row } },
            spans: { ...entry.spans, [cardId]: { col: rect.colSpan, row: rect.rowSpan } },
          }
          return { ...prev, [wrapId]: autoRowsIfOverflowing(next) }
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

          /* pinned: a span can only grow into free cells */
          if (entry.places) {
            const place = entry.places[cardId]
            if (!place) return prev // pinned grid, but this card was never pinned
            const rect = clampRect(
              entry,
              cardId,
              { col: place.col, row: place.row, colSpan: next.col, rowSpan: next.row },
              gridDims(entry),
            )
            if (!rect) return prev // pinned rect is no longer legal under this grid
            const pinnedEntry = {
              ...entry,
              places: { ...entry.places, [cardId]: { col: rect.col, row: rect.row } },
              spans: { ...entry.spans, [cardId]: { col: rect.colSpan, row: rect.rowSpan } },
            }
            return { ...prev, [wrapId]: autoRowsIfOverflowing(pinnedEntry) }
          }

          const nextEntry = { ...entry, spans: { ...(entry.spans ?? {}), [cardId]: next } }
          return { ...prev, [wrapId]: autoRowsIfOverflowing(nextEntry) }
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

/* An empty Fill row collapses to 0 in an auto-height container (there's no free
   space for the fr to claim), which hides explicit empty rows. Giving rows a
   floor keeps every row you asked for visible — and droppable, for bento. */
export const MIN_ROW = 96

export const trackToCSS = (t, axis = 'col') => {
  switch (t.mode) {
    case 'hug':
      return 'auto'
    case 'fixed':
      return `${t.px}px`
    default:
      return axis === 'row' ? `minmax(${MIN_ROW}px, ${t.fr}fr)` : `${t.fr}fr`
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
    base.gridTemplateColumns = grid.cols.map((t) => trackToCSS(t, 'col')).join(' ')
    // rows: Fixed = explicit track list; Auto = implicit rows that hug content
    if (grid.rowMode === 'fixed') {
      base.gridTemplateRows = grid.rows.map((t) => trackToCSS(t, 'row')).join(' ')
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
