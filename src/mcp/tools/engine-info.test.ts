import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import {
  registerEngineInfoTool,
  registerEngineLicensesTool,
  registerEngineUpdateHistoryTool,
} from "./engine-info.js"

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
  icon: "base64icon==",
  default_sampling_rate: 24000,
  frame_rate: 93.75,
  terms_of_service: "",
  update_infos: [{ version: "0.15.0", descriptions: ["Bug fixes"], contributors: ["dev1"] }],
  dependency_licenses: [{ name: "libfoo", version: "1.0", license: "MIT", text: "MIT License..." }],
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

// Manifest without the heavy fields (icon, dependency_licenses, update_infos)
const SLIM_MANIFEST = (({ icon: _i, dependency_licenses: _dl, update_infos: _ui, ...rest }) =>
  rest)(MOCK_MANIFEST)

describe("MCP get_engine_info", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns combined engine info as JSON without heavy fields", async () => {
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
    expect(parsed.manifest).toEqual(SLIM_MANIFEST)
    expect(parsed.manifest.icon).toBeUndefined()
    expect(parsed.manifest.dependency_licenses).toBeUndefined()
    expect(parsed.manifest.update_infos).toBeUndefined()
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
})

describe("MCP get_engine_licenses", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns dependency_licenses from manifest", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getEngineManifest").mockResolvedValue(MOCK_MANIFEST)

    const server = buildMockServer()
    registerEngineLicensesTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_engine_licenses"]({ host: "http://localhost:50021" })

    expect(result.isError).toBeUndefined()
    expect(JSON.parse(result.content[0].text)).toEqual(MOCK_MANIFEST.dependency_licenses)
  })

  it("returns isError:true when engine is unreachable", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getEngineManifest").mockRejectedValue(
      new Error("GET /engine_manifest failed"),
    )

    const server = buildMockServer()
    registerEngineLicensesTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_engine_licenses"]({ host: "http://localhost:50021" })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})

describe("MCP get_engine_update_history", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns update_infos from manifest", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getEngineManifest").mockResolvedValue(MOCK_MANIFEST)

    const server = buildMockServer()
    registerEngineUpdateHistoryTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_engine_update_history"]({
      host: "http://localhost:50021",
    })

    expect(result.isError).toBeUndefined()
    expect(JSON.parse(result.content[0].text)).toEqual(MOCK_MANIFEST.update_infos)
  })

  it("returns isError:true when engine is unreachable", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getEngineManifest").mockRejectedValue(
      new Error("GET /engine_manifest failed"),
    )

    const server = buildMockServer()
    registerEngineUpdateHistoryTool(server as never, "http://localhost:50021")

    const result = await server.tools["get_engine_update_history"]({
      host: "http://localhost:50021",
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/Error:/)
  })
})

describe("MCP get_engine_info (host forwarding)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("uses the provided host when calling client methods", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url)
      if (urlStr.includes("/version"))
        return new Response(JSON.stringify("0.15.3"), { status: 200 })
      if (urlStr.includes("/core_versions"))
        return new Response(JSON.stringify(["0.15.3"]), { status: 200 })
      if (urlStr.includes("/engine_manifest"))
        return new Response(JSON.stringify(MOCK_MANIFEST), { status: 200 })
      if (urlStr.includes("/supported_devices"))
        return new Response(JSON.stringify({ cpu: true, cuda: false, dml: false }), { status: 200 })
      return new Response("", { status: 404 })
    })

    const server = buildMockServer()
    registerEngineInfoTool(server as never, "http://localhost:50021")

    await server.tools["get_engine_info"]({ host: "http://custom-host:9999" })

    const calledUrls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(calledUrls.every((u) => u.startsWith("http://custom-host:9999"))).toBe(true)
  })
})
