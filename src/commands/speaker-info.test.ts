import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../voicevox/client.js"
import { speakerInfoCommand } from "./speaker-info.js"

const MOCK_SPEAKER_INFO = {
  policy: "このキャラクターの利用にはポリシーへの同意が必要です。",
  portrait: "base64encodedportrait==",
  style_infos: [
    {
      id: 0,
      icon: "base64encodedicon==",
      voice_samples: ["base64sample1==", "base64sample2=="],
    },
    {
      id: 1,
      icon: "base64encodedicon2==",
      voice_samples: ["base64sample3=="],
    },
  ],
}

function makeCtx(uuid: string | undefined, opts: { host?: string; json?: boolean } = {}) {
  return {
    positionals: uuid !== undefined ? [uuid] : [],
    values: {
      host: opts.host ?? "http://localhost:50021",
      json: opts.json ?? false,
    },
  } as never
}

describe("speaker-info command", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(process, "exit").mockImplementation((() => {}) as never)
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("prints policy and style count for a valid UUID", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    await speakerInfoCommand.run(makeCtx("test-uuid"))

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("このキャラクターの利用にはポリシーへの同意が必要です。"),
    )
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("2 voice sample(s)"))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("1 voice sample(s)"))
  })

  it("prints JSON when --json flag is set", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    await speakerInfoCommand.run(makeCtx("test-uuid", { json: true }))

    const firstCall = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(JSON.parse(firstCall)).toEqual(MOCK_SPEAKER_INFO)
  })

  it("prints error and exits when UUID is not provided", async () => {
    await speakerInfoCommand.run(makeCtx(undefined))

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("speaker UUID is required"))
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it("calls handleCommandError when the API fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockRejectedValue(
      new Error("GET /speaker_info failed: 404 Not Found"),
    )

    await speakerInfoCommand.run(makeCtx("unknown-uuid"))

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("GET /speaker_info failed: 404"),
    )
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
