import { existsSync } from "node:fs"
import { rm } from "node:fs/promises"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { cleanDir, makeTmpDir, runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox speak", () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await cleanDir(tmpDir)
    const defaultOut = "output.wav"
    if (existsSync(defaultOut)) await rm(defaultOut)
  })

  it("synthesizes text and saves a WAV file", async () => {
    tmpDir = await makeTmpDir()
    const out = join(tmpDir, "test.wav")
    const { stdout, exitCode } = await runCli(
      "speak",
      "こんにちは",
      "--output",
      out,
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Saved:/)
    expect(existsSync(out)).toBe(true)
  })

  it("uses --speaker option", async () => {
    tmpDir = await makeTmpDir()
    const out = join(tmpDir, "speaker.wav")
    const { stdout, exitCode } = await runCli(
      "speak",
      "テスト",
      "--speaker",
      "0",
      "--output",
      out,
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Saved:/)
    expect(existsSync(out)).toBe(true)
  })

  it("fails without text argument", async () => {
    const { stderr, exitCode } = await runCli("speak", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/text argument is required/i)
  })

  it("fails when --morph-rate is given without --morph-target", async () => {
    const { stderr, exitCode } = await runCli(
      "speak",
      "テスト",
      "--morph-rate",
      "0.5",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/--morph-rate requires --morph-target/i)
  })

  it("fails when --morph-rate is out of range", async () => {
    const { stderr, exitCode } = await runCli(
      "speak",
      "テスト",
      "--morph-target",
      "3",
      "--morph-rate",
      "1.5",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/--morph-rate must be between/i)
  })

  it("fails when --preset and --morph-target are both given", async () => {
    const { stderr, exitCode } = await runCli(
      "speak",
      "テスト",
      "--preset",
      "1",
      "--morph-target",
      "3",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/--preset cannot be used with --morph-target/i)
  })

  it("synthesizes with --morph-target", async () => {
    tmpDir = await makeTmpDir()
    const out = join(tmpDir, "morph.wav")
    const { stdout, exitCode } = await runCli(
      "speak",
      "テスト",
      "--morph-target",
      "3",
      "--morph-rate",
      "0.5",
      "--output",
      out,
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Saved:/)
    expect(existsSync(out)).toBe(true)
  })
})
