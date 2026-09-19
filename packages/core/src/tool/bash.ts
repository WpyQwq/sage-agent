import { z } from "zod"
import { spawn } from "child_process"
import type { ToolDef, ToolContext, ToolOutput } from "./types.js"

const MAX_OUTPUT = 100_000

export const bash: ToolDef<{ command: string; description?: string; timeout?: number }> = {
  name: "bash",
  description: "Execute a shell command in the current working directory. Use for running tests, builds, git operations, and any shell task.",
  inputSchema: z.object({
    command: z.string().describe("The shell command to execute"),
    description: z.string().optional().describe("Short description of what this command does"),
    timeout: z.number().optional().default(120000).describe("Timeout in milliseconds"),
  }),
  async execute(input, ctx: ToolContext): Promise<ToolOutput> {
    const timeout = input.timeout ?? 120_000
    return new Promise((resolve) => {
      const proc = spawn(process.platform === "win32" ? "cmd" : "sh",
        process.platform === "win32" ? ["/c", input.command] : ["-c", input.command],
        {
          cwd: ctx.cwd,
          env: { ...process.env },
          shell: false,
        }
      )

      let stdout = ""
      let stderr = ""
      let killed = false

      const timer = setTimeout(() => {
        killed = true
        proc.kill("SIGTERM")
      }, timeout)

      proc.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString()
        stdout += text
        ctx.onProgress?.(text)
      })

      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString()
      })

      proc.on("close", (code) => {
        clearTimeout(timer)
        let output = ""
        if (stdout) output += stdout
        if (stderr) output += (output ? "\n--- stderr ---\n" : "") + stderr
        if (killed) output += "\n[Process killed: timeout exceeded]"

        const truncated = output.length > MAX_OUTPUT
        if (truncated) output = output.slice(0, MAX_OUTPUT) + "\n... [output truncated]"

        resolve({
          content: output || "(no output)",
          exitCode: code ?? 0,
          error: (code ?? 0) !== 0,
          truncated,
        })
      })

      proc.on("error", (err) => {
        clearTimeout(timer)
        resolve({ content: `Error: ${err.message}`, exitCode: 1, error: true })
      })
    })
  },
}
