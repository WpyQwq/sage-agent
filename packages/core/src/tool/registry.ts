import type { AnyToolDef } from "./types.js"
import { bash } from "./bash.js"
import { read } from "./read.js"
import { write } from "./write.js"
import { edit } from "./edit.js"
import { glob } from "./glob.js"
import { grep } from "./grep.js"

export const ALL_TOOLS: AnyToolDef[] = [
  bash as AnyToolDef,
  read as AnyToolDef,
  write as AnyToolDef,
  edit as AnyToolDef,
  glob as AnyToolDef,
  grep as AnyToolDef,
]

export function getTool(name: string): AnyToolDef | undefined {
  return ALL_TOOLS.find(t => t.name === name)
}
