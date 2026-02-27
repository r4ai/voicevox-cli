import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../voicevox/client.js"
import { singersCommand } from "./singers.js"

const MOCK_SINGERS = [
  {
    name: "四国めたん",
    speaker_uuid: "7ffcb7ce-00ec-4bdc-82cd-45a8889e43ff",
    styles: [
      { name: "ノーマル", id: 6000 },
      { name: "あまあま", id: 6001 },
    ],
    version: "0.14.1",
  },
  {
    name: "ずんだもん",
    speaker_uuid: "388f246b-8c41-4ac1-8e2d-5d79f3ff56d9",
    styles: [{ name: "ノーマル", id: 6002 }],
  },
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

describe("singers command", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(process, "exit").mockImplementation((() => {}) as never)
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("prints singer names and style IDs", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSingers").mockResolvedValue(MOCK_SINGERS)

    await singersCommand.run(makeCtx())

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("四国めたん"))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("6000"))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("ノーマル"))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("ずんだもん"))
  })

  it("includes version in output when available", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSingers").mockResolvedValue(MOCK_SINGERS)

    await singersCommand.run(makeCtx())

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("v0.14.1"))
  })

  it("prints JSON when --json flag is set", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSingers").mockResolvedValue(MOCK_SINGERS)

    await singersCommand.run(makeCtx({ json: true }))

    const firstCall = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(JSON.parse(firstCall)).toEqual(MOCK_SINGERS)
  })

  it("calls handleCommandError when the API fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSingers").mockRejectedValue(
      new Error("GET /singers failed: 500 Internal Server Error"),
    )

    await singersCommand.run(makeCtx())

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("GET /singers failed: 500"))
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
