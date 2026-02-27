import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import type { AudioQuery } from "../../voicevox/types.js"
import { registerCancellableSynthesisTool } from "./cancellable-synthesis.js"

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

const MOCK_AUDIO_QUERY: AudioQuery = {
  accent_phrases: [],
  speedScale: 1.0,
  pitchScale: 0.0,
  intonationScale: 1.0,
  volumeScale: 1.0,
  prePhonemeLength: 0.1,
  postPhonemeLength: 0.1,
  outputSamplingRate: 24000,
  outputStereo: false,
}

describe("MCP cancellable_synthesize", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("synthesizes and returns the output file path", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "cancellableSynthesize").mockResolvedValue(
      new ArrayBuffer(8),
    )

    const server = buildMockServer()
    registerCancellableSynthesisTool(server as never, "http://localhost:50021")

    const result = await server.tools["cancellable_synthesize"]({
      host: "http://localhost:50021",
      text: "こんにちは",
      speaker: 1,
      output: "/tmp/test-cancellable.wav",
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBe("/tmp/test-cancellable.wav")
    expect(VoiceVoxClient.prototype.createAudioQuery).toHaveBeenCalledWith("こんにちは", 1)
    expect(VoiceVoxClient.prototype.cancellableSynthesize).toHaveBeenCalledWith(MOCK_AUDIO_QUERY, 1)
  })

  it("saves to a temp file when output is not specified", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "cancellableSynthesize").mockResolvedValue(
      new ArrayBuffer(8),
    )

    const server = buildMockServer()
    registerCancellableSynthesisTool(server as never, "http://localhost:50021")

    const result = await server.tools["cancellable_synthesize"]({
      host: "http://localhost:50021",
      text: "テスト",
      speaker: 1,
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toMatch(/voicevox-\d+-[\da-f-]{36}\.wav$/)
  })

  it("returns isError:true when audio query creation fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockRejectedValue(
      new Error("POST /audio_query failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerCancellableSynthesisTool(server as never, "http://localhost:50021")

    const result = await server.tools["cancellable_synthesize"]({
      host: "http://localhost:50021",
      text: "テスト",
      speaker: 1,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })

  it("returns isError:true when cancellable synthesis fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "cancellableSynthesize").mockRejectedValue(
      new Error("POST /cancellable_synthesis failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerCancellableSynthesisTool(server as never, "http://localhost:50021")

    const result = await server.tools["cancellable_synthesize"]({
      host: "http://localhost:50021",
      text: "テスト",
      speaker: 1,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})
