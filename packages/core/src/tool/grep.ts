import { z } from "zod"
import { resolve } from "path"
import { spawnSync } from "child_process"
import type { ToolDef, ToolContext, ToolOutput } from "./types.js"

const MAX_OUTPUT = 50_000

export const grep: ToolDef<{ pattern: string; path?: string; glob?: string; output_mode?: "content" | "files" | "count"; case_insensitive?: boolean; context?: number }> = {
  name: "grep",
  description: "Search for a regex pattern in files using ripgrep. Returns matching content or file paths.",
  inputSchema: z.object({
    pattern: z.string().describe("Regular expression pattern to search for"),
    path: z.string().optional().describe("File or directory to search in"),
    glob: z.string().optional().describe("Glob pattern to filter files, e.g. '*.ts'"),
    output_mode: z.enum(["content", "files", "count"]).optional().default("content").describe("content: show matching lines, files: only file paths, count: match counts"),
    case_insensitive: z.boolean().optional().default(false),
    context: z.number().optional().describe("Lines of context around each match"),
  }),
  async execute(input, ctx: ToolContext): Promise<ToolOutput> {
    const searchPath = resolve(ctx.cwd, input.path ?? ".")
    const args = ["--no-heading", "--color=never"]

    if (input.case_insensitive) args.push("-i")
    if (input.glob) args.push("--glob", input.glob)
    if (input.output_mode === "files") args.push("-l")
    if (input.output_mode === "count") args.push("-c")
    if (input.context) args.push(`-C${input.context}`)
    if (input.output_mode === "content") args.push("-n")

    args.push(input.pattern, searchPath)

    const result = spawnSync("rg", args, {
      encoding: "utf8",
      maxBuffer: MAX_OUTPUT * 2,
    })

    let output = (result.stdout ?? "") + (result.stderr ?? "")
    if (result.error) {
      // Fallback when rg not available
      output = `ripgrep not found. Install it for grep support.\nError: ${result.error.message}`
      return { content: output, error: true }
    }

    const truncated = output.length > MAX_OUTPUT
    return {
      content: output.slice(0, MAX_OUTPUT) || "(no matches)",
      truncated,
    }
  },
}
