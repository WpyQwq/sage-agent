import { eq, desc } from "drizzle-orm"
import { getDb } from "../db/client.js"
import { sessions, messages } from "../db/schema.js"
import type { Session, Message, CreateSessionInput, ToolCall } from "./types.js"
import { nanoid } from "nanoid"
import { cwd as getCwd } from "process"

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const db = getDb()
  const now = Date.now()
  const id = nanoid()
  const session: Session = {
    id,
    title: input.title ?? "New Session",
    model: input.model,
    provider: input.provider,
    cwd: input.cwd ?? getCwd(),
    createdAt: now,
    updatedAt: now,
    metadata: {},
  }
  await db.insert(sessions).values({
    ...session,
    metadata: JSON.stringify(session.metadata),
  })
  return session
}

export async function getSession(id: string): Promise<Session | null> {
  const db = getDb()
  const row = await db.select().from(sessions).where(eq(sessions.id, id)).get()
  if (!row) return null
  return { ...row, metadata: JSON.parse(row.metadata) }
}

export async function listSessions(limit = 50): Promise<Session[]> {
  const db = getDb()
  const rows = await db.select().from(sessions).orderBy(desc(sessions.updatedAt)).limit(limit).all()
  return rows.map(r => ({ ...r, metadata: JSON.parse(r.metadata) }))
}

export async function updateSessionTitle(id: string, title: string) {
  const db = getDb()
  await db.update(sessions).set({ title, updatedAt: Date.now() }).where(eq(sessions.id, id))
}

export async function deleteSession(id: string) {
  const db = getDb()
  await db.delete(sessions).where(eq(sessions.id, id))
}

export async function addMessage(msg: Omit<Message, "id" | "createdAt">): Promise<Message> {
  const db = getDb()
  const id = nanoid()
  const now = Date.now()
  const full: Message = { ...msg, id, createdAt: now }
  await db.insert(messages).values({
    ...full,
    toolCalls: msg.toolCalls ? JSON.stringify(msg.toolCalls) : null,
  })
  await db.update(sessions).set({ updatedAt: now }).where(eq(sessions.id, msg.sessionId))
  return full
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.createdAt)
    .all()
  return rows.map(r => ({
    ...r,
    role: r.role as Message["role"],
    toolCalls: r.toolCalls ? (JSON.parse(r.toolCalls) as ToolCall[]) : undefined,
    tokensInput: r.tokensInput ?? undefined,
    tokensOutput: r.tokensOutput ?? undefined,
    toolCallId: r.toolCallId ?? undefined,
  }))
}

export async function updateMessage(id: string, patch: Partial<Pick<Message, "content" | "tokensInput" | "tokensOutput">>) {
  const db = getDb()
  await db.update(messages).set(patch).where(eq(messages.id, id))
}
