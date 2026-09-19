import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("New Session"),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
  cwd: text("cwd").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  metadata: text("metadata").notNull().default("{}"),
})

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(), // user | assistant | tool
  content: text("content").notNull(),
  toolCalls: text("tool_calls"), // JSON
  toolCallId: text("tool_call_id"),
  createdAt: integer("created_at").notNull(),
  tokensInput: integer("tokens_input"),
  tokensOutput: integer("tokens_output"),
})

export const toolResults = sqliteTable("tool_results", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull(),
  sessionId: text("session_id").notNull(),
  toolName: text("tool_name").notNull(),
  toolCallId: text("tool_call_id").notNull(),
  input: text("input").notNull(),
  output: text("output").notNull(),
  exitCode: integer("exit_code"),
  createdAt: integer("created_at").notNull(),
})

export const memories = sqliteTable("memories", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  source: text("source").notNull().default("manual"),
  sessionId: text("session_id"),
  createdAt: integer("created_at").notNull(),
  lastAccessed: integer("last_accessed").notNull(),
  accessCount: integer("access_count").notNull().default(0),
  tags: text("tags").notNull().default("[]"),
})

export const config = sqliteTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})
