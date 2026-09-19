#!/usr/bin/env node
import { fileURLToPath, pathToFileURL } from "url"
import { join, dirname } from "path"
import { spawnSync } from "child_process"

const __dir = dirname(fileURLToPath(import.meta.url))
const tuiEntry = join(__dir, "packages", "tui", "src", "index.tsx")
const tsxLoader = join(__dir, "node_modules", "tsx", "dist", "esm", "index.cjs")
const loaderUrl = pathToFileURL(tsxLoader).href

const result = spawnSync(
  process.execPath,
  [`--import=${loaderUrl}`, tuiEntry, ...process.argv.slice(2)],
  { stdio: "inherit", env: { ...process.env }, cwd: process.cwd() }
)

process.exit(result.status ?? 0)
