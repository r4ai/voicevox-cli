import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox singers", () => {
  it("lists singers", async () => {
    const { stdout, exitCode } = await runCli("singers", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/uuid: .+/)
  })

  it("outputs JSON with --json", async () => {
    const { stdout, exitCode } = await runCli("singers", "--host", VOICEVOX_HOST, "--json")
    expect(exitCode).toBe(0)
    const singers = JSON.parse(stdout)
    expect(Array.isArray(singers)).toBe(true)
    expect(singers.length).toBeGreaterThan(0)
    expect(singers[0]).toHaveProperty("name")
    expect(singers[0]).toHaveProperty("speaker_uuid")
  })
})
