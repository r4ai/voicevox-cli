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
        "Get VoiceVox engine overview: version, core versions, essential manifest fields, and supported devices. " +
        "Large fields (icon image, dependency_licenses, update_infos) are excluded. " +
        "Use get_engine_licenses or get_engine_update_history to fetch those on demand.",
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
        const {
          icon: _icon,
          dependency_licenses: _dl,
          update_infos: _ui,
          ...slimManifest
        } = manifest
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  version,
                  core_versions: coreVersions,
                  manifest: slimManifest,
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

export function registerEngineLicensesTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "get_engine_licenses",
    {
      description:
        "Get the list of dependency licenses for the VoiceVox engine. " +
        "Each entry contains the dependency name, version, license type, and full license text. " +
        "This can be large; call only when license information is explicitly needed.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const manifest = await client.getEngineManifest()
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(manifest.dependency_licenses, null, 2),
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

export function registerEngineUpdateHistoryTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "get_engine_update_history",
    {
      description:
        "Get the update history of the VoiceVox engine. " +
        "Each entry contains the version number, description of changes, and contributor list.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
      },
    },
    async (args) => {
      try {
        const client = new VoiceVoxClient(args.host)
        const manifest = await client.getEngineManifest()
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(manifest.update_infos, null, 2),
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
