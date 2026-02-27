import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "./client.js"

describe("VoiceVoxClient.validateKana", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns true on 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.validateKana("テスト")
    expect(result).toBe(true)
  })

  it("returns error object on 400", async () => {
    const errorBody = { error_name: "ParseKanaError", error_args: { text: "bad" } }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(errorBody), { status: 400 }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.validateKana("bad_text")
    expect(result).toEqual(errorBody)
  })

  it("throws on other status codes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500, statusText: "Internal Server Error" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.validateKana("test")).rejects.toThrow("POST /validate_kana failed: 500")
  })
})

describe("VoiceVoxClient.getMorphableTargets", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("POSTs to /morphable_targets with the speaker array as body", async () => {
    const mockResult = [{ "0": { is_morphable: true } }]
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockResult), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const speakers = [
      [
        {
          name: "Test Speaker",
          speaker_uuid: "uuid-1",
          styles: [{ name: "Normal", id: 0 }],
          supported_features: { permitted_synthesis_morphing: "ALL" as const },
        },
      ],
    ]
    const result = await client.getMorphableTargets(speakers)
    expect(result).toEqual(mockResult)
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:50021/morphable_targets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(speakers),
      }),
    )
  })
})

describe("VoiceVoxClient.getEngineManifest", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /engine_manifest and returns the manifest", async () => {
    const mockManifest = {
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockManifest), { status: 200 }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.getEngineManifest()
    expect(result).toEqual(mockManifest)
  })

  it("throws on non-200 status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500, statusText: "Internal Server Error" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getEngineManifest()).rejects.toThrow("GET /engine_manifest failed: 500")
  })
})

describe("VoiceVoxClient.getCoreVersions", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /core_versions and returns the version list", async () => {
    const mockVersions = ["0.15.0", "0.14.0"]
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockVersions), { status: 200 }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.getCoreVersions()
    expect(result).toEqual(mockVersions)
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500, statusText: "Internal Server Error" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getCoreVersions()).rejects.toThrow("GET /core_versions failed: 500")
  })
})

describe("VoiceVoxClient.getSupportedDevices", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /supported_devices and returns device support info", async () => {
    const mockDevices = { cpu: true, cuda: false, dml: false }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockDevices), { status: 200 }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.getSupportedDevices()
    expect(result).toEqual(mockDevices)
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500, statusText: "Internal Server Error" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getSupportedDevices()).rejects.toThrow("GET /supported_devices failed: 500")
  })
})

describe("VoiceVoxClient.getSetting", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /setting and returns the engine setting", async () => {
    const mockSetting = { cors_policy_mode: "localapps" as const, allow_origin: null }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockSetting), { status: 200 }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.getSetting()
    expect(result).toEqual(mockSetting)
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500, statusText: "Internal Server Error" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getSetting()).rejects.toThrow("GET /setting failed: 500")
  })
})

describe("VoiceVoxClient.updateSetting", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("POSTs to /setting with the setting as JSON body", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const setting = { cors_policy_mode: "localapps" as const, allow_origin: null }
    await client.updateSetting(setting)
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:50021/setting",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(setting),
      }),
    )
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500, statusText: "Internal Server Error" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(
      client.updateSetting({ cors_policy_mode: "localapps", allow_origin: null }),
    ).rejects.toThrow("POST /setting failed: 500")
  })
})
