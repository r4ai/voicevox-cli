import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox initialize-speaker / is-initialized-speaker", () => {
  it("initializes a speaker and confirms it is initialized", async () => {
    const init = await runCli("initialize-speaker", "0", "--host", VOICEVOX_HOST)
    expect(init.exitCode).toBe(0)
    expect(init.stdout).toMatch(/Speaker 0 initialized/)

    const check = await runCli("is-initialized-speaker", "0", "--host", VOICEVOX_HOST)
    expect(check.exitCode).toBe(0)
    expect(check.stdout.trim()).toBe("true")
  })

  it("initialize-speaker with --skip-reinit succeeds on already initialized speaker", async () => {
    await runCli("initialize-speaker", "0", "--host", VOICEVOX_HOST)

    const { stdout, exitCode } = await runCli(
      "initialize-speaker",
      "0",
      "--skip-reinit",
      "--host",
      VOICEVOX_HOST,
    )
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Speaker 0/)
  })

  it("initialize-speaker fails without speaker ID", async () => {
    const { stderr, exitCode } = await runCli("initialize-speaker", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/speaker ID is required/i)
  })

  it("is-initialized-speaker fails without speaker ID", async () => {
    const { stderr, exitCode } = await runCli("is-initialized-speaker", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/speaker ID is required/i)
  })

  it("initialize-speaker fails with non-integer ID", async () => {
    const { stderr, exitCode } = await runCli("initialize-speaker", "abc", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/speaker ID must be an integer/i)
  })
})
