import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useApp, layoutStyle, CARD_IDS } from '../store.jsx'

export const ZOOM = 0.59

const BLUE = '#4B84F7'
const BLUE_DASH = '#6FA3F8'
const PINK = 'rgba(236, 90, 143, 0.28)'
const PINK_SOLID = '#E64980'
const SPAN_TINT = 'rgba(75, 132, 247, 0.10)'

const WRAP_ID = 'wrap:experience'

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
function Card({ index, inGrid }) {
  const app = useApp()
  const id = `exp-${index}`
  const c = EXPERIENCE[index]
  const ownStyle = layoutStyle(app.entryOf(id)) // cards are flex boxes by default

  /* grid-item span (phase 2): how many tracks this card covers */
  let spanStyle
  if (inGrid) {
    const wrap = app.entryOf(WRAP_ID)
    const span = wrap?.spans?.[id] ?? { col: 1, row: 1 }
    const col = Math.min(span.col, wrap.grid.cols.length)
    const row = wrap.grid.rowMode === 'fixed' ? Math.min(span.row, wrap.grid.rows.length) : span.row
    spanStyle = { gridColumn: `span ${col}`, gridRow: `span ${row}` }
  }

  return (
    <div
      data-node={id}
      onClick={(e) => {
        e.stopPropagation()
        app.selectCard(id, e.shiftKey)
      }}
      style={{ ...ownStyle, ...spanStyle }}
      className={`${inGrid ? 'w-auto' : 'w-[140px]'} min-h-[97px] rounded-[10px] border bg-white relative cursor-default ${
        c.checked ? 'border-[#8A3FFC]' : 'border-[#E5E6ED]'
      }`}
    >
      <RadioCircle checked={c.checked} />
      <div>
        <div className="text-[14px] font-semibold leading-5">{c.title}</div>
        <div className="text-[12px] text-[#828498] mt-0.5">{c.sub}</div>
      </div>
    </div>
  )
}

/* the row of cards; Add grid wraps only the selected cards in a new container */
function ExperienceRow({ onGapMove, onGapLeave }) {
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
              <Card key={mid} index={CARD_IDS.indexOf(mid)} inGrid />
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

function MyTrajArtboard({ onGapMove, onGapLeave }) {
  return (
    <div className="w-[1440px] bg-[#FDFCFF] font-hanken text-[#21243C]" data-node="artboard">
      <div className="w-[760px] mx-auto py-24" data-node="frame:content">
        <div className="text-[16px] font-semibold">How much experience do you have?</div>
        <div className="mt-3">
          <ExperienceRow onGapMove={onGapMove} onGapLeave={onGapLeave} />
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
  const [dragPos, setDragPos] = useState(null) // pointer in artboard coords, for the ghost edge
  const dragJustEnded = useRef(false)

  const wrap = app.entryOf(WRAP_ID)
  const singleCardId =
    app.selection.length === 1 && app.selection[0].startsWith('exp-') ? app.selection[0] : null
  const gridItemId = singleCardId && wrap?.layout !== 'none' && wrap?.members?.includes(singleCardId) ? singleCardId : null

  const wrapEl = () => artboardRef.current?.querySelector(`[data-node="${WRAP_ID}"]`)

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
      const artRect = artEl.getBoundingClientRect()
      setDragPos({ x: (e.clientX - artRect.left) / ZOOM, y: (e.clientY - artRect.top) / ZOOM })

      const geo = trackGeometry(wEl, wrap)
      const tracks = drag.axis === 'col' ? geo.cols : geo.rows
      const origin = drag.axis === 'col' ? geo.wRect.left : geo.wRect.top
      const pos = ((drag.axis === 'col' ? e.clientX : e.clientY) - origin) / ZOOM

      /* the ghost follows the pointer; the card snaps once a track's midpoint is crossed */
      const span =
        drag.edge === 'right' || drag.edge === 'bottom'
          ? Math.max(drag.anchor, lastMidpointBefore(tracks, pos)) - drag.anchor + 1
          : drag.anchor - Math.min(drag.anchor, firstMidpointAfter(tracks, pos)) + 1
      app.updateSpan(WRAP_ID, drag.cardId, { [drag.axis]: Math.max(1, span) })
    }

    const onUp = () => {
      setDrag(null)
      setDragPos(null)
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

  /* track guides + projected span while dragging */
  let guides = null
  if (drag && artboardRef.current) {
    const wEl = wrapEl()
    const artEl = artboardRef.current
    if (wEl) {
      const geo = trackGeometry(wEl, wrap)
      const artRect = artEl.getBoundingClientRect()
      const ox = (geo.wRect.left - artRect.left) / ZOOM
      const oy = (geo.wRect.top - artRect.top) / ZOOM
      const cEl = artEl.querySelector(`[data-node="${drag.cardId}"]`)
      let span = null
      let ghost = null
      if (cEl) {
        const cRect = cEl.getBoundingClientRect()
        span = {
          x: (cRect.left - artRect.left) / ZOOM,
          y: (cRect.top - artRect.top) / ZOOM,
          w: cRect.width / ZOOM,
          h: cRect.height / ZOOM,
        }
        /* ghost edge follows the pointer freely (clamped to the container);
           the card underneath snaps to whole tracks — CSS grid placement
           only exists on track lines */
        if (dragPos) {
          const clampX = (v) => Math.max(ox, Math.min(v, ox + geo.w))
          const clampY = (v) => Math.max(oy, Math.min(v, oy + geo.h))
          ghost = { ...span }
          if (drag.edge === 'right') ghost.w = Math.max(24, clampX(dragPos.x) - span.x)
          if (drag.edge === 'left') {
            const x1 = span.x + span.w
            ghost.x = Math.min(clampX(dragPos.x), x1 - 24)
            ghost.w = x1 - ghost.x
          }
          if (drag.edge === 'bottom') ghost.h = Math.max(24, clampY(dragPos.y) - span.y)
          if (drag.edge === 'top') {
            const y1 = span.y + span.h
            ghost.y = Math.min(clampY(dragPos.y), y1 - 24)
            ghost.h = y1 - ghost.y
          }
        }
      }
      guides = { ox, oy, geo, span, ghost }
    }
  }

  const clearGap = () => setGap(null)
  const pill = marks ? pillText(app, marks.box) : null

  /* edge handle geometry (screen px) for the selected grid item */
  const handleSpecs =
    gridItemId && marks && marks.nodes.length === 1
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
            onClick={(e) => e.stopPropagation()}
            className="shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.45)]"
          >
            <MyTrajArtboard onGapMove={handleGapMove} onGapLeave={clearGap} />
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
                        background: SPAN_TINT,
                      }}
                    />
                  )}
                  {/* ghost edge: follows the cursor; the card snaps to tracks below it */}
                  {guides.ghost && (
                    <div
                      className="absolute rounded-[6px]"
                      style={{
                        left: guides.ghost.x * ZOOM,
                        top: guides.ghost.y * ZOOM,
                        width: guides.ghost.w * ZOOM,
                        height: guides.ghost.h * ZOOM,
                        border: `1.5px solid ${BLUE}`,
                        background: SPAN_TINT,
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

              {/* dashed parent frame */}
              {marks.parent && !drag && (
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
