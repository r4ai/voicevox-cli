import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "./client.js"

const MOCK_SPEAKER_INFO = {
  policy: "このキャラクターの利用にはポリシーへの同意が必要です。",
  portrait: "base64encodedportrait==",
  style_infos: [
    {
      id: 0,
      icon: "base64encodedicon==",
      voice_samples: ["base64sample1==", "base64sample2=="],
    },
    {
      id: 1,
      icon: "base64encodedicon2==",
      voice_samples: ["base64sample3=="],
    },
  ],
}

describe("VoiceVoxClient.getSpeakerInfo", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /speaker_info with speaker_uuid and returns SpeakerInfo", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(MOCK_SPEAKER_INFO), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.getSpeakerInfo("test-uuid")
    expect(result).toEqual(MOCK_SPEAKER_INFO)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("speaker_uuid=test-uuid") }),
    )
  })

  it("passes resource_format query param when specified", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(MOCK_SPEAKER_INFO), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.getSpeakerInfo("uuid-1", "url")
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("resource_format=url")
  })

  it("omits resource_format when not specified", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(MOCK_SPEAKER_INFO), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.getSpeakerInfo("uuid-1")
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).not.toContain("resource_format")
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 404, statusText: "Not Found" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.getSpeakerInfo("unknown-uuid")).rejects.toThrow(
      "GET /speaker_info failed: 404",
    )
  })
})

describe("VoiceVoxClient.initializeSpeaker", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("POSTs to /initialize_speaker with the speaker id", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.initializeSpeaker(1)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("speaker=1")
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" })
  })

  it("passes skip_reinit when specified", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.initializeSpeaker(2, true)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("skip_reinit=true")
  })

  it("omits skip_reinit when not specified", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    await client.initializeSpeaker(3)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).not.toContain("skip_reinit")
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.initializeSpeaker(999)).rejects.toThrow(
      "POST /initialize_speaker failed: 422",
    )
  })
})

describe("VoiceVoxClient.isInitializedSpeaker", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /is_initialized_speaker and returns true when initialized", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(true), { status: 200 }))
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.isInitializedSpeaker(1)
    expect(result).toBe(true)
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain("speaker=1")
  })

  it("returns false when not initialized", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(false), { status: 200 }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    const result = await client.isInitializedSpeaker(0)
    expect(result).toBe(false)
  })

  it("throws on non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    )
    const client = new VoiceVoxClient("http://localhost:50021")
    await expect(client.isInitializedSpeaker(999)).rejects.toThrow(
      "GET /is_initialized_speaker failed: 422",
    )
  })
})
