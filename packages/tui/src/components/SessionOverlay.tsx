import React from "react"
import { Box, Text, useInput } from "ink"
import { colors, sym } from "../theme/index.js"
import type { Session } from "@sage/core"

interface Props {
  sessions: Session[]
  cursor: number
  onSelect: (s: Session) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClose: () => void
  setCursor: (n: number) => void
}

export function SessionOverlay({ sessions, cursor, onSelect, onNew, onDelete, onClose, setCursor }: Props) {
  useInput((input, key) => {
    if (key.escape || input === "q") { onClose(); return }
    if (key.upArrow)   { setCursor(Math.max(0, cursor - 1)); return }
    if (key.downArrow) { setCursor(Math.min(sessions.length - 1, cursor + 1)); return }
    if (key.return)    { const s = sessions[cursor]; if (s) { onSelect(s); onClose() } return }
    if (input === "n") { onNew(); onClose(); return }
    if (input === "d") {
      const s = sessions[cursor]
      if (s) { onDelete(s.id); setCursor(Math.max(0, cursor - 1)) }
      return
    }
  })

  return (
    <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
      <Box marginBottom={1}>
        <Text color={colors.muted}>sessions  </Text>
        <Text color={colors.subtle}>↑↓ navigate · enter select · n new · d delete · esc close</Text>
      </Box>

      {sessions.length === 0 && (
        <Text color={colors.subtle}>  no sessions yet — press n to start</Text>
      )}

      {sessions.map((s, i) => {
        const active = i === cursor
        const title = s.title.length > 60 ? s.title.slice(0, 59) + "…" : s.title
        return (
          <Box key={s.id}>
            <Text color={active ? colors.blue : colors.subtle}>
              {active ? `${sym.user} ` : "  "}
            </Text>
            <Text color={active ? colors.text : colors.muted}>{title}</Text>
            {active && (
              <Text color={colors.subtle}>
                {"  "}{new Date(s.updatedAt).toLocaleDateString()}
              </Text>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
