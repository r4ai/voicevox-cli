import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox morphable-targets", () => {
  it("shows morphable targets in text format", async () => {
    const { stdout, exitCode } = await runCli("morphable-targets", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/base style \d+:/)
  })

  it("outputs JSON with --json", async () => {
    const { stdout, exitCode } = await runCli(
      "morphable-targets",
      "--host",
      VOICEVOX_HOST,
      "--json",
    )
    expect(exitCode).toBe(0)
    const data = JSON.parse(stdout)
    expect(data).toHaveProperty("base_style_ids")
    expect(data).toHaveProperty("targets")
  })
})
