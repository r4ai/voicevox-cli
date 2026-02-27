import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

export function registerSettingTools(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "get_setting",
    {
      description:
        "Get the current VoiceVox engine setting. Returns cors_policy_mode and allow_origin.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const setting = await client.getSetting()
        return {
          content: [{ type: "text", text: JSON.stringify(setting, null, 2) }],
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
    "update_setting",
    {
      description:
        "Update the VoiceVox engine setting. Provide cors_policy_mode (localapps or all) and optionally allow_origin.",
      inputSchema: {
        cors_policy_mode: z.enum(["localapps", "all"]).describe("CORS policy mode"),
        allow_origin: z
          .string()
          .nullable()
          .optional()
          .describe("Allowed origin, or null to disable"),
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        await client.updateSetting(
          args.allow_origin === undefined
            ? { cors_policy_mode: args.cors_policy_mode }
            : {
                cors_policy_mode: args.cors_policy_mode,
                allow_origin: args.allow_origin,
              },
        )
        return {
          content: [{ type: "text", text: "Setting updated successfully." }],
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
