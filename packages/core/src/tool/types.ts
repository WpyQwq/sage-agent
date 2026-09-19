import { z } from "zod"

export interface ToolDef<TInput = Record<string, unknown>> {
  name: string
  description: string
  inputSchema: z.ZodType<TInput>
  execute: (input: TInput, context: ToolContext) => Promise<ToolOutput>
}

export interface ToolContext {
  sessionId: string
  cwd: string
  onProgress?: (text: string) => void
}

export interface ToolOutput {
  content: string
  exitCode?: number
  error?: boolean
  truncated?: boolean
}

export type AnyToolDef = ToolDef<Record<string, unknown>>
