import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox query", () => {
  it("returns AudioQuery JSON for given text", async () => {
    const { stdout, exitCode } = await runCli("query", "こんにちは", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
    const query = JSON.parse(stdout)
    expect(query).toHaveProperty("accent_phrases")
    expect(query).toHaveProperty("speedScale")
    expect(query).toHaveProperty("pitchScale")
  })

  it("accepts --speaker option", async () => {
    const { stdout, exitCode } = await runCli(
      "query",
      "テスト",
      "--speaker",
      "0",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    const query = JSON.parse(stdout)
    expect(query).toHaveProperty("accent_phrases")
  })

  it("fails without text argument", async () => {
    const { stderr, exitCode } = await runCli("query", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/text argument is required/i)
  })
})
