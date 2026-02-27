import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import { registerUtilityTools } from "./utilities.js"

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

describe("MCP get_morphable_targets", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("normalizes speakers without supported_features to ALL and returns results", async () => {
    const mockResult = [{ "0": { is_morphable: true } }]
    vi.spyOn(VoiceVoxClient.prototype, "getMorphableTargets").mockResolvedValue(mockResult)

    const server = buildMockServer()
    registerUtilityTools(server as never, "http://localhost:50021")

    const handler = server.tools["get_morphable_targets"]
    const result = await handler({
      host: "http://localhost:50021",
      core_version_speakers: [
        [
          {
            name: "Test Speaker",
            speaker_uuid: "uuid-1",
            styles: [{ name: "Normal", id: 0 }],
          },
        ],
      ],
    })

    expect(result.isError).toBeUndefined()
    expect(JSON.parse(result.content[0].text)).toEqual(mockResult)
    expect(VoiceVoxClient.prototype.getMorphableTargets).toHaveBeenCalledWith([
      [
        {
          name: "Test Speaker",
          speaker_uuid: "uuid-1",
          styles: [{ name: "Normal", id: 0 }],
          supported_features: { permitted_synthesis_morphing: "ALL" },
        },
      ],
    ])
  })

  it("preserves supported_features when already present", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getMorphableTargets").mockResolvedValue([])

    const server = buildMockServer()
    registerUtilityTools(server as never, "http://localhost:50021")

    await server.tools["get_morphable_targets"]({
      host: "http://localhost:50021",
      core_version_speakers: [
        [
          {
            name: "Speaker",
            speaker_uuid: "uuid-2",
            styles: [{ name: "Normal", id: 1 }],
            supported_features: { permitted_synthesis_morphing: "SELF_ONLY" },
          },
        ],
      ],
    })

    expect(VoiceVoxClient.prototype.getMorphableTargets).toHaveBeenCalledWith([
      [
        expect.objectContaining({
          supported_features: { permitted_synthesis_morphing: "SELF_ONLY" },
        }),
      ],
    ])
  })
})

describe("MCP validate_kana", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns { valid: true } as JSON when kana is valid", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "validateKana").mockResolvedValue(true)

    const server = buildMockServer()
    registerUtilityTools(server as never, "http://localhost:50021")

    const result = await server.tools["validate_kana"]({
      host: "http://localhost:50021",
      text: "テスト",
    })

    expect(result.isError).toBeUndefined()
    expect(JSON.parse(result.content[0].text)).toEqual({ valid: true })
  })

  it("returns { valid: false, ...error } as JSON when kana is invalid", async () => {
    const errorBody = { error_name: "ParseKanaError", error_args: { text: "bad" } }
    vi.spyOn(VoiceVoxClient.prototype, "validateKana").mockResolvedValue(errorBody)

    const server = buildMockServer()
    registerUtilityTools(server as never, "http://localhost:50021")

    const result = await server.tools["validate_kana"]({
      host: "http://localhost:50021",
      text: "bad_text",
    })

    expect(result.isError).toBeUndefined()
    expect(JSON.parse(result.content[0].text)).toEqual({ valid: false, ...errorBody })
  })
})
