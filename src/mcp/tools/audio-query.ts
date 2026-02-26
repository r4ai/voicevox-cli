import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

export function registerAudioQueryTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "audio_query",
    {
      description: "Get the audio query JSON for given text and speaker. The result can be modified and passed to the synthesize tool.",
      inputSchema: {
        text: z.string().describe("Text to generate audio query for"),
        speaker: z.number().int().default(1).describe("Speaker ID"),
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const query = await client.createAudioQuery(args.text, args.speaker)
        return {
          content: [{ type: "text", text: JSON.stringify(query, null, 2) }],
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
