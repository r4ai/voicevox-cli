import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { VoiceVoxClient } from "../../voicevox/client.js"
import type { SpeakerInfoSection } from "../../voicevox/types.js"

const HOST_SCHEMA = (defaultHost: string) =>
  z.string().default(defaultHost).describe("VoiceVox engine URL")

const SPEAKER_INFO_SECTION_SCHEMA = z
  .enum(["policy", "portrait", "style_icons", "style_portraits", "voice_samples"])
  .describe("Section of speaker info to retrieve")

export function registerSpeakerInfoTool(server: McpServer, defaultHost: string): void {
  server.registerTool(
    "get_speaker_info",
    {
      description:
        "Get speaker info selectively by sections. Defaults to policy text and style icons only to avoid large payloads. " +
        'Use sections=["portrait","voice_samples"] to fetch images/audio when needed. ' +
        "Use speaker_uuid from list_speakers.",
      inputSchema: {
        host: HOST_SCHEMA(defaultHost),
        speaker_uuid: z.string().describe("Speaker UUID from list_speakers"),
        sections: z
          .array(SPEAKER_INFO_SECTION_SCHEMA)
          .min(1, { message: "At least one section must be specified" })
          .default(["policy", "style_icons"])
          .describe(
            "Sections to include in the response. " +
              '"policy": usage policy text. ' +
              '"portrait": speaker portrait image. ' +
              '"style_icons": style icon images (one per style). ' +
              '"style_portraits": per-style portrait images. ' +
              '"voice_samples": audio sample files (base64/url, may be large).',
          ),
        resource_format: z
          .enum(["base64", "url"])
          .default("url")
          .describe('Format for image/audio resources. Use "url" to avoid large base64 payloads.'),
      },
    },
    async (args) => {
      try {
        const sections = args.sections as SpeakerInfoSection[]
        const hasResourceSections =
          sections.includes("portrait") ||
          sections.includes("style_icons") ||
          sections.includes("style_portraits") ||
          sections.includes("voice_samples")

        const effectiveResourceFormat = hasResourceSections ? args.resource_format : "url"
        const client = new VoiceVoxClient(args.host)
        const info = await client.getSpeakerInfo(args.speaker_uuid, effectiveResourceFormat)

        const hasStyleInfo =
          sections.includes("style_icons") ||
          sections.includes("style_portraits") ||
          sections.includes("voice_samples")

        const result: Record<string, unknown> = {}

        if (sections.includes("policy")) result["policy"] = info.policy
        if (sections.includes("portrait")) result["portrait"] = info.portrait

        if (hasStyleInfo) {
          result["style_infos"] = info.style_infos.map((si) => {
            const entry: Record<string, unknown> = { id: si.id }
            if (sections.includes("style_icons")) entry["icon"] = si.icon
            if (sections.includes("style_portraits") && si.portrait !== undefined)
              entry["portrait"] = si.portrait
            if (sections.includes("voice_samples")) entry["voice_samples"] = si.voice_samples
            return entry
          })
        }

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
