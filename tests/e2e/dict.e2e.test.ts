import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { cleanDir, makeTmpDir, runCli, VOICEVOX_HOST } from "./helpers.js"

describe("voicevox dict", () => {
  let tmpDir: string

  afterEach(async () => {
    if (tmpDir) await cleanDir(tmpDir)
  })

  it("lists user dictionary", async () => {
    const { exitCode } = await runCli("dict", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(0)
  })

  it("outputs JSON with --json", async () => {
    const { stdout, exitCode } = await runCli("dict", "--host", VOICEVOX_HOST, "--json")
    expect(exitCode).toBe(0)
    const dict = JSON.parse(stdout)
    expect(typeof dict).toBe("object")
  })

  it("performs full CRUD lifecycle: add → list → update → delete", async () => {
    const addResult = await runCli(
      "dict",
      "add",
      "テスト単語",
      "テストタンゴ",
      "--host",
      VOICEVOX_HOST,
    )
    expect(addResult.exitCode).toBe(0)
    expect(addResult.stdout).toMatch(/Added: .+/)
    const uuid = addResult.stdout.match(/Added: (.+)/)?.[1]?.trim()
    expect(uuid).toBeTruthy()

    const listResult = await runCli("dict", "--host", VOICEVOX_HOST, "--json")
    expect(listResult.exitCode).toBe(0)
    const dict = JSON.parse(listResult.stdout)
    expect(dict).toHaveProperty(uuid!)

    const updateResult = await runCli(
      "dict",
      "update",
      uuid!,
      "--surface",
      "テスト更新",
      "--pronunciation",
      "テストコウシン",
      "--host",
      VOICEVOX_HOST,
    )
    expect(updateResult.exitCode).toBe(0)
    expect(updateResult.stdout).toMatch(/Updated:/)

    const deleteResult = await runCli("dict", "delete", uuid!, "--host", VOICEVOX_HOST)
    expect(deleteResult.exitCode).toBe(0)
    expect(deleteResult.stdout).toMatch(/Deleted:/)

    const afterDelete = await runCli("dict", "--host", VOICEVOX_HOST, "--json")
    const dictAfter = JSON.parse(afterDelete.stdout)
    expect(dictAfter).not.toHaveProperty(uuid!)
  })

  it("dict add with options", async () => {
    const addResult = await runCli(
      "dict",
      "add",
      "固有名詞",
      "コユウメイシ",
      "--accent-type",
      "1",
      "--word-type",
      "PROPER_NOUN",
      "--priority",
      "8",
      "--host",
      VOICEVOX_HOST,
    )
    expect(addResult.exitCode).toBe(0)
    const uuid = addResult.stdout.match(/Added: (.+)/)?.[1]?.trim()

    await runCli("dict", "delete", uuid!, "--host", VOICEVOX_HOST)
  })

  it("dict import from JSON file", async () => {
    tmpDir = await makeTmpDir()

    // Add a word, export the dict, delete the word, then reimport
    const addResult = await runCli(
      "dict",
      "add",
      "インポートテスト",
      "インポートテスト",
      "--host",
      VOICEVOX_HOST,
    )
    expect(addResult.exitCode).toBe(0)
    const uuid = addResult.stdout.match(/Added: (.+)/)?.[1]?.trim()
    expect(uuid).toBeTruthy()

    const dictJson = (await runCli("dict", "--host", VOICEVOX_HOST, "--json")).stdout

    await runCli("dict", "delete", uuid!, "--host", VOICEVOX_HOST)

    const filePath = join(tmpDir, "dict.json")
    await writeFile(filePath, dictJson)

    const importResult = await runCli("dict", "import", filePath, "--host", VOICEVOX_HOST)
    expect(importResult.exitCode).toBe(0)
    expect(importResult.stdout).toMatch(/Imported from:/)

    // Cleanup: delete the re-imported word
    await runCli("dict", "delete", uuid!, "--host", VOICEVOX_HOST)
  })

  it("dict add fails without required arguments", async () => {
    const { stderr, exitCode } = await runCli("dict", "add", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/surface and pronunciation arguments are required/i)
  })

  it("dict delete fails without uuid argument", async () => {
    const { stderr, exitCode } = await runCli("dict", "delete", "--host", VOICEVOX_HOST)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/uuid argument is required/i)
  })
})
