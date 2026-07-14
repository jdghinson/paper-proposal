import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useApp, layoutStyle, CARD_IDS, WRAP_ID, isPinned, gridDims } from '../store.jsx'
import { resolveDrop, rectOf } from '../placement.js'

export const ZOOM = 0.59

const BLUE = '#4B84F7'
const BLUE_DASH = '#6FA3F8'
const PINK = 'rgba(236, 90, 143, 0.28)'
const PINK_SOLID = '#E64980'
const SPAN_TINT = 'rgba(75, 132, 247, 0.10)'
const INVALID_TINT = 'rgba(230, 73, 128, 0.14)' // refused drop — the pink already used for gaps

/* ---------------- MyTraj design pieces ---------------- */

const RadioCircle = ({ checked }) =>
  checked ? (
    <span className="inline-flex size-4.5 shrink-0 rounded-full border-[1.5px] border-[#8A3FFC] items-center justify-center">
      <span className="size-2 rounded-full bg-[#8A3FFC]" />
    </span>
  ) : (
    <span className="inline-flex size-4.5 shrink-0 rounded-full border-[1.5px] border-[#BBBDCB]" />
  )

const EXPERIENCE = [
  { title: 'Entry Level', sub: '0–2 years' },
  { title: 'Mid-Level', sub: '3–5 years', checked: true },
  { title: 'Senior', sub: '6–9 years' },
  { title: 'Lead / Principal', sub: '10+ years' },
  { title: 'Executive', sub: 'VP & above' },
]

/* a card: visual chrome via classes, its own flex layout via store entry */
function Card({ index, inGrid, onItemPointerDown }) {
  const app = useApp()
  const id = `exp-${index}`
  const c = EXPERIENCE[index]
  const ownStyle = layoutStyle(app.entryOf(id)) // null until the card is given a layout

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

  return (
    <div
      data-node={id}
      onPointerDown={inGrid ? (e) => onItemPointerDown?.(e, id) : undefined}
      onClick={(e) => {
        e.stopPropagation()
        app.selectCard(id, e.shiftKey)
      }}
      style={{ ...ownStyle, ...spanStyle }}
      className={`${inGrid ? 'w-auto' : 'w-[140px]'} min-h-[97px] rounded-[10px] border bg-white relative cursor-default p-3 ${
        c.checked ? 'border-[#8A3FFC]' : 'border-[#E5E6ED]'
      }`}
    >
      {/* base padding/spacing via classes so a no-layout card looks identical
          to a flex one; the flex entry (when present) drives it instead */}
      <RadioCircle checked={c.checked} />
      <div className={ownStyle ? '' : 'mt-2'}>
        <div className="text-[14px] font-semibold leading-5">{c.title}</div>
        <div className="text-[12px] text-[#828498] mt-0.5">{c.sub}</div>
      </div>
    </div>
  )
}

/* the row of cards; Add grid wraps only the selected cards in a new container */
function ExperienceRow({ onGapMove, onGapLeave, onItemPointerDown }) {
  const app = useApp()
  const wrap = app.entryOf(WRAP_ID)
  const hasWrap = wrap && wrap.layout !== 'none' && wrap.members?.length
  const members = hasWrap ? wrap.members : []

  const children = []
  let wrapperInserted = false
  CARD_IDS.forEach((id, i) => {
    if (members.includes(id)) {
      if (!wrapperInserted) {
        wrapperInserted = true
        children.push(
          <div
            key="wrap"
            data-node={WRAP_ID}
            onClick={(e) => {
              e.stopPropagation()
              app.selectNode(WRAP_ID)
            }}
            onPointerMove={onGapMove}
            onPointerLeave={onGapLeave}
            style={{ ...layoutStyle(wrap), flex: '1 1 0', minWidth: 0 }}
            className="relative"
          >
            {members.map((mid) => (
              <Card key={mid} index={CARD_IDS.indexOf(mid)} inGrid onItemPointerDown={onItemPointerDown} />
            ))}
          </div>,
        )
      }
    } else {
      children.push(<Card key={id} index={i} />)
    }
  })

  return (
    <div data-node="group:experience" className="flex gap-[15px] relative">
      {children}
    </div>
  )
}

function MyTrajArtboard({ onGapMove, onGapLeave, onItemPointerDown }) {
  return (
    <div className="w-[1440px] bg-[#FDFCFF] font-hanken text-[#21243C]" data-node="artboard">
      <div className="w-[760px] mx-auto py-24" data-node="frame:content">
        <div className="text-[16px] font-semibold">How much experience do you have?</div>
        <div className="mt-3">
          <ExperienceRow onGapMove={onGapMove} onGapLeave={onGapLeave} onItemPointerDown={onItemPointerDown} />
        </div>
      </div>
    </div>
  )
}

/* ---------------- geometry ---------------- */

/* resolved track geometry of the wrapper, in artboard px relative to the
   wrapper's border box. Auto rows fall back to clustering the children. */
function trackGeometry(wrapEl, entry) {
  const wRect = wrapEl.getBoundingClientRect()
  const cs = getComputedStyle(wrapEl)
  const padL = parseFloat(cs.paddingLeft) || 0
  const padT = parseFloat(cs.paddingTop) || 0
  const colGap = parseFloat(cs.columnGap) || 0
  const rowGap = parseFloat(cs.rowGap) || 0

  const fromTemplate = (tpl, start) => {
    const sizes = tpl.split(' ').map(parseFloat)
    if (!sizes.length || !sizes.every((n) => Number.isFinite(n))) return null
    const gap = start === padL ? colGap : rowGap
    const out = []
    let pos = start
    for (const size of sizes) {
      out.push({ start: pos, size })
      pos += size + gap
    }
    return out
  }

  const fromChildren = (axis) => {
    const kids = [...wrapEl.querySelectorAll(':scope > [data-node]')].map((k) => k.getBoundingClientRect())
    if (!kids.length) return []
    const startKey = axis === 'col' ? 'left' : 'top'
    const endKey = axis === 'col' ? 'right' : 'bottom'
    const origin = axis === 'col' ? wRect.left : wRect.top
    const starts = [...new Set(kids.map((r) => Math.round(r[startKey])))].sort((a, b) => a - b)
    return starts.map((s) => {
      const cluster = kids.filter((r) => Math.round(r[startKey]) === s)
      const end = Math.max(...cluster.map((r) => r[endKey]))
      return { start: (s - origin) / ZOOM, size: (end - s) / ZOOM }
    })
  }

  const cols = fromTemplate(cs.gridTemplateColumns, padL) ?? fromChildren('col')
  const rows = fromTemplate(cs.gridTemplateRows, padT) ?? fromChildren('row')
  return { wRect, cols, rows, colGap, rowGap, w: wRect.width / ZOOM, h: wRect.height / ZOOM }
}

/* which track a coordinate falls in (gap midpoints split ownership) */
function trackIndexAt(tracks, gap, pos) {
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i]
    if (pos <= t.start + t.size + gap / 2) return i
  }
  return tracks.length - 1
}

/* progressive snapping: a track joins the span once the pointer
   crosses its midpoint (Figma-style), not merely its edge */
function lastMidpointBefore(tracks, pos) {
  let e = -1
  for (let i = 0; i < tracks.length; i++) if (pos > tracks[i].start + tracks[i].size / 2) e = i
  return e
}
function firstMidpointAfter(tracks, pos) {
  let s = tracks.length
  for (let i = tracks.length - 1; i >= 0; i--) if (pos < tracks[i].start + tracks[i].size / 2) s = i
  return s
}

/* the tracks a rect covers: [startIndex, endIndex] */
function trackRange(tracks, gap, start, end) {
  return [trackIndexAt(tracks, gap, start + 2), trackIndexAt(tracks, gap, end - 2)]
}

const fmt = (n) => {
  if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n)) // snap zoom-rounding noise
  return (Math.round(n * 100) / 100).toFixed(2)
}

/* "Fill 145.39 × Fill 97" / "Fill 760 × Fit 97" / "140 × 97" */
function pillText(app, box) {
  const sel = app.selection
  if (sel.length === 1) {
    const id = sel[0]
    if (id.startsWith('wrap:') || id.startsWith('group:')) return `Fill ${fmt(box.w)} × Fit ${fmt(box.h)}`
    const wrap = app.entryOf(WRAP_ID)
    if (wrap && wrap.layout !== 'none' && wrap.members?.includes(id)) return `Fill ${fmt(box.w)} × Fill ${fmt(box.h)}`
  }
  return `${fmt(box.w)} × ${fmt(box.h)}`
}

/* parent frame that gets the dashed outline */
function parentIdOf(app) {
  const sel = app.selection
  if (!sel.length) return null
  if (sel[0].startsWith('wrap:') || sel[0].startsWith('group:')) return 'frame:content'
  const wrap = app.entryOf(WRAP_ID)
  const allInWrap = wrap && wrap.layout !== 'none' && sel.every((s) => wrap.members?.includes(s))
  return allInWrap ? WRAP_ID : 'group:experience'
}

/* ---------------- Canvas shell ---------------- */

export default function Canvas() {
  const app = useApp()
  const artboardRef = useRef(null)
  const [marks, setMarks] = useState(null) // {box, nodes:[], parent}
  const [gap, setGap] = useState(null) // {bands:[], badge:{x,y,value}}
  const [drag, setDrag] = useState(null) // {cardId, edge, axis, anchor}
  const [move, setMove] = useState(null) // {cardId, grab:{x,y}, target, ok, ghost}
  const moveRef = useRef(null) // live mirror of `move` — pointer events can outrun React renders
  const armed = useRef(null) // {cardId, x, y} — pointer is down, threshold not yet crossed
  const dragJustEnded = useRef(false)

  const wrap = app.entryOf(WRAP_ID)
  const singleCardId =
    app.selection.length === 1 && app.selection[0].startsWith('exp-') ? app.selection[0] : null
  const gridItemId = singleCardId && wrap?.layout !== 'none' && wrap?.members?.includes(singleCardId) ? singleCardId : null

  const wrapEl = () => artboardRef.current?.querySelector(`[data-node="${WRAP_ID}"]`)

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

  /* ---------------- body-drag item move ---------------- */

  const MOVE_THRESHOLD = 3 // px — below this it is a click, and selection wins

  const onItemPointerDown = (e, cardId) => {
    if (e.button !== 0) return
    /* capture so the release click lands on this card (selecting it),
       not on whatever cell it was dropped over */
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* no active pointer (synthetic event) — the drag still works, uncaptured */
    }
    armed.current = { cardId, x: e.clientX, y: e.clientY }
  }

  useEffect(() => {
    /* where the card would land for a pointer position — shared by preview and drop */
    const previewAt = (e, m) => {
      const wEl = wrapEl()
      const artEl = artboardRef.current
      if (!wEl || !artEl) return null
      const entry = app.entryOf(WRAP_ID)
      const geo = trackGeometry(wEl, entry)
      const dims = gridDims(entry)
      const span = entry.spans?.[m.cardId] ?? { col: 1, row: 1 }

      /* the cell under the card's own top-left corner, not under the cursor —
         so a card you grabbed by its middle doesn't jump */
      const x = (e.clientX - geo.wRect.left) / ZOOM - m.grab.x
      const y = (e.clientY - geo.wRect.top) / ZOOM - m.grab.y
      const clamp = (n, max) => Math.max(1, Math.min(max, n))
      const col = clamp(trackIndexAt(geo.cols, geo.colGap, x + 2) + 1, dims.cols - span.col + 1)
      const row = clamp(trackIndexAt(geo.rows, geo.rowGap, y + 2) + 1, Math.max(1, geo.rows.length - span.row + 1))

      const target = { col, row }
      const ok = resolveDrop(entry, m.cardId, target, dims).ok
      const artRect = artEl.getBoundingClientRect()
      const cEl = artEl.querySelector(`[data-node="${m.cardId}"]`)
      if (!cEl) return null
      const cRect = cEl.getBoundingClientRect()
      return { target, ok, ghost: { x: e.clientX - artRect.left, y: e.clientY - artRect.top, w: cRect.width, h: cRect.height } }
    }

    const onMove = (e) => {
      /* cross the threshold: pin the grid, then start moving */
      if (armed.current && !moveRef.current) {
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
        app.selectCard(a.cardId) // grabbing an item selects it, so the overlay follows the drag
        const m = {
          cardId: a.cardId,
          grab: { x: (a.x - r.left) / ZOOM, y: (a.y - r.top) / ZOOM },
          target: null,
          ok: false,
          ghost: null,
        }
        moveRef.current = m
        setMove(m)
        return
      }
      const m = moveRef.current
      if (!m) return
      const p = previewAt(e, m)
      if (!p) return
      const next = { ...m, ...p }
      moveRef.current = next
      setMove(next)
    }

    const onUp = (e) => {
      const m = moveRef.current
      if (m) {
        /* judge the drop from the release point itself — the last pointermove
           may not have rendered yet (or never fired, on a fast flick) */
        const p = previewAt(e, m) ?? m
        if (p.ok && p.target) app.moveItem(WRAP_ID, m.cardId, p.target)
        moveRef.current = null
        setMove(null)
        dragJustEnded.current = true
        requestAnimationFrame(() => (dragJustEnded.current = false))
      }
      armed.current = null
    }

    const onKey = (e) => {
      if (e.key === 'Escape' && moveRef.current) {
        moveRef.current = null
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
  }, [app.layouts]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!move) return
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [move])

  /* measure selection + parent in artboard coordinates; publish for the panel */
  useLayoutEffect(() => {
    const artEl = artboardRef.current
    const publish = (box, gridItem) => {
      window.__selBox = box
      window.__gridItem = gridItem ?? null
      window.dispatchEvent(new Event('selbox'))
    }
    if (!artEl || app.selection.length === 0) {
      setMarks(null)
      publish(null, null)
      return
    }
    const artRect = artEl.getBoundingClientRect()
    const toArt = (r) => ({
      x: (r.left - artRect.left) / ZOOM,
      y: (r.top - artRect.top) / ZOOM,
      w: r.width / ZOOM,
      h: r.height / ZOOM,
    })

    const nodes = []
    for (const id of app.selection) {
      const el = artEl.querySelector(`[data-node="${id}"]`)
      if (el) nodes.push(toArt(el.getBoundingClientRect()))
    }
    if (!nodes.length) {
      setMarks(null)
      publish(null, null)
      return
    }
    const box = {
      x: Math.min(...nodes.map((n) => n.x)),
      y: Math.min(...nodes.map((n) => n.y)),
    }
    box.w = Math.max(...nodes.map((n) => n.x + n.w)) - box.x
    box.h = Math.max(...nodes.map((n) => n.y + n.h)) - box.y

    const pid = parentIdOf(app)
    const pEl = pid && artEl.querySelector(`[data-node="${pid}"]`)
    const parent = pEl ? toArt(pEl.getBoundingClientRect()) : null

    /* grid-item info (1-based track range) for the panel */
    let gridItem = null
    if (gridItemId) {
      const wEl = wrapEl()
      const cEl = artEl.querySelector(`[data-node="${gridItemId}"]`)
      if (wEl && cEl) {
        const geo = trackGeometry(wEl, wrap)
        const cRect = cEl.getBoundingClientRect()
        const relX = (cRect.left - geo.wRect.left) / ZOOM
        const relR = (cRect.right - geo.wRect.left) / ZOOM
        const relY = (cRect.top - geo.wRect.top) / ZOOM
        const relB = (cRect.bottom - geo.wRect.top) / ZOOM
        const [c0, c1] = trackRange(geo.cols, geo.colGap, relX, relR)
        const [r0, r1] = trackRange(geo.rows, geo.rowGap, relY, relB)
        gridItem = { colStart: c0 + 1, colEnd: c1 + 1, rowStart: r0 + 1, rowEnd: r1 + 1 }
      }
    }

    setMarks({ box, nodes, parent })
    publish(box, gridItem)
  }, [app.selection, app.layouts]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- gap hover (wrapper selected) ---------------- */

  const handleGapMove = (e) => {
    if (!app.selection.includes(WRAP_ID) || drag) {
      if (gap) setGap(null)
      return
    }
    const wEl = e.currentTarget
    const artEl = artboardRef.current
    const entry = app.entryOf(WRAP_ID)
    if (!wEl || !artEl || !entry) return

    const artRect = artEl.getBoundingClientRect()
    const geo = trackGeometry(wEl, entry)
    const ox = (geo.wRect.left - artRect.left) / ZOOM
    const oy = (geo.wRect.top - artRect.top) / ZOOM
    const cx = (e.clientX - geo.wRect.left) / ZOOM
    const cy = (e.clientY - geo.wRect.top) / ZOOM

    const bands = []
    if (geo.colGap > 0)
      for (let i = 0; i < geo.cols.length - 1; i++) {
        const t = geo.cols[i]
        bands.push({ axis: 'col', x: ox + t.start + t.size, y: oy, w: geo.colGap, h: geo.h, value: entry.grid.colGap })
      }
    if (geo.rowGap > 0)
      for (let i = 0; i < geo.rows.length - 1; i++) {
        const t = geo.rows[i]
        bands.push({ axis: 'row', x: ox, y: oy + t.start + t.size, w: geo.w, h: geo.rowGap, value: entry.grid.rowGap })
      }

    const px = ox + cx
    const py = oy + cy
    const hit = bands.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h)
    if (hit) {
      setGap({
        bands,
        badge: {
          x: hit.axis === 'col' ? hit.x + hit.w / 2 : px,
          y: hit.axis === 'col' ? py : hit.y + hit.h / 2,
          value: hit.value,
        },
      })
    } else if (gap) {
      setGap(null)
    }
  }

  /* ---------------- edge-drag span resize (phase 2) ---------------- */

  const startSpanDrag = (edge) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const artEl = artboardRef.current
    const wEl = wrapEl()
    const cEl = artEl?.querySelector(`[data-node="${gridItemId}"]`)
    if (!artEl || !wEl || !cEl) return

    const geo = trackGeometry(wEl, wrap)
    const cRect = cEl.getBoundingClientRect()
    const axis = edge === 'left' || edge === 'right' ? 'col' : 'row'
    const tracks = axis === 'col' ? geo.cols : geo.rows
    const tGap = axis === 'col' ? geo.colGap : geo.rowGap
    const origin = axis === 'col' ? geo.wRect.left : geo.wRect.top
    const startPos = ((axis === 'col' ? cRect.left : cRect.top) - origin) / ZOOM
    const endPos = ((axis === 'col' ? cRect.right : cRect.bottom) - origin) / ZOOM
    const [s, en] = trackRange(tracks, tGap, startPos, endPos)

    // the edge being dragged is free; the opposite edge's track is the anchor
    const anchor = edge === 'right' || edge === 'bottom' ? s : en
    setDrag({ cardId: gridItemId, edge, axis, anchor })
  }

  useEffect(() => {
    if (!drag) return
    const artEl = artboardRef.current

    const onMove = (e) => {
      const wEl = wrapEl()
      if (!wEl || !artEl) return
      const geo = trackGeometry(wEl, wrap)
      const tracks = drag.axis === 'col' ? geo.cols : geo.rows
      const origin = drag.axis === 'col' ? geo.wRect.left : geo.wRect.top
      const pos = ((drag.axis === 'col' ? e.clientX : e.clientY) - origin) / ZOOM

      /* the card snaps once the pointer crosses a track's midpoint */
      const entry = app.entryOf(WRAP_ID)
      const growing = drag.edge === 'right' || drag.edge === 'bottom'
      const edgeIdx = growing
        ? Math.max(drag.anchor, lastMidpointBefore(tracks, pos))
        : Math.min(drag.anchor, firstMidpointAfter(tracks, pos))
      const start = Math.min(drag.anchor, edgeIdx)
      const span = Math.abs(edgeIdx - drag.anchor) + 1

      if (!entry?.places) {
        app.updateSpan(WRAP_ID, drag.cardId, { [drag.axis]: Math.max(1, span) })
        return
      }

      /* pinned: ask for the full rect, so a left/top drag moves the start cell;
         resizeItem clamps at the first occupied cell */
      const cur = rectOf(entry, drag.cardId)
      if (!cur) return // pinned grid, but this card was never pinned
      const desired = { ...cur }
      if (drag.axis === 'col') {
        desired.col = start + 1
        desired.colSpan = Math.max(1, span)
      } else {
        desired.row = start + 1
        desired.rowSpan = Math.max(1, span)
      }
      app.resizeItem(WRAP_ID, drag.cardId, desired)
    }

    const onUp = () => {
      setDrag(null)
      dragJustEnded.current = true
      requestAnimationFrame(() => (dragJustEnded.current = false))
    }

    document.body.style.cursor = drag.axis === 'col' ? 'col-resize' : 'row-resize'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag]) // eslint-disable-line react-hooks/exhaustive-deps

  /* track guides + projected span while dragging (edge resize or body move) */
  let guides = null
  if ((drag || move) && artboardRef.current) {
    const wEl = wrapEl()
    const artEl = artboardRef.current
    if (wEl) {
      const geo = trackGeometry(wEl, wrap)
      const artRect = artEl.getBoundingClientRect()
      const ox = (geo.wRect.left - artRect.left) / ZOOM
      const oy = (geo.wRect.top - artRect.top) / ZOOM
      const active = drag ?? move
      const cEl = artEl.querySelector(`[data-node="${active.cardId}"]`)
      let span = null
      if (move && move.target) {
        /* the cells the card will land in */
        const s = wrap.spans?.[move.cardId] ?? { col: 1, row: 1 }
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
      guides = { ox, oy, geo, span, invalid: Boolean(move && move.target && !move.ok) }
    }
  }

  const clearGap = () => setGap(null)
  const pill = marks ? pillText(app, marks.box) : null

  /* edge handle geometry (screen px) for the selected grid item */
  const handleSpecs =
    gridItemId && marks && marks.nodes.length === 1 && !move
      ? [
          { edge: 'left', x: marks.box.x, y: marks.box.y + marks.box.h / 2, cursor: 'col-resize', vert: true },
          { edge: 'right', x: marks.box.x + marks.box.w, y: marks.box.y + marks.box.h / 2, cursor: 'col-resize', vert: true },
          { edge: 'top', x: marks.box.x + marks.box.w / 2, y: marks.box.y, cursor: 'row-resize', vert: false },
          { edge: 'bottom', x: marks.box.x + marks.box.w / 2, y: marks.box.y + marks.box.h, cursor: 'row-resize', vert: false },
        ]
      : null

  return (
    <div
      className="relative flex-1 min-w-0 bg-[#1E1E1E] overflow-hidden"
      onClick={() => {
        if (dragJustEnded.current) return
        app.clearSelection()
      }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* artboard title (screen-space) */}
        <div className="text-[11px] font-sans text-[#9B9B9B] mb-1.5">Onboarding · Filled state</div>

        <div className="relative">
          <div
            style={{ zoom: ZOOM }}
            ref={artboardRef}
            className="shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.45)]"
          >
            <MyTrajArtboard onGapMove={handleGapMove} onGapLeave={clearGap} onItemPointerDown={onItemPointerDown} />
          </div>

          {/* screen-space selection overlay */}
          {marks && (
            <div className="absolute inset-0 pointer-events-none">
              {/* gap highlights */}
              {gap &&
                gap.bands.map((b, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{ left: b.x * ZOOM, top: b.y * ZOOM, width: b.w * ZOOM, height: b.h * ZOOM, background: PINK }}
                  />
                ))}

              {/* span-drag guides: dashed track lines + projected area */}
              {guides && (
                <>
                  {guides.span && (
                    <div
                      className="absolute"
                      style={{
                        left: guides.span.x * ZOOM,
                        top: guides.span.y * ZOOM,
                        width: guides.span.w * ZOOM,
                        height: guides.span.h * ZOOM,
                        background: guides.invalid ? INVALID_TINT : SPAN_TINT,
                      }}
                    />
                  )}
                  {guides.geo.cols.slice(1).map((t, i) => (
                    <div
                      key={`c${i}`}
                      className="absolute"
                      style={{
                        left: (guides.ox + t.start - guides.geo.colGap / 2) * ZOOM,
                        top: guides.oy * ZOOM,
                        height: guides.geo.h * ZOOM,
                        borderLeft: `1px dashed ${BLUE_DASH}`,
                      }}
                    />
                  ))}
                  {guides.geo.rows.slice(1).map((t, i) => (
                    <div
                      key={`r${i}`}
                      className="absolute"
                      style={{
                        top: (guides.oy + t.start - guides.geo.rowGap / 2) * ZOOM,
                        left: guides.ox * ZOOM,
                        width: guides.geo.w * ZOOM,
                        borderTop: `1px dashed ${BLUE_DASH}`,
                      }}
                    />
                  ))}
                </>
              )}

              {/* the ghost: the grabbed card following the cursor */}
              {move && move.ghost && (
                <div
                  className="absolute rounded-[10px] border border-[#4B84F7] bg-white/70 pointer-events-none"
                  style={{
                    left: move.ghost.x - move.grab.x * ZOOM,
                    top: move.ghost.y - move.grab.y * ZOOM,
                    width: move.ghost.w,
                    height: move.ghost.h,
                    opacity: 0.6,
                  }}
                />
              )}

              {/* dashed parent frame */}
              {marks.parent && !drag && !move && (
                <div
                  className="absolute"
                  style={{
                    left: marks.parent.x * ZOOM - 1,
                    top: marks.parent.y * ZOOM - 1,
                    width: marks.parent.w * ZOOM + 2,
                    height: marks.parent.h * ZOOM + 2,
                    border: `1px dashed ${BLUE_DASH}`,
                  }}
                />
              )}

              {/* per-node outlines for multi-selection */}
              {marks.nodes.length > 1 &&
                marks.nodes.map((n, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: n.x * ZOOM,
                      top: n.y * ZOOM,
                      width: n.w * ZOOM,
                      height: n.h * ZOOM,
                      border: `1px solid ${BLUE}`,
                    }}
                  />
                ))}

              {/* selection bbox + corner handles */}
              <div
                className="absolute"
                style={{
                  left: marks.box.x * ZOOM,
                  top: marks.box.y * ZOOM,
                  width: marks.box.w * ZOOM,
                  height: marks.box.h * ZOOM,
                  border: `1.5px solid ${BLUE}`,
                }}
              >
                {[
                  { left: -4, top: -4 },
                  { right: -4, top: -4 },
                  { left: -4, bottom: -4 },
                  { right: -4, bottom: -4 },
                ].map((posn, i) => (
                  <div key={i} className="absolute size-2 bg-white" style={{ ...posn, border: `1.5px solid ${BLUE}` }} />
                ))}

                {/* size pill */}
                {!move && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-white"
                    style={{
                      top: '100%',
                      marginTop: 8,
                      background: '#4E80F0',
                      borderRadius: 5,
                      fontSize: 11.5,
                      lineHeight: '14px',
                      padding: '4px 8px',
                    }}
                  >
                    {pill}
                  </div>
                )}
              </div>

              {/* edge handles: drag to change how many tracks the item spans */}
              {handleSpecs &&
                handleSpecs.map((h) => (
                  <div
                    key={h.edge}
                    onPointerDown={startSpanDrag(h.edge)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: h.x * ZOOM - 8,
                      top: h.y * ZOOM - 8,
                      width: 16,
                      height: 16,
                      pointerEvents: 'auto',
                      cursor: h.cursor,
                    }}
                  >
                    <div
                      className="bg-white rounded-full"
                      style={{
                        width: h.vert ? 5 : 14,
                        height: h.vert ? 14 : 5,
                        border: `1.5px solid ${BLUE}`,
                      }}
                    />
                  </div>
                ))}

              {/* gap badge */}
              {gap && (
                <div
                  className="absolute flex items-center justify-center font-mono text-white -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: gap.badge.x * ZOOM,
                    top: gap.badge.y * ZOOM,
                    minWidth: 22,
                    height: 22,
                    padding: '0 5px',
                    background: PINK_SOLID,
                    borderRadius: 4,
                    fontSize: 11.5,
                  }}
                >
                  {gap.badge.value}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
