import { useEffect, useRef, useState } from 'react'
import { ChevronDown, CheckboxCheck } from './icons.jsx'

/* Paper's layered field shadow, used everywhere */
export const FIELD_SHADOW =
  '[box-shadow:#FFFFFF08_0px_1px_0px_inset,#FFFFFF11_0px_0px_1px_0.5px_inset,#00000022_0px_1px_0.5px,#000000BB_0px_0px_3px_-1px]'
export const CHECKBOX_SHADOW =
  '[box-shadow:#FFFFFF08_0px_1px_0px_inset,#FFFFFF33_0px_0px_1px_0.5px_inset,#00000022_0px_1px_0.5px,#000000BB_0px_0px_3px_-1px]'
export const SEG_ACTIVE_SHADOW =
  '[box-shadow:#FFFFFF08_0px_1px_0px_inset,#FFFFFF22_0px_0px_1px_0.5px_inset,#00000022_0px_1px_0.5px,#000000BB_0px_0px_3px_-1px]'

/* Standard panel row */
export const Row = ({ className = '', children }) => (
  <div className={`flex items-center py-1 px-3 gap-2 ${className}`}>{children}</div>
)

/* 24px-high inset field. Left slot is a 24x24 icon/letter, optional chevron at right.
   If onCommit provided, the value is editable (commit on Enter/blur). */
export function Field({ label, icon, value, suffix = null, chevron = false, onChevron, onCommit, mono, title }) {
  const [draft, setDraft] = useState(null)
  const inputRef = useRef(null)
  const display = draft ?? String(value)

  const commit = () => {
    if (draft !== null && onCommit) onCommit(draft)
    setDraft(null)
  }

  return (
    <div className="flex items-center basis-[0%] grow min-w-0 relative" title={title}>
      <div
        className={`flex items-center h-6 w-full ${chevron ? 'pr-5' : ''} pl-6 rounded-[5px] overflow-clip ${FIELD_SHADOW} bg-[#373737]`}
      >
        {onCommit ? (
          <input
            ref={inputRef}
            className="w-full text-[#FFFFFFE6] text-xs/4 font-sans"
            value={display}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') inputRef.current?.blur()
              if (e.key === 'Escape') {
                setDraft(null)
                inputRef.current?.blur()
              }
              e.stopPropagation()
            }}
          />
        ) : (
          <div className={`text-xs/4 font-sans line-clamp-1 ${mono ? 'text-[#FFFFFF80]' : 'text-[#FFFFFFE6]'}`}>
            {value}
            {suffix}
          </div>
        )}
      </div>
      <div className="absolute size-6 flex items-center justify-center text-center content-center font-sans font-medium text-[#FFFFFF66] text-xs/4 pointer-events-none">
        {icon ?? label}
      </div>
      {(chevron || onChevron) && (
        <div
          className={`absolute right-0 h-6 w-5 flex items-center justify-center ${onChevron ? 'cursor-default' : ''}`}
          onClick={
            onChevron
              ? (e) => {
                  e.stopPropagation()
                  onChevron(e)
                }
              : undefined
          }
        >
          <ChevronDown />
        </div>
      )}
    </div>
  )
}

/* 24px icon button (hover bg like Paper) */
export function IconBtn({ children, onClick, active = false, className = '', title }) {
  return (
    <div
      role="button"
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center shrink-0 rounded-[5px] size-6 relative cursor-default ${
        active ? 'bg-[#464646]' : onClick ? 'hover:bg-[#3D3D3D]' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* Section header (Radius / Blending / Fill / ... rows) */
export function SectionHeader({ title, muted = false, right = null }) {
  return (
    <div className="flex items-center h-8 justify-between px-3">
      <div className={`font-sans font-medium text-xs/4 ${muted ? 'text-[#FFFFFF80]' : 'text-[#FFFFFFE6]'}`}>
        {title}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}

/* Checkbox row */
export function Checkbox({ label, checked, onChange, kbd }) {
  return (
    <div className="flex items-center py-1 px-3 gap-2">
      <div
        className="flex items-center gap-1.5 cursor-default"
        onClick={onChange ? () => onChange(!checked) : undefined}
      >
        <div
          className={`flex items-center justify-center shrink-0 rounded-sm ${CHECKBOX_SHADOW} bg-[#373737] size-4`}
        >
          {checked && <CheckboxCheck />}
        </div>
        <div className="font-sans text-[#FFFFFFE6] text-xs/4">{label}</div>
        {kbd && <div className="font-sans text-[#FFFFFF93] text-xs/4">{kbd}</div>}
      </div>
    </div>
  )
}

/* 3x3 position picker — exact structure from the design file.
   pos: {x: 'start'|'center'|'end'|'stretch', y: same}; marker = 3 blue bars.
   Stretch (the default) is drawn at the top-center cell, like the mockup;
   clicking the active anchor again returns to stretch. */
export function PositionPicker({ pos, onPick, className = '' }) {
  const anchors = ['start', 'center', 'end']
  const isStretch = pos.x === 'stretch' || pos.y === 'stretch'
  return (
    <div className={`grid grid-cols-3 grid-rows-[19px_18px_19px] rounded-sm bg-[#373737] ${className}`}>
      {anchors.flatMap((y, r) =>
        anchors.map((x, c) => {
          const active = isStretch ? r === 0 && c === 1 : pos.x === x && pos.y === y
          const padCls = `${r === 0 ? 'pt-0.5 ' : r === 2 ? 'pb-0.5 ' : ''}${c === 0 ? 'pl-0.5' : c === 2 ? 'pr-0.5' : ''}`
          return (
            <div key={`${x}-${y}`} className={padCls}>
              <div
                className="flex items-center justify-center rounded-xs size-full cursor-default hover:bg-[#FFFFFF0A]"
                onClick={() =>
                  active && !isStretch ? onPick({ x: 'stretch', y: 'stretch' }) : onPick({ x, y })
                }
              >
                {active ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="basis-0.5 h-0.5 shrink-0 w-1.75 rounded-[1px] bg-[#609EFA]" />
                    <div className="basis-0.5 h-0.5 shrink-0 w-2.5 rounded-[1px] bg-[#609EFA]" />
                    <div className="basis-0.5 h-0.5 shrink-0 w-1.75 rounded-[1px] bg-[#609EFA]" />
                  </div>
                ) : (
                  <div className="rounded-full shrink-0 bg-[#FFFFFF80] size-0.5" />
                )}
              </div>
            </div>
          )
        }),
      )}
    </div>
  )
}

/* Popover menu (Item position / Grid position, track types) — exact styles from 2IL-0 */
export function Menu({ items, onClose, style }) {
  const ref = useRef(null)
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={style}
      className="fixed z-50 py-1 rounded-[12.5px] overflow-clip w-fit backdrop-blur-[12px] [box-shadow:#555555_0px_0px_0px_0.5px,#00000066_0px_4px_20px_-2px] bg-[#2A2A2AEB]"
    >
      {items.map((item) => (
        <div
          key={item.label}
          onClick={() => {
            item.onSelect()
            onClose()
          }}
          className="grid items-center grid-flow-col grid-cols-[12px_1fr] min-h-6 pt-[3.5px] pr-5 pb-[4.5px] pl-2 gap-1 relative cursor-default hover:bg-[#3B6CD8]"
        >
          <div className="col-start-1">{item.checked && <CheckIconSmall />}</div>
          <div className="col-start-2 w-fit font-sans text-[#FFFFFFE6] text-xs/4 line-clamp-1">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

const CheckIconSmall = () => (
  <svg width="10" height="10" viewBox="0 0 10 10">
    <path
      d="M1.75 5.75L4.516 8.25L8.75 1.75"
      fill="none"
      stroke="rgba(255,255,255,0.9)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
