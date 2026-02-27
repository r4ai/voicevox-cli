import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

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
        "Determine which styles can be used as morphing targets for the given base style IDs.",
      inputSchema: {
        base_style_ids: z
          .array(z.number().int())
          .min(1)
          .describe("List of base style IDs to evaluate"),
        core_version: z.string().optional().describe("Optional engine core version"),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const result = await client.getMorphableTargets(args.base_style_ids, {
          coreVersion: args.core_version,
        })
        const mappedResult = args.base_style_ids.map((styleId, index) => ({
          base_style_id: styleId,
          targets: result[index] ?? {},
        }))
        return {
          content: [{ type: "text", text: JSON.stringify(mappedResult, null, 2) }],
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
