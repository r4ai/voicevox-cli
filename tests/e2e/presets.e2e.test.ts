import { describe, expect, it } from "vitest"
import { runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox presets", () => {
  it("lists presets", async () => {
    const { exitCode } = await runCli("presets", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
  })

  it("outputs JSON with --json", async () => {
    const { stdout, exitCode } = await runCli("presets", "--host", VOICEVOX_HOST, "--json")
    expect(exitCode).toBe(0)
    const presets = JSON.parse(stdout)
    expect(Array.isArray(presets)).toBe(true)
  })

  it("performs full CRUD lifecycle: add → list → update → delete", async () => {
    const speakers = JSON.parse(
      (await runCli("speakers", "--host", VOICEVOX_HOST, "--json")).stdout,
    )
    const speakerUuid = speakers[0].speaker_uuid as string

    const addResult = await runCli(
      "presets",
      "add",
      "--name",
      "E2Eテストプリセット",
      "--speaker-uuid",
      speakerUuid,
      "--style-id",
      "0",
      "--speed",
      "1.2",
      "--pitch",
      "0.1",
      "--intonation",
      "1.0",
      "--volume",
      "1.0",
      "--pre-phoneme-length",
      "0.1",
      "--post-phoneme-length",
      "0.1",
      "--host",
      VOICEVOX_HOST,
    )
    expect(addResult.exitCode).toBe(0)
    expect(addResult.stdout).toMatch(/Added preset: id=\d+/)
    const id = addResult.stdout.match(/id=(\d+)/)?.[1]
    expect(id).toBeTruthy()

    const listResult = await runCli("presets", "--host", VOICEVOX_HOST, "--json")
    const presets = JSON.parse(listResult.stdout)
    const found = presets.find((p: { id: number }) => p.id === Number(id))
    expect(found).toBeTruthy()
    expect(found.name).toBe("E2Eテストプリセット")

    const updateResult = await runCli(
      "presets",
      "update",
      id!,
      "--name",
      "更新テスト",
      "--speed",
      "1.5",
      "--host",
      VOICEVOX_HOST,
    )
    expect(updateResult.exitCode).toBe(0)
    expect(updateResult.stdout).toMatch(/Updated preset:/)

    const deleteResult = await runCli("presets", "delete", id!, "--host", VOICEVOX_HOST)
    expect(deleteResult.exitCode).toBe(0)
    expect(deleteResult.stdout).toMatch(/Deleted preset:/)
  })

  it("presets add fails without required options", async () => {
    const { stderr, exitCode } = await runCli("presets", "add", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/--name and --speaker-uuid are required/i)
  })

  it("presets delete fails without id argument", async () => {
    const { stderr, exitCode } = await runCli("presets", "delete", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/id argument is required/i)
  })
})
