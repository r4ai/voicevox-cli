import { readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

export function registerMultiSynthesizeTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "multi_synthesize",
    {
      description:
        "Synthesize multiple Japanese texts to speech in a single request and save the returned ZIP archive. Returns the output file path.",
      inputSchema: {
        texts: z.array(z.string()).min(1).describe("List of texts to synthesize"),
        speaker: z.number().int().default(1).describe("Speaker ID"),
        output: z.string().optional().describe("Output ZIP file path (defaults to a temp file)"),
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const queries = await Promise.all(
          args.texts.map((text) => client.createAudioQuery(text, args.speaker)),
        )
        const zip = await client.multiSynthesize(queries, args.speaker)

        const outputPath =
          args.output ?? join(tmpdir(), `voicevox-multi-${Date.now()}-${randomUUID()}.zip`)
        await writeFile(outputPath, Buffer.from(zip))

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

export function registerSynthesisMorphingTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "synthesis_morphing",
    {
      description:
        "Synthesize Japanese text with morphing between two speaker styles. Returns the output file path.",
      inputSchema: {
        text: z.string().describe("Text to synthesize"),
        base_speaker: z.number().int().describe("Base speaker ID"),
        target_speaker: z.number().int().describe("Target speaker ID for morphing"),
        morph_rate: z
          .number()
          .min(0)
          .max(1)
          .default(0.5)
          .describe("Morphing rate (0.0 = base speaker only, 1.0 = target speaker only)"),
        output: z.string().optional().describe("Output WAV file path (defaults to a temp file)"),
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const query = await client.createAudioQuery(args.text, args.base_speaker)
        const wav = await client.synthesisMorphing(
          query,
          args.base_speaker,
          args.target_speaker,
          args.morph_rate,
        )

        const outputPath =
          args.output ?? join(tmpdir(), `voicevox-morph-${Date.now()}-${randomUUID()}.wav`)
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

export function registerConnectWavesTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "connect_waves",
    {
      description:
        "Concatenate multiple WAV files into a single WAV file. Accepts file paths to WAV files. Returns the output file path.",
      inputSchema: {
        input_files: z.array(z.string()).min(2).describe("List of WAV file paths to concatenate"),
        output: z.string().optional().describe("Output WAV file path (defaults to a temp file)"),
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)

        const waves = await Promise.all(
          args.input_files.map(async (filePath) => {
            const buf = await readFile(filePath)
            return buf.toString("base64")
          }),
        )

        const wav = await client.connectWaves(waves)

        const outputPath =
          args.output ?? join(tmpdir(), `voicevox-connected-${Date.now()}-${randomUUID()}.wav`)
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
