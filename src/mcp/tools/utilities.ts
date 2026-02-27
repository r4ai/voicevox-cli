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

const SUPPORTED_FEATURES_SCHEMA = z.object({
  permitted_synthesis_morphing: z.enum(["ALL", "SELF_ONLY", "NOTHING"]),
})

const SPEAKER_SUPPORT_SCHEMA = z.object({
  name: z.string(),
  speaker_uuid: z.string(),
  styles: z.array(STYLE_SCHEMA),
  version: z.string().optional(),
  supported_features: SUPPORTED_FEATURES_SCHEMA.optional(),
})

export function registerUtilityTools(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "validate_kana",
    {
      description:
        "Validate whether text follows AquesTalk-style kana notation. Returns JSON with valid:true if valid, or valid:false with error details if invalid.",
      inputSchema: {
        text: z.string().describe("AquesTalk-style kana text to validate"),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const result = await client.validateKana(args.text)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                result === true ? { valid: true } : { valid: false, ...result },
                null,
                2,
              ),
            },
          ],
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
        "Determine which styles can be used as morphing targets for the given speakers. Pass the speakers obtained from list_speakers. Returns a list of dicts mapping style IDs to morphability info.",
      inputSchema: {
        core_version_speakers: z
          .array(z.array(SPEAKER_SUPPORT_SCHEMA))
          .describe(
            "List of speaker lists per engine core version. Speakers without supported_features are treated as ALL.",
          ),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const normalized = args.core_version_speakers.map((speakers) =>
          speakers.map((s) => ({
            ...s,
            supported_features: s.supported_features ?? {
              permitted_synthesis_morphing: "ALL" as const,
            },
          })),
        )
        const result = await client.getMorphableTargets(normalized)
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
