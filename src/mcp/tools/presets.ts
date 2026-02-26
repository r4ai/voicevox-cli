import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

export function registerPresetTools(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "list_presets",
    {
      description: "List all VoiceVox presets",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const presets = await client.getPresets()
        return {
          content: [{ type: "text", text: JSON.stringify(presets, null, 2) }],
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
    "create_audio_query_from_preset",
    {
      description:
        "Create an AudioQuery from a preset. Returns the AudioQuery JSON for use with the synthesize tool.",
      inputSchema: {
        text: z.string().describe("Text to synthesize"),
        preset_id: z.number().int().describe("Preset ID"),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const query = await client.createAudioQueryFromPreset(args.text, args.preset_id)
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
