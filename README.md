# Sage — AI 编程助手

功能上高度对应 opencode，但 UI 风格完全不同（Tokyo Night 配色 + Ink/React TUI），并额外内置**长期记忆**系统。

## 启动

```bash
# 在终端里直接运行（需要真实 TTY）
node sage.mjs

# 或者
cd packages/tui && node --import=tsx/esm src/index.tsx
```

## 配置 `~/.sage/config.json`

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-6",
  "theme": "tokyo-night",
  "providers": {
    "anthropic": { "apiKey": "sk-ant-..." },
    "openai":    { "apiKey": "sk-..." },
    "google":    { "apiKey": "..." },
    "openrouter":{ "apiKey": "sk-or-..." }
  },
  "memory": {
    "autoSummarize": true,
    "maxMemories": 500,
    "recallCount": 5
  }
}
```

也可以通过环境变量：`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY` / `OPENROUTER_API_KEY`

## 键位

| 按键 | 功能 |
|------|------|
| `^B` | 切换 session 面板焦点 |
| `↑↓` | 在 session 面板中导航 / 历史命令 |
| `Enter` | 发送消息 / 选中 session |
| `^C` | 中断当前生成 |
| `Esc` | 关闭弹窗 / 清除错误 |

## 斜线命令

| 命令 | 说明 |
|------|------|
| `/remember <文字>` | 手动保存一条长期记忆 |
| `/memories` | 浏览 & 删除所有记忆 |
| `/model <id> [provider]` | 切换模型，如 `/model gpt-4o openai` |
| `/new` | 新建 session |
| `/clear` | 清空显示 |
| `/abort` | 停止生成 |
| `/help` | 命令列表 |

## 长期记忆

- 每次发消息前，自动用 BM25 召回最相关的历史记忆注入上下文
- 底部黄色条 `◊ 3 memories recalled` 显示命中的记忆
- 每 20 条消息自动用 LLM 摘要本次会话并写入记忆库
- 数据存于 `~/.sage/sage.db`（SQLite + FTS5）

## 内置工具

| 工具 | 说明 |
|------|------|
| `bash` | 执行 shell 命令 |
| `read` | 读取文件 |
| `write` | 写入文件 |
| `edit` | 精确字符串替换 |
| `glob` | 文件模式匹配 |
| `grep` | 正则内容搜索（ripgrep） |

## 支持的 Provider

- **Anthropic** — Claude Opus 4.8 / Sonnet 4.6 / Haiku 4.5
- **OpenAI** — GPT-4o / GPT-4o-mini / o3
- **Google** — Gemini 2.5 Pro / Flash
- **OpenRouter** — 所有主流模型

## 项目结构

```
packages/
  core/    — DB、session、工具系统
  llm/     — 多 Provider + 流式调用循环
  memory/  — 长期记忆 (FTS5 BM25 检索)
  tui/     — Ink (React) TUI，Tokyo Night 风格
```
