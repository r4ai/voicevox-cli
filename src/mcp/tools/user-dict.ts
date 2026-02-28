import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

const WORD_TYPE_SCHEMA = z
  .enum(["PROPER_NOUN", "COMMON_NOUN", "VERB", "ADJECTIVE", "SUFFIX"])
  .default("COMMON_NOUN")
  .describe("Word type")

export function registerUserDictTools(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "get_user_dict",
    {
      description:
        "Get words in the VoiceVox user dictionary. Supports filtering by surface text and word type, " +
        "and pagination via limit/offset. Returns { words, total, has_more }.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
        search: z
          .string()
          .optional()
          .describe("Partial match filter for surface form (the word as written)"),
        word_type: z
          .enum(["PROPER_NOUN", "COMMON_NOUN", "VERB", "ADJECTIVE", "SUFFIX"])
          .optional()
          .describe("Filter by word type"),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum words to return"),
        offset: z.number().int().min(0).default(0).describe("Number of words to skip"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const dict = await client.getUserDict()

        let words = Object.entries(dict).map(([uuid, word]) => ({ uuid, ...word }))

        if (args.search) {
          const q = args.search.toLowerCase()
          words = words.filter((w) => w.surface.toLowerCase().includes(q))
        }
        if (args.word_type) {
          words = words.filter((w) => w.word_type === args.word_type)
        }

        words.sort((a, b) => {
          const surfaceCmp = a.surface.localeCompare(b.surface)
          if (surfaceCmp !== 0) return surfaceCmp
          return a.uuid.localeCompare(b.uuid)
        })

        const total = words.length
        const sliced = words.slice(args.offset, args.offset + args.limit)
        const has_more = args.offset + sliced.length < total

        return {
          content: [
            { type: "text", text: JSON.stringify({ words: sliced, total, has_more }, null, 2) },
          ],
        }
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${String(err)}` }],
          isError: true,
        }
      }
    },
  )

  server.registerTool(
    "export_user_dict",
    {
      description:
        "Export the entire VoiceVox user dictionary as JSON. " +
        "Returns the complete dictionary in the same format accepted by import_user_dict.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const dict = await client.getUserDict()
        return {
          content: [{ type: "text", text: JSON.stringify(dict, null, 2) }],
        }
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${String(err)}` }],
          isError: true,
        }
      }
    },
  )

  server.registerTool(
    "add_user_dict_word",
    {
      description: "Add a word to the VoiceVox user dictionary. Returns the UUID of the new word.",
      inputSchema: {
        surface: z.string().describe("Surface form (the word as written)"),
        pronunciation: z.string().describe("Pronunciation in katakana"),
        accent_type: z.number().int().default(0).describe("Accent type (mora index)"),
        word_type: WORD_TYPE_SCHEMA,
        priority: z.number().int().min(0).max(10).default(5).describe("Priority (0-10)"),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const uuid = await client.addUserDictWord({
          surface: args.surface,
          pronunciation: args.pronunciation,
          accent_type: args.accent_type,
          word_type: args.word_type,
          priority: args.priority,
        })
        return {
          content: [{ type: "text", text: uuid }],
        }
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${String(err)}` }],
          isError: true,
        }
      }
    },
  )

  server.registerTool(
    "update_user_dict_word",
    {
      description: "Update a word in the VoiceVox user dictionary",
      inputSchema: {
        word_uuid: z.string().describe("UUID of the word to update"),
        surface: z.string().describe("Surface form (the word as written)"),
        pronunciation: z.string().describe("Pronunciation in katakana"),
        accent_type: z.number().int().default(0).describe("Accent type (mora index)"),
        word_type: WORD_TYPE_SCHEMA,
        priority: z.number().int().min(0).max(10).default(5).describe("Priority (0-10)"),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        await client.updateUserDictWord(args.word_uuid, {
          surface: args.surface,
          pronunciation: args.pronunciation,
          accent_type: args.accent_type,
          word_type: args.word_type,
          priority: args.priority,
        })
        return {
          content: [{ type: "text", text: `Updated: ${args.word_uuid}` }],
        }
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${String(err)}` }],
          isError: true,
        }
      }
    },
  )

  server.registerTool(
    "delete_user_dict_word",
    {
      description: "Delete a word from the VoiceVox user dictionary",
      inputSchema: {
        word_uuid: z.string().describe("UUID of the word to delete"),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        await client.deleteUserDictWord(args.word_uuid)
        return {
          content: [{ type: "text", text: `Deleted: ${args.word_uuid}` }],
        }
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${String(err)}` }],
          isError: true,
        }
      }
    },
  )
}
