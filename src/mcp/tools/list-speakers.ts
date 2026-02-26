import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

export function registerListSpeakersTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "list_speakers",
    {
      description: "List available VoiceVox speakers and their voice styles with IDs",
      inputSchema: {
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const speakers = await client.getSpeakers()
        return {
          content: [{ type: "text", text: JSON.stringify(speakers, null, 2) }],
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
