import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

const STYLE_SCHEMA = z.object({
  name: z.string(),
  id: z.number().int(),
  type: z.string().optional(),
})

const SPEAKER_SUPPORT_SCHEMA = z.object({
  name: z.string(),
  speaker_uuid: z.string(),
  styles: z.array(STYLE_SCHEMA),
  version: z.string().optional(),
  supported_features: z.object({
    permitted_synthesis_morphing: z.enum(["ALL", "SELF_ONLY", "NOTHING"]),
  }),
})

export function registerUtilityTools(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "validate_kana",
    {
      description:
        "Validate whether text follows AquesTalk-style kana notation. Returns true if valid, or error details if invalid.",
      inputSchema: {
        text: z.string().describe("AquesTalk-style kana text to validate"),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const result = await client.validateKana(args.text)
        if (result === true) {
          return { content: [{ type: "text", text: "valid" }] }
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          isError: true,
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
    "get_morphable_targets",
    {
      description:
        "Determine which styles can be used as morphing targets for the given speakers. Pass the speakers (with supported_features) obtained from list_speakers. Returns a list of dicts mapping style IDs to morphability info.",
      inputSchema: {
        core_version_speakers: z
          .array(z.array(SPEAKER_SUPPORT_SCHEMA))
          .describe(
            "List of speaker lists per engine core version. Each speaker must include supported_features.",
          ),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const result = await client.getMorphableTargets(args.core_version_speakers)
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
