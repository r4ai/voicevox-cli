import { randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const noteSchema = z.object({
  id: z.string().optional().describe("Note ID"),
  key: z.number().int().nullable().describe("MIDI note number (null for rest)"),
  frame_length: z.number().int().describe("Duration in frames"),
  lyric: z.string().describe("Lyric for this note"),
})

const tempoSchema = z.object({
  position: z.number().int().describe("Beat position from start"),
  bpm: z.number().describe("Beats per minute"),
})

const timeSignatureSchema = z.object({
  measure_count: z.number().int().describe("Measure count"),
  beat_type: z.number().int().describe("Beat type (denominator)"),
  beats: z.number().int().describe("Number of beats per measure"),
})

const scoreSchema = z.object({
  notes: z.array(noteSchema).describe("List of notes"),
  tempos: z.array(tempoSchema).optional().describe("Optional list of tempo changes"),
  time_signatures: z
    .array(timeSignatureSchema)
    .optional()
    .describe("Optional list of time signatures"),
})

export function registerListSingersTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "list_singers",
    {
      description: "List available VoiceVox singers and their styles for song synthesis",
      inputSchema: {
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const singers = await client.getSingers()
        return {
          content: [{ type: "text", text: JSON.stringify(singers, null, 2) }],
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

export function registerSingTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "sing",
    {
      description:
        "Synthesize a song from score data (notes, tempos, time signatures) and save it as a WAV file. Returns the output file path.",
      inputSchema: {
        score: scoreSchema.describe("Score data with notes, tempos, and time signatures"),
        singer: z.number().int().default(6000).describe("Singer style ID"),
        output: z.string().optional().describe("Output WAV file path (defaults to a temp file)"),
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const query = await client.createSingFrameAudioQuery(args.score, args.singer)
        const wav = await client.frameSynthesis(query, args.singer)

        const outputPath =
          args.output ?? join(tmpdir(), `voicevox-sing-${process.pid}-${randomUUID()}.wav`)
        await writeFile(outputPath, Buffer.from(wav))

        return {
          content: [{ type: "text", text: outputPath }],
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
