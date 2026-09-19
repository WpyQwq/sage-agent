import React, { useState, useEffect, useCallback } from "react"
import type { Session, Message } from "@sage/core"
import {
  listSessions, createSession, getMessages, addMessage,
  deleteSession, updateSessionTitle, loadConfig, getDb,
} from "@sage/core"
import type { CoreMessage } from "ai"
import {
  recallMemories, formatMemoriesForContext, addMemory,
  summarizeSession, type RecalledMemory,
} from "@sage/memory"
import { runLLM, getLanguageModel, type ProviderID } from "@sage/llm"
import { generateText } from "ai"

export interface ActiveToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: string
  status: "running" | "done" | "error"
}

export interface AppState {
  sessions: Session[]
  currentSession: Session | null
  messages: Message[]
  toolCalls: ActiveToolCall[]
  isStreaming: boolean
  streamBuffer: string
  recalledMemories: RecalledMemory[]
  error: string | null
  usage: { input: number; output: number }
  abortController: AbortController | null
  openOverlay: "sessions" | "memories" | null
}

export function useAppState() {
  const config = loadConfig()
  const [state, setState] = useState<AppState>({
    sessions: [],
    currentSession: null,
    messages: [],
    toolCalls: [],
    isStreaming: false,
    streamBuffer: "",
    recalledMemories: [],
    error: null,
    usage: { input: 0, output: 0 },
    abortController: null,
    openOverlay: null,
  })

  const patch = useCallback(
    (p: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) =>
      setState(s => ({ ...s, ...(typeof p === "function" ? p(s) : p) })),
    []
  )

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const sessions = await listSessions()
    if (sessions.length > 0) {
      const msgs = await getMessages(sessions[0].id)
      setState(s => ({ ...s, sessions, currentSession: sessions[0], messages: msgs }))
    } else {
      setState(s => ({ ...s, sessions }))
    }
  }

  async function selectSession(session: Session) {
    const messages = await getMessages(session.id)
    patch({ currentSession: session, messages, toolCalls: [], streamBuffer: "", recalledMemories: [], error: null })
  }

  async function newSession() {
    const session = await createSession({ model: config.defaultModel, provider: config.defaultProvider })
    const sessions = await listSessions()
    patch({ sessions, currentSession: session, messages: [], toolCalls: [], recalledMemories: [], error: null })
  }

  async function removeSession(id: string) {
    await deleteSession(id)
    const sessions = await listSessions()
    if (sessions.length > 0) {
      const messages = await getMessages(sessions[0].id)
      patch({ sessions, currentSession: sessions[0], messages })
    } else {
      patch({ sessions, currentSession: null, messages: [] })
    }
  }

  async function submitMessage(text: string) {
    if (!text.trim() || state.isStreaming) return
    if (text.startsWith("/")) { await handleCommand(text); return }

    let session = state.currentSession
    if (!session) {
      session = await createSession({ model: config.defaultModel, provider: config.defaultProvider, title: text.slice(0, 50) })
      const sessions = await listSessions()
      patch({ sessions, currentSession: session })
    }

    const recalled = await recallMemories(text, config.memory.recallCount)
    const memoryCtx = formatMemoriesForContext(recalled)
    const userMsg = await addMessage({ sessionId: session.id, role: "user", content: text })

    // Auto-title on first message
    if (state.messages.length === 0 && session.title === "New Session") {
      const t = text.slice(0, 60).replace(/\n/g, " ")
      await updateSessionTitle(session.id, t)
      const sessions = await listSessions()
      patch({ sessions, currentSession: { ...session, title: t } })
      session = { ...session, title: t }
    }

    const allMessages = [...state.messages, userMsg]
    patch({ messages: allMessages, recalledMemories: recalled, isStreaming: true, streamBuffer: "", toolCalls: [], error: null })

    const coreMessages = buildCoreMessages(allMessages)
    const ac = new AbortController()
    patch({ abortController: ac })

    let localToolCalls: ActiveToolCall[] = []

    try {
      await runLLM({
        sessionId: session.id,
        messages: coreMessages,
        model: session.model,
        provider: session.provider,
        cwd: session.cwd,
        config,
        memoryContext: memoryCtx || undefined,
        signal: ac.signal,
        onEvent: (event) => {
          switch (event.type) {
            case "text-delta":
              patch(s => ({ streamBuffer: s.streamBuffer + (event.delta ?? "") }))
              break
            case "tool-call": {
              const tc: ActiveToolCall = { id: event.toolCall!.id, name: event.toolCall!.name, input: event.toolCall!.input, status: "running" }
              localToolCalls = [...localToolCalls, tc]
              patch({ toolCalls: localToolCalls })
              break
            }
            case "tool-result": {
              localToolCalls = localToolCalls.map(tc =>
                tc.id === event.toolResult?.toolCallId
                  ? { ...tc, output: event.toolResult!.output, status: "done" as const }
                  : tc
              )
              patch({ toolCalls: localToolCalls })
              break
            }
            case "finish":
              if (event.usage) patch(s => ({ usage: { input: s.usage.input + event.usage!.inputTokens, output: s.usage.output + event.usage!.outputTokens } }))
              break
            case "error":
              patch({ error: event.error?.message ?? "Unknown error" })
              break
          }
        },
      })
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") patch({ error: (err as Error)?.message ?? "Request failed" })
    }

    const updated = await getMessages(session.id)
    patch({ messages: updated, isStreaming: false, streamBuffer: "", abortController: null })

    if (config.memory.autoSummarize && updated.length > 0 && updated.length % 20 === 0) {
      autoSummarize(session, updated)
    }
  }

  async function autoSummarize(session: Session, msgs: Message[]) {
    try {
      const lm = getLanguageModel(session.provider as ProviderID, session.model, config)
      await summarizeSession(session.id, buildCoreMessages(msgs), async (prompt) => {
        const r = await generateText({ model: lm, prompt, maxTokens: 800 })
        return r.text
      })
    } catch { /* non-critical */ }
  }

  async function handleCommand(cmd: string) {
    const parts = cmd.trim().split(/\s+/)
    const command = parts[0]?.toLowerCase()
    switch (command) {
      case "/remember": {
        const content = parts.slice(1).join(" ")
        if (!content) { patch({ error: "usage: /remember <text>" }); break }
        await addMemory(content, { source: "manual" })
        patch({ error: "✓ memory saved" })
        setTimeout(() => patch({ error: null }), 2000)
        break
      }
      case "/memories": patch({ openOverlay: "memories" }); break
      case "/sessions": patch({ openOverlay: "sessions" }); break
      case "/new":      await newSession(); break
      case "/clear":    patch({ messages: [], toolCalls: [], streamBuffer: "" }); break
      case "/abort":    abort(); break
      case "/model": {
        const model = parts[1]
        const provider = parts[2] ?? state.currentSession?.provider ?? config.defaultProvider
        if (!model) { patch({ error: "usage: /model <id> [provider]" }); break }
        if (state.currentSession) {
          patch({ currentSession: { ...state.currentSession, model, provider }, error: `✓ switched to ${provider}/${model}` })
          setTimeout(() => patch({ error: null }), 2000)
        }
        break
      }
      case "/help":
        patch({ error: "/remember <t>  /memories  /sessions  /model <id> [prov]  /new  /clear  /abort  ^K sessions" })
        break
      default:
        patch({ error: `unknown command: ${command}  — /help for list` })
    }
  }

  function abort() {
    state.abortController?.abort()
    patch({ isStreaming: false, abortController: null })
  }

  return { state, patch, submitMessage, selectSession, newSession, removeSession, abort, config }
}

function buildCoreMessages(msgs: Message[]): CoreMessage[] {
  const result: CoreMessage[] = []
  for (const m of msgs) {
    if (m.role === "user") {
      result.push({ role: "user", content: m.content })
    } else if (m.role === "assistant") {
      if (m.toolCalls?.length) {
        result.push({
          role: "assistant",
          content: [
            ...(m.content ? [{ type: "text" as const, text: m.content }] : []),
            ...m.toolCalls.map(tc => ({ type: "tool-call" as const, toolCallId: tc.id, toolName: tc.name, args: tc.input })),
          ],
        })
      } else {
        result.push({ role: "assistant", content: m.content })
      }
    } else if (m.role === "tool") {
      result.push({ role: "tool", content: [{ type: "tool-result" as const, toolCallId: m.toolCallId ?? "", result: m.content }] })
    }
  }
  return result
}
