import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import { registerSpeakerInfoTool } from "./speaker-info.js"

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

const MOCK_SPEAKER_INFO = {
  policy: "このキャラクターの利用にはポリシーへの同意が必要です。",
  portrait: "base64encodedportrait==",
  style_infos: [
    {
      id: 0,
      icon: "base64encodedicon==",
      portrait: "base64styleportrait==",
      voice_samples: ["base64sample1==", "base64sample2=="],
    },
  ],
}

describe("MCP get_speaker_info", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns only policy and style_icons by default (no portrait, no voice_samples)", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    // Default: sections=["policy", "style_icons"], resource_format="url"
    const result = await server.tools["get_speaker_info"]({
      host: "http://localhost:50021",
      speaker_uuid: "test-uuid",
      sections: ["policy", "style_icons"],
      resource_format: "url",
    })

    expect(result.isError).toBeUndefined()
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.policy).toBe(MOCK_SPEAKER_INFO.policy)
    expect(parsed.portrait).toBeUndefined()
    expect(parsed.style_infos).toHaveLength(1)
    expect(parsed.style_infos[0].icon).toBe(MOCK_SPEAKER_INFO.style_infos[0].icon)
    expect(parsed.style_infos[0].voice_samples).toBeUndefined()
    expect(VoiceVoxClient.prototype.getSpeakerInfo).toHaveBeenCalledWith("test-uuid", "url")
  })

  it('returns only policy text when sections=["policy"]', async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_speaker_info"]({
      host: "http://localhost:50021",
      speaker_uuid: "uuid-1",
      sections: ["policy"],
      resource_format: "url",
    })

    expect(result.isError).toBeUndefined()
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.policy).toBe(MOCK_SPEAKER_INFO.policy)
    expect(parsed.portrait).toBeUndefined()
    expect(parsed.style_infos).toBeUndefined()
  })

  it('returns portrait when sections=["portrait"]', async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_speaker_info"]({
      host: "http://localhost:50021",
      speaker_uuid: "uuid-1",
      sections: ["portrait"],
      resource_format: "url",
    })

    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.portrait).toBe(MOCK_SPEAKER_INFO.portrait)
    expect(parsed.policy).toBeUndefined()
    expect(parsed.style_infos).toBeUndefined()
  })

  it('returns voice_samples only in style_infos when sections=["voice_samples"]', async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_speaker_info"]({
      host: "http://localhost:50021",
      speaker_uuid: "uuid-1",
      sections: ["voice_samples"],
      resource_format: "base64",
    })

    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.style_infos).toHaveLength(1)
    expect(parsed.style_infos[0].voice_samples).toEqual(
      MOCK_SPEAKER_INFO.style_infos[0].voice_samples,
    )
    expect(parsed.style_infos[0].icon).toBeUndefined()
    expect(parsed.portrait).toBeUndefined()
  })

  it("passes resource_format=base64 to client when specified", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    await server.tools["get_speaker_info"]({
      host: "http://localhost:50021",
      speaker_uuid: "uuid-1",
      sections: ["policy"],
      resource_format: "base64",
    })

    expect(VoiceVoxClient.prototype.getSpeakerInfo).toHaveBeenCalledWith("uuid-1", "base64")
  })

  it("returns isError:true when the engine is unreachable", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockRejectedValue(
      new Error("GET /speaker_info failed: 500 Internal Server Error"),
    )

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_speaker_info"]({
      host: "http://localhost:50021",
      speaker_uuid: "test-uuid",
      sections: ["policy"],
      resource_format: "url",
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })

  it("uses the provided host when calling the client", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(MOCK_SPEAKER_INFO), { status: 200 }))

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    await server.tools["get_speaker_info"]({
      host: "http://custom-host:9999",
      speaker_uuid: "uuid-x",
      sections: ["policy"],
      resource_format: "url",
    })

    const calledUrls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(calledUrls.every((u) => u.startsWith("http://custom-host:9999"))).toBe(true)
  })
})
