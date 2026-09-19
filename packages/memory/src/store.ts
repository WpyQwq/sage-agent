import { nanoid } from "nanoid"
import { getRawDb, getDb } from "@sage/core"
import { memories } from "@sage/core"
import { eq } from "drizzle-orm"
import { recallMemoriesRaw } from "./retrieval.js"

export interface Memory {
  id: string
  content: string
  source: "manual" | "auto" | "session"
  sessionId?: string
  createdAt: number
  lastAccessed: number
  accessCount: number
  tags: string[]
}

export interface RecalledMemory extends Memory {
  score: number
}

export async function addMemory(
  content: string,
  opts: { source?: Memory["source"]; sessionId?: string; tags?: string[] } = {}
): Promise<Memory> {
  const db = getDb()
  const now = Date.now()
  const id = nanoid()
  const tags = opts.tags ?? extractTags(content)
  const mem: Memory = {
    id,
    content,
    source: opts.source ?? "manual",
    sessionId: opts.sessionId,
    createdAt: now,
    lastAccessed: now,
    accessCount: 0,
    tags,
  }
  await db.insert(memories).values({
    ...mem,
    tags: JSON.stringify(tags),
    sessionId: opts.sessionId ?? null,
  })
  return mem
}

export async function recallMemories(query: string, limit = 5): Promise<RecalledMemory[]> {
  const sqlite = getRawDb()
  return recallMemoriesRaw(sqlite, query, limit)
}

export async function listMemories(limit = 100): Promise<Memory[]> {
  const db = getDb()
  const rows = await db.select().from(memories).limit(limit).all()
  return rows.map(r => ({
    ...r,
    source: r.source as Memory["source"],
    sessionId: r.sessionId ?? undefined,
    tags: JSON.parse(r.tags) as string[],
  }))
}

export async function deleteMemory(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.delete(memories).where(eq(memories.id, id))
  return ((result as unknown as { changes: number }).changes ?? 0) > 0
}

export function formatMemoriesForContext(mems: RecalledMemory[]): string {
  if (mems.length === 0) return ""
  return mems.map((m, i) => `${i + 1}. ${m.content}`).join("\n")
}

function extractTags(content: string): string[] {
  const words = content.toLowerCase().match(/\b[a-z][a-z0-9]{2,}\b/g) ?? []
  const stopWords = new Set(["the", "and", "for", "that", "this", "with", "from", "have", "been", "will", "not", "but"])
  const freq: Record<string, number> = {}
  for (const w of words) {
    if (!stopWords.has(w)) freq[w] = (freq[w] ?? 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w)
}
