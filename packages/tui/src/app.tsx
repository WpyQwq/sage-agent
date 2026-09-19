import React from "react"
import { Box, Text, useInput } from "ink"
import { colors } from "./theme/index.js"
import { MessageList } from "./components/MessageList.js"
import { InputBar } from "./components/InputBar.js"
import { MemoryBar } from "./components/MemoryBar.js"
import { MemoryPanel } from "./components/MemoryPanel.js"
import { SessionOverlay } from "./components/SessionOverlay.js"
import { Footer } from "./components/Footer.js"
import { useAppState } from "./hooks/useAppState.js"
import { useState } from "react"

export function App() {
  const [sessionCursor, setSessionCursor] = useState(0)
  const { state, patch, submitMessage, selectSession, newSession, removeSession, abort, config } = useAppState()

  useInput((_input, key) => {
    if (state.openOverlay) return
    if (key.ctrl && _input === "k") { patch({ openOverlay: "sessions" }); return }
    if (key.escape && state.error)  { patch({ error: null }); return }
  })

  const model    = state.currentSession?.model    ?? config.defaultModel
  const provider = state.currentSession?.provider ?? config.defaultProvider
  const cwd      = state.currentSession?.cwd      ?? process.cwd()

  if (state.openOverlay === "sessions") {
    return (
      <SessionOverlay
        sessions={state.sessions}
        cursor={sessionCursor}
        setCursor={setSessionCursor}
        onSelect={s => { selectSession(s); patch({ openOverlay: null }) }}
        onNew={() => { newSession(); patch({ openOverlay: null }) }}
        onDelete={id => { removeSession(id); setSessionCursor(c => Math.max(0, c - 1)) }}
        onClose={() => patch({ openOverlay: null })}
      />
    )
  }

  if (state.openOverlay === "memories") {
    return <MemoryPanel onClose={() => patch({ openOverlay: null })} />
  }

  return (
    <Box flexDirection="column">
      {/* Session title */}
      <Box paddingLeft={2} paddingRight={2} paddingTop={1} marginBottom={1}>
        <Text color={colors.muted}>sage  </Text>
        {state.currentSession
          ? <Text color={colors.text}>{state.currentSession.title}</Text>
          : <Text color={colors.subtle}>no session</Text>
        }
      </Box>

      {/* Welcome */}
      {!state.currentSession && (
        <Box flexDirection="column" paddingLeft={2} marginBottom={1}>
          <Text color={colors.subtle}>start typing to begin, or ^K to switch sessions</Text>
        </Box>
      )}

      {/* Messages */}
      {state.currentSession && (
        <MessageList
          messages={state.messages}
          toolCalls={state.toolCalls}
          streamBuffer={state.streamBuffer}
          isStreaming={state.isStreaming}
        />
      )}

      {/* Error/info */}
      {state.error && (
        <Box paddingLeft={2} marginTop={1}>
          <Text color={state.error.startsWith("✓") ? colors.green : colors.red}>
            {state.error}
          </Text>
          {!state.error.startsWith("✓") && <Text color={colors.subtle}>  esc</Text>}
        </Box>
      )}

      {/* Memory recall indicator */}
      <MemoryBar memories={state.recalledMemories} />

      {/* Input */}
      <InputBar onSubmit={submitMessage} isStreaming={state.isStreaming} onAbort={abort} />

      {/* Footer */}
      <Footer
        model={model}
        provider={provider}
        cwd={cwd}
        isStreaming={state.isStreaming}
        usage={state.usage}
        memoryCount={state.recalledMemories.length}
        sessionTitle={state.currentSession?.title ?? null}
      />
    </Box>
  )
}
