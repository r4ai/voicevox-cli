import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox validate-kana", () => {
  it("validates correct AquesTalk-style kana", async () => {
    const { stdout, exitCode } = await runCli(
      "validate-kana",
      "コンニチワ'",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Valid/)
  })

  it("rejects invalid kana notation", async () => {
    const { stderr, exitCode } = await runCli("validate-kana", "hello", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/Invalid kana/i)
  })

  it("fails without text argument", async () => {
    const { stderr, exitCode } = await runCli("validate-kana", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/text argument is required/i)
  })
})
