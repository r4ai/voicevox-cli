import { randomUUID } from "node:crypto"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import type { AudioQuery } from "../../voicevox/types.js"
import {
  registerConnectWavesTool,
  registerMultiSynthesizeTool,
  registerSynthesisMorphingTool,
} from "./advanced-synthesis.js"

async function writeTempWav(name: string, data: Buffer): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "voicevox-test-"))
  const path = join(dir, `${name}-${randomUUID()}.wav`)
  await writeFile(path, data)
  return path
}

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

describe("MCP multi_synthesize", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("synthesizes multiple texts and returns the output file path", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "multiSynthesize").mockResolvedValue(new ArrayBuffer(8))

    const server = buildMockServer()
    registerMultiSynthesizeTool(server as never, "http://localhost:50021")

    const result = await server.tools["multi_synthesize"]({
      host: "http://localhost:50021",
      texts: ["こんにちは", "さようなら"],
      speaker: 1,
      output: "/tmp/test-multi.wav",
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBe("/tmp/test-multi.wav")
    expect(VoiceVoxClient.prototype.createAudioQuery).toHaveBeenCalledTimes(2)
    expect(VoiceVoxClient.prototype.createAudioQuery).toHaveBeenCalledWith("こんにちは", 1)
    expect(VoiceVoxClient.prototype.createAudioQuery).toHaveBeenCalledWith("さようなら", 1)
    expect(VoiceVoxClient.prototype.multiSynthesize).toHaveBeenCalledWith(
      [MOCK_AUDIO_QUERY, MOCK_AUDIO_QUERY],
      1,
    )
  })

  it("saves to a temp file when output is not specified", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "multiSynthesize").mockResolvedValue(new ArrayBuffer(8))

    const server = buildMockServer()
    registerMultiSynthesizeTool(server as never, "http://localhost:50021")

    const result = await server.tools["multi_synthesize"]({
      host: "http://localhost:50021",
      texts: ["テスト"],
      speaker: 1,
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toMatch(/voicevox-multi-\d+-[\da-f-]{36}\.wav$/)
  })

  it("returns isError:true when audio query creation fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockRejectedValue(
      new Error("POST /audio_query failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerMultiSynthesizeTool(server as never, "http://localhost:50021")

    const result = await server.tools["multi_synthesize"]({
      host: "http://localhost:50021",
      texts: ["テスト"],
      speaker: 1,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })

  it("returns isError:true when multi_synthesis fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "multiSynthesize").mockRejectedValue(
      new Error("POST /multi_synthesis failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerMultiSynthesizeTool(server as never, "http://localhost:50021")

    const result = await server.tools["multi_synthesize"]({
      host: "http://localhost:50021",
      texts: ["テスト"],
      speaker: 1,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})

describe("MCP synthesis_morphing", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("synthesizes with morphing and returns the output file path", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "synthesisMorphing").mockResolvedValue(new ArrayBuffer(8))

    const server = buildMockServer()
    registerSynthesisMorphingTool(server as never, "http://localhost:50021")

    const result = await server.tools["synthesis_morphing"]({
      host: "http://localhost:50021",
      text: "こんにちは",
      base_speaker: 1,
      target_speaker: 3,
      morph_rate: 0.5,
      output: "/tmp/test-morph.wav",
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBe("/tmp/test-morph.wav")
    expect(VoiceVoxClient.prototype.createAudioQuery).toHaveBeenCalledWith("こんにちは", 1)
    expect(VoiceVoxClient.prototype.synthesisMorphing).toHaveBeenCalledWith(
      MOCK_AUDIO_QUERY,
      1,
      3,
      0.5,
    )
  })

  it("saves to a temp file when output is not specified", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "synthesisMorphing").mockResolvedValue(new ArrayBuffer(8))

    const server = buildMockServer()
    registerSynthesisMorphingTool(server as never, "http://localhost:50021")

    const result = await server.tools["synthesis_morphing"]({
      host: "http://localhost:50021",
      text: "テスト",
      base_speaker: 1,
      target_speaker: 2,
      morph_rate: 0.5,
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toMatch(/voicevox-morph-\d+-[\da-f-]{36}\.wav$/)
  })

  it("returns isError:true when query creation fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockRejectedValue(
      new Error("POST /audio_query failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerSynthesisMorphingTool(server as never, "http://localhost:50021")

    const result = await server.tools["synthesis_morphing"]({
      host: "http://localhost:50021",
      text: "テスト",
      base_speaker: 1,
      target_speaker: 2,
      morph_rate: 0.5,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })

  it("returns isError:true when morphing synthesis fails", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "createAudioQuery").mockResolvedValue(MOCK_AUDIO_QUERY)
    vi.spyOn(VoiceVoxClient.prototype, "synthesisMorphing").mockRejectedValue(
      new Error("POST /synthesis_morphing failed: 400 Bad Request"),
    )

    const server = buildMockServer()
    registerSynthesisMorphingTool(server as never, "http://localhost:50021")

    const result = await server.tools["synthesis_morphing"]({
      host: "http://localhost:50021",
      text: "テスト",
      base_speaker: 1,
      target_speaker: 2,
      morph_rate: 0.5,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})

describe("MCP connect_waves", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("reads input files, base64-encodes them, calls connectWaves, and returns the output file path", async () => {
    const fakeWavBuf = Buffer.from("RIFF")
    const inputA = await writeTempWav("test-a.wav", fakeWavBuf)
    const inputB = await writeTempWav("test-b.wav", fakeWavBuf)
    const outputPath = join(tmpdir(), "test-connected.wav")

    vi.spyOn(VoiceVoxClient.prototype, "connectWaves").mockResolvedValue(new ArrayBuffer(16))

    const server = buildMockServer()
    registerConnectWavesTool(server as never, "http://localhost:50021")

    const result = await server.tools["connect_waves"]({
      host: "http://localhost:50021",
      input_files: [inputA, inputB],
      output: outputPath,
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBe(outputPath)
    expect(VoiceVoxClient.prototype.connectWaves).toHaveBeenCalledWith([
      fakeWavBuf.toString("base64"),
      fakeWavBuf.toString("base64"),
    ])
  })

  it("saves to a temp file when output is not specified", async () => {
    const fakeWavBuf = Buffer.from("RIFF")
    const inputA = await writeTempWav("test-a2.wav", fakeWavBuf)
    const inputB = await writeTempWav("test-b2.wav", fakeWavBuf)

    vi.spyOn(VoiceVoxClient.prototype, "connectWaves").mockResolvedValue(new ArrayBuffer(16))

    const server = buildMockServer()
    registerConnectWavesTool(server as never, "http://localhost:50021")

    const result = await server.tools["connect_waves"]({
      host: "http://localhost:50021",
      input_files: [inputA, inputB],
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toMatch(/voicevox-connected-\d+-[\da-f-]{36}\.wav$/)
  })

  it("returns isError:true when a file does not exist", async () => {
    const server = buildMockServer()
    registerConnectWavesTool(server as never, "http://localhost:50021")

    const result = await server.tools["connect_waves"]({
      host: "http://localhost:50021",
      input_files: ["/nonexistent/a.wav", "/nonexistent/b.wav"],
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })

  it("returns isError:true when connect_waves API call fails", async () => {
    const fakeWavBuf = Buffer.from("RIFF")
    const inputA = await writeTempWav("test-a3.wav", fakeWavBuf)
    const inputB = await writeTempWav("test-b3.wav", fakeWavBuf)

    vi.spyOn(VoiceVoxClient.prototype, "connectWaves").mockRejectedValue(
      new Error("POST /connect_waves failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerConnectWavesTool(server as never, "http://localhost:50021")

    const result = await server.tools["connect_waves"]({
      host: "http://localhost:50021",
      input_files: [inputA, inputB],
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})
