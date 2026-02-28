import { beforeEach, describe, expect, it, vi } from "vitest"
import { VoiceVoxClient } from "../../voicevox/client.js"
import { registerUserDictTools } from "./user-dict.js"

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

describe("MCP get_user_dict", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("sorts words deterministically by surface then uuid before pagination", async () => {
    vi.spyOn(VoiceVoxClient.prototype, "getUserDict").mockResolvedValue({
      "z-uuid": {
        surface: "banana",
        pronunciation: "バナナ",
        accent_type: 1,
        word_type: "COMMON_NOUN",
        priority: 5,
      },
      "b-uuid": {
        surface: "apple",
        pronunciation: "アップル",
        accent_type: 1,
        word_type: "COMMON_NOUN",
        priority: 5,
      },
      "a-uuid": {
        surface: "apple",
        pronunciation: "アップル",
        accent_type: 2,
        word_type: "COMMON_NOUN",
        priority: 5,
      },
    })

    const server = buildMockServer()
    registerUserDictTools(server as never, "http://localhost:50021")

    const result = await server.tools["get_user_dict"]({
      host: "http://localhost:50021",
      limit: 2,
      offset: 0,
    })

    expect(result.isError).toBeUndefined()
    const parsed = JSON.parse(result.content[0].text) as {
      words: { uuid: string; surface: string }[]
      total: number
      has_more: boolean
    }

    expect(parsed.words.map((w) => `${w.surface}:${w.uuid}`)).toEqual([
      "apple:a-uuid",
      "apple:b-uuid",
    ])
    expect(parsed.total).toBe(3)
    expect(parsed.has_more).toBe(true)
  })
})
