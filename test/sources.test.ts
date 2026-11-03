import { readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { projectDir } from "../shared/dir"
import { originSources } from "../shared/pre-sources"
import { fixedColumnIds, metadata } from "../shared/metadata"

const sourceFiles = readdirSync(join(projectDir, "server/sources"))
  .filter(f => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map(f => f.replace(/\.ts$/, ""))

describe("source registry", () => {
  it("every getter file is registered in pre-sources", () => {
    const unregistered = sourceFiles.filter(id => !(id in originSources))
    expect(unregistered).toEqual([])
  })

  it("every registered source has a getter file", () => {
    const missing = Object.keys(originSources).filter(id => !sourceFiles.includes(id))
    expect(missing).toEqual([])
  })

  it("every fixed column has at least one source except focus", () => {
    const empty = fixedColumnIds.filter(id => id !== "focus" && !metadata[id].sources.length)
    expect(empty).toEqual([])
  })
})
