import React from "react"
import { Box, Text } from "ink"
import { colors, sym } from "../theme/index.js"
import type { RecalledMemory } from "@sage/memory"

interface Props {
  memories: RecalledMemory[]
}

export function MemoryBar({ memories }: Props) {
  if (memories.length === 0) return null
  const preview = memories[0]?.content.slice(0, 55) ?? ""
  const more = memories.length > 1 ? ` +${memories.length - 1}` : ""
  return (
    <Box paddingLeft={2} marginTop={1}>
      <Text color={colors.yellow}>{sym.memory} </Text>
      <Text color={colors.muted}>{preview}{more}</Text>
    </Box>
  )
}
