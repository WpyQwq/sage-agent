#!/usr/bin/env node
import React from "react"
import { render } from "ink"
import { App } from "./app.js"
import { getDb, loadConfig } from "@sage/core"

getDb()
loadConfig()

const { unmount } = render(<App />, { exitOnCtrlC: false })

process.on("SIGINT", () => { unmount(); process.exit(0) })
process.on("SIGTERM", () => { unmount(); process.exit(0) })
