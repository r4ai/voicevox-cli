import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

export function registerSpeakerInfoTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "get_speaker_info",
    {
      description:
        "Get detailed information about a speaker including usage policy, portrait image (base64), and style icons. Use speaker_uuid from list_speakers.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
        speaker_uuid: z.string().describe("Speaker UUID from list_speakers"),
        resource_format: z
          .enum(["base64", "url"])
          .default("base64")
          .describe("Format for image resources (base64 or url)"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const info = await client.getSpeakerInfo(args.speaker_uuid, args.resource_format)
        return {
          content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
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
