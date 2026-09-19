import { z } from "zod"
import { writeFileSync, mkdirSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import type { ToolDef, ToolContext, ToolOutput } from "./types.js"

export const write: ToolDef<{ file_path: string; content: string }> = {
  name: "write",
  description: "Write content to a file, creating it and any parent directories if needed. Overwrites existing files.",
  inputSchema: z.object({
    file_path: z.string().describe("Path to the file to write"),
    content: z.string().describe("Content to write to the file"),
  }),
  async execute(input, ctx: ToolContext): Promise<ToolOutput> {
    const filePath = resolve(ctx.cwd, input.file_path)
    const dir = dirname(filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, input.content, "utf8")
    const lines = input.content.split("\n").length
    return { content: `Wrote ${lines} lines to ${filePath}` }
  },
}
