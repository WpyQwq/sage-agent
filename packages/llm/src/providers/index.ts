import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModelV1 } from "ai"
import type { SageConfig } from "@sage/core"

export type ProviderID = "anthropic" | "openai" | "google" | "openrouter"

export interface ProviderModel {
  id: string
  name: string
  contextWindow: number
  supportsTools: boolean
}

export const PROVIDER_MODELS: Record<ProviderID, ProviderModel[]> = {
  anthropic: [
    { id: "claude-opus-4-8", name: "Claude Opus 4.8", contextWindow: 200_000, supportsTools: true },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", contextWindow: 200_000, supportsTools: true },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", contextWindow: 200_000, supportsTools: true },
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o", contextWindow: 128_000, supportsTools: true },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128_000, supportsTools: true },
    { id: "o3", name: "o3", contextWindow: 200_000, supportsTools: true },
  ],
  google: [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", contextWindow: 1_000_000, supportsTools: true },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", contextWindow: 1_000_000, supportsTools: true },
  ],
  openrouter: [
    { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6 (OR)", contextWindow: 200_000, supportsTools: true },
    { id: "openai/gpt-4o", name: "GPT-4o (OR)", contextWindow: 128_000, supportsTools: true },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro (OR)", contextWindow: 1_000_000, supportsTools: true },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (OR)", contextWindow: 64_000, supportsTools: true },
  ],
}

export function getLanguageModel(provider: ProviderID, modelId: string, config: SageConfig): LanguageModelV1 {
  const providerCfg = config.providers[provider] ?? {}

  switch (provider) {
    case "anthropic": {
      const apiKey = (providerCfg as { apiKey?: string }).apiKey ?? process.env.ANTHROPIC_API_KEY
      const client = createAnthropic({ apiKey })
      return client(modelId) as LanguageModelV1
    }
    case "openai": {
      const cfg = providerCfg as { apiKey?: string; baseUrl?: string }
      const apiKey = cfg.apiKey ?? process.env.OPENAI_API_KEY
      const client = createOpenAI({ apiKey, baseURL: cfg.baseUrl })
      return client(modelId) as LanguageModelV1
    }
    case "google": {
      const apiKey = (providerCfg as { apiKey?: string }).apiKey ?? process.env.GOOGLE_API_KEY
      const client = createGoogleGenerativeAI({ apiKey })
      return client(modelId) as LanguageModelV1
    }
    case "openrouter": {
      const apiKey = (providerCfg as { apiKey?: string }).apiKey ?? process.env.OPENROUTER_API_KEY
      const client = createOpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        headers: { "HTTP-Referer": "https://github.com/sage-ai", "X-Title": "Sage" },
      })
      return client(modelId) as LanguageModelV1
    }
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

export function listProviders(): ProviderID[] {
  return ["anthropic", "openai", "google", "openrouter"]
}
