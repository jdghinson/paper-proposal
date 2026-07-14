import { useApp } from '../store.jsx'
import {
  PaperLogo,
  PanelToggleIcon,
  TreeChevron,
  PageIcon,
  PlusIcon,
  ArtboardLayerIcon,
  FrameLayerIcon,
  TextLayerIcon,
  GridLayerIcon,
  VStackLayerIcon,
  HStackLayerIcon,
} from '../icons.jsx'

const CARD_NAMES = ['Entry Level', 'Mid-Level', 'Senior', 'Lead / Principal', 'Executive']

/* a frame's layer icon reflects its layout: generic frame when it has none,
   grid, or a flex stack by direction */
function layoutIcon(entry) {
  if (!entry || entry.layout === 'none') return 'frame'
  if (entry.layout === 'grid') return 'grid'
  return entry.flex.dir === 'row' ? 'hstack' : 'vstack'
}

/* layer tree mirrors the canvas; the wrapper frame appears when Add grid/flex creates it */
function buildTree(app) {
  const wrap = app.entryOf('wrap:experience')
  const hasWrap = wrap && wrap.layout !== 'none' && wrap.members?.length
  const members = hasWrap ? wrap.members : []

  const rows = [
    { d: 0, icon: 'artboard', name: 'Onboarding · Filled state', chevron: true, artboard: true },
    { d: 1, icon: 'vstack', name: 'Frame', chevron: true }, // content column
    { d: 2, icon: 'text', name: 'How much experience …' },
    { d: 2, icon: 'hstack', name: 'Frame', chevron: true, sel: 'group:experience' }, // cards row
  ]

  let wrapperInserted = false
  CARD_NAMES.forEach((name, i) => {
    const id = `exp-${i}`
    if (members.includes(id)) {
      if (!wrapperInserted) {
        wrapperInserted = true
        rows.push({
          d: 3,
          icon: layoutIcon(wrap),
          name: wrap.layout === 'grid' ? 'Grid' : 'Frame',
          chevron: true,
          sel: 'wrap:experience',
        })
        members.forEach((mid) => {
          rows.push({
            d: 4,
            icon: layoutIcon(app.entryOf(mid)),
            name: CARD_NAMES[Number(mid.split('-')[1])],
            chevron: true,
            sel: mid,
          })
        })
      }
    } else {
      rows.push({ d: 3, icon: layoutIcon(app.entryOf(id)), name, chevron: true, sel: id })
    }
  })
  return rows
}

const LayerIcon = ({ kind }) => {
  switch (kind) {
    case 'artboard':
      return <ArtboardLayerIcon />
    case 'text':
      return <TextLayerIcon />
    case 'grid':
      return <GridLayerIcon />
    case 'hstack':
      return <HStackLayerIcon />
    case 'frame':
      return <FrameLayerIcon />
    default:
      return <VStackLayerIcon />
  }
}

export default function Sidebar() {
  const app = useApp()
  const tree = buildTree(app)

  return (
    <div className="flex flex-col w-60 min-h-0 shrink-0 bg-[#2A2A2A] text-xs/4">
      {/* header */}
      <div className="flex items-center justify-between pr-3 pl-2.5 gap-3 py-2 border-b border-[#373737]">
        <div className="flex items-center basis-[0%] grow min-w-0 gap-1">
          <div className="flex items-center justify-center shrink-0 rounded-[5px] -m-1 size-7">
            <PaperLogo />
          </div>
          <div className="flex items-center h-6 px-1.5 rounded-sm">
            <div className="text-center font-sans font-medium text-[#FFFFFFE6] text-[13px]/4">Paper</div>
          </div>
        </div>
        <div className="flex items-center justify-center shrink-0 rounded-[5px] -m-1 size-6">
          <PanelToggleIcon />
        </div>
      </div>

      {/* pages */}
      <div className="flex flex-col">
        <div className="flex items-center h-6 justify-between mb-0.5 mt-2 pr-3 shrink-0">
          <div className="flex items-center h-full pr-1">
            <div className="flex items-center h-full shrink-0 w-5 justify-center">
              <TreeChevron />
            </div>
            <div className="font-sans font-medium text-[#FFFFFFE6] text-xs/4">Pages</div>
          </div>
          <div className="flex items-center justify-center shrink-0 rounded-[5px] -m-1 size-6">
            <PlusIcon opacity={0.9} />
          </div>
        </div>
        <div className="pb-1.5">
          <div className="flex items-center h-7">
            <div className="w-5 shrink-0" />
            <div className="flex items-center justify-center opacity-60 shrink-0 size-3">
              <PageIcon />
            </div>
            <div className="grow ml-2 font-sans text-[#FFFFFFE6] text-xs/4">Page 1</div>
            <div className="flex items-center w-4 justify-center mr-3 shrink-0">
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
            </div>
          </div>
        </div>
      </div>

      <div className="h-2 shrink-0 -mb-0.75 -mt-0.75 relative">
        <div className="top-[50%] absolute border-b border-[#373737] inset-x-0" />
      </div>

      {/* layers */}
      <div className="flex basis-[0%] flex-col grow min-h-0">
        <div className="basis-[0%] grow min-h-0 py-1.5 overflow-y-auto overflow-x-clip [scrollbar-width:thin] [scrollbar-color:#444_transparent]">
          {tree.map((row, i) => {
            const selected = row.sel && app.selection.includes(row.sel)
            return (
              <div
                key={i}
                onClick={
                  row.sel
                    ? (e) =>
                        row.sel.startsWith('exp-') ? app.selectCard(row.sel, e.shiftKey) : app.selectNode(row.sel)
                    : undefined
                }
                className={`flex items-center h-7 min-w-full break-keep cursor-default ${
                  selected ? 'bg-[#333333]' : row.artboard ? '' : 'hover:bg-[#303030]'
                }`}
                style={{ paddingLeft: row.d * 16 }}
              >
                <div className="flex items-center h-full shrink-0 w-5 justify-center">
                  {row.chevron && <TreeChevron />}
                </div>
                <div
                  className={`flex items-center justify-center shrink-0 size-3 ${row.icon === 'grid' ? '' : 'opacity-60'}`}
                >
                  <LayerIcon kind={row.icon} />
                </div>
                <div className="ml-2 font-sans text-[#FFFFFFE6] text-xs/4 whitespace-nowrap">{row.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* footer */}
      <div className="flex py-2 px-3 gap-2 shrink-0">
        <div className="font-sans text-[#FFFFFFA6] text-xs/4">What’s new</div>
        <div className="font-sans text-[#FFFFFFA6] text-xs/4">•</div>
        <div className="font-sans text-[#FFFFFFA6] text-xs/4">Feedback</div>
      </div>
    </div>
  )
}
