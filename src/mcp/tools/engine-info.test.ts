import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import { registerEngineInfoTool } from "./engine-info.js"

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

const MOCK_MANIFEST = {
  manifest_version: "0.13.1",
  name: "VOICEVOX Engine",
  brand_name: "VOICEVOX",
  uuid: "test-uuid",
  url: "https://example.com",
  icon: "",
  default_sampling_rate: 24000,
  frame_rate: 93.75,
  terms_of_service: "",
  update_infos: [],
  dependency_licenses: [],
  supported_features: {
    adjust_mora_pitch: true,
    adjust_phoneme_length: true,
    adjust_speed_scale: true,
    adjust_pitch_scale: true,
    adjust_intonation_scale: true,
    adjust_volume_scale: true,
    interrogative_upspeak: true,
    synthesis_morphing: true,
  },
}

describe("MCP get_engine_info", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns combined engine info as JSON", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getVersion").mockResolvedValue("0.15.3")
    vi.spyOn(VoiceVoxClient.prototype, "getCoreVersions").mockResolvedValue(["0.15.3"])
    vi.spyOn(VoiceVoxClient.prototype, "getEngineManifest").mockResolvedValue(MOCK_MANIFEST)
    vi.spyOn(VoiceVoxClient.prototype, "getSupportedDevices").mockResolvedValue({
      cpu: true,
      cuda: false,
      dml: false,
    })

    const server = buildMockServer()
    registerEngineInfoTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_engine_info"]({ host: "http://localhost:50021" })

    expect(result.isError).toBeUndefined()
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.version).toBe("0.15.3")
    expect(parsed.core_versions).toEqual(["0.15.3"])
    expect(parsed.manifest).toEqual(MOCK_MANIFEST)
    expect(parsed.supported_devices).toEqual({ cpu: true, cuda: false, dml: false })
  })

  it("returns isError:true when the engine is unreachable", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getVersion").mockRejectedValue(
      new Error("GET /version failed: 500 Internal Server Error"),
    )
    vi.spyOn(VoiceVoxClient.prototype, "getCoreVersions").mockRejectedValue(new Error("fail"))
    vi.spyOn(VoiceVoxClient.prototype, "getEngineManifest").mockRejectedValue(new Error("fail"))
    vi.spyOn(VoiceVoxClient.prototype, "getSupportedDevices").mockRejectedValue(new Error("fail"))

    const server = buildMockServer()
    registerEngineInfoTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_engine_info"]({ host: "http://localhost:50021" })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })

  it("uses the provided host when calling client methods", async () => {
    const getVersionSpy = vi
      .spyOn(VoiceVoxClient.prototype, "getVersion")
      .mockResolvedValue("0.15.3")
    vi.spyOn(VoiceVoxClient.prototype, "getCoreVersions").mockResolvedValue(["0.15.3"])
    vi.spyOn(VoiceVoxClient.prototype, "getEngineManifest").mockResolvedValue(MOCK_MANIFEST)
    vi.spyOn(VoiceVoxClient.prototype, "getSupportedDevices").mockResolvedValue({
      cpu: true,
      cuda: false,
      dml: false,
    })

    const server = buildMockServer()
    registerEngineInfoTool(server as never, "http://localhost:50021")

    await server.tools["get_engine_info"]({ host: "http://custom-host:9999" })

    expect(getVersionSpy).toHaveBeenCalledOnce()
  })
})
