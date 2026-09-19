import Database from "better-sqlite3"
import type { Memory } from "./store.js"

// Recall memories using SQLite FTS5 BM25 ranking
export function recallMemoriesRaw(
  sqlite: Database.Database,
  query: string,
  limit: number
): Array<Memory & { score: number }> {
  const sanitized = sanitizeFtsQuery(query)
  if (!sanitized) return []

  const rows = sqlite.prepare<{
    id: string; content: string; source: string; session_id: string | null;
    created_at: number; last_accessed: number; access_count: number; tags: string; rank: number
  }, [string, number]>(`
    SELECT m.id, m.content, m.source, m.session_id, m.created_at,
           m.last_accessed, m.access_count, m.tags, mf.rank
    FROM memories_fts mf
    JOIN memories m ON m.id = mf.id
    WHERE memories_fts MATCH ?
    ORDER BY mf.rank
    LIMIT ?
  `).all(sanitized, limit)

  if (rows.length === 0) return []

  // Update access stats
  const now = Date.now()
  const ids = rows.map(r => r.id)
  const placeholders = ids.map(() => "?").join(",")
  sqlite.prepare(`UPDATE memories SET last_accessed = ?, access_count = access_count + 1 WHERE id IN (${placeholders})`)
    .run(now, ...ids)

  return rows.map(r => ({
    id: r.id,
    content: r.content,
    source: r.source as Memory["source"],
    sessionId: r.session_id ?? undefined,
    createdAt: r.created_at,
    lastAccessed: r.last_accessed,
    accessCount: r.access_count,
    tags: JSON.parse(r.tags) as string[],
    score: -r.rank,
  }))
}

function sanitizeFtsQuery(query: string): string {
  return query
    .replace(/["*^()]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(w => `"${w}"`)
    .join(" OR ")
}
