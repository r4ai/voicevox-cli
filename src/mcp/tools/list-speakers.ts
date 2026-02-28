import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"
import type { Speaker } from "../../voicevox/types.js"

export function registerListSpeakersTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "list_speakers",
    {
      description:
        "List available VoiceVox speakers and their voice styles with IDs. " +
        "supported_features (morphing permissions) are omitted by default to keep the response compact. " +
        "Set include_supported_features=true to include them.",
      inputSchema: {
        host: z.string().default(defaultHost).describe("VoiceVox engine URL"),
        include_supported_features: z
          .boolean()
          .default(false)
          .describe(
            "Include supported_features (e.g. permitted_synthesis_morphing) in each speaker",
          ),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const speakers = await client.getSpeakers()
        const result: Omit<Speaker, "supported_features">[] | Speaker[] =
          args.include_supported_features
            ? speakers
            : speakers.map(({ supported_features: _sf, ...rest }) => rest)
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
