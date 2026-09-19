import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"

export interface SageConfig {
  defaultProvider: string
  defaultModel: string
  theme: "tokyo-night" | "catppuccin" | "gruvbox" | "minimal"
  providers: {
    anthropic?: { apiKey?: string }
    openai?: { apiKey?: string; baseUrl?: string }
    google?: { apiKey?: string }
    openrouter?: { apiKey?: string }
  }
  memory: {
    autoSummarize: boolean
    maxMemories: number
    recallCount: number
  }
  editor: string
}

const CONFIG_PATH = join(homedir(), ".sage", "config.json")

const DEFAULTS: SageConfig = {
  defaultProvider: "anthropic",
  defaultModel: "claude-sonnet-4-6",
  theme: "tokyo-night",
  providers: {},
  memory: {
    autoSummarize: true,
    maxMemories: 500,
    recallCount: 5,
  },
  editor: process.env.EDITOR ?? "vim",
}

let _config: SageConfig | null = null

export function loadConfig(): SageConfig {
  if (_config) return _config
  if (!existsSync(CONFIG_PATH)) {
    _config = { ...DEFAULTS }
    return _config
  }
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"))
    _config = deepMerge(DEFAULTS, raw) as SageConfig
  } catch {
    _config = { ...DEFAULTS }
  }
  return _config
}

export function saveConfig(patch: Partial<SageConfig>) {
  const current = loadConfig()
  _config = deepMerge(current, patch) as SageConfig
  writeFileSync(CONFIG_PATH, JSON.stringify(_config, null, 2))
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    if (override[key] !== null && typeof override[key] === "object" && !Array.isArray(override[key]) &&
        typeof base[key] === "object" && base[key] !== null) {
      result[key] = deepMerge(base[key] as Record<string, unknown>, override[key] as Record<string, unknown>)
    } else {
      result[key] = override[key]
    }
  }
  return result
}
