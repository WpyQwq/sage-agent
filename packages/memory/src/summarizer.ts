import type { CoreMessage } from "ai"
import { addMemory } from "./store.js"

// Auto-summarize a completed session and extract key memories
export async function summarizeSession(
  sessionId: string,
  messages: CoreMessage[],
  summarizeFn: (prompt: string) => Promise<string>
): Promise<string[]> {
  if (messages.length < 4) return []

  const transcript = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .slice(-30) // last 30 messages max
    .map(m => `${m.role.toUpperCase()}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`)
    .join("\n\n")

  const prompt = `You are extracting key facts and insights from a coding session transcript for long-term memory storage.

Extract 3-7 important, reusable pieces of information that would be valuable in future sessions:
- Technical decisions made (architecture, libraries chosen, patterns used)
- Bugs found and their root causes
- User preferences or conventions discovered
- Project-specific knowledge (file structure, APIs, domain concepts)
- Important constraints or requirements

Format as a JSON array of strings, each being a self-contained, specific memory.
Do NOT include generic observations. Each memory should be specific and actionable.

TRANSCRIPT:
${transcript}

Return ONLY a JSON array of strings.`

  try {
    const response = await summarizeFn(prompt)
    const extracted = JSON.parse(response.trim()) as string[]
    if (!Array.isArray(extracted)) return []

    const stored: string[] = []
    for (const fact of extracted.slice(0, 7)) {
      if (typeof fact === "string" && fact.length > 10) {
        await addMemory(fact, { source: "auto", sessionId })
        stored.push(fact)
      }
    }
    return stored
  } catch {
    return []
  }
}
