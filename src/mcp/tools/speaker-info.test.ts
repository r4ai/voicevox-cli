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
      voice_samples: ["base64sample1==", "base64sample2=="],
    },
  ],
}

describe("MCP get_speaker_info", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns speaker info as JSON", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    // The real MCP SDK applies the Zod schema before calling the handler,
    // so resource_format defaults to "base64" when not provided by the caller.
    const result = await server.tools["get_speaker_info"]({
      host: "http://localhost:50021",
      speaker_uuid: "test-uuid",
      resource_format: "base64",
    })

    expect(result.isError).toBeUndefined()
    expect(JSON.parse(result.content[0].text)).toEqual(MOCK_SPEAKER_INFO)
    expect(VoiceVoxClient.prototype.getSpeakerInfo).toHaveBeenCalledWith("test-uuid", "base64")
  })

  it("passes resource_format to client when specified", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getSpeakerInfo").mockResolvedValue(MOCK_SPEAKER_INFO)

    const server = buildMockServer()
    registerSpeakerInfoTool(server as never, "http://localhost:50021")

    await server.tools["get_speaker_info"]({
      host: "http://localhost:50021",
      speaker_uuid: "uuid-1",
      resource_format: "url",
    })

    expect(VoiceVoxClient.prototype.getSpeakerInfo).toHaveBeenCalledWith("uuid-1", "url")
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
    })

    const calledUrls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(calledUrls.every((u) => u.startsWith("http://custom-host:9999"))).toBe(true)
  })
})
