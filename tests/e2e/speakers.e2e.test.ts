import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox speakers", () => {
  it("lists speakers with names and style IDs", async () => {
    const { stdout, exitCode } = await runCli("speakers", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/uuid: .+/)
    expect(stdout).toMatch(/\[\d+\]/)
  })

  it("outputs JSON with --json", async () => {
    const { stdout, exitCode } = await runCli("speakers", "--host", VOICEVOX_HOST, "--json")
    expect(exitCode).toBe(0)
    const speakers = JSON.parse(stdout)
    expect(Array.isArray(speakers)).toBe(true)
    expect(speakers.length).toBeGreaterThan(0)
    expect(speakers[0]).toHaveProperty("name")
    expect(speakers[0]).toHaveProperty("speaker_uuid")
    expect(speakers[0]).toHaveProperty("styles")
  })

  it("shows version and morphing info with --info", async () => {
    const { stdout, exitCode } = await runCli("speakers", "--host", VOICEVOX_HOST, "--info")
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/morphing:/)
  })
})
