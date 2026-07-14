# Moving a grid item to a cell of your choice

## Problem

A grid item's position is not represented anywhere in the prototype. `store.jsx`
records only `spans` (`{col, row}` per member card); the cards land wherever CSS
auto-placement puts them, in DOM order. The edge handles in `Canvas.jsx` grow and
shrink an item's span from its anchored corner, so the only way to make an item
"move" today is to make it bigger — and even then it stays glued to its
auto-placed origin.

The bento story the pitch is making needs the opposite: pick a card up, drop it
in the cell you chose.

## Model

Add explicit placement alongside the existing spans:

```js
// wrap:experience entry
spans:  { 'exp-1': { col: 2, row: 1 }, ... }   // existing
places: { 'exp-1': { col: 1, row: 2 }, ... }   // new — 1-based start cell, or absent
```

`places` is absent until the first move. While absent, the grid behaves exactly as
it does today (auto-placement, DOM order). On the first move, **every** member is
pinned: each one's current start cell is measured from the DOM — the same
`trackGeometry` + `trackRange` measurement the panel already uses for its span
readout — and written into `places`. From then on every member renders with
explicit `gridColumn: ${col} / span ${n}` and `gridRow: ${row} / span ${n}`.

Pinning everything at once is what makes the feature feel like placement rather
than reordering. Without it, moving one card would reshuffle every card after it
in DOM order, which is the exact frustration this is fixing. It also means empty
cells stay empty — and therefore stay droppable, which is what reads as bento.

## Invariant: one card per cell

v1 never lets two cards occupy the same cell. Overlap is a legal CSS grid state
and the underlying model permits it, but it looks broken and it makes the pitch
harder to read, so it is excluded. This invariant constrains both interactions:

- A move that would land on an occupied region either swaps or is refused.
- A resize clamps at the first occupied cell rather than growing over it.

## Interaction: move

Trigger: pointer-down on a grid item's body, then movement past a 3px threshold.
Below the threshold it is a plain click and selection behaves as it does now.
This does not collide with the edge handles — those live in the screen-space
overlay and stop propagation.

While dragging:

- The card follows the cursor at reduced opacity.
- The grid's track guides show — the same dashed lines the span-drag already draws.
- A tinted region shows where the card will land: the card's own span size,
  snapped to the cell under the pointer, clamped so it cannot hang off the grid.
- If the landing region is refused (see below) the region reads as invalid and no
  drop will occur.

Release drops the card. Escape cancels and the card returns to its origin.

Landing rules, by what occupies the target region:

| Occupants | Result |
| --- | --- |
| none | the card lands there |
| exactly one card | the two swap: the other card's start becomes the dragged card's old start; both keep their own spans |
| one card, but its span does not fit at the dragged card's old start | refused |
| two or more cards | refused |

A swap is refused rather than fudged when the displaced card's span would run off
the grid (or onto a third card) at its new start. Shrinking it to fit would be a
silent lie about what the user asked for.

## Interaction: resize

Unchanged in feel — the same edge handles, the same midpoint-crossing snap — with
one added constraint: once positions are pinned, the projected span is clamped at
the first cell occupied by another card. The card simply will not grow past its
neighbor.

## Rows

`rowMode: 'auto'` still generates implicit rows. Explicit row placement works
against them, and the drop target is clamped to the tracks that can actually be
measured, so a card cannot be dropped into a row that does not exist yet. The
existing `autoRowsIfOverflowing` / `growRowsToFit` logic is untouched: pinning
changes where cards sit, not how many cells they consume.

## Panel

No change. The panel's grid-item readout derives its track range from the DOM,
which stays correct under explicit placement — it will simply report the moved
card's new start.

## Out of scope for v1

- Overlapping items.
- Dropping outside the grid (removing a card from the wrapper).
- Multi-select move.
- Auto-growing the grid by dropping past its last row.
