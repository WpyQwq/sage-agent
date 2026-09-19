import { z } from "zod"
import { resolve } from "path"
import { spawnSync } from "child_process"
import { readdirSync, statSync, existsSync } from "fs"
import type { ToolDef, ToolContext, ToolOutput } from "./types.js"

const MAX_RESULTS = 500

export const glob: ToolDef<{ pattern: string; path?: string }> = {
  name: "glob",
  description: "Find files matching a glob pattern. Returns file paths sorted by modification time.",
  inputSchema: z.object({
    pattern: z.string().describe("Glob pattern, e.g. '**/*.ts' or 'src/**/*.tsx'"),
    path: z.string().optional().describe("Directory to search in (default: cwd)"),
  }),
  async execute(input, ctx: ToolContext): Promise<ToolOutput> {
    const searchDir = resolve(ctx.cwd, input.path ?? ".")
    const results = matchGlob(input.pattern, searchDir)
    const truncated = results.length > MAX_RESULTS
    const listed = results.slice(0, MAX_RESULTS)
    return {
      content: listed.length > 0 ? listed.join("\n") : "(no matches)",
      truncated,
    }
  },
}

function matchGlob(pattern: string, dir: string): string[] {
  // Try ripgrep first for performance
  const rg = spawnSync("rg", ["--files", "--glob", pattern, dir], {
    encoding: "utf8",
    maxBuffer: 10_000_000,
  })
  if (rg.status === 0) {
    return rg.stdout.trim().split("\n").filter(Boolean)
  }

  // Fallback: simple recursive walk
  return walkAndMatch(dir, dir, patternToRegex(pattern))
}

function walkAndMatch(base: string, dir: string, regex: RegExp): string[] {
  if (!existsSync(dir)) return []
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue
    const full = `${dir}/${entry.name}`
    const rel = full.slice(base.length + 1)
    if (entry.isDirectory()) {
      results.push(...walkAndMatch(base, full, regex))
    } else if (regex.test(rel)) {
      results.push(full)
    }
  }
  return results
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§DOUBLE§")
    .replace(/\*/g, "[^/]*")
    .replace(/§DOUBLE§/g, ".*")
    .replace(/\?/g, "[^/]")
  return new RegExp(`^${escaped}$`)
}
