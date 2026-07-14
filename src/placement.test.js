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
