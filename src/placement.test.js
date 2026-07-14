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

  it('returns null for an unpinned item: there is no origin to retreat toward', () => {
    // 'x' is a member with no place, so rectOf returns null (current === null).
    // clampRect has no legal rect to fall back to in that case, so it refuses
    // to guess and returns null instead of silently producing an illegal rect.
    const r = clampRect({ members: ['x'], spans: {}, places: {} }, 'x', { col: 5, row: 1, colSpan: 1, rowSpan: 1 }, dims)
    expect(r).toBeNull()
  })

  it('falls back to the current rect when a pinned item cannot legally reach the desired cell', () => {
    // a is pinned at (1,1). Desired asks for b's cell (2,1) at 1x1 already,
    // so there is no span left to shrink; the only safe answer is a's current rect.
    const r = clampRect(entry(), 'a', { col: 2, row: 1, colSpan: 1, rowSpan: 1 }, dims)
    expect(r).toEqual({ col: 1, row: 1, colSpan: 1, rowSpan: 1 })
  })

  it('clamps a pinned item onto a neighbor to a rect that stays in the grid and overlaps no one', () => {
    // x at (1,1) and y at (2,1) are both pinned. Dragging x onto y's cell must
    // clamp to something that neither leaves the grid nor overlaps y (or anyone).
    const e = {
      members: ['x', 'y'],
      spans: { x: { col: 1, row: 1 }, y: { col: 1, row: 1 } },
      places: { x: { col: 1, row: 1 }, y: { col: 2, row: 1 } },
    }
    const r = clampRect(e, 'x', { col: 2, row: 1, colSpan: 1, rowSpan: 1 }, dims)
    expect(withinGrid(r, dims)).toBe(true)
    expect(occupantsOf(e, r, 'x')).toEqual([])
  })

  it('returns null when the pinned current rect is stale and no longer fits the grid', () => {
    // 'a' was pinned at col 5 back when the grid was wider; dims has since
    // shrunk to 3 cols, so the pinned rect itself is out of grid. There is no
    // legal rect to fall back to, so clampRect must refuse rather than hand
    // back the stale, out-of-grid rect unvalidated.
    const e = { members: ['a'], spans: { a: { col: 1, row: 1 } }, places: { a: { col: 5, row: 1 } } }
    const r = clampRect(e, 'a', { col: 5, row: 1, colSpan: 1, rowSpan: 1 }, { cols: 3, rows: 2 })
    expect(r).toBeNull()
  })

  it('returns null when the pinned current rect already overlaps another item', () => {
    // 'a' and 'b' are both (stalely) pinned to the same cell. a's current rect
    // is within the grid but overlaps b, so it is not legal either — clampRect
    // must not hand back an already-overlapping rect.
    const e = {
      members: ['a', 'b'],
      spans: { a: { col: 1, row: 1 }, b: { col: 1, row: 1 } },
      places: { a: { col: 1, row: 1 }, b: { col: 1, row: 1 } },
    }
    const r = clampRect(e, 'a', { col: 1, row: 1, colSpan: 1, rowSpan: 1 }, dims)
    expect(r).toBeNull()
  })
})
