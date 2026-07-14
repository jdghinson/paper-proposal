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
   where the user put it.

   Requires a pinned item: `rectOf(entry, id)` must be non-null. There is no
   origin to retreat toward and no legal rect to fall back to for an unpinned
   item, so callers must pin the item's start cell before resizing it. If the
   item isn't pinned, clampRect returns null rather than guess. */
export function clampRect(entry, id, desired, dims) {
  const current = rectOf(entry, id)
  if (!current) return null

  const legal = (rect) => withinGrid(rect, dims) && occupantsOf(entry, rect, id).length === 0
  if (legal(desired)) return desired

  const growingLeft = desired.col < current.col
  const growingUp = desired.row < current.row

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
  if (legal(rect)) return rect

  /* the shrunk rect is still illegal (e.g. no span left to give): fall back
     to the item's pinned current rect, which is legal by definition */
  return current
}
