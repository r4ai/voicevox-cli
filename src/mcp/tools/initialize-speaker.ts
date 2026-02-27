import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

export function registerInitializeSpeakerTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "initialize_speaker",
    {
      description:
        "Initialize a speaker (load voice model into memory). Must be called before synthesis if not already initialized.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
        speaker: z.number().int().describe("Speaker style ID"),
        skip_reinit: z
          .boolean()
          .optional()
          .describe("Skip re-initialization if already initialized (default: false)"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        await client.initializeSpeaker(args.speaker, args.skip_reinit)
        return {
          content: [{ type: "text", text: `Speaker ${args.speaker} initialized.` }],
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

export function registerIsInitializedSpeakerTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "is_initialized_speaker",
    {
      description: "Check whether a speaker style is already initialized (voice model loaded).",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
        speaker: z.number().int().describe("Speaker style ID"),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const result = await client.isInitializedSpeaker(args.speaker)
        return {
          content: [{ type: "text", text: String(result) }],
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
