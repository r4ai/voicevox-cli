import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox info", () => {
  it("shows engine manifest and supported devices", async () => {
    const { stdout, exitCode } = await runCli("info", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Engine: .+/)
    expect(stdout).toMatch(/UUID: .+/)
    expect(stdout).toMatch(/Supported devices:/)
    expect(stdout).toMatch(/CPU: .+/)
  })

  it("outputs JSON with --json", async () => {
    const { stdout, exitCode } = await runCli("info", "--host", VOICEVOX_HOST, "--json")
    expect(exitCode).toBe(0)
    const data = JSON.parse(stdout)
    expect(data).toHaveProperty("manifest")
    expect(data).toHaveProperty("supported_devices")
  })
})
