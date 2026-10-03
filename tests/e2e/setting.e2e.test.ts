import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox setting", () => {
  it("shows current setting", async () => {
    const { stdout, exitCode } = await runCli("setting", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/cors_policy_mode:/)
    expect(stdout).toMatch(/allow_origin:/)
  })

  it("outputs JSON with --json", async () => {
    const { stdout, exitCode } = await runCli("setting", "--host", VOICEVOX_HOST, "--json")
    expect(exitCode).toBe(0)
    const setting = JSON.parse(stdout)
    expect(setting).toHaveProperty("cors_policy_mode")
  })

  it("updates setting with 'set' subcommand and restores", async () => {
    const originalResult = await runCli("setting", "--host", VOICEVOX_HOST, "--json")
    expect(originalResult.exitCode).toBe(0)
    const original = JSON.parse(originalResult.stdout)

    try {
      const updateResult = await runCli(
        "setting",
        "set",
        "--cors-policy-mode",
        "localapps",
        "--host",
        VOICEVOX_HOST,
      )
      expect(updateResult.exitCode).toBe(0)
      expect(updateResult.stdout).toMatch(/Updated setting:/)
      expect(updateResult.stdout).toMatch(/cors_policy_mode:\s+localapps/)
    } finally {
      const restored = await runCli(
        "setting",
        "set",
        "--cors-policy-mode",
        original.cors_policy_mode,
        "--host",
        VOICEVOX_HOST,
      )
      expect(restored.exitCode).toBe(0)
      const result = await runCli("setting", "--host", VOICEVOX_HOST, "--json")
      expect(result.exitCode).toBe(0)
      expect(JSON.parse(result.stdout)).toEqual(original)
    }
  })
})
