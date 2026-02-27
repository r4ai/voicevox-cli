import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import {
  registerInitializeSpeakerTool,
  registerIsInitializedSpeakerTool,
} from "./initialize-speaker.js"

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

describe("MCP initialize_speaker", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("calls initializeSpeaker and returns success message", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "initializeSpeaker").mockResolvedValue(undefined)

    const server = buildMockServer()
    registerInitializeSpeakerTool(server as never, "http://localhost:50021")

    const result = await server.tools["initialize_speaker"]({
      host: "http://localhost:50021",
      speaker: 1,
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toContain("1")
    expect(VoiceVoxClient.prototype.initializeSpeaker).toHaveBeenCalledWith(1, undefined)
  })

  it("passes skip_reinit when specified", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "initializeSpeaker").mockResolvedValue(undefined)

    const server = buildMockServer()
    registerInitializeSpeakerTool(server as never, "http://localhost:50021")

    await server.tools["initialize_speaker"]({
      host: "http://localhost:50021",
      speaker: 2,
      skip_reinit: true,
    })

    expect(VoiceVoxClient.prototype.initializeSpeaker).toHaveBeenCalledWith(2, true)
  })

  it("returns isError:true when the engine is unreachable", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "initializeSpeaker").mockRejectedValue(
      new Error("POST /initialize_speaker failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerInitializeSpeakerTool(server as never, "http://localhost:50021")

    const result = await server.tools["initialize_speaker"]({
      host: "http://localhost:50021",
      speaker: 999,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})

describe("MCP is_initialized_speaker", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns 'true' when the speaker is initialized", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "isInitializedSpeaker").mockResolvedValue(true)

    const server = buildMockServer()
    registerIsInitializedSpeakerTool(server as never, "http://localhost:50021")

    const result = await server.tools["is_initialized_speaker"]({
      host: "http://localhost:50021",
      speaker: 1,
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBe("true")
  })

  it("returns 'false' when the speaker is not initialized", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "isInitializedSpeaker").mockResolvedValue(false)

    const server = buildMockServer()
    registerIsInitializedSpeakerTool(server as never, "http://localhost:50021")

    const result = await server.tools["is_initialized_speaker"]({
      host: "http://localhost:50021",
      speaker: 0,
    })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBe("false")
  })

  it("returns isError:true when the engine is unreachable", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "isInitializedSpeaker").mockRejectedValue(
      new Error("GET /is_initialized_speaker failed: 422 Unprocessable Entity"),
    )

    const server = buildMockServer()
    registerIsInitializedSpeakerTool(server as never, "http://localhost:50021")

    const result = await server.tools["is_initialized_speaker"]({
      host: "http://localhost:50021",
      speaker: 999,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})
