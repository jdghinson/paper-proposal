/* Exact SVG icons extracted from the Paper design file. */

// white with opacity helpers (Paper exports use oklab; plain rgba is identical here)
const W = (pct) => `rgba(255,255,255,${pct})`

export const ChevronDown = ({ opacity = 0.65, style }) => (
  <svg width="8" height="6" viewBox="0 0 8 6" style={{ flexShrink: 0, ...style }}>
    <path d="M0.75 1.5L4 4.75L7.25 1.5" fill="none" stroke={W(opacity)} />
  </svg>
)

export const AngleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.534 8.274L4.497 11H7.995C8.122 9.874 7.532 8.787 6.534 8.274ZM7.139 7.464L9.864 3.816L9.063 3.218L3.099 11.201L2.502 12H3.5H13V11H9C9.119 9.557 8.382 8.176 7.139 7.464Z"
      fill={W(0.4)}
    />
  </svg>
)

export const RotateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path d="M9.5 2.5L6 4.5V3H4.5C3.119 3 2 4.119 2 5.5V8H1V5.5C1 3.567 2.567 2 4.5 2H6V0.5L9.5 2.5Z" fill={W(0.65)} />
    <rect x="5.5" y="6.5" width="7" height="7" rx="1" fill="none" stroke={W(0.65)} strokeLinejoin="round" />
  </svg>
)

export const FlipIcon = ({ rotate = 0 }) => (
  <svg
    width="14"
    height="16"
    viewBox="0 0 14 16"
    style={{ flexShrink: 0, rotate: `${rotate}deg`, transformOrigin: '50% 50%' }}
  >
    <path d="M1.5 12.5H5.5V3.5L1.5 12.5Z" fill="none" stroke={W(0.35)} strokeLinejoin="round" />
    <path d="M12.5 12.5H8.5V3.5L12.5 12.5Z" fill="none" stroke={W(0.35)} strokeLinejoin="round" />
  </svg>
)

// ⌘ glyph used inside the Add grid shortcut
export const CmdIcon = () => (
  <svg viewBox="0 0 12 12" width="12" height="12" style={{ flexShrink: 0 }}>
    <path
      transform="matrix(1 0 0 1 1 1)"
      d="M8.000 4.000C9.105 4.000 10.000 3.105 10.000 2.000C10.000 0.895 9.105 0.000 8.000 0.000C6.895 0.000 6.000 0.895 6.000 2.000C6.000 2.000 6.000 3.000 6.000 3.000C6.000 3.000 4.000 3.000 4.000 3.000C4.000 3.000 4.000 2.000 4.000 2.000C4.000 0.895 3.105 0.000 2.000 0.000C0.895 0.000 0.000 0.895 0.000 2.000C0.000 3.105 0.895 4.000 2.000 4.000C2.000 4.000 3.000 4.000 3.000 4.000C3.000 4.000 3.000 6.000 3.000 6.000C3.000 6.000 2.000 6.000 2.000 6.000C0.895 6.000 0.000 6.895 0.000 8.000C0.000 9.105 0.895 10.000 2.000 10.000C3.105 10.000 4.000 9.105 4.000 8.000C4.000 8.000 4.000 7.000 4.000 7.000C4.000 7.000 6.000 7.000 6.000 7.000C6.000 7.000 6.000 8.000 6.000 8.000C6.000 9.105 6.895 10.000 8.000 10.000C9.105 10.000 10.000 9.105 10.000 8.000C10.000 6.895 9.105 6.000 8.000 6.000C8.000 6.000 7.000 6.000 7.000 6.000C7.000 6.000 7.000 4.000 7.000 4.000C7.000 4.000 8.000 4.000 8.000 4.000ZM7.000 2.000C7.000 1.450 7.450 1.000 8.000 1.000C8.550 1.000 9.000 1.450 9.000 2.000C9.000 2.550 8.550 3.000 8.000 3.000C8.000 3.000 7.000 3.000 7.000 3.000C7.000 3.000 7.000 2.000 7.000 2.000ZM3.000 8.000C3.000 8.550 2.550 9.000 2.000 9.000C1.450 9.000 1.000 8.550 1.000 8.000C1.000 7.450 1.450 7.000 2.000 7.000C2.000 7.000 3.000 7.000 3.000 7.000C3.000 7.000 3.000 8.000 3.000 8.000ZM3.000 3.000C3.000 3.000 2.000 3.000 2.000 3.000C1.450 3.000 1.000 2.550 1.000 2.000C1.000 1.450 1.450 1.000 2.000 1.000C2.550 1.000 3.000 1.450 3.000 2.000C3.000 2.000 3.000 3.000 3.000 3.000ZM6.000 6.000C6.000 6.000 4.000 6.000 4.000 6.000C4.000 6.000 4.000 4.000 4.000 4.000C4.000 4.000 6.000 4.000 6.000 4.000C6.000 4.000 6.000 6.000 6.000 6.000ZM8.000 7.000C8.550 7.000 9.000 7.450 9.000 8.000C9.000 8.550 8.550 9.000 8.000 9.000C7.450 9.000 7.000 8.550 7.000 8.000C7.000 8.000 7.000 7.000 7.000 7.000C7.000 7.000 8.000 7.000 8.000 7.000Z"
      fillRule="nonzero"
      fill="#B0B0B0"
    />
  </svg>
)

// Layout header collapse (four arrows pointing in)
export const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path d="M5 4.363V2H6V6H2V5H4.363L1.481 2.118L2.118 1.481L5 4.363Z" fill={W(0.9)} />
    <path d="M5 11.637V14H6V10H2V11H4.363L1.481 13.882L2.118 14.519L5 11.637Z" fill={W(0.9)} />
    <path d="M11 4.363V2H10V6H14V5H11.637L14.519 2.118L13.882 1.481L11 4.363Z" fill={W(0.9)} />
    <path d="M11 11.637V14H10V10H14V11H11.637L14.519 13.882L13.882 14.519L11 11.637Z" fill={W(0.9)} />
  </svg>
)

// Section minus (collapse section)
export const MinusIcon = ({ opacity = 0.9 }) => (
  <svg width="10" height="2" viewBox="0 0 10 2" style={{ flexShrink: 0 }}>
    <path d="M10 1H5H0" vectorEffect="non-scaling-stroke" fill="none" stroke={W(opacity)} />
  </svg>
)

// Section plus
export const PlusIcon = ({ opacity = 0.5 }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
    <path d="M5 0V5M5 5V10M5 5H10M5 5H0" vectorEffect="non-scaling-stroke" fill="none" stroke={W(opacity)} />
  </svg>
)

// Columns count icon (13x12); rows = same rotated 90°
export const ColumnsIcon = ({ rotate = 0 }) => (
  <svg
    width="13"
    height="12"
    viewBox="0 0 13 12"
    style={{ flexShrink: 0, rotate: `${rotate}deg`, transformOrigin: '50% 50%' }}
  >
    <rect x="4.5" y="1.5" width="5" height="9" rx="0.5" fill="none" stroke={W(0.4)} />
    <line x1="2" y1="0" x2="2" y2="12" stroke={W(0.4)} />
    <line x1="12" y1="0" x2="12" y2="12" stroke={W(0.4)} />
  </svg>
)

// Gap icon (13x12, rotated for column/row gap)
export const GapIcon = ({ rotate = 0 }) => (
  <svg
    width="13"
    height="12"
    viewBox="0 0 13 12"
    style={{ flexShrink: 0, rotate: `${rotate}deg`, transformOrigin: '50% 50%' }}
  >
    <rect x="0.5" y="1.5" width="3" height="9" rx="0.5" fill="none" stroke={W(0.4)} />
    <rect x="9.5" y="1.5" width="3" height="9" rx="0.5" fill="none" stroke={W(0.4)} />
    <line x1="6.5" y1="0" x2="6.5" y2="12" stroke={W(0.4)} />
  </svg>
)

// Grid settings icon (2x2 rounded squares)
export const GridSettingsIcon = () => (
  <svg viewBox="0 0 12 12" width="12" height="12" style={{ flexShrink: 0, overflow: 'visible' }}>
    <path
      transform="translate(1.31 1.31)"
      d="M0.281-0.187C0.281-0.187 3.469-0.187 3.469-0.187 3.728-0.187 3.938 0.023 3.938 0.282 3.938 0.282 3.938 3.47 3.938 3.47 3.938 3.728 3.728 3.938 3.469 3.938 3.469 3.938 0.281 3.938 0.281 3.938 0.022 3.938-0.188 3.728-0.188 3.47-0.188 3.47-0.188 0.282-0.188 0.282-0.188 0.023 0.022-0.187 0.281-0.187Z"
      vectorEffect="non-scaling-stroke" fill="none" stroke="#ECECEC" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      transform="translate(7.87 1.31)"
      d="M-0.656-0.187C-0.656-0.187 2.532-0.187 2.532-0.187 2.79-0.187 3 0.023 3 0.282 3 0.282 3 3.47 3 3.47 3 3.728 2.79 3.938 2.532 3.938 2.532 3.938-0.656 3.938-0.656 3.938-0.915 3.938-1.125 3.728-1.125 3.47-1.125 3.47-1.125 0.282-1.125 0.282-1.125 0.023-0.915-0.187-0.656-0.187Z"
      vectorEffect="non-scaling-stroke" fill="none" stroke="#ECECEC" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      transform="translate(1.31 7.87)"
      d="M0.281-1.124C0.281-1.124 3.469-1.124 3.469-1.124 3.728-1.124 3.938-0.914 3.938-0.655 3.938-0.655 3.938 2.532 3.938 2.532 3.938 2.791 3.728 3.001 3.469 3.001 3.469 3.001 0.281 3.001 0.281 3.001 0.022 3.001-0.188 2.791-0.188 2.532-0.188 2.532-0.188-0.655-0.188-0.655-0.188-0.914 0.022-1.124 0.281-1.124Z"
      vectorEffect="non-scaling-stroke" fill="none" stroke="#ECECEC" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      transform="translate(7.87 7.87)"
      d="M-0.656-1.124C-0.656-1.124 2.532-1.124 2.532-1.124 2.79-1.124 3-0.914 3-0.655 3-0.655 3 2.532 3 2.532 3 2.791 2.79 3.001 2.532 3.001 2.532 3.001-0.656 3.001-0.656 3.001-0.915 3.001-1.125 2.791-1.125 2.532-1.125 2.532-1.125-0.655-1.125-0.655-1.125-0.914-0.915-1.124-0.656-1.124Z"
      vectorEffect="non-scaling-stroke" fill="none" stroke="#ECECEC" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
)

// Reset item position to stretch (four outward diagonal arrows, 16x16)
export const StretchResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path d="M2.981 3.618V5.981H1.981V1.981H5.981V2.981H3.618L6.5 5.863L5.863 6.5L2.981 3.618Z" fill={W(0.9)} />
    <path d="M2.981 12.382V10.019H1.981V14.019H5.981V13.019H3.618L6.5 10.137L5.863 9.5L2.981 12.382Z" fill={W(0.9)} />
    <path d="M13.019 3.618V5.981H14.019V1.981H10.019V2.981H12.382L9.5 5.863L10.137 6.5L13.019 3.618Z" fill={W(0.9)} />
    <path d="M13.019 12.382V10.019H14.019V14.019H10.019V13.019H12.382L9.5 10.137L10.137 9.5L13.019 12.382Z" fill={W(0.9)} />
  </svg>
)

// Position settings sliders (12x12)
export const SlidersIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
    <path d="M3 9.5H2V12H3V9.5Z" fill={W(0.9)} />
    <path d="M10 6.5H9V12H10V6.5Z" fill={W(0.9)} />
    <path d="M10 0H9V2.5H10V0Z" fill={W(0.9)} />
    <path d="M3 0H2V5.5H3V0Z" fill={W(0.9)} />
    <path d="M2.5 9.5C3.604 9.5 4.5 8.605 4.5 7.5C4.5 6.396 3.604 5.5 2.5 5.5C1.395 5.5 0.5 6.396 0.5 7.5C0.5 8.605 1.395 9.5 2.5 9.5Z" fill="none" stroke={W(0.9)} />
    <path d="M9.5 6.5C10.604 6.5 11.499 5.605 11.499 4.5C11.499 3.396 10.604 2.5 9.5 2.5C8.395 2.5 7.5 3.396 7.5 4.5C7.5 5.605 8.395 6.5 9.5 6.5Z" fill="none" stroke={W(0.9)} />
  </svg>
)

// Padding icons — rounded rect with side lines
// lines: array of [x1,y1,x2,y2]
const PadBase = ({ lines }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
    <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" fill="none" stroke={W(0.4)} />
    {lines.map((l, i) => (
      <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke={W(0.4)} />
    ))}
  </svg>
)
export const PadXIcon = () => <PadBase lines={[[3.5, 3, 3.5, 9], [8.5, 3, 8.5, 9]]} />
export const PadYIcon = () => <PadBase lines={[[3, 3.5, 9, 3.5], [3, 8.5, 9, 8.5]]} />
export const PadLeftIcon = () => <PadBase lines={[[3.5, 3, 3.5, 9]]} />
export const PadRightIcon = () => <PadBase lines={[[8.5, 3, 8.5, 9]]} />
export const PadTopIcon = () => <PadBase lines={[[3, 3.5, 9, 3.5]]} />
export const PadBottomIcon = () => <PadBase lines={[[3, 8.5, 9, 8.5]]} />

// Individual padding toggle (rect in rect)
export const PadToggleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
    <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" fill="none" stroke={W(0.9)} />
    <rect x="3.5" y="3.5" width="5" height="5" fill="none" stroke={W(0.9)} />
  </svg>
)

// Individual padding active icon (edge ticks + center square, 16x16)
export const PadToggleActiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <rect x="4" y="1" width="8" height="1" fill={W(0.9)} />
    <rect x="4" y="14" width="8" height="1" fill={W(0.9)} />
    <rect x="1" y="4" width="1" height="8" fill={W(0.9)} />
    <rect x="14" y="4" width="1" height="8" fill={W(0.9)} />
    <rect x="5.5" y="5.5" width="5" height="5" fill="none" stroke={W(0.9)} />
  </svg>
)

// Flex direction arrow (9x9)
export const FlexArrow = ({ rotate = 0, opacity = 0.575 }) => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 9 9"
    style={{ flexShrink: 0, rotate: `${rotate}deg`, transformOrigin: '50% 50%' }}
  >
    <path
      d="M0.5 4.5H8.4M8.4 4.5L5.3 1.169M8.4 4.5L5.3 7.83"
      fill="none"
      stroke={W(opacity)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Menu check (10x10, thick)
export const CheckIcon = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
    <path
      d="M1.75 5.75L4.516 8.25L8.75 1.75"
      fill="none"
      stroke={W(0.9)}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Checkbox check (slightly thinner)
export const CheckboxCheck = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: 'translate(-0.25px, 0)' }}>
    <path
      d="M1.75 5.75L4.516 8.25L8.75 1.75"
      fill="none"
      stroke={W(0.9)}
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Overlay close ×
export const CloseIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
    <path
      d="M0.465 0.464L4.001 4M4.001 4L7.536 7.535M4.001 4L7.536 0.464M4.001 4L0.465 7.535"
      vectorEffect="non-scaling-stroke"
      fill="none"
      stroke={W(0.65)}
      strokeLinecap="round"
    />
  </svg>
)

// Eye (Blending / Fill header)
export const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path
      d="M8.503 3.99C13.464 3.99 15.033 7.958 15.05 8C15.05 8 13.51 12 8.503 12C3.496 12 1.955 8 1.955 8C1.968 7.967 3.536 3.99 8.503 3.99ZM8.5 5.498C7.118 5.498 5.998 6.618 5.998 8C5.998 9.382 7.118 10.502 8.5 10.502C9.882 10.502 11.002 9.382 11.002 8C11.002 6.618 9.882 5.498 8.5 5.498Z"
      fill={W(0.9)}
    />
  </svg>
)

// Opacity checkerboard (12x12)
export const OpacityIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
    {[[1, 1], [1, 5], [1, 9], [3, 3], [3, 7], [5, 1], [5, 5], [5, 9], [9, 1], [9, 5], [9, 9], [7, 3], [7, 7]].map(
      ([x, y], i) => (
        <rect key={i} x={x} y={y} width="2" height="2" fill={W(0.24)} />
      ),
    )}
  </svg>
)

// Blend mode droplet (12x12)
export const DropletIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
    <path
      d="M9.375 7.25C9.375 9.114 7.864 10.625 6 10.625C4.136 10.625 2.625 9.114 2.625 7.25C2.625 5.386 6 1.813 6 1.813C6 1.813 9.375 5.386 9.375 7.25Z"
      fill="none"
      stroke={W(0.4)}
    />
  </svg>
)

// Radius corners glyph (2x2 grid of corner strokes) — built in JSX, not SVG
export const RadiusGlyph = () => (
  <div className="grid grid-cols-2 gap-0.5">
    <div className="h-1.25 w-1.25 rounded-tl-xs border-t border-l border-[#FFFFFFE6]" />
    <div className="h-1.25 w-1.25 rounded-tr-xs border-t border-r border-[#FFFFFFE6]" />
    <div className="h-1.25 w-1.25 rounded-bl-xs border-l border-b border-[#FFFFFFE6]" />
    <div className="h-1.25 w-1.25 rounded-br-xs border-b border-r border-[#FFFFFFE6]" />
  </div>
)

// Selection colors target (14x14)
export const TargetIcon = () => (
  <svg viewBox="0 0 14 14" width="14" height="14" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="5.75" fill="none" stroke={W(0.552)} />
    <circle cx="7" cy="7" r="1.75" fill="none" stroke={W(0.552)} />
  </svg>
)

/* ---------- Sidebar icons ---------- */

export const PaperLogo = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" style={{ flexShrink: 0 }}>
    <path d="M2 0V2H8V8H2V2H0V13H8V8H13V0H2Z" fill={W(0.5)} />
  </svg>
)

export const PanelToggleIcon = () => (
  <svg width="14" height="11" viewBox="0 0 14 11" style={{ flexShrink: 0 }}>
    <path
      d="M13 0C13.552 0 14 0.448 14 1V10L13.995 10.102C13.947 10.573 13.573 10.947 13.102 10.995L13 11H1L0.897 10.995C0.427 10.947 0.053 10.573 0.005 10.102L0 10L0 1C1.289e-07 0.448 0.448 1.611e-08 1 0H13ZM1 10H4V1H1V10ZM13 10V1H5V10H13Z"
      fill={W(0.5)}
    />
  </svg>
)

export const TreeChevron = ({ open = true }) => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 8 8"
    style={{ flexShrink: 0, rotate: open ? '0deg' : '-90deg' }}
  >
    <path d="M1 2.5L4 5.5L7 2.5" fill="none" stroke={W(0.65)} />
  </svg>
)

export const PageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path d="M12.5 5.5L9.5 2.5H4.5C3.948 2.5 3.5 2.948 3.5 3.5V12.5C3.5 13.052 3.948 13.5 4.5 13.5H11.5C12.052 13.5 12.5 13.052 12.5 12.5V5.5Z" fill={W(0.09)} />
    <path
      d="M12.5 5.5L9.5 2.5M12.5 5.5V12.5C12.5 13.052 12.052 13.5 11.5 13.5H4.5C3.948 13.5 3.5 13.052 3.5 12.5V3.5C3.5 2.948 3.948 2.5 4.5 2.5H9.5M12.5 5.5H9.5V2.5"
      fill="none"
      stroke={W(0.9)}
      strokeLinecap="round"
    />
  </svg>
)

// Artboard layer icon (two stacked slots)
export const ArtboardLayerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <rect x="2" y="2.5" width="12" height="4.5" rx="1" fill={W(0.09)} />
    <rect x="2.5" y="3" width="11" height="3.5" rx="0.5" fill="none" stroke={W(0.9)} />
    <rect x="2" y="8.5" width="12" height="4.5" rx="1" fill={W(0.09)} />
    <rect x="2.5" y="9" width="11" height="3.5" rx="0.5" fill="none" stroke={W(0.9)} />
  </svg>
)

// Generic frame layer icon
export const FrameLayerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path d="M5.5 2V14M10.5 2V14M2 5.5H14M2 10.5H14" stroke={W(0.9)} fill="none" />
  </svg>
)

// Grid layer icon — 2x2 filled rounded squares (self-colored, no dimming)
export const GridLayerIcon = () => (
  <svg viewBox="0 0 12 12" width="12" height="12" style={{ flexShrink: 0, overflow: 'visible' }}>
    <path
      transform="translate(1.31 1.31)"
      d="M0.281-0.187C0.281-0.187 3.469-0.187 3.469-0.187 3.728-0.187 3.938 0.023 3.938 0.282 3.938 0.282 3.938 3.47 3.938 3.47 3.938 3.728 3.728 3.938 3.469 3.938 3.469 3.938 0.281 3.938 0.281 3.938 0.022 3.938-0.188 3.728-0.188 3.47-0.188 3.47-0.188 0.282-0.188 0.282-0.188 0.023 0.022-0.187 0.281-0.187Z"
      vectorEffect="non-scaling-stroke" fill="#363636" stroke="#A5A5A5" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      transform="translate(7.87 1.31)"
      d="M-0.656-0.187C-0.656-0.187 2.532-0.187 2.532-0.187 2.79-0.187 3 0.023 3 0.282 3 0.282 3 3.47 3 3.47 3 3.728 2.79 3.938 2.532 3.938 2.532 3.938-0.656 3.938-0.656 3.938-0.915 3.938-1.125 3.728-1.125 3.47-1.125 3.47-1.125 0.282-1.125 0.282-1.125 0.023-0.915-0.187-0.656-0.187Z"
      vectorEffect="non-scaling-stroke" fill="#363636" stroke="#A5A5A5" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      transform="translate(1.31 7.87)"
      d="M0.281-1.124C0.281-1.124 3.469-1.124 3.469-1.124 3.728-1.124 3.938-0.914 3.938-0.655 3.938-0.655 3.938 2.532 3.938 2.532 3.938 2.791 3.728 3.001 3.469 3.001 3.469 3.001 0.281 3.001 0.281 3.001 0.022 3.001-0.188 2.791-0.188 2.532-0.188 2.532-0.188-0.655-0.188-0.655-0.188-0.914 0.022-1.124 0.281-1.124Z"
      vectorEffect="non-scaling-stroke" fill="#363636" stroke="#A5A5A5" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      transform="translate(7.87 7.87)"
      d="M-0.656-1.124C-0.656-1.124 2.532-1.124 2.532-1.124 2.79-1.124 3-0.914 3-0.655 3-0.655 3 2.532 3 2.532 3 2.791 2.79 3.001 2.532 3.001 2.532 3.001-0.656 3.001-0.656 3.001-0.915 3.001-1.125 2.791-1.125 2.532-1.125 2.532-1.125-0.655-1.125-0.655-1.125-0.914-0.915-1.124-0.656-1.124Z"
      vectorEffect="non-scaling-stroke" fill="#363636" stroke="#A5A5A5" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
)

// Frame vertical-stack layer icon — two stacked horizontal slots
export const VStackLayerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <rect x="2" y="2.5" width="12" height="4.5" rx="1" fill={W(0.09)} />
    <rect x="2.5" y="3" width="11" height="3.5" rx="0.5" fill="none" stroke={W(0.9)} />
    <rect x="2" y="8.5" width="12" height="4.5" rx="1" fill={W(0.09)} />
    <rect x="2.5" y="9" width="11" height="3.5" rx="0.5" fill="none" stroke={W(0.9)} />
  </svg>
)

// Frame horizontal-stack layer icon — two side-by-side vertical slots
export const HStackLayerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <rect x="2" y="3" width="5" height="10.5" rx="1" fill={W(0.09)} />
    <rect x="2.5" y="3.5" width="4" height="9.5" rx="0.5" fill="none" stroke={W(0.9)} />
    <rect x="8.5" y="3" width="5" height="10.5" rx="1" fill={W(0.09)} />
    <rect x="9" y="3.5" width="4" height="9.5" rx="0.5" fill="none" stroke={W(0.9)} />
  </svg>
)

// Text layer icon
export const TextLayerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path d="M3.5 5V3.5H12.5V5M8 3.5V12.5M6.5 12.5H9.5" stroke={W(0.9)} fill="none" strokeLinecap="round" />
  </svg>
)

// SVG/vector layer icon
export const VectorLayerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path d="M2.5 13.5C6 13.5 7 8 13.5 8" fill="none" stroke={W(0.9)} />
    <rect x="1" y="12" width="3" height="3" rx="0.5" fill="#2A2A2A" stroke={W(0.9)} />
    <rect x="12" y="6.5" width="3" height="3" rx="0.5" fill="#2A2A2A" stroke={W(0.9)} />
  </svg>
)

// Rectangle/shape layer icon
export const ShapeLayerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="5.5" fill="none" stroke={W(0.9)} />
  </svg>
)

/* ---------- Toolbar icons (exact) ---------- */

export const ToolCursor = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0, position: 'relative' }}>
    <path
      d="M6.5 20.263V3.741C6.5 3.652 6.608 3.608 6.671 3.671L18.329 15.329C18.392 15.392 18.348 15.5 18.259 15.5H11.829C11.698 15.5 11.573 15.551 11.479 15.642L6.67 20.334C6.606 20.396 6.5 20.351 6.5 20.263Z"
      fill="none"
      stroke={W(0.9)}
      strokeLinejoin="round"
    />
  </svg>
)

export const ToolHand = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      d="M12 2C12.873 2 13.613 2.56 13.886 3.339C14.204 3.125 14.588 3 15 3C16.104 3 17 3.896 17 5V5.27C17.294 5.099 17.636 5 18 5C19.104 5 20 5.896 20 7V9.714C20 11.314 19.804 12.908 19.416 14.46L18.655 17.503C18.552 17.915 18.5 18.337 18.5 18.762C18.5 19.998 17.498 21 16.262 21H8.851C7.829 21 7 20.171 7 19.149C7 18.646 6.883 18.149 6.659 17.7L6.557 17.511L4.854 14.592C3.91 12.973 4.109 10.931 5.348 9.524L5.951 8.839L7 7.627V5C7 3.895 7.895 3 9 3C9.412 3 9.795 3.125 10.113 3.339C10.386 2.559 11.127 2 12 2ZM12 3C11.448 3 11 3.448 11 4V10.5L10.99 10.601C10.944 10.829 10.742 11 10.5 11L10.399 10.99C10.204 10.95 10.05 10.796 10.01 10.601L10 10.5V5C10 4.482 9.607 4.056 9.103 4.005L9 4C8.448 4 8 4.448 8 5V12C8 12.276 7.776 12.5 7.5 12.5C7.224 12.5 7 12.276 7 12V9.155L6.702 9.5L6.098 10.185L5.929 10.395C5.129 11.464 5.036 12.919 5.718 14.088L7.421 17.007C7.8 17.657 8 18.397 8 19.149C8 19.59 8.335 19.953 8.764 19.996L8.851 20H16.262C16.903 20 17.43 19.513 17.493 18.889L17.5 18.762C17.5 18.382 17.535 18.004 17.605 17.631L17.685 17.261L18.445 14.218C18.767 12.929 18.951 11.61 18.991 10.283L19 9.714V7C19 6.482 18.607 6.056 18.102 6.005L18 6C17.448 6 17 6.448 17 7V10.5L16.99 10.601C16.944 10.829 16.742 11 16.5 11L16.399 10.99C16.204 10.95 16.05 10.796 16.01 10.601L16 10.5V5C16 4.482 15.607 4.056 15.102 4.005L15 4C14.448 4 14 4.448 14 5V10.5L13.99 10.601C13.944 10.829 13.742 11 13.5 11L13.399 10.99C13.204 10.95 13.05 10.796 13.01 10.601L13 10.5V4C13 3.482 12.607 3.056 12.102 3.005L12 3Z"
      fill={W(0.72)}
    />
  </svg>
)

export const ToolFrame = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M4 10V4H10V5H5V10H4ZM20 10V4H14V5H19V10H20ZM20 14H19V19H14V20H20V14ZM10 20V19H5V14H4V20H10Z" fill={W(0.72)} />
  </svg>
)

export const ToolRect = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <rect x="0.5" y="0.5" width="15" height="15" fill="none" stroke={W(0.72)} />
  </svg>
)

export const ToolPen = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      d="M4.337 2.237C4.337 1.467 5.171 0.986 5.837 1.37L16.578 7.572C17.66 8.197 18.328 9.352 18.328 10.603V15.654L19.285 17.31L19.529 17.734C19.805 18.212 19.642 18.824 19.164 19.1L13.047 22.631C12.569 22.907 11.957 22.743 11.681 22.265L10.462 20.154L6.103 17.668C5.011 17.046 4.338 15.885 4.337 14.628V2.237ZM12.04 20.888L12.547 21.765L18.664 18.234L18.419 17.81L18.157 17.356L12.04 20.888ZM10.464 10.113C10.737 10.011 11.031 9.952 11.339 9.952C12.72 9.953 13.839 11.072 13.839 12.452C13.839 13.833 12.72 14.952 11.339 14.952C9.959 14.952 8.839 13.833 8.839 12.452C8.839 11.74 9.138 11.099 9.616 10.644L5.337 3.233V14.628C5.338 15.526 5.819 16.354 6.599 16.799L10.959 19.285C11.112 19.373 11.24 19.501 11.329 19.654L11.54 20.022L17.657 16.489L17.462 16.154C17.375 16.002 17.328 15.829 17.328 15.654V10.603C17.328 9.71 16.851 8.884 16.078 8.438L6.205 2.738L10.464 10.113ZM11.339 10.952C10.511 10.952 9.84 11.624 9.839 12.452L9.847 12.606C9.919 13.312 10.48 13.873 11.186 13.945L11.339 13.952C12.116 13.952 12.755 13.362 12.832 12.606L12.839 12.452C12.839 11.676 12.249 11.037 11.493 10.96L11.339 10.952Z"
      fill={W(0.72)}
    />
  </svg>
)

export const ToolText = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ flexShrink: 0 }}>
    <path
      d="M1.363 13.107C1.012 13.107 0.783 12.905 0.783 12.571C0.783 12.43 0.81 12.29 0.862 12.14L4.642 1.611C4.817 1.145 5.055 0.917 5.494 0.917C5.925 0.917 6.171 1.145 6.347 1.611L10.117 12.14C10.17 12.29 10.205 12.43 10.205 12.571C10.205 12.896 9.968 13.107 9.616 13.107C9.282 13.107 9.089 12.949 8.948 12.536L7.815 9.214H3.165L2.031 12.536C1.899 12.949 1.697 13.107 1.363 13.107ZM3.517 8.203H7.463L5.521 2.516H5.468L3.517 8.203ZM17.241 11.699C16.731 12.613 15.711 13.158 14.507 13.158C12.714 13.158 11.51 12.024 11.51 10.354C11.51 8.693 12.706 7.674 14.701 7.674H17.258V6.663C17.258 5.389 16.494 4.721 15.079 4.721C14.217 4.721 13.611 5.046 13.075 5.758C12.89 5.995 12.723 6.065 12.486 6.065C12.196 6.065 12.002 5.872 12.002 5.564C12.002 5.081 12.389 4.554 13.066 4.149C13.593 3.833 14.27 3.657 15.149 3.657C17.285 3.657 18.471 4.712 18.471 6.628V12.402C18.471 12.824 18.251 13.079 17.882 13.079C17.513 13.079 17.293 12.824 17.293 12.402V11.699H17.241ZM12.767 10.328C12.767 11.383 13.576 12.095 14.797 12.095C16.195 12.095 17.258 11.128 17.258 9.862V8.729H14.727C13.47 8.729 12.767 9.3 12.767 10.328Z"
      fill={W(0.72)}
    />
  </svg>
)

export const ToolImage = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
    <path
      d="M11.5 3C11.776 3 12 3.224 12 3.5C12 3.776 11.776 4 11.5 4H3.5C3.224 4 3 4.224 3 4.5V12.793L6.646 9.146L6.725 9.082C6.919 8.954 7.183 8.976 7.354 9.146L11 12.793L13.646 10.146L13.725 10.082C13.919 9.954 14.183 9.976 14.354 10.146L17 12.793V9.917C17 9.641 17.224 9.417 17.5 9.417C17.776 9.417 18 9.641 18 9.917V15.5C18 16.328 17.328 17 16.5 17H8.039C8.01 17.003 7.982 17.003 7.953 17H3.5C2.672 17 2 16.328 2 15.5V4.5C2 3.672 2.672 3 3.5 3H11.5ZM3 14.207V15.5C3 15.776 3.224 16 3.5 16H7.793L10.293 13.5L7 10.207L3 14.207ZM9.207 16H16.5C16.776 16 17 15.776 17 15.5V14.207L14 11.207L9.207 16ZM16.5 1C16.776 1 17 1.224 17 1.5C17 2.881 18.119 4 19.5 4C19.776 4 20 4.224 20 4.5C20 4.776 19.776 5 19.5 5C18.119 5 17 6.119 17 7.5C17 7.776 16.776 8 16.5 8C16.224 8 16 7.776 16 7.5C16 6.119 14.881 5 13.5 5C13.224 5 13 4.776 13 4.5C13 4.224 13.224 4 13.5 4C14.881 4 16 2.881 16 1.5C16 1.224 16.224 1 16.5 1ZM16.5 3.302C16.205 3.793 15.793 4.205 15.302 4.5C15.792 4.795 16.205 5.207 16.5 5.697C16.795 5.207 17.207 4.795 17.697 4.5C17.207 4.205 16.795 3.792 16.5 3.302Z"
      fill={W(0.72)}
    />
  </svg>
)

export const ToolArtboard = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
    <path
      d="M4 2C4.552 2 5 2.448 5 3H11C11.276 3 11.5 3.224 11.5 3.5C11.5 3.776 11.276 4 11 4H5L4.995 4.096C4.95 4.569 4.575 4.947 4.103 4.995L4 5V15C4.552 15 5 15.448 5 16H15C15 15.448 15.448 15 16 15V9C16 8.724 16.224 8.5 16.5 8.5C16.776 8.5 17 8.724 17 9V15C17.552 15 18 15.448 18 16V17C18 17.518 17.607 17.944 17.102 17.995L17 18H16L15.898 17.995C15.427 17.947 15.053 17.573 15.005 17.102L15 17H5C5 17.518 4.607 17.944 4.103 17.995L4 18H3L2.897 17.995C2.427 17.947 2.053 17.573 2.005 17.102L2 17V16C2 15.448 2.448 15 3 15V5L2.897 4.995C2.427 4.947 2.053 4.573 2.005 4.103L2 4V3C2 2.448 2.448 2 3 2H4ZM3 17H4V16H3V17ZM16 17H17V16H16V17ZM3 4H4V3H3V4ZM16.5 0C16.776 0 17 0.224 17 0.5C17 1.881 18.119 3 19.5 3C19.776 3 20 3.224 20 3.5C20 3.776 19.776 4 19.5 4C18.119 4 17 5.119 17 6.5C17 6.776 16.776 7 16.5 7C16.224 7 16 6.776 16 6.5C16 5.119 14.881 4 13.5 4C13.224 4 13 3.776 13 3.5C13 3.224 13.224 3 13.5 3C14.881 3 16 1.881 16 0.5C16 0.224 16.224 0 16.5 0ZM16.5 2.302C16.205 2.793 15.793 3.205 15.302 3.5C15.792 3.795 16.205 4.207 16.5 4.697C16.795 4.207 17.207 3.795 17.697 3.5C17.207 3.205 16.795 2.792 16.5 2.302Z"
      fill={W(0.72)}
    />
  </svg>
)

export const ToolComponent = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path
      d="M16 16H0V0H16V16ZM1 15H15V1H1V15ZM12.75 8L8 12.75L3.25 8L8 3.25L12.75 8ZM4.664 8L8 11.336L11.336 8L8 4.664L4.664 8Z"
      fill={W(0.72)}
    />
  </svg>
)
