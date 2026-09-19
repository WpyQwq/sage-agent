import { z } from "zod"
import { readFileSync, existsSync, statSync, readdirSync } from "fs"
import { join, resolve } from "path"
import type { ToolDef, ToolContext, ToolOutput } from "./types.js"

const MAX_FILE_SIZE = 1_000_000
const MAX_LINES = 2000

export const read: ToolDef<{ file_path: string; offset?: number; limit?: number }> = {
  name: "read",
  description: "Read the contents of a file. Use offset/limit for large files.",
  inputSchema: z.object({
    file_path: z.string().describe("Absolute or relative path to the file"),
    offset: z.number().optional().describe("Line number to start reading from (1-based)"),
    limit: z.number().optional().describe("Maximum number of lines to read"),
  }),
  async execute(input, ctx: ToolContext): Promise<ToolOutput> {
    const filePath = resolve(ctx.cwd, input.file_path)

    if (!existsSync(filePath)) {
      return { content: `File not found: ${filePath}`, error: true }
    }

    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      const entries = readdirSync(filePath, { withFileTypes: true })
      const listing = entries
        .map(e => `${e.isDirectory() ? "d" : "f"}  ${e.name}`)
        .join("\n")
      return { content: `Directory listing of ${filePath}:\n${listing}` }
    }

    if (stat.size > MAX_FILE_SIZE) {
      return {
        content: `File too large (${Math.round(stat.size / 1024)}KB). Use offset/limit to read specific sections.`,
        error: true,
      }
    }

    const raw = readFileSync(filePath, "utf8")
    const lines = raw.split("\n")
    const offset = (input.offset ?? 1) - 1
    const limit = input.limit ?? MAX_LINES
    const slice = lines.slice(offset, offset + limit)
    const numbered = slice.map((l, i) => `${String(offset + i + 1).padStart(4, " ")}\t${l}`).join("\n")

    const truncated = lines.length > offset + limit

    return {
      content: numbered,
      truncated,
    }
  },
}
