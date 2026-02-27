import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerAccentPhraseTools } from "./tools/accent-phrases.js"
import { registerAudioQueryTool } from "./tools/audio-query.js"
import { registerEngineInfoTool } from "./tools/engine-info.js"
import {
  registerInitializeSpeakerTool,
  registerIsInitializedSpeakerTool,
} from "./tools/initialize-speaker.js"
import { registerListSpeakersTool } from "./tools/list-speakers.js"
import { registerPresetTools } from "./tools/presets.js"
import { registerSettingTools } from "./tools/setting.js"
import { registerSpeakerInfoTool } from "./tools/speaker-info.js"
import { registerListSingersTool, registerSingTool } from "./tools/singers.js"
import { registerSynthesizeTool } from "./tools/synthesize.js"
import { registerUserDictTools } from "./tools/user-dict.js"
import { registerUtilityTools } from "./tools/utilities.js"

export function createMcpServer(defaultHost: string): McpServer {
  const server = new McpServer({
    name: "voicevox",
    version: process.env.PKG_VERSION ?? "0.0.0",
  })

  registerListSpeakersTool(server, defaultHost)
  registerSpeakerInfoTool(server, defaultHost)
  registerInitializeSpeakerTool(server, defaultHost)
  registerIsInitializedSpeakerTool(server, defaultHost)
  registerAudioQueryTool(server, defaultHost)
  registerSynthesizeTool(server, defaultHost)
  registerAccentPhraseTools(server, defaultHost)
  registerUserDictTools(server, defaultHost)
  registerPresetTools(server, defaultHost)
  registerUtilityTools(server, defaultHost)
  registerEngineInfoTool(server, defaultHost)
  registerSettingTools(server, defaultHost)
  registerListSingersTool(server, defaultHost)
  registerSingTool(server, defaultHost)

  return server
}
