import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

export function registerEngineInfoTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "get_engine_info",
    {
      description:
        "Get VoiceVox engine information including engine version, core versions, engine manifest, and supported devices (CPU/GPU). Returns a JSON object with all engine info.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const [version, coreVersions, manifest, supportedDevices] = await Promise.all([
          client.getVersion(),
          client.getCoreVersions(),
          client.getEngineManifest(),
          client.getSupportedDevices(),
        ])
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  version,
                  core_versions: coreVersions,
                  manifest,
                  supported_devices: supportedDevices,
                },
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
}
