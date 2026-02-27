import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox version", () => {
  it("shows engine version and core versions", async () => {
    const { stdout, exitCode } = await runCli("version", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Engine version: .+/)
    expect(stdout).toMatch(/Core versions: .+/)
  })
})
