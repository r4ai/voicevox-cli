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
    const updateResult = await runCli(
      "setting",
      "set",
      "--cors-policy-mode",
      "all",
      "--host",
      VOICEVOX_HOST,
    )
    expect(updateResult.exitCode).toBe(0)
    expect(updateResult.stdout).toMatch(/Updated setting:/)
    expect(updateResult.stdout).toMatch(/cors_policy_mode:\s+all/)

    // Restore
    await runCli("setting", "set", "--cors-policy-mode", "localapps", "--host", VOICEVOX_HOST)
  })
})
