import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import { colors, sym } from "../theme/index.js"
import { listMemories, deleteMemory, type Memory } from "@sage/memory"

interface Props { onClose: () => void }

export function MemoryPanel({ onClose }: Props) {
  const [mems, setMems] = useState<Memory[]>([])
  const [cursor, setCursor] = useState(0)

  useEffect(() => { listMemories().then(setMems) }, [])

  useInput((input, key) => {
    if (key.escape || input === "q") { onClose(); return }
    if (key.upArrow)   { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow) { setCursor(c => Math.min(mems.length - 1, c + 1)); return }
    if (input === "d" && mems[cursor]) {
      deleteMemory(mems[cursor].id).then(() =>
        listMemories().then(m => { setMems(m); setCursor(c => Math.min(c, m.length - 1)) })
      )
    }
  })

  return (
    <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
      <Box marginBottom={1}>
        <Text color={colors.muted}>{sym.memory} memories  </Text>
        <Text color={colors.subtle}>↑↓ navigate · d delete · esc close</Text>
      </Box>

      {mems.length === 0 && (
        <Text color={colors.subtle}>  no memories — use /remember &lt;text&gt;</Text>
      )}

      {mems.slice(0, 30).map((m, i) => {
        const active = i === cursor
        const text = m.content.length > 70 ? m.content.slice(0, 69) + "…" : m.content
        return (
          <Box key={m.id}>
            <Text color={active ? colors.yellow : colors.subtle}>
              {active ? `${sym.user} ` : "  "}
            </Text>
            <Text color={active ? colors.text : colors.muted}>{text}</Text>
          </Box>
        )
      })}
      {mems.length > 30 && (
        <Text color={colors.subtle}>  … {mems.length - 30} more</Text>
      )}
    </Box>
  )
}
