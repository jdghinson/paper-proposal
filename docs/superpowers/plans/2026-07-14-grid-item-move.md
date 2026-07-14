# Grid Item Move Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user pick up a grid item and drop it into the cell of their choice, with swap-on-collision and no overlapping items.

**Architecture:** Placement becomes explicit state. The wrapper entry gains `places` (a 1-based start cell per member), absent until the first move. All the rules that decide *whether* a placement is legal — occupancy, swap, resize clamping — live in one pure module, `src/placement.js`, which is unit-tested. `store.jsx` holds the state and calls into that module; `Canvas.jsx` measures the DOM, runs the drag, and renders. See the spec: `docs/superpowers/specs/2026-07-14-grid-item-move-design.md`.

**Tech Stack:** React 19, Vite 7, Tailwind 4, Vitest (added by Task 1).

## Global Constraints

- **One card per cell.** No two members' rects may overlap, ever — enforced on move, on swap, on edge-drag resize, and on the panel's span inputs.
- **Grid coordinates are 1-based and inclusive**, matching CSS (`grid-column: 3 / span 2` starts at column 3). A rect is `{ col, row, colSpan, rowSpan }`.
- **`places` is absent until the first move.** While absent, the grid renders exactly as it does today (CSS auto-placement, DOM order). Do not change that path.
- **The wrapper id is `'wrap:experience'`**, exported as `WRAP_ID` from `Canvas.jsx` today. Task 2 moves it to `store.jsx` so `placement.js` and the store don't import from a component.
- **Existing behavior that must not regress:** `autoRowsIfOverflowing`, `growRowsToFit`, gap hover bands, the size pill, the panel's span readout.
- **Prototype fidelity rule (from CLAUDE.md memory):** this repo is a pixel-faithful Paper clone. Reuse the existing overlay constants (`BLUE`, `BLUE_DASH`, `SPAN_TINT`) — do not invent new colors except the one invalid-state tint specified in Task 5.

---

### Task 1: Placement rules module

The pure core: given a wrapper entry and a proposed rect, what is legal?

**Files:**
- Create: `src/placement.js`
- Create: `src/placement.test.js`
- Modify: `package.json` (add Vitest + `test` script)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `spanOf(entry, id) -> {col, row}`
  - `rectOf(entry, id) -> {col, row, colSpan, rowSpan} | null` (null when unpinned)
  - `rectsOf(entry, exceptId) -> Array<{id, rect}>`
  - `overlaps(a, b) -> boolean`
  - `occupantsOf(entry, rect, exceptId) -> string[]` (ids whose rect intersects `rect`)
  - `withinGrid(rect, dims) -> boolean`, `dims = {cols, rows}`
  - `resolveDrop(entry, id, target, dims) -> {ok: boolean, places?: object}`
  - `clampRect(entry, id, desired, dims) -> {col, row, colSpan, rowSpan}` (shrinks a resize until it is legal)

- [ ] **Step 1: Add Vitest**

```bash
npm install -D vitest
```

Then add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Write the failing tests**

Create `src/placement.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { rectOf, occupantsOf, withinGrid, resolveDrop, clampRect } from './placement.js'

/* a 3x2 grid: a at (1,1), b at (2,1) spanning 2 cols, c at (1,2) */
const entry = () => ({
  members: ['a', 'b', 'c'],
  spans: { a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, c: { col: 1, row: 1 } },
  places: { a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, c: { col: 1, row: 2 } },
})
const dims = { cols: 3, rows: 2 }

describe('rectOf', () => {
  it('combines place and span', () => {
    expect(rectOf(entry(), 'b')).toEqual({ col: 2, row: 1, colSpan: 2, rowSpan: 1 })
  })

  it('is null when the item is not pinned', () => {
    expect(rectOf({ members: ['a'], spans: {}, places: {} }, 'a')).toBeNull()
  })
})

describe('occupantsOf', () => {
  it('finds the item covering a cell', () => {
    expect(occupantsOf(entry(), { col: 3, row: 1, colSpan: 1, rowSpan: 1 }, 'a')).toEqual(['b'])
  })

  it('excludes the item being moved', () => {
    expect(occupantsOf(entry(), { col: 1, row: 1, colSpan: 1, rowSpan: 1 }, 'a')).toEqual([])
  })

  it('finds every item a wide rect covers', () => {
    expect(occupantsOf(entry(), { col: 1, row: 1, colSpan: 3, rowSpan: 1 }, 'c')).toEqual(['a', 'b'])
  })
})

describe('withinGrid', () => {
  it('accepts a rect inside the grid', () => {
    expect(withinGrid({ col: 2, row: 2, colSpan: 2, rowSpan: 1 }, dims)).toBe(true)
  })

  it('rejects a rect running off the right edge', () => {
    expect(withinGrid({ col: 3, row: 1, colSpan: 2, rowSpan: 1 }, dims)).toBe(false)
  })

  it('rejects a rect running off the bottom', () => {
    expect(withinGrid({ col: 1, row: 2, colSpan: 1, rowSpan: 2 }, dims)).toBe(false)
  })
})

describe('resolveDrop', () => {
  it('lands on an empty cell', () => {
    const r = resolveDrop(entry(), 'a', { col: 3, row: 2 }, dims)
    expect(r.ok).toBe(true)
    expect(r.places.a).toEqual({ col: 3, row: 2 })
    expect(r.places.c).toEqual({ col: 1, row: 2 }) // others untouched
  })

  it('swaps with a single occupant', () => {
    const r = resolveDrop(entry(), 'a', { col: 1, row: 2 }, dims) // a onto c
    expect(r.ok).toBe(true)
    expect(r.places.a).toEqual({ col: 1, row: 2 })
    expect(r.places.c).toEqual({ col: 1, row: 1 }) // c takes a's old start
  })

  it('refuses a swap whose displaced item would not fit at the old start', () => {
    // c (1x1) onto b (2 cols wide): b would move to c's old start (1,2) and fit,
    // so use the mirror — move b onto c: b's rect at (1,2) spans cols 1-2, which
    // is legal, and c would take b's old start (2,1). That fits too. Instead pin
    // a wide item at the right edge so the displaced item runs off the grid.
    const e = {
      members: ['a', 'wide'],
      spans: { a: { col: 1, row: 1 }, wide: { col: 3, row: 1 } },
      places: { a: { col: 3, row: 2 }, wide: { col: 1, row: 1 } },
    }
    // a onto wide -> wide must move to a's old start (3,2), spanning cols 3-5: off grid
    const r = resolveDrop(e, 'a', { col: 1, row: 1 }, dims)
    expect(r.ok).toBe(false)
  })

  it('refuses a swap whose displaced item would land on a third item', () => {
    const e = {
      members: ['a', 'b', 'c'],
      spans: { a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, c: { col: 1, row: 1 } },
      places: { a: { col: 1, row: 2 }, b: { col: 1, row: 1 }, c: { col: 2, row: 2 } },
    }
    // a onto b -> b (2 wide) must move to a's old start (1,2), covering c at (2,2)
    const r = resolveDrop(e, 'a', { col: 1, row: 1 }, dims)
    expect(r.ok).toBe(false)
  })

  it('refuses a drop covering two or more items', () => {
    const r = resolveDrop(entry(), 'c', { col: 1, row: 1 }, {
      ...dims,
    })
    expect(r.ok).toBe(true) // c onto a alone is a legal swap
    const wide = {
      ...entry(),
      spans: { ...entry().spans, c: { col: 3, row: 1 } },
    }
    // c is now 3 wide; dropping it at (1,1) covers both a and b
    expect(resolveDrop(wide, 'c', { col: 1, row: 1 }, dims).ok).toBe(false)
  })

  it('refuses a drop that runs off the grid', () => {
    expect(resolveDrop(entry(), 'b', { col: 3, row: 1 }, dims).ok).toBe(false)
  })
})

describe('clampRect', () => {
  it('leaves a legal rect alone', () => {
    const r = clampRect(entry(), 'c', { col: 1, row: 2, colSpan: 3, rowSpan: 1 }, dims)
    expect(r).toEqual({ col: 1, row: 2, colSpan: 3, rowSpan: 1 })
  })

  it('shrinks a rect growing right into a neighbor', () => {
    // a at (1,1) growing to 3 cols would cover b at (2,1): clamp to 1
    const r = clampRect(entry(), 'a', { col: 1, row: 1, colSpan: 3, rowSpan: 1 }, dims)
    expect(r.colSpan).toBe(1)
  })

  it('shrinks a rect growing down into a neighbor', () => {
    // a at (1,1) growing to 2 rows would cover c at (1,2): clamp to 1
    const r = clampRect(entry(), 'a', { col: 1, row: 1, colSpan: 1, rowSpan: 2 }, dims)
    expect(r.rowSpan).toBe(1)
  })

  it('shrinks a rect growing left into a neighbor, holding its far edge', () => {
    // c at (1,2) is 1 wide. b (at (2,1), 2 wide) dragged left to col 1 keeps its
    // right edge at col 3 and would cover a at (1,1): clamp back to col 2.
    const r = clampRect(entry(), 'b', { col: 1, row: 1, colSpan: 3, rowSpan: 1 }, dims)
    expect(r).toEqual({ col: 2, row: 1, colSpan: 2, rowSpan: 1 })
  })

  it('clamps a rect that runs off the grid', () => {
    const r = clampRect(entry(), 'c', { col: 1, row: 2, colSpan: 1, rowSpan: 3 }, dims)
    expect(r.rowSpan).toBe(1)
  })
})
```

- [ ] **Step 3: Run the tests and watch them fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./placement.js"`.

- [ ] **Step 4: Write the module**

Create `src/placement.js`:

```js
/* ------------------------------------------------------------------
   Placement rules for grid items. Pure — no React, no DOM.

   A rect is 1-based and inclusive of its start cell, matching CSS grid:
   { col: 3, row: 1, colSpan: 2, rowSpan: 1 } covers columns 3-4 of row 1.

   `entry.places[id]` is an item's start cell. It is absent until the user
   moves something for the first time; before that the grid is auto-placed
   and none of these rules apply.
------------------------------------------------------------------- */

export const spanOf = (entry, id) => entry.spans?.[id] ?? { col: 1, row: 1 }

export function rectOf(entry, id) {
  const place = entry.places?.[id]
  if (!place) return null
  const span = spanOf(entry, id)
  return { col: place.col, row: place.row, colSpan: span.col, rowSpan: span.row }
}

/* every member's rect except one — the item being moved doesn't collide with itself */
export function rectsOf(entry, exceptId) {
  return (entry.members ?? [])
    .filter((id) => id !== exceptId)
    .map((id) => ({ id, rect: rectOf(entry, id) }))
    .filter((m) => m.rect)
}

export const overlaps = (a, b) =>
  a.col < b.col + b.colSpan &&
  b.col < a.col + a.colSpan &&
  a.row < b.row + b.rowSpan &&
  b.row < a.row + a.rowSpan

export const occupantsOf = (entry, rect, exceptId) =>
  rectsOf(entry, exceptId)
    .filter((m) => overlaps(rect, m.rect))
    .map((m) => m.id)

export const withinGrid = (rect, dims) =>
  rect.col >= 1 &&
  rect.row >= 1 &&
  rect.col + rect.colSpan - 1 <= dims.cols &&
  rect.row + rect.rowSpan - 1 <= dims.rows

/* Where a dropped item lands. Empty target -> it just moves. Exactly one
   occupant -> the two swap, each keeping its own span; refused if the displaced
   item can't legally sit at the dragged item's old start. Two or more -> refused,
   because there is no unambiguous swap and v1 forbids overlap. */
export function resolveDrop(entry, id, target, dims) {
  const span = spanOf(entry, id)
  const moved = { col: target.col, row: target.row, colSpan: span.col, rowSpan: span.row }
  if (!withinGrid(moved, dims)) return { ok: false }

  const occupants = occupantsOf(entry, moved, id)
  const places = entry.places ?? {}

  if (occupants.length === 0) {
    return { ok: true, places: { ...places, [id]: { col: moved.col, row: moved.row } } }
  }
  if (occupants.length > 1) return { ok: false }

  const otherId = occupants[0]
  const from = places[id]
  if (!from) return { ok: false }

  const otherSpan = spanOf(entry, otherId)
  const other = { col: from.col, row: from.row, colSpan: otherSpan.col, rowSpan: otherSpan.row }
  if (!withinGrid(other, dims)) return { ok: false }
  if (overlaps(other, moved)) return { ok: false }

  /* the displaced item must not land on a third item */
  const bystanders = rectsOf(entry, id).filter((m) => m.id !== otherId)
  if (bystanders.some((m) => overlaps(other, m.rect))) return { ok: false }

  return {
    ok: true,
    places: {
      ...places,
      [id]: { col: moved.col, row: moved.row },
      [otherId]: { col: other.col, row: other.row },
    },
  }
}

/* A resize, shrunk until it is legal. The dragged edge gives way; the anchored
   edge (the far side of `desired`) is held. Growing right/down pulls colSpan or
   rowSpan back; growing left/up pushes col or row forward, keeping the far edge
   where the user put it. */
export function clampRect(entry, id, desired, dims) {
  const current = rectOf(entry, id)
  const legal = (rect) => withinGrid(rect, dims) && occupantsOf(entry, rect, id).length === 0
  if (legal(desired)) return desired

  const growingLeft = current ? desired.col < current.col : false
  const growingUp = current ? desired.row < current.row : false

  const rect = { ...desired }
  /* give way one track at a time on each axis until nothing is in the way */
  for (const axis of ['col', 'row']) {
    const spanKey = axis === 'col' ? 'colSpan' : 'rowSpan'
    const growingBack = axis === 'col' ? growingLeft : growingUp
    while (rect[spanKey] > 1 && !legal(rect)) {
      rect[spanKey] -= 1
      if (growingBack) rect[axis] += 1 // hold the far edge, retreat the dragged one
    }
  }
  return legal(rect) ? rect : (current ?? { ...desired, colSpan: 1, rowSpan: 1 })
}
```

- [ ] **Step 5: Run the tests and watch them pass**

Run: `npm test`
Expected: PASS — all tests in `src/placement.test.js` green.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/placement.js src/placement.test.js
git commit -m "Add placement rules: occupancy, swap, resize clamping"
```

---

### Task 2: Explicit placement in the store

State and actions. No visual change yet — `places` stays absent, so the grid still renders auto-placed.

**Files:**
- Modify: `src/store.jsx`
- Modify: `src/placement.test.js` (append the store-rule tests below)

**Interfaces:**
- Consumes: `resolveDrop`, `clampRect`, `rectOf`, `occupantsOf` from Task 1.
- Produces, on the store api:
  - `WRAP_ID` — exported const `'wrap:experience'`
  - `gridDims(entry) -> {cols, rows}`
  - `isPinned(entry) -> boolean`
  - `pinPlaces(wrapId, places)` — writes the measured start cells, once
  - `moveItem(wrapId, cardId, target) -> void` — applies `resolveDrop`; a refused drop is a no-op
  - `resizeItem(wrapId, cardId, desiredRect) -> void` — applies `clampRect`, writing both span and place
  - `updateSpan` — unchanged signature, now occupancy-aware when pinned

- [ ] **Step 1: Write the failing tests**

Append to `src/placement.test.js`:

```js
import { gridDims } from './store.jsx'

describe('gridDims', () => {
  it('reads the explicit track counts', () => {
    const e = { grid: { cols: [1, 1, 1], rows: [1, 1], rowMode: 'fixed' } }
    expect(gridDims(e)).toEqual({ cols: 3, rows: 2 })
  })

  it('lets auto rows extend past the explicit ones', () => {
    const e = { grid: { cols: [1, 1], rows: [1], rowMode: 'auto' } }
    expect(gridDims(e).rows).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm test`
Expected: FAIL — `gridDims` is not exported from `store.jsx`.

- [ ] **Step 3: Wire the store**

In `src/store.jsx`, add the import at the top:

```js
import { resolveDrop, clampRect, rectOf, occupantsOf, spanOf } from './placement.js'
```

Export the wrapper id and the dims helper (place them next to `CARD_IDS`):

```js
export const WRAP_ID = 'wrap:experience'

/* Auto rows are implicit — CSS makes as many as the content needs — so the row
   ceiling for placement is the explicit count plus headroom for those. */
export const AUTO_ROW_HEADROOM = 8

export const gridDims = (entry) => ({
  cols: entry.grid.cols.length,
  rows: entry.grid.rowMode === 'fixed' ? entry.grid.rows.length : entry.grid.rows.length + AUTO_ROW_HEADROOM,
})

export const isPinned = (entry) => Boolean(entry?.places)
```

Add these actions to the `api` object returned from `useMemo`, after `updateSpan`:

```js
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
```

Then make `updateSpan` occupancy-aware. Replace its body's final lines — where it currently builds `nextEntry` — so that a pinned grid routes through `clampRect` and an unpinned one keeps today's behavior exactly:

```js
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
            const rect = clampRect(
              entry,
              cardId,
              { col: place.col, row: place.row, colSpan: next.col, rowSpan: next.row },
              gridDims(entry),
            )
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
```

Note `usedCells` already reads `entry.spans`, so `autoRowsIfOverflowing` keeps working untouched.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Confirm nothing regressed visually**

Run: `npm run dev`, then in the app select two or more cards, click **Add grid**, and drag an item's edge handle. It must behave exactly as before (no `places` exists yet, so nothing is pinned).

- [ ] **Step 6: Commit**

```bash
git add src/store.jsx src/placement.test.js
git commit -m "Store: explicit places, moveItem, resizeItem, occupancy-aware spans"
```

---

### Task 3: Render explicit placement, and pin on demand

Make the grid *able* to render pinned items, and give the canvas a way to measure and pin. Still no new interaction.

**Files:**
- Modify: `src/components/Canvas.jsx`

**Interfaces:**
- Consumes: `WRAP_ID`, `isPinned`, `pinPlaces` from Task 2; `trackGeometry`, `trackRange` (already in `Canvas.jsx`).
- Produces:
  - `pinIfNeeded()` — measures every member's current start cell from the DOM and calls `app.pinPlaces`; a no-op if already pinned. Returns `true` once positions are pinned.

- [ ] **Step 1: Import from the store instead of redeclaring**

At the top of `Canvas.jsx`, replace the local `const WRAP_ID = 'wrap:experience'` with an import:

```js
import { useApp, layoutStyle, CARD_IDS, WRAP_ID, isPinned } from '../store.jsx'
```

- [ ] **Step 2: Render `places` when present**

In `Card`, replace the `spanStyle` block:

```js
  /* grid-item placement: span (always) + explicit start cell (once pinned) */
  let spanStyle
  if (inGrid) {
    const wrap = app.entryOf(WRAP_ID)
    const span = wrap?.spans?.[id] ?? { col: 1, row: 1 }
    const col = Math.min(span.col, wrap.grid.cols.length)
    const row = wrap.grid.rowMode === 'fixed' ? Math.min(span.row, wrap.grid.rows.length) : span.row
    const place = wrap?.places?.[id]
    spanStyle = place
      ? { gridColumn: `${place.col} / span ${col}`, gridRow: `${place.row} / span ${row}` }
      : { gridColumn: `span ${col}`, gridRow: `span ${row}` }
  }
```

- [ ] **Step 3: Add the measure-and-pin helper**

In the `Canvas` component, below the existing `wrapEl` helper, add:

```js
  /* Measure where every member currently sits and freeze it. Called the first
     time the user moves an item — from then on the grid is explicitly placed and
     no card re-flows because a neighbor changed. */
  const pinIfNeeded = () => {
    if (isPinned(wrap)) return true
    const artEl = artboardRef.current
    const wEl = wrapEl()
    if (!artEl || !wEl || !wrap?.members?.length) return false

    const geo = trackGeometry(wEl, wrap)
    const places = {}
    for (const mid of wrap.members) {
      const cEl = artEl.querySelector(`[data-node="${mid}"]`)
      if (!cEl) return false
      const r = cEl.getBoundingClientRect()
      const [c0] = trackRange(geo.cols, geo.colGap, (r.left - geo.wRect.left) / ZOOM, (r.right - geo.wRect.left) / ZOOM)
      const [r0] = trackRange(geo.rows, geo.rowGap, (r.top - geo.wRect.top) / ZOOM, (r.bottom - geo.wRect.top) / ZOOM)
      places[mid] = { col: c0 + 1, row: r0 + 1 }
    }
    app.pinPlaces(WRAP_ID, places)
    return true
  }
```

- [ ] **Step 4: Verify the render path by hand**

Run `npm run dev`. In the browser console, with a grid created, run:

```js
__layouts['wrap:experience'].places
```

Expected: `undefined` — nothing pins yet, and the grid looks unchanged. This step only proves the render branch is inert until `places` exists.

- [ ] **Step 5: Commit**

```bash
git add src/components/Canvas.jsx
git commit -m "Canvas: render explicit grid placement, measure-and-pin helper"
```

---

### Task 4: The move drag

**Files:**
- Modify: `src/components/Canvas.jsx`

**Interfaces:**
- Consumes: `pinIfNeeded` (Task 3), `app.moveItem` (Task 2), `resolveDrop` + `gridDims` for the live preview.
- Produces: a `move` drag state `{cardId, target, ok, ghost}` rendered by the overlay.

- [ ] **Step 1: Import the preview rules**

Add to the imports in `Canvas.jsx`:

```js
import { resolveDrop } from '../placement.js'
import { gridDims } from '../store.jsx' // fold into the existing store import
```

- [ ] **Step 2: Add the drag state and the pointer-down that arms it**

Next to the existing `const [drag, setDrag] = useState(null)`, add:

```js
  const [move, setMove] = useState(null) // {cardId, grab:{x,y}, target, ok, ghost}
  const armed = useRef(null) // {cardId, x, y} — pointer is down, threshold not yet crossed
```

In `Card`, add a pointer-down handler that arms a move only for grid items. Pass it down from `Canvas` through `ExperienceRow` as `onItemPointerDown`:

```js
// Card signature becomes: function Card({ index, inGrid, onItemPointerDown })
    <div
      data-node={id}
      onPointerDown={inGrid ? (e) => onItemPointerDown?.(e, id) : undefined}
      onClick={(e) => {
        e.stopPropagation()
        app.selectCard(id, e.shiftKey)
      }}
```

`ExperienceRow` takes `onItemPointerDown` and forwards it to the `<Card ... inGrid />` it renders inside the wrapper. `MyTrajArtboard` passes it straight through.

- [ ] **Step 3: Arm on pointer-down, start on threshold**

In `Canvas`, add:

```js
  const MOVE_THRESHOLD = 3 // px — below this it is a click, and selection wins

  const onItemPointerDown = (e, cardId) => {
    if (e.button !== 0) return
    armed.current = { cardId, x: e.clientX, y: e.clientY }
  }
```

And in the effect that handles global pointer events (add a new effect, don't touch the resize one):

```js
  useEffect(() => {
    const onMove = (e) => {
      /* cross the threshold: pin the grid, then start moving */
      if (armed.current && !move) {
        const a = armed.current
        if (Math.hypot(e.clientX - a.x, e.clientY - a.y) < MOVE_THRESHOLD) return
        if (!pinIfNeeded()) {
          armed.current = null
          return
        }
        const cEl = artboardRef.current?.querySelector(`[data-node="${a.cardId}"]`)
        if (!cEl) {
          armed.current = null
          return
        }
        const r = cEl.getBoundingClientRect()
        setMove({
          cardId: a.cardId,
          grab: { x: (a.x - r.left) / ZOOM, y: (a.y - r.top) / ZOOM },
          target: null,
          ok: false,
          ghost: null,
        })
        return
      }
      if (!move) return

      const wEl = wrapEl()
      const artEl = artboardRef.current
      if (!wEl || !artEl) return
      const entry = app.entryOf(WRAP_ID)
      const geo = trackGeometry(wEl, entry)
      const dims = gridDims(entry)
      const span = entry.spans?.[move.cardId] ?? { col: 1, row: 1 }

      /* the cell under the card's own top-left corner, not under the cursor —
         so a card you grabbed by its middle doesn't jump */
      const x = (e.clientX - geo.wRect.left) / ZOOM - move.grab.x
      const y = (e.clientY - geo.wRect.top) / ZOOM - move.grab.y
      const clamp = (n, max) => Math.max(1, Math.min(max, n))
      const col = clamp(trackIndexAt(geo.cols, geo.colGap, x + 2) + 1, dims.cols - span.col + 1)
      const row = clamp(trackIndexAt(geo.rows, geo.rowGap, y + 2) + 1, Math.max(1, geo.rows.length - span.row + 1))

      const target = { col, row }
      const ok = resolveDrop(entry, move.cardId, target, dims).ok
      const artRect = artEl.getBoundingClientRect()
      const cRect = artEl.querySelector(`[data-node="${move.cardId}"]`).getBoundingClientRect()
      setMove((m) =>
        m && { ...m, target, ok, ghost: { x: e.clientX - artRect.left, y: e.clientY - artRect.top, w: cRect.width, h: cRect.height } },
      )
    }

    const onUp = () => {
      if (move) {
        if (move.ok && move.target) app.moveItem(WRAP_ID, move.cardId, move.target)
        setMove(null)
        dragJustEnded.current = true
        requestAnimationFrame(() => (dragJustEnded.current = false))
      }
      armed.current = null
    }

    const onKey = (e) => {
      if (e.key === 'Escape' && move) {
        setMove(null)
        armed.current = null
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [move, app.layouts]) // eslint-disable-line react-hooks/exhaustive-deps
```

Set the grabbing cursor while a move is live, mirroring how the resize effect sets `document.body.style.cursor`:

```js
  useEffect(() => {
    if (!move) return
    document.body.style.cursor = 'grabbing'
    return () => {
      document.body.style.cursor = ''
    }
  }, [move])
```

- [ ] **Step 4: Render the landing region, the track guides, and the ghost**

`guides` is currently computed only when `drag` is set. Widen that condition to `if ((drag || move) && artboardRef.current)` and keep the rest as-is — but when `move` is set, the projected `span` rectangle should be the *landing region*, not the card's current box. Inside the `guides` block:

```js
      const active = drag ?? move
      const cEl = artEl.querySelector(`[data-node="${active.cardId}"]`)
      let span = null
      if (move && move.target) {
        /* the cells the card will land in */
        const entry = app.entryOf(WRAP_ID)
        const s = entry.spans?.[move.cardId] ?? { col: 1, row: 1 }
        const c0 = geo.cols[move.target.col - 1]
        const r0 = geo.rows[move.target.row - 1]
        const c1 = geo.cols[Math.min(geo.cols.length, move.target.col + s.col - 1) - 1]
        const r1 = geo.rows[Math.min(geo.rows.length, move.target.row + s.row - 1) - 1]
        if (c0 && r0 && c1 && r1)
          span = { x: ox + c0.start, y: oy + r0.start, w: c1.start + c1.size - c0.start, h: r1.start + r1.size - r0.start }
      } else if (cEl) {
        const cRect = cEl.getBoundingClientRect()
        span = {
          x: (cRect.left - artRect.left) / ZOOM,
          y: (cRect.top - artRect.top) / ZOOM,
          w: cRect.width / ZOOM,
          h: cRect.height / ZOOM,
        }
      }
      guides = { ox, oy, geo, span, invalid: Boolean(move && !move.ok) }
```

Add the invalid tint next to the other overlay constants at the top of the file:

```js
const INVALID_TINT = 'rgba(230, 73, 128, 0.14)' // refused drop — the pink already used for gaps
```

And in the JSX where the span tint renders, pick the tint by validity:

```js
                        background: guides.invalid ? INVALID_TINT : SPAN_TINT,
```

Render the ghost — the card following the cursor — just after the guides block in the overlay:

```js
              {move && move.ghost && (
                <div
                  className="absolute rounded-[10px] border border-[#4B84F7] bg-white/70 pointer-events-none"
                  style={{
                    left: move.ghost.x - (move.grab.x * ZOOM),
                    top: move.ghost.y - (move.grab.y * ZOOM),
                    width: move.ghost.w,
                    height: move.ghost.h,
                    opacity: 0.6,
                  }}
                />
              )}
```

Finally, hide the edge handles and the size pill while a move is in flight — they'd fight the ghost. Where `handleSpecs` is computed, add `&& !move` to the condition; where the pill renders, wrap it in `{!move && ( ... )}`.

- [ ] **Step 5: Verify in the browser**

Run `npm run dev`. Select 3+ cards, click **Add grid**, then:

| Do this | Expect |
| --- | --- |
| Click a card without moving | it just selects, as before |
| Drag a card onto an empty cell and release | it lands there; no other card moves |
| Drag a card onto another card and release | the two swap |
| Drag a card so it covers two cards | the landing region turns pink; releasing puts it back |
| Press Escape mid-drag | the card returns to where it was |
| Check `__layouts['wrap:experience'].places` in the console | every member has a `{col, row}` |

- [ ] **Step 6: Commit**

```bash
git add src/components/Canvas.jsx
git commit -m "Move a grid item to the cell of your choice, swapping on collision"
```

---

### Task 5: Resize clamps at its neighbor

The invariant's other half. Once pinned, an edge-drag stops at an occupied cell rather than growing on top of it — and a left/top drag moves the item's start rather than pretending the start is fixed.

**Files:**
- Modify: `src/components/Canvas.jsx`

**Interfaces:**
- Consumes: `app.resizeItem` (Task 2), `rectOf` (Task 1).

- [ ] **Step 1: Route the edge drag through `resizeItem` when pinned**

In the resize effect's `onMove`, replace the single `app.updateSpan(...)` call. The existing midpoint math already yields the span; now derive the full rect so a left/top drag can move the start cell:

```js
      const entry = app.entryOf(WRAP_ID)
      const growing = drag.edge === 'right' || drag.edge === 'bottom'
      const edgeIdx = growing ? Math.max(drag.anchor, lastMidpointBefore(tracks, pos)) : Math.min(drag.anchor, firstMidpointAfter(tracks, pos))
      const start = Math.min(drag.anchor, edgeIdx)
      const span = Math.abs(edgeIdx - drag.anchor) + 1

      if (!entry.places) {
        app.updateSpan(WRAP_ID, drag.cardId, { [drag.axis]: Math.max(1, span) })
        return
      }

      const cur = rectOf(entry, drag.cardId)
      const desired = { ...cur }
      if (drag.axis === 'col') {
        desired.col = start + 1
        desired.colSpan = Math.max(1, span)
      } else {
        desired.row = start + 1
        desired.rowSpan = Math.max(1, span)
      }
      app.resizeItem(WRAP_ID, drag.cardId, desired)
```

Add `rectOf` to the `placement.js` import at the top of the file.

- [ ] **Step 2: Verify in the browser**

Run `npm run dev`. Create a grid, move a card once (to pin), then:

| Do this | Expect |
| --- | --- |
| Drag a card's right edge toward a neighbor | it grows into empty cells and stops at the neighbor — never on top of it |
| Drag a card's left edge toward a neighbor | same, and the card's start cell moves left as it grows |
| Drag an edge with nothing in the way | it grows to the grid's edge, exactly as before |
| Type a too-large span into the panel's Col/Row inputs | it clamps at the neighbor rather than overlapping |

- [ ] **Step 3: Commit**

```bash
git add src/components/Canvas.jsx
git commit -m "Clamp edge-drag resize at the first occupied cell"
```

---

### Task 6: Full-flow verification

**Files:** none — this task only runs the app.

- [ ] **Step 1: Run the unit tests**

Run: `npm test`
Expected: PASS, every test in `src/placement.test.js`.

- [ ] **Step 2: Drive the real app**

Use the `verify` skill (or `npm run dev` plus the browser tools) and walk the whole story end to end:

1. Select all five cards, click **Add grid** — a 3×2 grid appears, auto-placed, nothing pinned.
2. Drag the last card into the empty cell — it lands; the other four do not move.
3. Drag a card onto an occupied cell — the two swap.
4. Grow a card's span with the edge handle until it meets a neighbor — it stops.
5. Change the column count in the panel — the grid re-tracks and no two cards overlap.
6. Switch rows between Fixed and Auto — the placed cards stay where they were put.

Note that step 5 is the one place where changing the grid's shape can push a pinned item's rect off the grid. Confirm the item clamps into the grid rather than vanishing; if it does not, fix it in `store.jsx`'s `setTrackCount` by clamping each place into the new dims via `clampRect` before writing the tracks.

- [ ] **Step 3: Commit anything the walkthrough fixed**

```bash
git add -A
git commit -m "Fix placement clamping when the track count changes"
```
