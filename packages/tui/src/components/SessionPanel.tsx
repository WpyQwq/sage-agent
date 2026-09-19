import React from "react"
import { Box, Text, useStdout } from "ink"
import { colors, symbols } from "../theme/index.js"
import type { Session } from "@sage/core"

interface Props {
  sessions: Session[]
  current: Session | null
  onSelect: (s: Session) => void
  onNew: () => void
}

export function SessionPanel({ sessions, current, onSelect, onNew }: Props) {
  const { stdout } = useStdout()

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={colors.border} width={28} paddingX={1}>
      <Box marginBottom={1}>
        <Text color={colors.purple} bold>◈ SAGE</Text>
        <Text color={colors.fgDim}> sessions</Text>
      </Box>

      {sessions.length === 0 && (
        <Text color={colors.fgDim} italic>  No sessions yet</Text>
      )}

      {sessions.slice(0, 20).map((s, i) => {
        const isCurrent = s.id === current?.id
        const title = s.title.length > 20 ? s.title.slice(0, 19) + symbols.ellipsis : s.title
        return (
          <Box key={s.id} marginBottom={0}>
            <Text
              color={isCurrent ? colors.blue : colors.fgDim}
              bold={isCurrent}
            >
              {isCurrent ? "▶ " : "  "}{title}
            </Text>
          </Box>
        )
      })}

      <Box marginTop={1} borderStyle="single" borderColor={colors.fgMuted}>
        <Text color={colors.fgDim}> n  new session</Text>
      </Box>
      <Box>
        <Text color={colors.fgDim}> ↑↓  navigate</Text>
      </Box>
    </Box>
  )
}
