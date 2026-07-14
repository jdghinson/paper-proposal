import { useLayoutEffect, useRef, useState } from 'react'
import { useApp, layoutStyle, CARD_IDS } from '../store.jsx'

export const ZOOM = 0.59

const BLUE = '#4B84F7'
const BLUE_DASH = '#6FA3F8'
const PINK = 'rgba(236, 90, 143, 0.28)'
const PINK_SOLID = '#E64980'

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
  return (
    <div
      data-node={id}
      onClick={(e) => {
        e.stopPropagation()
        app.selectCard(id, e.shiftKey)
      }}
      style={ownStyle ?? undefined}
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
  const wrap = app.entryOf('wrap:experience')
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
            data-node="wrap:experience"
            onClick={(e) => {
              e.stopPropagation()
              app.selectNode('wrap:experience')
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

/* ---------------- selection helpers ---------------- */

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
    const wrap = app.entryOf('wrap:experience')
    if (wrap && wrap.layout !== 'none' && wrap.members?.includes(id)) return `Fill ${fmt(box.w)} × Fill ${fmt(box.h)}`
  }
  return `${fmt(box.w)} × ${fmt(box.h)}`
}

/* parent frame that gets the dashed outline */
function parentIdOf(app) {
  const sel = app.selection
  if (!sel.length) return null
  if (sel[0].startsWith('wrap:') || sel[0].startsWith('group:')) return 'frame:content'
  const wrap = app.entryOf('wrap:experience')
  const allInWrap = wrap && wrap.layout !== 'none' && sel.every((s) => wrap.members?.includes(s))
  return allInWrap ? 'wrap:experience' : 'group:experience'
}

/* ---------------- Canvas shell ---------------- */

export default function Canvas() {
  const app = useApp()
  const artboardRef = useRef(null)
  const [marks, setMarks] = useState(null) // {box, nodes:[], parent}
  const [gap, setGap] = useState(null) // {bands:[{x,y,w,h,axis}], badge:{x,y,value}}

  /* measure selection + parent in artboard coordinates */
  useLayoutEffect(() => {
    const artEl = artboardRef.current
    const publish = (box) => {
      window.__selBox = box
      window.dispatchEvent(new Event('selbox'))
    }
    if (!artEl || app.selection.length === 0) {
      setMarks(null)
      publish(null)
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
      publish(null)
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

    setMarks({ box, nodes, parent })
    publish(box)
  }, [app.selection, app.layouts])

  /* gap hover on the wrapper (only while it is selected) */
  const handleGapMove = (e) => {
    if (!app.selection.includes('wrap:experience')) {
      if (gap) setGap(null)
      return
    }
    const wrapEl = e.currentTarget
    const artEl = artboardRef.current
    const entry = app.entryOf('wrap:experience')
    if (!wrapEl || !artEl || !entry) return

    const artRect = artEl.getBoundingClientRect()
    const wRect = wrapEl.getBoundingClientRect()
    const ox = (wRect.left - artRect.left) / ZOOM
    const oy = (wRect.top - artRect.top) / ZOOM
    const innerW = wRect.width / ZOOM
    const innerH = wRect.height / ZOOM
    const cx = (e.clientX - wRect.left) / ZOOM
    const cy = (e.clientY - wRect.top) / ZOOM

    const cs = getComputedStyle(wrapEl)
    const padL = parseFloat(cs.paddingLeft) || 0
    const padT = parseFloat(cs.paddingTop) || 0
    const bands = []

    if (entry.layout === 'grid') {
      const cols = cs.gridTemplateColumns.split(' ').map(parseFloat)
      const rows = cs.gridTemplateRows.split(' ').map(parseFloat)
      const colGap = parseFloat(cs.columnGap) || 0
      const rowGap = parseFloat(cs.rowGap) || 0
      let x = padL
      for (let i = 0; i < cols.length - 1; i++) {
        x += cols[i]
        if (colGap > 0) bands.push({ axis: 'col', x: ox + x, y: oy, w: colGap, h: innerH, value: entry.grid.colGap })
        x += colGap
      }
      let y = padT
      for (let i = 0; i < rows.length - 1; i++) {
        y += rows[i]
        if (rowGap > 0) bands.push({ axis: 'row', x: ox, y: oy + y, w: innerW, h: rowGap, value: entry.grid.rowGap })
        y += rowGap
      }
    } else {
      // flex wrapper: bands between consecutive children
      const kids = [...wrapEl.querySelectorAll(':scope > [data-node]')].map((k) => k.getBoundingClientRect())
      for (let i = 0; i < kids.length - 1; i++) {
        const a = kids[i]
        const b = kids[i + 1]
        const gw = (b.left - a.right) / ZOOM
        if (gw > 0)
          bands.push({
            axis: 'col',
            x: ox + (a.right - wRect.left) / ZOOM,
            y: oy,
            w: gw,
            h: innerH,
            value: entry.flex.gap,
          })
      }
    }

    const hit = bands.find(
      (b) => cx + ox >= b.x && cx + ox <= b.x + b.w && cy + oy >= b.y && cy + oy <= b.y + b.h,
    )
    if (hit) {
      setGap({
        bands,
        badge: {
          x: hit.axis === 'col' ? hit.x + hit.w / 2 : ox + cx,
          y: hit.axis === 'col' ? oy + cy : hit.y + hit.h / 2,
          value: hit.value,
        },
      })
    } else if (gap) {
      setGap(null)
    }
  }

  const clearGap = () => setGap(null)
  const pill = marks ? pillText(app, marks.box) : null

  return (
    <div className="relative flex-1 min-w-0 bg-[#1E1E1E] overflow-hidden" onClick={() => app.clearSelection()}>
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

          {/* screen-space selection overlay: crisp 1px lines and handles at any zoom */}
          {marks && (
            <div className="absolute inset-0 pointer-events-none">
              {/* gap highlights */}
              {gap &&
                gap.bands.map((b, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: b.x * ZOOM,
                      top: b.y * ZOOM,
                      width: b.w * ZOOM,
                      height: b.h * ZOOM,
                      background: PINK,
                    }}
                  />
                ))}

              {/* dashed parent frame */}
              {marks.parent && (
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
                  <div
                    key={i}
                    className="absolute size-2 bg-white"
                    style={{ ...posn, border: `1.5px solid ${BLUE}` }}
                  />
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
