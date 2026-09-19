import { z } from "zod"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"
import type { ToolDef, ToolContext, ToolOutput } from "./types.js"

export const edit: ToolDef<{ file_path: string; old_string: string; new_string: string; replace_all?: boolean }> = {
  name: "edit",
  description: "Replace a specific string in a file with a new string. The old_string must match exactly (including whitespace). Use replace_all to replace every occurrence.",
  inputSchema: z.object({
    file_path: z.string().describe("Path to the file to edit"),
    old_string: z.string().describe("The exact string to find and replace"),
    new_string: z.string().describe("The string to replace it with"),
    replace_all: z.boolean().optional().default(false).describe("Replace all occurrences instead of just the first"),
  }),
  async execute(input, ctx: ToolContext): Promise<ToolOutput> {
    const filePath = resolve(ctx.cwd, input.file_path)

    if (!existsSync(filePath)) {
      return { content: `File not found: ${filePath}`, error: true }
    }

    const original = readFileSync(filePath, "utf8")

    if (!original.includes(input.old_string)) {
      // Attempt fuzzy match to give helpful error
      const lines = original.split("\n")
      const needle = input.old_string.trim()
      const close = lines.findIndex(l => l.includes(needle.split("\n")[0]?.trim() ?? ""))
      const hint = close >= 0 ? ` (closest match at line ${close + 1})` : ""
      return { content: `old_string not found in file${hint}. Ensure the text matches exactly including whitespace.`, error: true }
    }

    const occurrences = original.split(input.old_string).length - 1
    if (occurrences > 1 && !input.replace_all) {
      return {
        content: `old_string appears ${occurrences} times. Provide more context to make it unique, or set replace_all=true.`,
        error: true,
      }
    }

    const updated = input.replace_all
      ? original.split(input.old_string).join(input.new_string)
      : original.replace(input.old_string, input.new_string)

    writeFileSync(filePath, updated, "utf8")
    return { content: `Edited ${filePath}: replaced ${input.replace_all ? occurrences : 1} occurrence(s)` }
  },
}
