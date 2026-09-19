import type { CoreMessage, CoreTool, StreamTextResult } from "ai"
import type { ToolCall, ToolResult } from "@sage/core"

export interface LLMRequest {
  messages: CoreMessage[]
  tools?: Record<string, CoreTool>
  model: string
  provider: string
  maxSteps?: number
  systemPrompt?: string
}

export interface LLMStreamEvent {
  type: "text-delta" | "tool-call" | "tool-result" | "finish" | "error"
  delta?: string
  toolCall?: { id: string; name: string; input: Record<string, unknown> }
  toolResult?: ToolResult
  usage?: { inputTokens: number; outputTokens: number }
  error?: Error
}

export type LLMEventEmitter = (event: LLMStreamEvent) => void
