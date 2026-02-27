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
