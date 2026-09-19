import React from "react"
import { Box, Text } from "ink"
import { colors, symbols } from "../theme/index.js"

interface Props {
  model: string
  provider: string
  cwd: string
  isStreaming: boolean
  usage: { input: number; output: number }
  memoryCount: number
}

export function StatusBar({ model, provider, cwd, isStreaming, usage, memoryCount }: Props) {
  const cwdShort = cwd.replace(/^.*[/\\]/, "")

  return (
    <Box paddingX={1} justifyContent="space-between" borderStyle="single" borderColor={colors.fgMuted}>
      <Box gap={2}>
        <Text color={colors.purple}>◈ sage</Text>
        <Text color={colors.blue}>{provider}</Text>
        <Text color={colors.cyan}>{model}</Text>
        {isStreaming && <Text color={colors.yellow}>● streaming</Text>}
      </Box>
      <Box gap={2}>
        {memoryCount > 0 && (
          <Text color={colors.orange}>{symbols.memory}{memoryCount}</Text>
        )}
        {(usage.input > 0 || usage.output > 0) && (
          <Text color={colors.fgDim}>↑{usage.input} ↓{usage.output}</Text>
        )}
        <Text color={colors.fgDim}>{cwdShort}</Text>
      </Box>
    </Box>
  )
}
