import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import type { MorphableTargetInfo } from "../../voicevox/types.js"
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

  it("passes base style IDs to the client and returns style-indexed results", async () => {
    const mockResult: Record<string, MorphableTargetInfo>[] = [
      { "1": { is_morphable: true } },
      { "2": { is_morphable: false } },
    ]
    vi.spyOn(VoiceVoxClient.prototype, "getMorphableTargets").mockResolvedValue(mockResult)

    const server = buildMockServer()
    registerUtilityTools(server as never, "http://localhost:50021")

    const handler = server.tools["get_morphable_targets"]
    const result = await handler({
      host: "http://localhost:50021",
      base_style_ids: [100, 200],
    })

    expect(result.isError).toBeUndefined()
    expect(JSON.parse(result.content[0].text)).toEqual([
      { base_style_id: 100, targets: mockResult[0] },
      { base_style_id: 200, targets: mockResult[1] },
    ])
    expect(VoiceVoxClient.prototype.getMorphableTargets).toHaveBeenCalledWith([100, 200], {
      coreVersion: undefined,
    })
  })

  it("passes core_version when provided", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getMorphableTargets").mockResolvedValue([])

    const server = buildMockServer()
    registerUtilityTools(server as never, "http://localhost:50021")

    await server.tools["get_morphable_targets"]({
      host: "http://localhost:50021",
      base_style_ids: [1],
      core_version: "0.15.0",
    })

    expect(VoiceVoxClient.prototype.getMorphableTargets).toHaveBeenCalledWith([1], {
      coreVersion: "0.15.0",
    })
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
