export type MessageRole = "user" | "assistant" | "tool"

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  toolName: string
  output: string
  exitCode?: number
  error?: boolean
}

export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  createdAt: number
  tokensInput?: number
  tokensOutput?: number
}

export interface Session {
  id: string
  title: string
  model: string
  provider: string
  cwd: string
  createdAt: number
  updatedAt: number
  metadata: Record<string, unknown>
}

export interface CreateSessionInput {
  model: string
  provider: string
  cwd?: string
  title?: string
}
