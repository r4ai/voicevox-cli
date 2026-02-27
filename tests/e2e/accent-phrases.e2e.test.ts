import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox accent-phrases", () => {
  it("returns accent phrases JSON for given text", async () => {
    const { stdout, exitCode } = await runCli(
      "accent-phrases",
      "こんにちは",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    const phrases = JSON.parse(stdout)
    expect(Array.isArray(phrases)).toBe(true)
    expect(phrases.length).toBeGreaterThan(0)
    expect(phrases[0]).toHaveProperty("moras")
  })

  it("accepts --is-kana flag with katakana input", async () => {
    const { stdout, exitCode } = await runCli(
      "accent-phrases",
      "コンニチワ'",
      "--is-kana",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    const phrases = JSON.parse(stdout)
    expect(Array.isArray(phrases)).toBe(true)
  })

  it("accepts --speaker option", async () => {
    const { stdout, exitCode } = await runCli(
      "accent-phrases",
      "テスト",
      "--speaker",
      "0",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    const phrases = JSON.parse(stdout)
    expect(Array.isArray(phrases)).toBe(true)
  })

  it("fails without text argument", async () => {
    const { stderr, exitCode } = await runCli("accent-phrases", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/text argument is required/i)
  })
})
