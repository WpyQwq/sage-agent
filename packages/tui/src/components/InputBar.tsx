import React, { useState, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import { colors, sym } from "../theme/index.js"

interface Props {
  onSubmit: (text: string) => void
  isStreaming: boolean
  onAbort: () => void
}

export function InputBar({ onSubmit, isStreaming, onAbort }: Props) {
  const [value, setValue] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)

  useInput((input, key) => {
    if (isStreaming && key.ctrl && input === "c") { onAbort(); return }

    if (!isStreaming && key.upArrow) {
      const idx = Math.min(historyIdx + 1, history.length - 1)
      if (idx >= 0) { setHistoryIdx(idx); setValue(history[history.length - 1 - idx] ?? "") }
    }
    if (!isStreaming && key.downArrow) {
      const idx = historyIdx - 1
      if (idx < 0) { setHistoryIdx(-1); setValue("") }
      else { setHistoryIdx(idx); setValue(history[history.length - 1 - idx] ?? "") }
    }
  })

  const handleSubmit = useCallback((text: string) => {
    if (!text.trim() || isStreaming) return
    setHistory(h => [...h.slice(-49), text])
    setHistoryIdx(-1)
    setValue("")
    onSubmit(text)
  }, [onSubmit, isStreaming])

  return (
    <Box paddingLeft={2} paddingRight={2} marginTop={1}>
      {isStreaming
        ? <Text color={colors.muted}>~ generating…  ^C to abort</Text>
        : <>
            <Text color={colors.orange}>{sym.prompt} </Text>
            <TextInput
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              placeholder="message…"
              placeholderColor={colors.subtle}
            />
          </>
      }
    </Box>
  )
}
