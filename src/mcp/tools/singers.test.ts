import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import type { FrameAudioQuery, Score } from "../../voicevox/types.js"
import { registerListSingersTool, registerSingTool } from "./singers.js"

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[]
  isError?: boolean
}>

function buildMockServer() {
  const tools: Record<string, ToolHandler> = {}
  const server = {
    registerTool: (_name: string, _schema: unknown, handler: ToolHandler) => {
      tools[_name] = handler
    },
    tools,
  }
  return server
}

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
]

const MOCK_SCORE: Score = {
  notes: [{ key: 60, frame_length: 10, lyric: "ど" }],
  tempos: [{ position: 0, bpm: 120 }],
  time_signatures: [{ measure_count: 1, beat_type: 4, beats: 4 }],
}

const MOCK_FRAME_AUDIO_QUERY: FrameAudioQuery = {
  f0: [440.0, 440.0],
  volume: [1.0, 1.0],
  phonemes: [{ phoneme: "d", frame_length: 5 }],
  volumeScale: 1.0,
  outputSamplingRate: 24000,
  outputStereo: false,
}

describe("MCP list_singers", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns singers list as JSON", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSingers").mockResolvedValue(MOCK_SINGERS)

    const server = buildMockServer()
    registerListSingersTool(server as never, "http://localhost:50021")

    const result = await server.tools["list_singers"]({ host: "http://localhost:50021" })

    expect(result.isError).toBeUndefined()
    expect(JSON.parse(result.content[0].text)).toEqual(MOCK_SINGERS)
  })

  it("returns isError:true when the engine is unreachable", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSingers").mockRejectedValue(
      new Error("GET /singers failed: 500 Internal Server Error"),
    )

    const server = buildMockServer()
    registerListSingersTool(server as never, "http://localhost:50021")

    const result = await server.tools["list_singers"]({ host: "http://localhost:50021" })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })

  it("uses the provided host when calling the client", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(MOCK_SINGERS), { status: 200 }))

    const server = buildMockServer()
    registerListSingersTool(server as never, "http://localhost:50021")

    await server.tools["list_singers"]({ host: "http://custom-host:9999" })

    const calledUrls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(calledUrls.every((u) => u.startsWith("http://custom-host:9999"))).toBe(true)
  })
})

describe("MCP sing", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("synthesizes a song and returns the output file path", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createSingFrameAudioQuery").mockResolvedValue(
      MOCK_FRAME_AUDIO_QUERY,
    )
    vi.spyOn(VoiceVoxClient.prototype, "frameSynthesis").mockResolvedValue(
      new ArrayBuffer(8) as ArrayBuffer,
    )

    const server = buildMockServer()
    registerSingTool(server as never, "http://localhost:50021")

    const result = await server.tools["sing"]({
      host: "http://localhost:50021",
      score: MOCK_SCORE,
      singer: 6000,
      output: "/tmp/test-song.wav",
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBe("/tmp/test-song.wav")
    expect(VoiceVoxClient.prototype.createSingFrameAudioQuery).toHaveBeenCalledWith(
      MOCK_SCORE,
      6000,
    )
    expect(VoiceVoxClient.prototype.frameSynthesis).toHaveBeenCalledWith(
      MOCK_FRAME_AUDIO_QUERY,
      6000,
    )
  })

  it("saves to a temp file when output is not specified", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createSingFrameAudioQuery").mockResolvedValue(
      MOCK_FRAME_AUDIO_QUERY,
    )
    vi.spyOn(VoiceVoxClient.prototype, "frameSynthesis").mockResolvedValue(new ArrayBuffer(8))

    const server = buildMockServer()
    registerSingTool(server as never, "http://localhost:50021")

    const result = await server.tools["sing"]({
      host: "http://localhost:50021",
      score: MOCK_SCORE,
      singer: 6000,
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toMatch(/voicevox-sing-\d+\.wav$/)
  })

  it("returns isError:true when query creation fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createSingFrameAudioQuery").mockRejectedValue(
      new Error("POST /sing_frame_audio_query failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerSingTool(server as never, "http://localhost:50021")

    const result = await server.tools["sing"]({
      host: "http://localhost:50021",
      score: MOCK_SCORE,
      singer: 6000,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })

  it("returns isError:true when frame synthesis fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createSingFrameAudioQuery").mockResolvedValue(
      MOCK_FRAME_AUDIO_QUERY,
    )
    vi.spyOn(VoiceVoxClient.prototype, "frameSynthesis").mockRejectedValue(
      new Error("POST /frame_synthesis failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerSingTool(server as never, "http://localhost:50021")

    const result = await server.tools["sing"]({
      host: "http://localhost:50021",
      score: MOCK_SCORE,
      singer: 6000,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})
