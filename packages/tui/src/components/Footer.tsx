import React from "react"
import { Box, Text } from "ink"
import { colors, sym } from "../theme/index.js"
import { basename } from "path"

interface Props {
  model: string
  provider: string
  cwd: string
  isStreaming: boolean
  usage: { input: number; output: number }
  memoryCount: number
  sessionTitle: string | null
}

export function Footer({ model, provider, cwd, isStreaming, usage, memoryCount, sessionTitle }: Props) {
  const dir = basename(cwd) || cwd
  const modelShort = model.replace(/claude-/, "").replace(/-\d{8}$/, "")

  return (
    <Box flexDirection="column">
      {/* divider */}
      <Box paddingLeft={2} paddingRight={2}>
        <Text color={colors.subtle}>
          {"─".repeat(60)}
        </Text>
      </Box>

      {/* status line */}
      <Box paddingLeft={2} paddingRight={2} justifyContent="space-between">
        <Box gap={2}>
          <Text color={colors.muted}>{provider}</Text>
          <Text color={colors.subtle}>{sym.dot}</Text>
          <Text color={colors.muted}>{modelShort}</Text>
          {isStreaming && <Text color={colors.orange}>{sym.dot} streaming</Text>}
        </Box>
        <Box gap={2}>
          {memoryCount > 0 && (
            <Text color={colors.yellow}>{sym.memory} {memoryCount}</Text>
          )}
          {usage.output > 0 && (
            <Text color={colors.subtle}>{usage.output}tok</Text>
          )}
          <Text color={colors.muted}>{dir}</Text>
        </Box>
      </Box>
    </Box>
  )
}
