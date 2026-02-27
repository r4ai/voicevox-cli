import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import { registerSettingTools } from "./setting.js"

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

describe("MCP update_setting", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("does not pass allow_origin when omitted", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "updateSetting").mockResolvedValue()

    const server = buildMockServer()
    registerSettingTools(server as never, "http://localhost:50021")

    const result = await server.tools["update_setting"]({
      host: "http://localhost:50021",
      cors_policy_mode: "all",
    })

    expect(result.isError).toBeUndefined()
    expect(VoiceVoxClient.prototype.updateSetting).toHaveBeenCalledWith({
      cors_policy_mode: "all",
    })
  })

  it("passes allow_origin when explicitly provided", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "updateSetting").mockResolvedValue()

    const server = buildMockServer()
    registerSettingTools(server as never, "http://localhost:50021")

    const result = await server.tools["update_setting"]({
      host: "http://localhost:50021",
      cors_policy_mode: "localapps",
      allow_origin: null,
    })

    expect(result.isError).toBeUndefined()
    expect(VoiceVoxClient.prototype.updateSetting).toHaveBeenCalledWith({
      cors_policy_mode: "localapps",
      allow_origin: null,
    })
  })
})
