import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerAccentPhraseTools } from "./tools/accent-phrases.js"
import { registerAudioQueryTool } from "./tools/audio-query.js"
import { registerListSpeakersTool } from "./tools/list-speakers.js"
import { registerSynthesizeTool } from "./tools/synthesize.js"
import { registerUserDictTools } from "./tools/user-dict.js"

export function createMcpServer(defaultHost: string): McpServer {
  const server = new McpServer({
    name: "voicevox",
    version: process.env.PKG_VERSION ?? "0.0.0",
  })

  registerListSpeakersTool(server, defaultHost)
  registerAudioQueryTool(server, defaultHost)
  registerSynthesizeTool(server, defaultHost)
  registerAccentPhraseTools(server, defaultHost)
  registerUserDictTools(server, defaultHost)

  return server
}
