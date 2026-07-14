import { useState } from 'react'
import { useApp, trackLabel } from '../store.jsx'
import { Menu, FIELD_SHADOW } from '../ui.jsx'
import { ChevronDown, CloseIcon } from '../icons.jsx'

const num = (v, fallback = 0) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}

/* one track row inside the grid settings overlay */
function TrackRow({ id, axis, index, track }) {
  const app = useApp()
  const [draft, setDraft] = useState(null)
  const label = trackLabel(track)

  const editable = track.mode !== 'hug'
  const commit = () => {
    if (draft !== null) {
      const n = Math.max(track.mode === 'fill' ? 0.1 : 1, num(draft, 1))
      if (track.mode === 'fill') app.updateTrack(id, axis, index, { fr: n })
      else app.updateTrack(id, axis, index, { px: n })
    }
    setDraft(null)
  }

  const editValue = track.mode === 'fill' ? String(track.fr) : String(track.px)

  return (
    <div className="flex items-center min-w-0 relative self-stretch">
      <div className={`flex items-center h-6 w-full pr-5 pl-6 rounded-[5px] overflow-clip ${FIELD_SHADOW} bg-[#373737]`}>
        <div className="flex items-center gap-1 w-full min-w-0">
          {editable ? (
            <input
              className="flex-1 min-w-0 font-sans text-[#FFFFFFE6] text-xs/4"
              value={draft ?? (track.mode === 'fill' ? `${track.fr}fr` : `${track.px}`)}
              onFocus={(e) => {
                setDraft(editValue)
                requestAnimationFrame(() => e.target.select())
              }}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                e.stopPropagation()
              }}
            />
          ) : (
            <div className="flex-1 font-sans text-[#FFFFFFE6] text-xs/4 line-clamp-1">Auto</div>
          )}
          <div className="text-right font-sans text-[#8E8E8E] text-xs/4 shrink-0">{label.mode}</div>
        </div>
      </div>
      <div className="absolute size-6 flex items-center justify-center text-center font-sans font-medium text-[#FFFFFF66] text-xs/4 pointer-events-none">
        {index + 1}
      </div>
      <div
        className="absolute right-0 h-6 w-5 flex items-center justify-center cursor-default"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          app.setMenu({ kind: 'track', id, axis, index, x: r.right, y: r.bottom + 4 })
        }}
      >
        <ChevronDown />
      </div>
    </div>
  )
}

/* shown for an axis whose count mode is Auto — one non-indexed "Auto | Hug" row */
function AutoAxisRow({ id, axis }) {
  const app = useApp()
  return (
    <div className="flex items-center min-w-0 relative self-stretch">
      <div className={`flex items-center h-6 w-full pr-5 pl-2.5 rounded-[5px] overflow-clip ${FIELD_SHADOW} bg-[#373737]`}>
        <div className="flex items-center gap-1 w-full min-w-0">
          <div className="flex-1 font-sans text-[#FFFFFFE6] text-xs/4 line-clamp-1">Auto</div>
          <div className="text-right font-sans text-[#8E8E8E] text-xs/4 shrink-0">Hug</div>
        </div>
      </div>
      <div
        className="absolute right-0 h-6 w-5 flex items-center justify-center cursor-default"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          app.setMenu({ kind: 'countMode', id, axis, x: r.right, y: r.bottom + 4 })
        }}
      >
        <ChevronDown />
      </div>
    </div>
  )
}

export function GridSettingsOverlay() {
  const app = useApp()
  const id = app.activeLayoutId
  if (!id || app.overlay !== 'gridSettings') return null
  const grid = app.entryOf(id).grid

  /* live mini-preview: scale fixed px tracks down so proportions read */
  const previewTrack = (t) =>
    t.mode === 'hug' ? 'minmax(12px, auto)' : t.mode === 'fixed' ? `${Math.max(8, t.px / 5)}px` : `${t.fr}fr`

  const previewStyle = {
    display: 'grid',
    gap: 2,
    justifyItems: 'stretch',
    alignItems: 'stretch',
  }
  const visCols = grid.cols.length
  const visRows = grid.rowMode === 'fixed' ? grid.rows.length : 1
  previewStyle.gridTemplateColumns = grid.cols.map(previewTrack).join(' ')
  if (grid.rowMode === 'fixed') previewStyle.gridTemplateRows = grid.rows.map(previewTrack).join(' ')
  else previewStyle.gridTemplateRows = `repeat(${visRows}, minmax(24px, auto))`

  return (
    <div className="fixed z-40 right-[293px] top-[108px] w-75 rounded-md overflow-clip [box-shadow:#555555_0px_0px_0px_0.5px,#00000066_0px_4px_20px_-2px] bg-[#2A2A2A]">
      {/* tab bar */}
      <div className="h-6 flex [box-shadow:#373737_0px_-1px_0px_inset] bg-[#222222]">
        <div className="relative [box-shadow:#373737_0px_-1px_0px,#373737_-1px_0px_0px,#373737_1px_0px_0px] bg-[#2A2A2A] rounded-t-md">
          <div className="flex items-center h-6 px-2 rounded-md">
            <div className="font-sans font-medium text-[#FFFFFFE6] text-xs/4">Grid settings</div>
          </div>
        </div>
        <div className="grow" />
        <div
          className="flex items-center justify-center shrink-0 size-6 cursor-default hover:bg-[#333]"
          onClick={() => app.setOverlay(null)}
        >
          <CloseIcon />
        </div>
      </div>

      {/* live preview */}
      <div className="h-30 flex flex-col justify-center mt-2 rounded-sm overflow-clip bg-[#333333] mx-2 p-4">
        <div className="w-full h-full" style={previewStyle}>
          {Array.from({ length: visCols * visRows }).map((_, i) => (
            <div key={i} className="rounded-xs bg-[#2B2B2B] min-h-3" />
          ))}
        </div>
      </div>

      {/* columns / rows lists */}
      <div className="flex py-1 pb-3 w-75 gap-2">
        <div className="flex items-start py-1 px-2 gap-2 flex-col h-fit flex-1 min-w-0">
          <div className="font-sans text-[#FFFFFFA6] text-xs/4">Columns</div>
          {grid.cols.map((t, i) => (
            <TrackRow key={i} id={id} axis="col" index={i} track={t} />
          ))}
        </div>
        <div className="flex items-start py-1 px-2 gap-2 flex-col h-fit flex-1 min-w-0">
          <div className="font-sans text-[#FFFFFFA6] text-xs/4">
            {grid.rowMode === 'fixed' && grid.rows.length > 1 ? 'Rows' : 'Row'}
          </div>
          {grid.rowMode === 'fixed' ? (
            grid.rows.map((t, i) => <TrackRow key={i} id={id} axis="row" index={i} track={t} />)
          ) : (
            <AutoAxisRow id={id} axis="row" />
          )}
        </div>
      </div>
    </div>
  )
}

export function Menus() {
  const app = useApp()
  const m = app.menu
  if (!m) return null

  if (m.kind === 'position') {
    const grid = app.entryOf(m.id).grid
    return (
      <Menu
        onClose={() => app.setMenu(null)}
        style={{ left: m.x - 118, top: m.y }}
        items={[
          {
            label: 'Item position',
            checked: grid.posMode === 'item',
            onSelect: () => app.updateGrid(m.id, { posMode: 'item' }),
          },
          {
            label: 'Grid position',
            checked: grid.posMode === 'grid',
            onSelect: () => app.updateGrid(m.id, { posMode: 'grid' }),
          },
        ]}
      />
    )
  }

  /* Fixed (explicit row count) vs Auto (implicit rows) */
  if (m.kind === 'countMode') {
    const grid = app.entryOf(m.id).grid
    return (
      <Menu
        onClose={() => app.setMenu(null)}
        style={{ left: m.x - 110, top: m.y }}
        items={[
          { label: 'Fixed', checked: grid.rowMode === 'fixed', onSelect: () => app.updateGrid(m.id, { rowMode: 'fixed' }) },
          { label: 'Auto', checked: grid.rowMode === 'auto', onSelect: () => app.updateGrid(m.id, { rowMode: 'auto' }) },
        ]}
      />
    )
  }

  if (m.kind === 'track') {
    const grid = app.entryOf(m.id).grid
    const track = (m.axis === 'col' ? grid.cols : grid.rows)[m.index]
    if (!track) return null
    const set = (mode) => app.updateTrack(m.id, m.axis, m.index, { mode })
    return (
      <Menu
        onClose={() => app.setMenu(null)}
        style={{ left: m.x - 110, top: m.y }}
        items={[
          { label: 'Fill', checked: track.mode === 'fill', onSelect: () => set('fill') },
          { label: 'Fixed', checked: track.mode === 'fixed', onSelect: () => set('fixed') },
          { label: 'Auto', checked: track.mode === 'hug', onSelect: () => set('hug') },
        ]}
      />
    )
  }

  return null
}
