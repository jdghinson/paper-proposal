import {
  ToolCursor,
  ToolHand,
  ToolFrame,
  ToolRect,
  ToolPen,
  ToolText,
  ToolImage,
  ToolArtboard,
  ToolComponent,
} from '../icons.jsx'

const TOOLS = [
  { icon: <ToolCursor />, active: true },
  { icon: <ToolHand /> },
  { icon: <ToolFrame /> },
  { icon: <ToolRect /> },
  { icon: <ToolPen /> },
  { icon: <ToolText /> },
  { icon: <ToolImage /> },
  { icon: <ToolArtboard /> },
  { icon: <ToolComponent /> },
]

export default function Toolbar() {
  return (
    <div className="flex flex-col justify-between w-10.5 py-0.5 shrink-0 bg-[#2A2A2A] border-x border-[#373737]">
      <div className="flex flex-col">
        {TOOLS.map((tool, i) => (
          <div key={i} className="flex items-center shrink-0 isolate justify-center w-10 h-9 p-0.5 relative">
            {tool.active && (
              <div className="absolute rounded-[7.5px] [box-shadow:#FFFFFF08_0px_1px_0px_inset,#FFFFFF11_0px_0px_1px_0.5px_inset,#00000022_0px_1px_0.5px,#000000BB_0px_0px_3px_-1px] bg-[#444444] size-8 inset-y-0.5 inset-x-1" />
            )}
            <span className="relative">{tool.icon}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
