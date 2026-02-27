import { randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

export function registerCancellableSynthesisTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "cancellable_synthesize",
    {
      description:
        "Synthesize Japanese text to speech using the cancellable synthesis endpoint and save it as a WAV file. Returns the output file path.",
      inputSchema: {
        text: z.string().describe("Text to synthesize"),
        speaker: z.number().int().default(1).describe("Speaker ID"),
        output: z.string().optional().describe("Output WAV file path (defaults to a temp file)"),
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const query = await client.createAudioQuery(args.text, args.speaker)
        const wav = await client.cancellableSynthesize(query, args.speaker)

        const outputPath =
          args.output ?? join(tmpdir(), `voicevox-${Date.now()}-${randomUUID()}.wav`)
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
