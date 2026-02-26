import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { define } from "gunshi"
import { createMcpServer } from "../mcp/server.js"

export const mcpCommand = define({
  name: "mcp",
  description: "Start the VoiceVox MCP server over stdio",
  args: {
    host: {
      type: "string",
      default: "http://localhost:50021",
      description: "VoiceVox engine URL",
    },
  },
  run: async (ctx) => {
    const host = ctx.values.host ?? "http://localhost:50021"
    const server = createMcpServer(host)
    const transport = new StdioServerTransport()
    await server.connect(transport)
  },
})
