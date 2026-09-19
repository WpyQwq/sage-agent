import { streamText, tool, type CoreMessage, type CoreTool, type TextStreamPart } from "ai"
import { z } from "zod"
import type { SageConfig, AnyToolDef, ToolContext } from "@sage/core"
import { ALL_TOOLS, getTool, addMessage, updateMessage } from "@sage/core"
import { getLanguageModel, type ProviderID } from "./providers/index.js"
import type { LLMEventEmitter } from "./types.js"

const SYSTEM_PROMPT = `You are Sage, an expert AI coding assistant. You help users write, debug, and understand code.

You have access to tools to read/write files, run shell commands, search code, and more.
Always prefer using tools to gather information before answering.
When editing files, use the edit tool for small changes and write for large rewrites.
Be concise but complete. Show your reasoning when working through complex problems.`

export interface RunOptions {
  sessionId: string
  messages: CoreMessage[]
  model: string
  provider: string
  cwd: string
  config: SageConfig
  memoryContext?: string
  onEvent: LLMEventEmitter
  signal?: AbortSignal
}

export async function runLLM(opts: RunOptions): Promise<void> {
  const { sessionId, messages, model, provider, cwd, config, onEvent, signal } = opts

  const toolContext: ToolContext = {
    sessionId,
    cwd,
    onProgress: (text) => {
      /* incremental tool output — currently unused at this level */
    },
  }

  const aiTools: Record<string, CoreTool> = {}
  for (const t of ALL_TOOLS) {
    aiTools[t.name] = tool({
      description: t.description,
      parameters: t.inputSchema as z.ZodType<Record<string, unknown>>,
      execute: async (input) => {
        const result = await t.execute(input as Record<string, unknown>, toolContext)
        return result
      },
    })
  }

  const systemParts: string[] = [SYSTEM_PROMPT]
  if (opts.memoryContext) {
    systemParts.push(`\n## Recalled Memories\n${opts.memoryContext}`)
  }
  systemParts.push(`\nCurrent working directory: ${cwd}`)

  const lm = getLanguageModel(provider as ProviderID, model, config)

  const currentMessages = [...messages]
  let assistantMsgId: string | null = null
  let accText = ""

  const stream = streamText({
    model: lm,
    system: systemParts.join("\n"),
    messages: currentMessages,
    tools: aiTools,
    maxSteps: 20,
    abortSignal: signal,
  })

  for await (const part of stream.fullStream) {
    if (signal?.aborted) break

    switch (part.type) {
      case "text-delta": {
        if (!assistantMsgId) {
          const msg = await addMessage({
            sessionId,
            role: "assistant",
            content: "",
          })
          assistantMsgId = msg.id
        }
        accText += part.textDelta
        await updateMessage(assistantMsgId, { content: accText })
        onEvent({ type: "text-delta", delta: part.textDelta })
        break
      }

      case "tool-call": {
        onEvent({
          type: "tool-call",
          toolCall: {
            id: part.toolCallId,
            name: part.toolName,
            input: part.args as Record<string, unknown>,
          },
        })
        break
      }

      case "tool-result": {
        const output = typeof part.result === "string"
          ? part.result
          : JSON.stringify(part.result, null, 2)

        await addMessage({
          sessionId,
          role: "tool",
          content: output,
          toolCallId: part.toolCallId,
        })

        onEvent({
          type: "tool-result",
          toolResult: {
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            output,
          },
        })
        break
      }

      case "finish": {
        const usage = part.usage
        if (assistantMsgId && usage) {
          await updateMessage(assistantMsgId, {
            tokensInput: usage.promptTokens,
            tokensOutput: usage.completionTokens,
          })
        }
        onEvent({
          type: "finish",
          usage: usage
            ? { inputTokens: usage.promptTokens, outputTokens: usage.completionTokens }
            : undefined,
        })
        break
      }

      case "error": {
        onEvent({ type: "error", error: part.error as Error })
        break
      }
    }
  }
}
