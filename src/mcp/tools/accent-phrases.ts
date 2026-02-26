import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const ACCENT_PHRASES_SCHEMA = z
  .array(
    z.object({
      moras: z.array(
        z.object({
          text: z.string(),
          consonant: z.string().optional(),
          consonant_length: z.number().optional(),
          vowel: z.string(),
          vowel_length: z.number(),
          pitch: z.number(),
        }),
      ),
      accent: z.number(),
      pause_mora: z
        .object({
          text: z.string(),
          consonant: z.string().optional(),
          consonant_length: z.number().optional(),
          vowel: z.string(),
          vowel_length: z.number(),
          pitch: z.number(),
        })
        .nullable()
        .optional(),
      is_interrogative: z.boolean().optional(),
    }),
  )
  .describe("Accent phrases")

export function registerAccentPhraseTools(server: McpServer, defaultHost: string): void {
  const hostSchema = z.string().default(defaultHost).describe("VoiceVox engine URL")

  server.registerTool(
    "get_accent_phrases",
    {
      description:
        "Get accent phrases from text. Returns accent phrase list with mora details that can be modified and passed to mora data tools.",
      inputSchema: {
        text: z.string().describe("Text to generate accent phrases for"),
        speaker: z.number().int().default(1).describe("Speaker ID"),
        is_kana: z.boolean().default(false).describe("Whether text is in kana"),
        host: hostSchema,
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const accentPhrases = await client.getAccentPhrases(args.text, args.speaker, args.is_kana)
        return {
          content: [{ type: "text", text: JSON.stringify(accentPhrases, null, 2) }],
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
    "get_mora_data",
    {
      description:
        "Get mora phoneme lengths and pitches for accent phrases. Updates both consonant/vowel lengths and pitch values.",
      inputSchema: {
        accent_phrases: ACCENT_PHRASES_SCHEMA,
        speaker: z.number().int().default(1).describe("Speaker ID"),
        host: hostSchema,
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const result = await client.getMoraData(args.accent_phrases, args.speaker)
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
    "get_mora_length",
    {
      description: "Get mora phoneme lengths for accent phrases. Updates consonant and vowel length values.",
      inputSchema: {
        accent_phrases: ACCENT_PHRASES_SCHEMA,
        speaker: z.number().int().default(1).describe("Speaker ID"),
        host: hostSchema,
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const result = await client.getMoraLength(args.accent_phrases, args.speaker)
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
    "get_mora_pitch",
    {
      description: "Get mora pitch values for accent phrases. Updates pitch values only.",
      inputSchema: {
        accent_phrases: ACCENT_PHRASES_SCHEMA,
        speaker: z.number().int().default(1).describe("Speaker ID"),
        host: hostSchema,
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const result = await client.getMoraPitch(args.accent_phrases, args.speaker)
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
