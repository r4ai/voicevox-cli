import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox speaker-info", () => {
  it("shows speaker details for a valid UUID", async () => {
    const speakers = JSON.parse(
      (await runCli("speakers", "--host", VOICEVOX_HOST, "--json")).stdout,
    )
    const uuid = speakers[0].speaker_uuid as string

    const { stdout, exitCode } = await runCli("speaker-info", uuid, "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Policy:/)
    expect(stdout).toMatch(/Styles:/)
    expect(stdout).toMatch(/voice sample/)
  })

  it("outputs JSON with --json", async () => {
    const speakers = JSON.parse(
      (await runCli("speakers", "--host", VOICEVOX_HOST, "--json")).stdout,
    )
    const uuid = speakers[0].speaker_uuid as string

    const { stdout, exitCode } = await runCli(
      "speaker-info",
      uuid,
      "--host",
      VOICEVOX_HOST,
      "--json",
    )
    expect(exitCode).toBe(0)
    const info = JSON.parse(stdout)
    expect(info).toHaveProperty("policy")
    expect(info).toHaveProperty("style_infos")
  })

  it("fails without UUID argument", async () => {
    const { stderr, exitCode } = await runCli("speaker-info", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/speaker UUID is required/i)
  })
})
