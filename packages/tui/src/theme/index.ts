// Opencode-inspired minimal palette
export const colors = {
  bg:           "#0a0a0a",
  panel:        "#141414",
  element:      "#1e1e1e",

  text:         "#eeeeee",
  muted:        "#808080",
  subtle:       "#484848",
  focus:        "#606060",

  blue:         "#7aa2f7",
  green:        "#7fd88f",
  orange:       "#fab283",
  purple:       "#9d7cd8",
  cyan:         "#56b6c2",
  red:          "#f7768e",
  yellow:       "#e0af68",
} as const

// Single-char tool icons (2-char wide with trailing space)
export const toolIcon: Record<string, string> = {
  bash:    "$",
  read:    "→",
  write:   "←",
  edit:    "←",
  glob:    "✱",
  grep:    "✱",
  default: "·",
}

export const sym = {
  user:      "▌",   // left-border marker for user messages
  assistant: "◆",
  memory:    "◊",
  check:     "✓",
  cross:     "✗",
  running:   "~",
  prompt:    "❯",
  dot:       "·",
  bar:       "─",
} as const
