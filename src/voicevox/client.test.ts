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

  it("POSTs to /morphable_targets with base style IDs as body", async () => {
    const mockResult = [{ "0": { is_morphable: true } }]
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockResult), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const baseStyleIds = [0, 1]
    const result = await client.getMorphableTargets(baseStyleIds, { coreVersion: "0.15.0" })
    expect(result).toEqual(mockResult)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("/morphable_targets")
    expect(calledUrl).toContain("core_version=0.15.0")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(baseStyleIds),
      }),
    )
  })
})

describe("VoiceVoxClient.getPortalPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs / and returns the portal HTML", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>Portal</html>", { status: 200 }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getPortalPage()).resolves.toBe("<html>Portal</html>")
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500, statusText: "Internal Server Error" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getPortalPage()).rejects.toThrow("GET / failed: 500")
  })
})

describe("VoiceVoxClient query params", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("sends enable_katakana_english and core_version for audio_query", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")

    await client.createAudioQuery("こんにちは", 1, {
      enableKatakanaEnglish: false,
      coreVersion: "0.15.0",
    })

    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("enable_katakana_english=false")
    expect(calledUrl).toContain("core_version=0.15.0")
  })

  it("sends enable_interrogative_upspeak and core_version for synthesis", async () => {
    const mockQuery = {
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
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(new ArrayBuffer(8), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")

    await client.synthesize(mockQuery, 1, {
      enableInterrogativeUpspeak: false,
      coreVersion: "0.15.0",
    })

    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("enable_interrogative_upspeak=false")
    expect(calledUrl).toContain("core_version=0.15.0")
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

  it("includes core_version query param when provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ cpu: true, cuda: false, dml: false }), { status: 200 }),
      )
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.getSupportedDevices({ coreVersion: "0.15.0" })
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("core_version=0.15.0")
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

describe("VoiceVoxClient.getSingerInfo", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /singer_info with speaker_uuid query param", async () => {
    const mockInfo = { portrait: "base64data", style_infos: [] }
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockInfo), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.getSingerInfo("test-uuid")
    expect(result).toEqual(mockInfo)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("/singer_info")
    expect(calledUrl).toContain("speaker_uuid=test-uuid")
  })

  it("includes resource_format query param when provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.getSingerInfo("test-uuid", "url")
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("resource_format=url")
  })

  it("includes core_version query param when provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.getSingerInfo("test-uuid", "base64", { coreVersion: "0.15.0" })
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("core_version=0.15.0")
  })

  it("throws on non-200 status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 404, statusText: "Not Found" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getSingerInfo("bad-uuid")).rejects.toThrow("GET /singer_info failed: 404")
  })
})

describe("VoiceVoxClient.getSingFrameF0", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockScore = {
    notes: [{ key: 60, frame_length: 10, lyric: "ど" }],
    tempos: [{ position: 0, bpm: 120 }],
    time_signatures: [{ measure_count: 1, beat_type: 4, beats: 4 }],
  }

  const mockQuery = {
    f0: [440.0],
    volume: [1.0],
    phonemes: [{ phoneme: "d", frame_length: 5 }],
    volumeScale: 1.0,
    outputSamplingRate: 24000,
    outputStereo: false,
  }

  it("POSTs to /sing_frame_f0 with speaker query param and {score, frame_audio_query} as body", async () => {
    const mockF0 = [440.0, 440.0, 0.0]
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockF0), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.getSingFrameF0(mockScore, 6000, mockQuery, {
      coreVersion: "0.15.0",
    })
    expect(result).toEqual(mockF0)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("/sing_frame_f0")
    expect(calledUrl).toContain("speaker=6000")
    expect(calledUrl).toContain("core_version=0.15.0")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ score: mockScore, frame_audio_query: mockQuery }),
      }),
    )
  })

  it("throws on non-200 status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getSingFrameF0(mockScore, 6000, mockQuery)).rejects.toThrow(
      "POST /sing_frame_f0 failed: 422",
    )
  })
})

describe("VoiceVoxClient.getSingFrameVolume", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockScore = {
    notes: [{ key: 60, frame_length: 10, lyric: "ど" }],
    tempos: [{ position: 0, bpm: 120 }],
    time_signatures: [{ measure_count: 1, beat_type: 4, beats: 4 }],
  }

  const mockQuery = {
    f0: [440.0],
    volume: [1.0],
    phonemes: [{ phoneme: "d", frame_length: 5 }],
    volumeScale: 1.0,
    outputSamplingRate: 24000,
    outputStereo: false,
  }

  it("POSTs to /sing_frame_volume with speaker query param and {score, frame_audio_query} as body", async () => {
    const mockVolume = [0.8, 0.9, 0.7]
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockVolume), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.getSingFrameVolume(mockScore, 6000, mockQuery)
    expect(result).toEqual(mockVolume)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("/sing_frame_volume")
    expect(calledUrl).toContain("speaker=6000")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ score: mockScore, frame_audio_query: mockQuery }),
      }),
    )
  })

  it("throws on non-200 status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getSingFrameVolume(mockScore, 6000, mockQuery)).rejects.toThrow(
      "POST /sing_frame_volume failed: 422",
    )
  })
})

describe("VoiceVoxClient.updateSetting", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("POSTs to /setting as application/x-www-form-urlencoded", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const setting = { cors_policy_mode: "localapps" as const, allow_origin: null }
    await client.updateSetting(setting)
    const requestInit = fetchMock.mock.calls[0][1]
    expect(requestInit).toBeDefined()
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:50021/setting", expect.anything())
    expect(requestInit).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    expect(((requestInit as RequestInit).body as URLSearchParams).toString()).toBe(
      "cors_policy_mode=localapps&allow_origin=",
    )
  })

  it("omits allow_origin when not provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.updateSetting({ cors_policy_mode: "all" })
    const requestInit = fetchMock.mock.calls[0][1]
    expect(requestInit).toBeDefined()
    expect(((requestInit as RequestInit).body as URLSearchParams).toString()).toBe(
      "cors_policy_mode=all",
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

describe("VoiceVoxClient.multiSynthesize", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockQuery = {
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

  it("POSTs to /multi_synthesis with speaker query param and query array as body", async () => {
    const mockBuffer = new ArrayBuffer(8)
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(mockBuffer, { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const queries = [mockQuery, mockQuery]
    const result = await client.multiSynthesize(queries, 1, {
      enableInterrogativeUpspeak: false,
      coreVersion: "0.15.0",
    })
    expect(result).toBeInstanceOf(ArrayBuffer)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("/multi_synthesis")
    expect(calledUrl).toContain("speaker=1")
    expect(calledUrl).toContain("enable_interrogative_upspeak=false")
    expect(calledUrl).toContain("core_version=0.15.0")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(queries),
      }),
    )
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.multiSynthesize([mockQuery], 1)).rejects.toThrow(
      "POST /multi_synthesis failed: 422",
    )
  })
})

describe("VoiceVoxClient.synthesisMorphing", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockQuery = {
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

  it("POSTs to /synthesis_morphing with base_speaker, target_speaker, morph_rate params and query as body", async () => {
    const mockBuffer = new ArrayBuffer(8)
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(mockBuffer, { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.synthesisMorphing(mockQuery, 1, 2, 0.5)
    expect(result).toBeInstanceOf(ArrayBuffer)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("/synthesis_morphing")
    expect(calledUrl).toContain("base_speaker=1")
    expect(calledUrl).toContain("target_speaker=2")
    expect(calledUrl).toContain("morph_rate=0.5")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(mockQuery),
      }),
    )
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.synthesisMorphing(mockQuery, 1, 2, 0.5)).rejects.toThrow(
      "POST /synthesis_morphing failed: 422",
    )
  })
})

describe("VoiceVoxClient.cancellableSynthesize", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockQuery = {
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

  it("POSTs to /cancellable_synthesis with speaker query param and query as body", async () => {
    const mockBuffer = new ArrayBuffer(8)
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(mockBuffer, { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.cancellableSynthesize(mockQuery, 1, {
      enableInterrogativeUpspeak: false,
      coreVersion: "0.15.0",
    })
    expect(result).toBeInstanceOf(ArrayBuffer)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("/cancellable_synthesis")
    expect(calledUrl).toContain("speaker=1")
    expect(calledUrl).toContain("enable_interrogative_upspeak=false")
    expect(calledUrl).toContain("core_version=0.15.0")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(mockQuery),
      }),
    )
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.cancellableSynthesize(mockQuery, 1)).rejects.toThrow(
      "POST /cancellable_synthesis failed: 422",
    )
  })
})

describe("VoiceVoxClient.connectWaves", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("POSTs to /connect_waves with base64 wave array as body", async () => {
    const mockBuffer = new ArrayBuffer(16)
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(mockBuffer, { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const waves = ["base64wav1==", "base64wav2=="]
    const result = await client.connectWaves(waves)
    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:50021/connect_waves",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(waves),
      }),
    )
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.connectWaves(["wav1==", "wav2=="])).rejects.toThrow(
      "POST /connect_waves failed: 422",
    )
  })
})
