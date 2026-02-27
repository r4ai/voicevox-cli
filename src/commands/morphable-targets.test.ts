import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../voicevox/client.js"
import type { MorphableTargetInfo } from "../voicevox/types.js"
import { morphableTargetsCommand } from "./morphable-targets.js"

const MOCK_SPEAKERS = [
  {
    name: "四国めたん",
    speaker_uuid: "uuid-1",
    styles: [
      { name: "ノーマル", id: 1 },
      { name: "あまあま", id: 2 },
    ],
    version: "0.14.1",
  },
  {
    name: "ずんだもん",
    speaker_uuid: "uuid-2",
    styles: [{ name: "ノーマル", id: 3 }],
  },
]

const MOCK_TARGETS: Record<string, MorphableTargetInfo>[] = [
  { "1": { is_morphable: true }, "2": { is_morphable: false } },
  { "3": { is_morphable: true } },
  { "1": { is_morphable: false } },
]

function makeCtx(opts: { host?: string; json?: boolean } = {}) {
  return {
    positionals: [],
    values: {
      host: opts.host ?? "http://localhost:50021",
      json: opts.json ?? false,
    },
  } as never
}

describe("morphable-targets command", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(process, "exit").mockImplementation((() => {}) as never)
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("requests morphable targets with base style IDs", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakers").mockResolvedValue(MOCK_SPEAKERS)
    vi.spyOn(VoiceVoxClient.prototype, "getMorphableTargets").mockResolvedValue(MOCK_TARGETS)

    await morphableTargetsCommand.run(makeCtx())

    expect(VoiceVoxClient.prototype.getMorphableTargets).toHaveBeenCalledWith([1, 2, 3])
    expect(console.log).toHaveBeenCalledWith("base style 1:")
    expect(console.log).toHaveBeenCalledWith("  style 1: morphable")
    expect(console.log).toHaveBeenCalledWith("  style 2: not morphable")
    expect(console.log).toHaveBeenCalledWith("base style 3:")
  })

  it("prints JSON with base_style_ids and targets when --json is set", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakers").mockResolvedValue(MOCK_SPEAKERS)
    vi.spyOn(VoiceVoxClient.prototype, "getMorphableTargets").mockResolvedValue(MOCK_TARGETS)

    await morphableTargetsCommand.run(makeCtx({ json: true }))

    const firstCall = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(JSON.parse(firstCall)).toEqual({
      base_style_ids: [1, 2, 3],
      targets: MOCK_TARGETS,
    })
  })

  it("calls handleCommandError when the API fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakers").mockRejectedValue(
      new Error("GET /speakers failed: 500 Internal Server Error"),
    )

    await morphableTargetsCommand.run(makeCtx())

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("GET /speakers failed: 500"))
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
