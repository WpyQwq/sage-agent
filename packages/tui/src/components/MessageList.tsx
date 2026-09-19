import React from "react"
import { Box, Text } from "ink"
import { colors, toolIcon, sym } from "../theme/index.js"
import type { Message } from "@sage/core"
import type { ActiveToolCall } from "../hooks/useAppState.js"

interface Props {
  messages: Message[]
  toolCalls: ActiveToolCall[]
  streamBuffer: string
  isStreaming: boolean
}

export function MessageList({ messages, toolCalls, streamBuffer, isStreaming }: Props) {
  const display = messages.filter(m => m.role !== "tool")

  return (
    <Box flexDirection="column" paddingLeft={2} paddingRight={2} flexGrow={1}>
      {display.map((msg, i) => (
        <MsgItem key={msg.id} msg={msg} first={i === 0} />
      ))}

      {/* In-flight tool calls */}
      {toolCalls.map(tc => (
        <ToolLine key={tc.id} tc={tc} />
      ))}

      {/* Streaming assistant text */}
      {isStreaming && streamBuffer && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text color={colors.green}>{sym.assistant} </Text>
            <Text color={colors.text}>{streamBuffer}</Text>
            <Text color={colors.muted}>▊</Text>
          </Box>
        </Box>
      )}

      {isStreaming && !streamBuffer && toolCalls.length === 0 && (
        <Box marginTop={1}>
          <Text color={colors.muted}>~ thinking…</Text>
        </Box>
      )}
    </Box>
  )
}

function MsgItem({ msg, first }: { msg: Message; first: boolean }) {
  if (msg.role === "user") {
    return (
      <Box flexDirection="column" marginTop={first ? 0 : 1}>
        {msg.content.split("\n").map((line, i) => (
          <Box key={i}>
            <Text color={colors.blue}>{sym.user} </Text>
            <Text color={colors.text} bold={i === 0}>{line}</Text>
          </Box>
        ))}
      </Box>
    )
  }

  if (msg.role === "assistant") {
    const lines = msg.content.trim().split("\n")
    return (
      <Box flexDirection="column" marginTop={1}>
        {lines.map((line, i) => (
          <Box key={i}>
            {i === 0
              ? <Text color={colors.green}>{sym.assistant} </Text>
              : <Text>{"  "}</Text>
            }
            <Text color={colors.text}>{line}</Text>
          </Box>
        ))}
        {msg.tokensOutput != null && (
          <Box marginTop={0}>
            <Text color={colors.subtle}>{"  "}{sym.dot} {msg.tokensOutput} tokens</Text>
          </Box>
        )}
      </Box>
    )
  }

  return null
}

function ToolLine({ tc }: { tc: ActiveToolCall }) {
  const icon = toolIcon[tc.name] ?? toolIcon.default
  const isDone = tc.status === "done"
  const isErr  = tc.status === "error"
  const color  = isErr ? colors.red : isDone ? colors.muted : colors.orange

  // Show most relevant input arg as a short label
  const label = getLabel(tc.name, tc.input)

  // Output preview: first non-empty line, max 80 chars
  const preview = tc.output
    ? tc.output.split("\n").find(l => l.trim()) ?? ""
    : ""
  const previewTrunc = preview.length > 80 ? preview.slice(0, 79) + "…" : preview

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color={color}>
          {isDone ? sym.check : isErr ? sym.cross : sym.running}{" "}
        </Text>
        <Text color={colors.muted}>{icon} </Text>
        <Text color={isDone ? colors.muted : colors.text}>{label}</Text>
      </Box>
      {previewTrunc && (
        <Box paddingLeft={4}>
          <Text color={colors.subtle}>{previewTrunc}</Text>
        </Box>
      )}
    </Box>
  )
}

function getLabel(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "bash":  return String(input.command ?? "").slice(0, 72)
    case "read":  return String(input.file_path ?? "")
    case "write": return String(input.file_path ?? "")
    case "edit":  return String(input.file_path ?? "")
    case "glob":  return String(input.pattern ?? "")
    case "grep":  return `${input.pattern ?? ""} ${input.path ?? ""}`.trim()
    default:      return name
  }
}
